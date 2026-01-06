# 
# Server_Host.py
"""
Flask server for the Digital Twin IDE.

- Serves templates/digital_twin.html
- Serves static files from /static
- Provides AI query endpoint (/ai_query) that uses ai_integration.ai_integration.AIEngine
- Provides a sensor list endpoint for the loader
"""

import os
from flask import Flask, render_template, request, jsonify, send_from_directory, abort
from dotenv import load_dotenv

load_dotenv()

# Optional import of AI integration module (we'll implement it later)
AI_ENGINE_AVAILABLE = False
try:
    from ai_integration.ai_integration import AIEngine
    AI_ENGINE_AVAILABLE = True
except Exception as e:
    # Not fatal — UI still works and you can add the AI module later
    print("AI integration module not found or failed to load:", str(e))
    AIEngine = None

app = Flask(__name__, static_folder="static", template_folder="templates")

# Configuration from environment
CESIUM_ION_TOKEN = os.getenv("CESIUM_ION_TOKEN", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

@app.route("/")
def index():
    """
    Render the main Digital Twin page.
    Pass Cesium Ion token to template (so the client can set Cesium.Ion.defaultAccessToken).
    """
    return render_template("digital_twin.html", cesium_ion_token=CESIUM_ION_TOKEN)

# AI query endpoint - returns AI response (string or structured JSON)
@app.route("/ai_query", methods=["POST"])
def ai_query():
    payload = request.get_json(silent=True) or {}
    # Accept either 'message' or legacy 'query'
    query = payload.get("message") or payload.get("query") or ""
    if not query:
        return jsonify({"error": "No query provided"}), 400

    # Simple geocoding for commands like 'drive to Lagos Island'
    try:
        import requests
        if "drive to" in query.lower():
            loc = query.lower().split("drive to", 1)[1].strip()
            if loc:
                try:
                    r = requests.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"format": "json", "q": loc, "limit": 1},
                        headers={"User-Agent": "DigitalTwin/1.0"},
                        timeout=5,
                    )
                    data = r.json()
                    if data:
                        lat = float(data[0]["lat"])
                        lon = float(data[0]["lon"])
                        return jsonify({
                            "message": f"Driving to {data[0].get('display_name', loc)}",
                            "success": True,
                            "action": {"type": "drive", "lat": lat, "lon": lon},
                        })
                    else:
                        return jsonify({"message": f"Location not found: {loc}", "success": False}), 200
                except Exception as e:
                    return jsonify({"error": str(e), "success": False}), 500
    except Exception:
        # requests may not be available; continue to AI fallback
        pass

    if not AI_ENGINE_AVAILABLE:
        # Safe fallback: echo back the prompt for now
        return jsonify({"message": f"AI module not configured. Received: {query}", "success": False}), 200

    try:
        # Use AIEngine to process query (should return a string or JSON-string)
        result = AIEngine.process_query(query)
        # Ensure JSON serializable
        return jsonify({"message": result, "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# Add /ai/object endpoint (mirrors FastAPI behavior expected by the UI)
@app.route("/ai/object", methods=["POST"])
def ai_object():
    payload = request.get_json(silent=True) or {}
    obj = payload.get("object") or {}
    model = str(obj.get("model", "")).lower()
    otype = str(obj.get("type", "")).lower()

    classified = otype or "unknown"
    suggestions = []

    if "car" in model or "sedan" in model or "truck" in model:
        classified = "car"
        suggestions = ["drive", "brake", "slow_at_checkpoints", "report_status"]
    elif "aircraft" in model or "plane" in model or "airplane" in model:
        classified = "aircraft"
        suggestions = ["arm_engines", "takeoff", "land", "report_status"]
    elif "satellite" in model or "sat" in model:
        classified = "satellite"
        suggestions = ["monitor_orbit", "track_signal", "report_status"]
    else:
        suggestions = ["inspect", "report_status"]

    return jsonify({"classification": classified, "suggestions": suggestions, "ai": None}), 200

# Endpoint to list sensor JS files available (for auto-loader)
@app.route("/sensor_list", methods=["GET"])
def sensor_list():
    sensor_dir = os.path.join(app.static_folder, "js", "sensors")
    if not os.path.isdir(sensor_dir):
        return jsonify({"sensors": []})
    try:
        files = [f for f in os.listdir(sensor_dir) if f.endswith(".js")]
        return jsonify({"sensors": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve 3d_objects files
@app.route("/3d_objects/<path:filename>")
def serve_3d_objects(filename):
    base = os.path.join(os.getcwd(), "3d_objects")
    if not os.path.exists(os.path.join(base, filename)):
        abort(404)
    return send_from_directory(base, filename)

# Optional: Serve physics or other folders outside static
@app.route("/physics/<path:filename>")
def serve_physics(filename):
    base = os.path.join(os.getcwd(), "physics")
    if not os.path.exists(os.path.join(base, filename)):
        abort(404)
    return send_from_directory(base, filename)

# Basic health check
@app.route("/health")
def health():
    return jsonify({"status": "ok", "ai_available": AI_ENGINE_AVAILABLE})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Starting Flask server on http://{host}:{port}")
    app.run(host=host, port=port, debug=True)

