//! Wasmtime runtime plumbing for business modules.
//!
//! What this file does:
//!   - Configures the Wasmtime engine (component model, fuel, epoch
//!     interruption).
//!   - Loads core modules from disk (fallback path).
//!   - Prepares a `Store` with the standard fuel limit.
//!
//! What this file does NOT yet do:
//!   - Load a *component* (wasm32-wasip2). That requires the module
//!     crate to be compiled with the `component-model` target and to
//!     export the WIT-defined functions. See
//!     `docs/architecture/WASMTIME-INTEGRATION.md`.
//!   - Provide the WIT `host` interface (log, now-iso8601, uuid-v7,
//!     read-projection, write-audit). That requires the `bindgen!`
//!     macro wired to a stable WIT file, which is a Category C item.
//!
//! The goal of this file is to have the *host side* ready so that when
//! the module crate is compiled to wasm32-wasip2, the remaining wiring
//! is a small, well-understood change (see the integration doc).

use std::path::Path;

use wasmtime::{Config, Engine, Module, Store};

use crate::error::{AppError, AppResult};

/// Default fuel per invocation. Wasmtime's fuel is measured in
/// "instructions"; 10^9 is a generous upper bound for a single command
/// on a modern machine (roughly 1-5 seconds of CPU).
pub const DEFAULT_FUEL: u64 = 1_000_000_000;

/// Default memory cap per store (bytes). 64 MB, matching the manifest
/// in 01-PRINCIPLES § 13.
pub const DEFAULT_MEMORY_BYTES: usize = 64 * 1024 * 1024;

pub struct ModuleRuntime {
    engine: Engine,
}

impl ModuleRuntime {
    /// Build a Wasmtime engine configured for our module contract:
    ///   - component model enabled (WIT / wasm32-wasip2)
    ///   - fuel metering (hard CPU cap per invocation)
    ///   - epoch interruption (host can force a timeout)
    pub fn new() -> AppResult<Self> {
        let mut config = Config::new();
        config.wasm_component_model(true);
        config.consume_fuel(true);
        config.epoch_interruption(true);
        let engine = Engine::new(&config)
            .map_err(|e| AppError::Internal(format!("wasmtime engine: {e}")))?;
        Ok(Self { engine })
    }

    pub fn engine(&self) -> &Engine {
        &self.engine
    }

    /// Load a *core* module (a plain .wasm, not a component). This is
    /// retained for the fallback path used by unit tests that don't
    /// need the WIT host interface.
    pub fn load_module(&self, path: &Path) -> AppResult<Module> {
        let bytes = std::fs::read(path)?;
        Module::from_binary(&self.engine, &bytes)
            .map_err(|e| AppError::Internal(format!("module load: {e}")))
    }

    /// Prepare a `Store` with the standard fuel limit already applied.
    /// The caller supplies the per-store data (typically the host state
    /// struct once that lands).
    pub fn prepare_store<T>(&self, data: T) -> AppResult<Store<T>> {
        let mut store = Store::new(&self.engine, data);
        store
            .set_fuel(DEFAULT_FUEL)
            .map_err(|e| AppError::Internal(format!("set fuel: {e}")))?;
        Ok(store)
    }
}

impl Default for ModuleRuntime {
    fn default() -> Self {
        // Engine construction only fails on invalid config, which we
        // control. If this ever panics, it is a programming error.
        Self::new().expect("ModuleRuntime::new must succeed")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn engine_builds() {
        let rt = ModuleRuntime::new().expect("engine");
        // Touch the engine to make sure it's usable.
        let _ = rt.engine();
    }

    #[test]
    fn prepare_store_sets_fuel() {
        let rt = ModuleRuntime::new().expect("engine");
        let store: Store<()> = rt.prepare_store(()).expect("store");
        // Reading fuel back confirms it was set.
        let fuel = store.get_fuel().expect("get fuel");
        assert!(fuel > 0);
    }
}