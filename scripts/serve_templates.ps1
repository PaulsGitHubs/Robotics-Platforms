param([int]$Port=5500)
# Serve the repository root on the given port and open the demo page in browser.
Push-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Set-Location ..
Write-Host "Serving repository root on port $Port. Opening browser..."
Start-Process -FilePath python -ArgumentList "-m http.server $Port" -NoNewWindow
Start-Sleep -Seconds 1
Start-Process "http://127.0.0.1:$Port/templates/digital_twin.modular.html"
Pop-Location
