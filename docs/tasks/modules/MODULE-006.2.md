# TASK ID: MODULE-006.2
# TITLE: Add module: restaurant (menu, orders)
# STATUS: pending
# DEPENDENCIES: MODULE-006.1
# ALLOWED FILES: product/modules/restaurant/src/commands/menu.rs, product/modules/restaurant/src/commands/order.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Restaurant module: menu items, orders, table assignment.

## REQUIRED IMPLEMENTATION

Create `product/modules/restaurant/src/commands/menu.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct AddMenuItem {
    name: String,
    category: String,        // "appetizer" | "main" | "dessert" | "drink"
    price_cents: u32,
    description: Option<String>,
    available: bool,
    prep_minutes: u8,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddMenuItem = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["appetizer", "main", "dessert", "drink"].contains(&req.category.as_str()) {
        return Err(ModuleError::Validation(format!("invalid category: {}", req.category)));
    }
    let id = format!("item_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "menu_item.added".into(),
        aggregate_type: "menu_item".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "item_id": id, "name": req.name, "category": req.category,
            "price_cents": req.price_cents, "description": req.description,
            "available": req.available, "prep_minutes": req.prep_minutes,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "item_id": id }) })
}
```

Create `product/modules/restaurant/src/commands/order.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct PlaceOrder {
    table_number: u8,
    items: Vec<OrderItem>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OrderItem {
    item_id: String,
    quantity: u8,
    modifiers: Option<Vec<String>>,
}

pub fn handle_place(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: PlaceOrder = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.items.is_empty() {
        return Err(ModuleError::Validation("items required".into()));
    }
    let id = format!("ord_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "order.placed".into(),
        aggregate_type: "order".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "order_id": id, "table_number": req.table_number,
            "items": req.items, "notes": req.notes,
            "status": "placed",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "order_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/restaurant/src/commands/menu.rs || { echo "FAIL"; exit 1; }
test -f modules/restaurant/src/commands/order.rs || { echo "FAIL: no order"; exit 1; }
echo "OK"
```
