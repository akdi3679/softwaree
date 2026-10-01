# TASK ID: LAUNCH-011.1
# TITLE: Add module verification harness
# STATUS: pending
# DEPENDENCIES: LAUNCH-010.2
# ALLOWED FILES: product/modules/verify/Cargo.toml, product/modules/verify/src/main.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Run every published module against a fixture suite. Catch regressions.

## REQUIRED IMPLEMENTATION

Create `product/modules/verify/Cargo.toml`:

```toml
[package]
name = "verify"
version = "0.1.0"
edition = "2021"

[dependencies]
product-module-sdk = { path = "../sdk" }
serde_json = "1"
clap = { version = "4", features = ["derive"] }
walkdir = "2"
```

Create `product/modules/verify/src/main.rs`:

```rust
//! Run a set of "fixtures" against every installed module.
//! Fixture = a JSON file with a command payload + expected event type.
//! For each module, run every fixture and check the output.
use clap::Parser;
use product_module_sdk::command::{Command, CommandOutcome};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Parser)]
struct Cli { modules_dir: PathBuf, fixtures_dir: PathBuf }

fn main() -> Result<(), String> {
    let cli = Cli::parse();
    let mut pass = 0;
    let mut fail = 0;
    for module_entry in WalkDir::new(&cli.modules_dir).into_iter().filter_map(|e| e.ok()) {
        if !module_entry.file_type().is_dir() { continue; }
        let module_name = module_entry.file_name().to_string_lossy().to_string();
        if module_name == "sdk" || module_name == "verify" { continue; }
        let module_path = module_entry.path();
        for fixture in WalkDir::new(&cli.fixtures_dir).into_iter().filter_map(|e| e.ok()) {
            if !fixture.file_type().is_file() { continue; }
            if fixture.path().extension().and_then(|s| s.to_str()) != Some("json") { continue; }
            let bytes = match fs::read(fixture.path()) { Ok(b) => b, Err(e) => { eprintln!("read error: {e}"); continue; } };
            let cmd: Command = match serde_json::from_slice(&bytes) { Ok(c) => c, Err(e) => { eprintln!("parse error: {e}"); continue; } };
            // In real impl: dlopen the module WASM, dispatch the command, compare output
            // For now: print what we'd do
            match dispatch(&module_path, &cmd) {
                Ok(out) => { eprintln!("✓ {module_name} :: {cmd.command_type} -> {} events", out.events.len()); pass += 1; }
                Err(e) => { eprintln!("✗ {module_name} :: {cmd.command_type} -> {e}"); fail += 1; }
            }
        }
    }
    eprintln!("\n{pass} pass, {fail} fail");
    if fail > 0 { std::process::exit(1); }
    Ok(())
}

fn dispatch(_module_path: &std::path::Path, _cmd: &Command) -> Result<CommandOutcome, String> {
    Err("not yet implemented (v1.0 stub)".into())
}
```

## TESTS

```bash
cd product
test -f modules/verify/Cargo.toml || { echo "FAIL"; exit 1; }
test -f modules/verify/src/main.rs || { echo "FAIL: no main"; exit 1; }
echo "OK"
```
