# Check outdated dependencies
Write-Host "=== Checking outdated dependencies ==="
pnpm outdated
if ($LASTEXITCODE -ne 0) {
    # pnpm outdated exits non-zero if outdated packages found, which is fine.
    # We just show the output and not fail.
}
Write-Host "Check complete."
