# Format all code (TypeScript via Biome, Rust via cargo fmt)
Write-Host "=== Formatting TypeScript ==="
pnpm run format

Write-Host "=== Formatting Rust (admin) ==="
Push-Location apps\admin\src-tauri
cargo fmt
Pop-Location

Write-Host "=== Formatting Rust (user) ==="
Push-Location apps\user\src-tauri
cargo fmt
Pop-Location

Write-Host "Formatting complete."
