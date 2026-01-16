# PowerShell helper to run uvicorn with repo root on PYTHONPATH
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $root
$env:PYTHONPATH = $root
Write-Host "PYTHONPATH set to $env:PYTHONPATH"
# Launch uvicorn using python -m to avoid PATH issues
pwsh -NoExit -Command "py -3 -m uvicorn backend.src.server:app --reload --port 8000"
Pop-Location
