//! Fixture runner for module manifests.
//!
//! Walks a modules directory and a fixtures directory, and reports which
//! module the fixtures would apply to. Does not yet dispatch into Wasmtime
//! (the runtime is not wired in the product workspace as of v1.0).
//!
//! Usage:
//!   verify <modules_dir> <fixtures_dir>

use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

use walkdir::WalkDir;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 3 {
        eprintln!("usage: verify <modules_dir> <fixtures_dir>");
        return ExitCode::from(2);
    }
    let modules_dir = PathBuf::from(&args[1]);
    let fixtures_dir = PathBuf::from(&args[2]);

    if !modules_dir.is_dir() {
        eprintln!("modules_dir does not exist: {}", modules_dir.display());
        return ExitCode::from(2);
    }
    if !fixtures_dir.is_dir() {
        eprintln!("fixtures_dir does not exist: {}", fixtures_dir.display());
        return ExitCode::from(2);
    }

    let mut module_count = 0usize;
    for entry in WalkDir::new(&modules_dir).min_depth(1).max_depth(1).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "sdk" || name == "verify" || name == "sdk-tests" {
            continue;
        }
        module_count += 1;
        println!("module: {name}");
    }

    let mut fixture_count = 0usize;
    for entry in WalkDir::new(&fixtures_dir).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        if entry.path().extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }
        fixture_count += 1;
        match fs::read_to_string(entry.path()) {
            Ok(text) => match serde_json::from_str::<serde_json::Value>(&text) {
                Ok(v) => {
                    let cmd = v.get("command_type").and_then(|x| x.as_str()).unwrap_or("<none>");
                    println!("fixture: {} -> {}", entry.path().display(), cmd);
                }
                Err(e) => eprintln!("fixture parse error {}: {e}", entry.path().display()),
            },
            Err(e) => eprintln!("fixture read error {}: {e}", entry.path().display()),
        }
    }

    println!("\n{module_count} module(s), {fixture_count} fixture(s)");
    println!("note: dispatch into Wasmtime is not yet wired (v1.0 stub)");
    ExitCode::SUCCESS
}
