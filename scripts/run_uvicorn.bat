@echo off
REM Run uvicorn with project root on PYTHONPATH so `backend` imports succeed.
cd /d %~dp0
set REPO_ROOT=%CD%
echo Setting PYTHONPATH=%REPO_ROOT%
set PYTHONPATH=%REPO_ROOT%
REM Prefer uvicorn module via python to avoid PATH issues
py -3 -m uvicorn backend.src.server:app --reload --port 8000
