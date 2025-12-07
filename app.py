import os
from pathlib import Path
from uuid import uuid4

from flask import (
    Flask, request, redirect, url_for,
    send_from_directory, abort, render_template_string, make_response
)
from werkzeug.utils import secure_filename

# --------------------
# Configuration
# --------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "models"
UPLOAD_FOLDER.mkdir(exist_ok=True)

# More 3D / robotics-relevant formats
ALLOWED_EXTENSIONS = {
    ".gltf",  # GLTF (graphics / robotics)
    ".glb",   # Binary GLTF
    ".stl",   # CAD / robotics meshes
    ".obj",   # Generic mesh
    ".dae",   # COLLADA (used in Gazebo, etc.)
    ".ply",   # Point clouds / meshes
    ".urdf",  # Robot description
    ".sdf",   # Simulation description
}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)


def allowed_file(filename: str) -> bool:
    suffix = Path(filename).suffix.lower()
    return suffix in ALLOWED_EXTENSIONS


def make_unique_filename(original_name: str) -> str:
    """
    Take a sanitized original filename and append a GUID so that
    multiple uploads with the same name don't overwrite each other.

    Example:
      original_name = 'arm.gltf'
      -> 'arm__d41d8cd98f00b204e9800998ecf8427e.gltf'
    """
    original_name = secure_filename(original_name)
    p = Path(original_name)
    stem = p.stem
    suffix = p.suffix.lower()
    uid = uuid4().hex
    return f"{stem}__{uid}{suffix}"


def display_name_from_stored(stored_name: str) -> str:
    """
    Derive a user-friendly display name from the stored filename.
    If stored as 'arm__GUID.gltf', display 'arm.gltf'.
    """
    p = Path(stored_name)
    stem = p.stem
    suffix = p.suffix
    if "__" in stem:
        stem = stem.split("__", 1)[0]
    return f"{stem}{suffix}"


# --------------------
# File Upload Endpoint
# --------------------
@app.route("/upload-model", methods=["POST"])
def upload_model():
    """
    Accepts a 3D model file and stores it in UPLOAD_FOLDER with a unique name.
    Expected form field: 'model'
    """
    if "model" not in request.files:
        return "No file part 'model' in request", 400

    file = request.files["model"]

    if file.filename == "":
        return "No selected file", 400

    if not allowed_file(file.filename):
        return (
            "Unsupported file type. Allowed: "
            + ", ".join(sorted(ALLOWED_EXTENSIONS))
        ), 400

    # Create unique stored filename based on original name + GUID
    stored_filename = make_unique_filename(file.filename)
    save_path = UPLOAD_FOLDER / stored_filename
    file.save(save_path)

    # Redirect to models index or return JSON if you prefer
    return redirect(url_for("list_models"))


# --------------------
# Serve a single model file (no directory paths)
# --------------------
@app.route("/models/<filename>")
def serve_model_file(filename):
    """
    Serves a file from UPLOAD_FOLDER by filename only.
    No directories/paths are allowed or exposed.
    """
    safe_name = secure_filename(filename)
    file_path = (UPLOAD_FOLDER / safe_name).resolve()

    # Ensure the file is exactly inside UPLOAD_FOLDER
    try:
        file_path.relative_to(UPLOAD_FOLDER)
    except ValueError:
        abort(404)

    if not file_path.exists() or not file_path.is_file():
        abort(404)

    return send_from_directory(
        directory=str(UPLOAD_FOLDER),
        path=safe_name,
        as_attachment=False
    )


# --------------------
# Directory HTML Index: /models
# --------------------
@app.route("/models")
def list_models():
    """
    Returns an HTML page listing model files in UPLOAD_FOLDER.
    - Only files in the models directory are shown (no recursion).
    - No directory structure or real paths are exposed.
    - Filenames on disk have GUIDs; users see original-like names.
    """

    file_entries = []
    for p in UPLOAD_FOLDER.iterdir():
        if p.is_file() and allowed_file(p.name):
            file_entries.append({
                "stored_name": p.name,
                "display_name": display_name_from_stored(p.name),
            })

    # Sort by display name
    file_entries.sort(key=lambda e: e["display_name"].lower())

    template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Models Directory</title>
      <style>
        body {
          font-family: sans-serif;
          margin: 20px;
        }
        h1 {
          margin-bottom: 0.5em;
        }
        ul {
          list-style: none;
          padding-left: 0;
        }
        li {
          margin: 4px 0;
        }
        a {
          text-decoration: none;
          color: #0066cc;
        }
        a:hover {
          text-decoration: underline;
        }
        .empty {
          color: #777;
        }
        .filename-small {
          font-size: 11px;
          color: #999;
          margin-left: 6px;
        }
      </style>
    </head>
    <body>
      <h1>Available Models</h1>
      {% if files %}
        <ul>
          {% for entry in files %}
            <li>
              <a href="{{ url_for('serve_model_file', filename=entry.stored_name) }}" target="_blank">
                {{ entry.display_name }}
              </a>
              <span class="filename-small">(id: {{ entry.stored_name }})</span>
            </li>
          {% endfor %}
        </ul>
      {% else %}
        <p class="empty">No model files uploaded yet.</p>
      {% endif %}
    </body>
    </html>
    """

    html = render_template_string(template, files=file_entries)
    # Explicitly set Content-Type to text/html
    resp = make_response(html, 200)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    return resp


# --------------------
# Serve index.html from current directory on /
# --------------------
@app.route("/", methods=["GET"])
def index():
    """
    Serve index.html from the same directory as this app file.
    """
    index_path = BASE_DIR / "index.html"
    if not index_path.exists():
        return "index.html not found in current directory", 404

    return send_from_directory(directory=str(BASE_DIR), path="index.html")


if __name__ == "__main__":
    # For development only. Use a proper WSGI server (gunicorn/uwsgi) in production.
    app.run(host="0.0.0.0", port=8001, debug=True)
