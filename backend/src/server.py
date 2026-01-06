from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pathlib import Path
import os
from dotenv import load_dotenv

# --------------------------------------------------
# Paths
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# --------------------------------------------------
# Load .env
# --------------------------------------------------
load_dotenv(PROJECT_ROOT / ".env")

CESIUM_ION_TOKEN = os.getenv("CESIUM_ION_TOKEN")
ALLOW_INJECT = os.getenv("ALLOW_CESIUM_TOKEN_IN_TEMPLATE", "false").lower() == "true"

print("🔑 CESIUM TOKEN FOUND:", bool(CESIUM_ION_TOKEN))
print("🧪 TOKEN INJECTION ENABLED:", ALLOW_INJECT)

# --------------------------------------------------
# App
# --------------------------------------------------
app = FastAPI(title="Digital Twin Platform")

# --------------------------------------------------
# Static files
# --------------------------------------------------
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR / "static"),
    name="static",
)

# --------------------------------------------------
# Templates
# --------------------------------------------------
TEMPLATES_DIR = (
    FRONTEND_DIR / "templates"
    if (FRONTEND_DIR / "templates").exists()
    else PROJECT_ROOT / "templates"
)

templates = Jinja2Templates(directory=TEMPLATES_DIR)

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.get("/")
def root():
    return {
        "service": "digital-twin-backend",
        "ui": "/digital-twin",
        "docs": "/docs",
    }


@app.get("/digital-twin")
def digital_twin(request: Request):
    """
    Inject Cesium Ion token ONLY when explicitly allowed (development mode).
    """
    token = CESIUM_ION_TOKEN if (ALLOW_INJECT and CESIUM_ION_TOKEN) else ""

    if token:
        print("🔑 CESIUM TOKEN INJECTED INTO TEMPLATE (DEV MODE)")
    else:
        print("⚠️ CESIUM TOKEN NOT INJECTED")

    return templates.TemplateResponse(
        "digital_twin.modular.html",
        {
            "request": request,
            "CESIUM_ION_TOKEN": token,
        },
    )


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

# --------------------------------------------------
# Debug endpoint
# --------------------------------------------------
@app.get("/debug/cesium_token_check")
def cesium_token_check():
    """
    Verify that the server-side Cesium token is valid.
    """
    import requests

    if not CESIUM_ION_TOKEN:
        return {"valid": False, "reason": "CESIUM_ION_TOKEN not set"}

    try:
        r = requests.get(
            f"https://api.cesium.com/v1/assets/2/endpoint?access_token={CESIUM_ION_TOKEN}",
            timeout=5,
        )
        return {
            "valid": r.status_code == 200,
            "status": r.status_code,
            "response": r.text if r.status_code != 200 else "OK",
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}

# --------------------------------------------------
# API Routers
# --------------------------------------------------
from .routes import (
    geo_router,
    public_data_router,
    telecom_router,
    simulation_router,
    health_router,
)

app.include_router(geo_router)
app.include_router(public_data_router)
app.include_router(telecom_router)
app.include_router(simulation_router)
app.include_router(health_router)

# --------------------------------------------------
# AI Endpoints
# --------------------------------------------------
AI_ENGINE_AVAILABLE = False
AIEngine = None


@app.post("/ai_query")
def ai_query(payload: dict):
    msg = (payload or {}).get("message") or (payload or {}).get("query") or ""
    if not msg:
        return JSONResponse({"error": "No message provided"}, status_code=400)

    # Handle 'drive to <place>' by geocoding the place name (Nominatim)
    try:
        if "drive to" in msg.lower():
            import requests
            loc = msg.lower().split("drive to", 1)[1].strip()
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
                        return {
                            "message": f"Driving to {data[0].get('display_name', loc)}",
                            "success": True,
                            "action": {"type": "drive", "lat": lat, "lon": lon},
                        }
                    else:
                        return {"message": f"Location not found: {loc}", "success": False}
                except Exception as e:
                    return JSONResponse({"error": str(e)}, status_code=500)
    except Exception:
        # If requests is not available or any other failure, fall through to coordinate parsing
        pass

    # Simple fallback AI (coordinate parsing)
    import re
    m = re.search(r"([-0-9\.]+)\s+([-0-9\.]+)", msg)
    if m:
        return {
            "message": msg,
            "success": True,
            "action": {
                "type": "drive",
                "lat": float(m.group(1)),
                "lon": float(m.group(2)),
            },
        }

    return {"message": f"AI not configured. Received: {msg}", "success": False}


@app.post("/ai/object")
def ai_object(payload: dict):
    """Return a simple classification/suggestions for an object (mirrors Flask /ai/object)."""
    obj = (payload or {}).get("object") or {}
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

    return {"classification": classified, "suggestions": suggestions, "ai": None} 
