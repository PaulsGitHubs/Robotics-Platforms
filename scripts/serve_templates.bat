@echo off
REM Serve repository root on port 5500 so templates/ are reachable at /templates/... 
cd /d %~dp0
REM move to repo root
cd ..
echo Serving repository root on port 5500. Open http://127.0.0.1:5500/templates/digital_twin.modular.html
py -3 -m http.server 5500
