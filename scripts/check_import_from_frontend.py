"""
Check that `backend` package is importable when running from the `frontend` folder
Run this from the repo root or simulate running from frontend:
    pushd frontend && python ../scripts/check_import_from_frontend.py
"""
import sys
import os

print('cwd:', os.getcwd())
try:
    import backend
    print('Imported backend from', backend.__file__)
except Exception as e:
    print('Failed to import backend:', type(e).__name__, e)
    sys.exit(2)
