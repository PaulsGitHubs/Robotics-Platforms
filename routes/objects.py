# 3d_objects.py
from pathlib import Path
from uuid import uuid4

from flask import (
    Blueprint, request, redirect, url_for,
    send_from_directory, abort, render_template_string, make_response, current_app
)
from werkzeug.utils import secure_filename

# --------------------
# Configuration
# --------------------
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_UPLOAD_FOLDER = BASE_DIR / "models"
DEFAULT_UPLOAD_FOLDER.mkdir(exist_ok=True)

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

objects_bp = Blueprint("objects", __name__)


def _upload_folder() -> Path:
    """
    Resolve upload folder from app config. Falls back to DEFAULT_UPLOAD_FOLDER.
    """
    folder = current_app.config.get("UPLOAD_FOLDER")
    if folder:
        p = Path(folder)
        p.mkdir(exist_ok=True)
        return p
    return DEFAULT_UPLOAD_FOLDER


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
@objects_bp.route("/upload-model", methods=["POST"])
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

    upload_folder = _upload_folder()

    stored_filename = make_unique_filename(file.filename)
    save_path = upload_folder / stored_filename
    file.save(save_path)

    return redirect(url_for("objects.list_models"))


# --------------------
# Serve a single model file (no directory paths)
# --------------------
@objects_bp.route("/models/<filename>")
def serve_model_file(filename):
    """
    Serves a file from UPLOAD_FOLDER by filename only.
    No directories/paths are allowed or exposed.
    """
    upload_folder = _upload_folder()

    safe_name = secure_filename(filename)
    file_path = (upload_folder / safe_name).resolve()

    # Ensure the file is exactly inside UPLOAD_FOLDER
    try:
        file_path.relative_to(upload_folder)
    except ValueError:
        abort(404)

    if not file_path.exists() or not file_path.is_file():
        abort(404)

    return send_from_directory(
        directory=str(upload_folder),
        path=safe_name,
        as_attachment=False
    )


# --------------------
# Directory HTML Index: /models
# --------------------
@objects_bp.route("/models")
def list_models():
    """
    Returns an HTML page listing model files in UPLOAD_FOLDER.
    - Only files in the models directory are shown (no recursion).
    - No directory structure or real paths are exposed.
    - Filenames on disk have GUIDs; users see original-like names.
    """
    upload_folder = _upload_folder()

    file_entries = []
    for p in upload_folder.iterdir():
        if p.is_file() and allowed_file(p.name):
            file_entries.append({
                "stored_name": p.name,
                "display_name": display_name_from_stored(p.name),
            })

    file_entries.sort(key=lambda e: e["display_name"].lower())

    template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Models Directory</title>
      <style>
        body { font-family: sans-serif; margin: 20px; }
        h1 { margin-bottom: 0.5em; }
        ul { list-style: none; padding-left: 0; }
        li { margin: 4px 0; }
        a { text-decoration: none; color: #0066cc; }
        a:hover { text-decoration: underline; }
        .empty { color: #777; }
        .filename-small { font-size: 11px; color: #999; margin-left: 6px; }
      </style>
    </head>
    <body>
      <h1>Available Models</h1>
      {% if files %}
        <ul>
          {% for entry in files %}
            <li>
              <a href="{{ url_for('objects.serve_model_file', filename=entry.stored_name) }}" target="_blank">
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
    resp = make_response(html, 200)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    return resp
