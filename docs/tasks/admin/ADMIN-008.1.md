# TASK ID: ADMIN-008.1
# TITLE: Add Wasmtime runtime
# STATUS: pending
# DEPENDENCIES: ADMIN-007.5
# ALLOWED FILES: product/apps/admin/src-tauri/src/modules/runtime.rs, product/apps/admin/src-tauri/src/modules/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add Wasmtime-based module runtime. Loads WASM modules, enforces capability-based access.

## REQUIRED IMPLEMENTATION

Add to Cargo.toml:
```toml
wasmtime = "27"
```

Create `product/apps/admin/src-tauri/src/modules/mod.rs`:

```rust
pub mod runtime;
pub mod manifest;
pub mod installer;
```

Create `product/apps/admin/src-tauri/src/modules/runtime.rs`:

```rust
use std::path::Path;
use wasmtime::{Engine, Module, Store, Config, ResourceLimiter, Instance};
use wasmtime_wasi::WasiCtxBuilder;
use std::sync::Arc;

use crate::error::{AppError, AppResult};

/// The Wasmtime engine, shared across all module instances.
pub struct ModuleRuntime {
    pub engine: Engine,
    /// Host functions modules can call back into.
    pub host: Arc<HostFunctions>,
}

/// Host functions exposed to modules. In v1, this is minimal.
pub struct HostFunctions;

impl ModuleRuntime {
    pub fn new() -> AppResult<Self> {
        let mut config = Config::new();
        config.wasm_component_model(true);
        config.consume_fuel(true);
        let engine = Engine::new(&config)?;
        Ok(Self {
            engine,
            host: Arc::new(HostFunctions),
        })
    }

    /// Load a module from a file.
    pub fn load_module(&self, path: &Path) -> AppResult<Module> {
        let bytes = std::fs::read(path)?;
        let module = Module::from_binary(&self.engine, &bytes)?;
        Ok(module)
    }

    /// Instantiate a module. Returns a Store that the caller manages.
    pub fn instantiate(&self, module: &Module) -> AppResult<Store<WasmModuleState>> {
        let wasi = WasiCtxBuilder::new().build();
        let state = WasmModuleState { wasi, fuel: 100_000 };
        let mut store = Store::new(&self.engine, state);
        store.set_fuel(100_000)?;
        store.limiter(|s| s.fuel = 100_000);
        Ok(store)
    }
}

#[derive(Default)]
pub struct WasmModuleState {
    pub wasi: wasmtime_wasi::WasiCtx,
    /// Fuel budget remaining. Decremented as module runs.
    pub fuel: u64,
}

impl ResourceLimiter for WasmModuleState {
    fn memory_growing(&mut self, _current: usize, desired: usize, _maximum: Option<usize>) -> Result<usize, wasmtime::Error> {
        // 64 MB hard cap per module
        if desired > 64 * 1024 * 1024 {
            return Err(wasmtime::Error::new(wasmtime::ErrorKind::ResourceLimiter));
        }
        Ok(desired)
    }
    fn table_growing(&mut self, _current: u32, desired: u32, _maximum: Option<u32>) -> Result<u32, wasmtime::Error> {
        if desired > 1000 {
            return Err(wasmtime::Error::new(wasmtime::ErrorKind::ResourceLimiter));
        }
        Ok(desired)
    }
}
```

Add to Cargo.toml:
```toml
wasmtime-wasi = "27"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/modules/runtime.rs || { echo "FAIL"; exit 1; }
grep -q "wasmtime" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no wasmtime"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
