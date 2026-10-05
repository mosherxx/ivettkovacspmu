Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Open PowerShell as Administrator and run this script after the tunnel token is saved in .env.'
}

$project = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $project '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw '.env is missing.' }
$line = Get-Content -LiteralPath $envFile |
    Where-Object { $_ -match '^TUNNEL_TOKEN=' } |
    Select-Object -Last 1
if (-not $line) { throw 'TUNNEL_TOKEN is missing from .env.' }
$token = $line.Substring('TUNNEL_TOKEN='.Length).Trim().Trim('"').Trim("'")
if (-not $token -or $token -match '\s') { throw 'TUNNEL_TOKEN is empty or contains whitespace.' }

$source = Join-Path $env:USERPROFILE 'AppData\Local\Programs\cloudflared\cloudflared.exe'
if (-not (Test-Path -LiteralPath $source)) { throw "cloudflared executable is missing: $source" }
$targetDir = Join-Path $env:ProgramFiles 'Cloudflare'
$target = Join-Path $targetDir 'cloudflared.exe'
$existing = Get-CimInstance Win32_Service -Filter "Name='cloudflared'" -ErrorAction SilentlyContinue
if ($existing) {
    if (-not $existing.PathName.Contains($target) -or
        -not $existing.PathName.Contains('C:\ProgramData\cloudflared\token')) {
        throw 'A different cloudflared Windows service already exists. Inspect it before changing it.'
    }
} else {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne
        (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash) {
        throw 'cloudflared copy failed checksum verification.'
    }

    # Cloudflare logs informational messages on stderr. PowerShell 5.1 turns
    # those into NativeCommandError when ErrorActionPreference is Stop.
    # Suppress all CLI output, then use its actual exit code.
    $ErrorActionPreference = 'Continue'
    try {
        & $target service install $token *> $null
        $installExit = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = 'Stop'
    }
    if ($installExit -ne 0) { throw "cloudflared service installation failed with code $installExit" }
}
Set-Service -Name 'cloudflared' -StartupType Automatic
if ((Get-Service -Name 'cloudflared').Status -ne 'Running') { Start-Service -Name 'cloudflared' }
Write-Output 'cloudflared Windows service is running and starts automatically.'
