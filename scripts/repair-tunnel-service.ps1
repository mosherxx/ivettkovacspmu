Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script in an Administrator PowerShell window.'
}

$project = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $project '.env'
$line = Get-Content -LiteralPath $envFile |
    Where-Object { $_ -match '^TUNNEL_TOKEN=' } |
    Select-Object -Last 1
if (-not $line) { throw 'TUNNEL_TOKEN is missing from .env.' }
$token = $line.Substring('TUNNEL_TOKEN='.Length).Trim().Trim('"').Trim("'")
if (-not $token -or $token -match '\s') { throw 'TUNNEL_TOKEN is empty or malformed.' }

$service = Get-CimInstance Win32_Service -Filter "Name='cloudflared'"
$tokenFile = 'C:\ProgramData\cloudflared\token'
if (-not $service -or -not $service.PathName.Contains('--token-file ' + $tokenFile)) {
    throw 'The installed cloudflared service does not use the expected token file.'
}
if (-not (Test-Path -LiteralPath $tokenFile)) { throw 'The service token file is missing.' }

if ((Get-Service -Name cloudflared).Status -ne 'Stopped') {
    Stop-Service -Name cloudflared
}
[System.IO.File]::WriteAllText($tokenFile, $token, [System.Text.UTF8Encoding]::new($false))
Set-Service -Name cloudflared -StartupType Automatic
Start-Service -Name cloudflared
Start-Sleep -Seconds 5
if ((Get-Service -Name cloudflared).Status -ne 'Running') {
    throw 'cloudflared stopped after startup. Check the Windows Application event log.'
}
Write-Output 'cloudflared service is running and configured for automatic startup.'
