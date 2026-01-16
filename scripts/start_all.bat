@echo off
REM Start backend uvicorn and static file server from project root.
REM Run this from a normal command prompt (not PowerShell) with Python and uvicorn on PATH.
cd /d %~dp0







pauseecho Servers started. Open http://127.0.0.1:5500/templates/digital_twin.modular.htmlstart cmd /k "py -3 -m http.server 5500 --directory %CD%":: Start static server in new windowstart cmd /k "uvicorn backend.src.server:app --reload --port 8003"title Backend Servern:: Start uvicorn in a new window