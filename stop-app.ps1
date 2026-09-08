$ErrorActionPreference = 'Stop'
$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'next dev' }

if (-not $processes) {
    Write-Host "No running Next.js app found."
    exit 0
}

foreach ($p in $processes) {
    Stop-Process -Id $p.ProcessId -Force
    Write-Host "Stopped Next.js process $($p.ProcessId)"
}
