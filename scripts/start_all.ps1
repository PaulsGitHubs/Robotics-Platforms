# PowerShell helper to start backend and static servers from project root
# Run in PowerShell as: .\start_all.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $root
Start-Process -NoNewWindow -FilePath pwsh -ArgumentList "-NoExit","-Command","uvicorn backend.src.server:app --reload --port 8003"
Start-Process -NoNewWindow -FilePath pwsh -ArgumentList "-NoExit","-Command","py -3 -m http.server 5500 --directory '$root'"
Write-Host "Servers started. Open http://127.0.0.1:5500/templates/digital_twin.modular.html"
Pop-Location
