# Remove build artifacts and node_modules
Write-Host "Cleaning build artifacts..."
pnpm -r exec rm -rf dist build .turbo
Write-Host "Clean completed."
