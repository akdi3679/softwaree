# TASK ID: MODULE-005.1
# TITLE: Add module: invoice generator (PDF)
# STATUS: pending
# DEPENDENCIES: FOODLAB-006.2
# ALLOWED FILES: product/modules/invoice/src/lib.rs, product/modules/invoice/Cargo.toml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Generate professional PDF invoices from a list of line items.

## REQUIRED IMPLEMENTATION

Create `product/modules/invoice/Cargo.toml`:

```toml
[package]
name = "invoice-module"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
product-module-sdk = { path = "../sdk" }
printpdf = "0.7"
chrono = "0.4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Create `product/modules/invoice/src/lib.rs`:

```rust
use printpdf::*;
use serde::Deserialize;
use serde_json::json;
use std::fs::File;
use std::io::BufWriter;

#[derive(Deserialize)]
struct LineItem {
    description: String,
    quantity: u32,
    unit_price_cents: u32,
}

#[derive(Deserialize)]
struct InvoiceInput {
    invoice_number: String,
    issue_date: String,
    due_date: String,
    business_name: String,
    business_address: String,
    customer_name: String,
    customer_address: String,
    line_items: Vec<LineItem>,
    tax_rate: f32,  // 0.15 for 15%
    currency_symbol: String,
}

#[no_mangle]
pub extern "C" fn generate_invoice_pdf(input_json: *const u8, len: usize, output_path: *const u8, out_len: usize) -> i32 {
    let input_slice = unsafe { std::slice::from_raw_parts(input_json, len) };
    let path_slice = unsafe { std::slice::from_raw_parts(output_path as *const u8, out_len) };
    let path_str = match std::str::from_utf8(path_slice) {
        Ok(s) => s,
        Err(_) => return -1,
    };
    let input: InvoiceInput = match serde_json::from_slice(input_slice) {
        Ok(i) => i,
        Err(_) => return -2,
    };

    let subtotal: u64 = input.line_items.iter().map(|li| (li.quantity as u64) * (li.unit_price_cents as u64)).sum();
    let tax = (subtotal as f32 * input.tax_rate) as u64;
    let total = subtotal + tax;

    let (doc, page1, layer1) = PdfDocument::new(&input.invoice_number, Mm(210.0), Mm(297.0), "Layer 1");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).unwrap();
    let bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).unwrap();
    let mut layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text("INVOICE", 24.0, Mm(20.0), Mm(280.0), &bold);
    layer.use_text(&format!("Invoice #: {}", input.invoice_number), 11.0, Mm(140.0), Mm(280.0), &font);
    layer.use_text(&format!("Issue date: {}", input.issue_date), 11.0, Mm(140.0), Mm(274.0), &font);
    layer.use_text(&format!("Due date: {}", input.due_date), 11.0, Mm(140.0), Mm(268.0), &font);

    layer.use_text("From:", 12.0, Mm(20.0), Mm(255.0), &bold);
    layer.use_text(&input.business_name, 11.0, Mm(20.0), Mm(250.0), &font);
    layer.use_text(&input.business_address, 10.0, Mm(20.0), Mm(245.0), &font);

    layer.use_text("To:", 12.0, Mm(120.0), Mm(255.0), &bold);
    layer.use_text(&input.customer_name, 11.0, Mm(120.0), Mm(250.0), &font);
    layer.use_text(&input.customer_address, 10.0, Mm(120.0), Mm(245.0), &font);

    let mut y = 220.0;
    layer.use_text("Description", 11.0, Mm(20.0), Mm(y), &bold);
    layer.use_text("Qty", 11.0, Mm(120.0), Mm(y), &bold);
    layer.use_text("Unit", 11.0, Mm(140.0), Mm(y), &bold);
    layer.use_text("Total", 11.0, Mm(170.0), Mm(y), &bold);
    y -= 6.0;
    for li in &input.line_items {
        layer.use_text(&li.description, 10.0, Mm(20.0), Mm(y), &font);
        layer.use_text(&li.quantity.to_string(), 10.0, Mm(120.0), Mm(y), &font);
        layer.use_text(&format!("{}{:.2}", input.currency_symbol, li.unit_price_cents as f64 / 100.0), 10.0, Mm(140.0), Mm(y), &font);
        layer.use_text(&format!("{}{:.2}", input.currency_symbol, (li.quantity as f64 * li.unit_price_cents as f64) / 100.0), 10.0, Mm(170.0), Mm(y), &font);
        y -= 5.5;
    }
    y -= 5.0;
    layer.use_text(&format!("Subtotal: {}{:.2}", input.currency_symbol, subtotal as f64 / 100.0), 11.0, Mm(140.0), Mm(y), &font);
    y -= 5.5;
    layer.use_text(&format!("Tax ({:.0}%): {}{:.2}", input.tax_rate * 100.0, input.currency_symbol, tax as f64 / 100.0), 11.0, Mm(140.0), Mm(y), &font);
    y -= 6.0;
    layer.use_text(&format!("Total: {}{:.2}", input.currency_symbol, total as f64 / 100.0), 14.0, Mm(140.0), Mm(y), &bold);

    let file = match File::create(path_str) {
        Ok(f) => f,
        Err(_) => return -3,
    };
    let mut buf = BufWriter::new(file);
    if doc.save(&mut buf).is_err() { return -4; }
    0
}
```

## TESTS

```bash
cd product
test -f modules/invoice/Cargo.toml || { echo "FAIL"; exit 1; }
test -f modules/invoice/src/lib.rs || { echo "FAIL: no lib"; exit 1; }
grep -q "generate_invoice_pdf" modules/invoice/src/lib.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
