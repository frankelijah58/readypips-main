# Payment backfill helper (admin JWT required).
# Usage:
#   1) npm run dev   (in project root)
#   2) Log in to admin dashboard → copy `token` from localStorage (same key the app uses)
#   3) $env:READPIPS_ADMIN_JWT = "<paste token>"
#   4) .\scripts\run-payment-backfill.ps1 -DryRunOnly
#   5) .\scripts\run-payment-backfill.ps1 -Apply
# Optional: -SyncSubscriptions with -Apply

param(
    [string] $BaseUrl = "http://localhost:3000",
    [int] $Limit = 200,
    [switch] $DryRunOnly,
    [switch] $Apply,
    [switch] $SyncSubscriptions
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "== payment unit tests ==" -ForegroundColor Cyan
npx tsx --test tests/payment-amounts.test.ts tests/payment-backfill.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$token = $env:READPIPS_ADMIN_JWT
if (-not $token) {
    Write-Host ""
    Write-Host "READPIPS_ADMIN_JWT is not set." -ForegroundColor Yellow
    Write-Host 'Set it in this shell: $env:READPIPS_ADMIN_JWT = "<admin JWT>"'
    exit 1
}

$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

function Invoke-Backfill([hashtable] $Body) {
    $json = $Body | ConvertTo-Json -Compress -Depth 6
    Invoke-RestMethod -Uri "$BaseUrl/api/admin/payments/backfill" -Method POST -Headers $headers -Body $json
}

if ($DryRunOnly) {
    Write-Host ""
    Write-Host "== Backfill DRY RUN (no DB writes) ==" -ForegroundColor Cyan
    $r = Invoke-Backfill @{ dryRun = $true; limit = $Limit }
    $r | ConvertTo-Json -Depth 8
    exit 0
}

if ($Apply) {
    Write-Host ""
    Write-Host "== Backfill APPLY (writes payment_intents + payment_backfill_audit) ==" -ForegroundColor Yellow
    $body = @{ dryRun = $false; limit = $Limit }
    if ($SyncSubscriptions) { $body.syncSubscriptions = $true }
    $r = Invoke-Backfill $body
    $r | ConvertTo-Json -Depth 8
    exit 0
}

Write-Host "Specify -DryRunOnly or -Apply. Example: .\scripts\run-payment-backfill.ps1 -DryRunOnly" -ForegroundColor Yellow
exit 1
