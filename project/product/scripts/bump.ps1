# Bump a package version (interactive)
param(
    [string]$Package,
    [string]$Version
)

if (-not $Package -or -not $Version) {
    Write-Host "Usage: .\scripts\bump.ps1 -Package <package-name> -Version <new-version>"
    return
}

Write-Host "Bumping $Package to $Version..."
pnpm --filter $Package version $Version --no-git-tag-version
if ($LASTEXITCODE -ne 0) { Write-Error "version bump failed"; return }

Write-Host "Bump complete."
