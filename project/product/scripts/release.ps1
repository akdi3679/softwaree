# Create a release using changesets
Write-Host "=== Creating changeset version ==="
pnpm changeset version
if ($LASTEXITCODE -ne 0) { Write-Error "changeset version failed"; return }

Write-Host "=== Committing version bump ==="
git add .
git commit -m "chore: version packages"
if ($LASTEXITCODE -ne 0) { Write-Error "commit failed"; return }

Write-Host "Release version created. Review and push."
