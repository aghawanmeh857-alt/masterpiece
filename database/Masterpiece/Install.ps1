param(
    [string]$Server = 'localhost',
    [switch]$DemoData
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw 'Install SQL Server command-line tools (sqlcmd), or run the SQL files in SSMS.'
}

$files = @(
    '001_create_database.sql',
    '002_schema.sql',
    '003_views.sql',
    '004_reference_data.sql',
    '005_learning_and_meetings.sql'
)
if ($DemoData) { $files += '006_demo_data.sql' }

foreach ($file in $files) {
    Write-Host "Running $file"
    & sqlcmd -S $Server -E -b -f 65001 -i (Join-Path $PSScriptRoot $file)
    if ($LASTEXITCODE -ne 0) { throw "Failed: $file" }
}

Write-Host "Masterpiece is ready on $Server. The website has not been connected."
