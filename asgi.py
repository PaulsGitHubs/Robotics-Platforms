"""ASGI wrapper to make running uvicorn from project root robust.

Usage:
  uvicorn asgi:app --reload

This file ensures the repository root is on sys.path before importing the FastAPI app
so direct invocations of uvicorn work without requiring PYTHONPATH environment setup.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Import the FastAPI app object
try:
    from backend.src.server import app  # type: ignore
except Exception as e:
    # Provide a clear error message if import fails
    raise RuntimeError("Failed to import backend app. Ensure repository layout is intact.") from e
