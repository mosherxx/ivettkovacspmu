Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
)
$desktop = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $desktop) { throw 'Docker Desktop is not installed.' }

$startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
New-Item -ItemType Directory -Force -Path $startup | Out-Null
$shortcut = Join-Path $startup 'Docker Desktop.lnk'
$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($shortcut)
$link.TargetPath = $desktop
$link.WorkingDirectory = Split-Path $desktop -Parent
$link.Description = 'Start Docker Desktop when this Windows user signs in'
$link.Save()
Write-Output "Docker Desktop will start at sign-in: $shortcut"
