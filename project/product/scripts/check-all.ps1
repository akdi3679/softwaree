# Run all quality checks: TypeScript, Rust
$ErrorActionPreference = 'Continue'
$failed = $false

function Run-Check {
    param([string]$Name, [scriptblock]$Command)
    Write-Host "=== $Name ==="
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Error "$Name failed with exit code $LASTEXITCODE"
        $failed = $true
        return
    }
}

# TypeScript checks
Run-Check "Running lint" { pnpm run lint }
if ($failed) { return }

Run-Check "Running typecheck" { pnpm run typecheck }
if ($failed) { return }

Run-Check "Running tests" { pnpm run test }
if ($failed) { return }

# Rust fmt admin
Push-Location apps\admin\src-tauri
Run-Check "Running Rust fmt (admin)" { cargo fmt -- --check }
Pop-Location
if ($failed) { return }

# Rust fmt user
Push-Location apps\user\src-tauri
Run-Check "Running Rust fmt (user)" { cargo fmt -- --check }
Pop-Location
if ($failed) { return }

# Clippy admin
Push-Location apps\admin\src-tauri
Run-Check "Running clippy (admin)" { cargo clippy -- -D warnings }
Pop-Location
if ($failed) { return }

# Clippy user
Push-Location apps\user\src-tauri
Run-Check "Running clippy (user)" { cargo clippy -- -D warnings }
Pop-Location
if ($failed) { return }

Write-Host "All checks passed."
