# Setup script: install dependencies
Write-Host "=== Setting up repository ==="
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { Write-Error "pnpm install failed"; return }

Write-Host "=== Building workspace ==="
pnpm run build
if ($LASTEXITCODE -ne 0) { Write-Error "build failed"; return }

Write-Host "Setup complete."
