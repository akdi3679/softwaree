# Update dependencies
Write-Host "=== Updating dependencies ==="
pnpm update --latest
if ($LASTEXITCODE -ne 0) { Write-Error "pnpm update failed"; return }

Write-Host "=== Reinstalling ==="
pnpm install --no-frozen-lockfile
if ($LASTEXITCODE -ne 0) { Write-Error "pnpm install failed"; return }

Write-Host "Update complete."
