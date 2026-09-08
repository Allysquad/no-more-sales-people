$ErrorActionPreference = 'Stop'
$project = "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
$node = "C:\Program Files\nodejs\node.exe"

Write-Host "Project directory: $project"
Write-Host "Node binary: $node"

& $node .\node_modules\next\dist\bin\next dev --hostname 0.0.0.0 --port 3000

