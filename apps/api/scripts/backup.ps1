<#
.SYNOPSIS
    Automated Daily Backup Script for GMH Database (Windows Server / Local Dev)
.DESCRIPTION
    Dumps PostgreSQL database using pg_dump, stores in apps/api/backups,
    and removes backup files older than 7 days.
#>

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiDir = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $ApiDir "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "gmh_backup_$Timestamp.sql"
$RetentionDays = 7

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Read .env if present
$EnvFile = Join-Path $ApiDir ".env"
$DbHost = "localhost"
$DbPort = "5432"
$DbName = "gmh_database"
$DbUser = "postgres"

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            if ($key -eq "DB_HOST") { $DbHost = $val }
            if ($key -eq "DB_PORT") { $DbPort = $val }
            if ($key -eq "DB_NAME") { $DbName = $val }
            if ($key -eq "DB_USER") { $DbUser = $val }
            if ($key -eq "DB_PASSWORD") { $env:PGPASSWORD = $val }
        }
    }
}

Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Starting GMH PostgreSQL Backup..."
Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Target: $BackupFile"

try {
    & pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -F p -b -f $BackupFile
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    $fileInfo = Get-Item $BackupFile
    Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Backup completed! Size: $($fileInfo.Length) bytes"
} catch {
    Write-Warning "pg_dump failed or not in PATH: $_"
    Write-Host "Please ensure pg_dump is available in your PATH or configured in Task Scheduler."
}

# Clean old backups
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "gmh_backup_*.sql" | Where-Object { $_.CreationTime -lt $CutoffDate } | ForEach-Object {
    Write-Host "Removing old backup: $($_.Name)"
    Remove-Item $_.FullName -Force
}
