from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/api/assets", tags=["Assets"])

@router.get("/registry")
def assets_registry():
    """Return a minimal registry of optional models and whether the files actually exist on disk."""
    project_root = Path(__file__).resolve().parents[3]
    registry_path = project_root / "3d_objects" / "objects_registry.json"

    out = {"models": {}}
    try:
        with open(registry_path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            models = (data or {}).get("models", {})
            frontend_static = project_root / "frontend" / "static"
            for name, meta in models.items():
                model_uri = meta.get("model")
                exists = False
                if isinstance(model_uri, str) and model_uri.startswith("/static/"):
                    rel = model_uri.replace("/static/", "")
                    file_path = frontend_static / rel
                    exists = file_path.exists()
                out["models"].setdefault(name, {})
                out["models"][name]["model"] = model_uri
                out["models"][name]["exists"] = bool(exists)
    except Exception:
        # If registry isn't available, return an empty models map (fail-safe)
        out = {"models": {}}

    return out
