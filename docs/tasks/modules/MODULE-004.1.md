# TASK ID: MODULE-004.1
# TITLE: Add module: retail-pos full implementation
# STATUS: pending
# DEPENDENCIES: USER-008.3
# ALLOWED FILES: product/modules/retail-pos/src/commands/product.rs, product/modules/retail-pos/src/commands/sale.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Full retail-pos module: product + sale + refund.

## REQUIRED IMPLEMENTATION

Create `product/modules/retail-pos/src/commands/product.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateProduct {
    sku: String,
    name: String,
    price_cents: u32,
    stock: u32,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateProduct = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.sku.is_empty() { return Err(ModuleError::Validation("sku required".into())); }
    if req.price_cents == 0 { return Err(ModuleError::Validation("price must be > 0".into())); }
    let id = format!("prod_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "product.created".into(),
        aggregate_type: "product".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "product_id": id, "sku": req.sku, "name": req.name,
            "price_cents": req.price_cents, "stock": req.stock,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "product_id": id }) })
}
```

Create `product/modules/retail-pos/src/commands/sale.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RecordSale {
    items: Vec<SaleItem>,
    payment_method: String,  // "cash" | "card" | "transfer"
    customer_phone: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SaleItem {
    product_id: String,
    quantity: u32,
    unit_price_cents: u32,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordSale = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.items.is_empty() { return Err(ModuleError::Validation("items required".into())); }
    if !["cash", "card", "transfer"].contains(&req.payment_method.as_str()) {
        return Err(ModuleError::Validation(format!("invalid payment_method: {}", req.payment_method)));
    }
    let total_cents: u32 = req.items.iter().map(|i| i.unit_price_cents * i.quantity).sum();
    let sale_id = format!("sale_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sale.recorded".into(),
        aggregate_type: "sale".into(),
        aggregate_id: sale_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sale_id": sale_id,
            "items": req.items,
            "total_cents": total_cents,
            "payment_method": req.payment_method,
            "customer_phone": req.customer_phone,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "sale_id": sale_id, "total_cents": total_cents }),
    })
}

#[derive(Debug, Deserialize)]
struct RefundSale {
    sale_id: String,
    reason: String,
}

pub fn handle_refund(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RefundSale = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sale.refunded".into(),
        aggregate_type: "sale".into(),
        aggregate_id: req.sale_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sale_id": req.sale_id,
            "reason": req.reason,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "sale_id": req.sale_id, "status": "refunded" }) })
}
```

## TESTS

```bash
cd product
test -f modules/retail-pos/src/commands/product.rs || { echo "FAIL"; exit 1; }
test -f modules/retail-pos/src/commands/sale.rs || { echo "FAIL: no sale"; exit 1; }
echo "OK"
```
