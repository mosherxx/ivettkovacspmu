param(
    [string]$BackupDirectory = (Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'),
    [int]$RetentionDays = 14
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($RetentionDays -lt 1) { throw 'RetentionDays must be at least 1.' }

$project = Split-Path $PSScriptRoot -Parent
$compose = Join-Path $project 'compose.yaml'
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCommand) {
    $dockerPath = $dockerCommand.Source
} else {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'),
        (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker.exe')
    )
    $dockerPath = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $dockerPath) { throw 'Docker CLI was not found. Start Docker Desktop before running a backup.' }
}
New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
$backupPath = (Resolve-Path -LiteralPath $BackupDirectory).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$name = "ivett-data-$stamp-$([guid]::NewGuid().ToString('N').Substring(0, 8)).tar.gz"
$partial = "$name.part"
$partialPath = Join-Path $backupPath $partial
$archivePath = Join-Path $backupPath $name
$dockerBase = @('compose', '--project-directory', $project, '-f', $compose)

function Invoke-Docker([string[]]$DockerArgs) {
    & $dockerPath @DockerArgs
    if ($LASTEXITCODE -ne 0) { throw "docker exited with code $LASTEXITCODE" }
}

$runningServices = @(& $dockerPath @dockerBase ps --status running --services)
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the Docker Compose services.' }
$webWasRunning = $runningServices -contains 'web'
$stopped = $false

try {
    if ($webWasRunning) {
        Invoke-Docker ($dockerBase + @('stop', 'web'))
        $stopped = $true
    }

    # A one-off container mounts the same named volume as web. With web stopped,
    # its SQLite database, WAL files, and uploads form one consistent snapshot.
    Invoke-Docker ($dockerBase + @(
        'run', '--rm', '--no-deps', '-T',
        '-v', "${backupPath}:/backup",
        '--entrypoint', 'sh', 'web', '-c',
        "tar -czf /backup/$partial -C /data ."
    ))

    if (-not (Test-Path -LiteralPath $partialPath)) { throw 'The archive was not created.' }
    & "$env:SystemRoot\System32\tar.exe" -tzf $partialPath | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Archive verification failed.' }
    Move-Item -LiteralPath $partialPath -Destination $archivePath
    $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath "$archivePath.sha256" -Value "$hash  $name"
    Write-Output "Verified backup: $archivePath"

    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -LiteralPath $backupPath -File -Filter 'ivett-data-*.tar.gz' |
        Where-Object LastWriteTime -lt $cutoff |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName
            $sidecar = "$($_.FullName).sha256"
            if (Test-Path -LiteralPath $sidecar) { Remove-Item -LiteralPath $sidecar }
        }
}
finally {
    if ($stopped) { Invoke-Docker ($dockerBase + @('start', 'web')) }
}
