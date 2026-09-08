$ErrorActionPreference = 'Stop'
$project = "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
$node = "C:\Program Files\nodejs\node.exe"

$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'next dev' }
foreach ($p in $processes) {
    Stop-Process -Id $p.ProcessId -Force
    Write-Host "Stopped Next.js process $($p.ProcessId)"
}

Start-Process -FilePath $node -ArgumentList @(
    '.\node_modules\next\dist\bin\next',
    'dev',
    '--hostname',
    '0.0.0.0',
    '--port',
    '3000'
) -WorkingDirectory $project -NoNewWindow

Write-Host "Started app at http://localhost:3000"
