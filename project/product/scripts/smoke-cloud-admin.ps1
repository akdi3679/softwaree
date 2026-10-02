# Cloud + Admin Smoke Test
#
# Verifies the Cloud API boots and responds to its core endpoints.
# The Admin app side is not started by this script - it only exercises
# the Cloud's HTTP surface. For a full end-to-end test, run the Admin
# app in a separate window and add its assertions below.
#
# Usage:
#   cd C:\Users\user\desktop\softwaree\product
#   .\scripts\smoke-cloud-admin.ps1
#
# Exit codes:
#   0 = all checks passed
#   1 = Cloud did not become ready in time
#   2 = one or more endpoint checks failed
#
# This script is a scaffold. It works when the Cloud API is running.

param(
    [string]$CloudUrl = "http://localhost:8787",
    [int]$ReadyTimeoutSec = 30
)

$ErrorActionPreference = "Stop"
$script:Failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int[]]$AcceptStatus = @(200)
    )
    try {
        $r = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($AcceptStatus -contains $r.StatusCode) {
            Write-Host "  PASS  $Name ($($r.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "  FAIL  $Name (got $($r.StatusCode), expected $($AcceptStatus -join ','))" -ForegroundColor Red
            $script:Failed++
        }
    } catch {
        Write-Host "  FAIL  $Name ($($_.Exception.Message))" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "Cloud smoke test against $CloudUrl" -ForegroundColor Cyan
Write-Host ""

# 1. Wait for Cloud readiness.
Write-Host "Waiting for Cloud (max ${ReadyTimeoutSec}s)..."
$deadline = (Get-Date).AddSeconds($ReadyTimeoutSec)
$ready = $false
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri "$CloudUrl/health" -Method GET -TimeoutSec 2 -UseBasicParsing
        if ($r.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 500
    }
}

if (-not $ready) {
    Write-Host ""
    Write-Host "Cloud did not become ready in ${ReadyTimeoutSec}s." -ForegroundColor Red
    Write-Host "Start it with:  cd platform-cloud\apps\api ; pnpm dev" -ForegroundColor Yellow
    exit 1
}
Write-Host "Cloud is up." -ForegroundColor Green
Write-Host ""

# 2. Endpoint checks.
Write-Host "Endpoint checks:"
Test-Endpoint -Name "/health"          -Url "$CloudUrl/health"
Test-Endpoint -Name "/ready"           -Url "$CloudUrl/ready"
Test-Endpoint -Name "/v1/status/public" -Url "$CloudUrl/v1/status/public"
Test-Endpoint -Name "/v1/modules"      -Url "$CloudUrl/v1/modules" -AcceptStatus @(200, 401)
Test-Endpoint -Name "/v1/discovery/lookup (missing param)" -Url "$CloudUrl/v1/discovery/lookup" -AcceptStatus @(400)

Write-Host ""
if ($script:Failed -eq 0) {
    Write-Host "All checks passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$($script:Failed) check(s) failed." -ForegroundColor Red
    exit 2
}