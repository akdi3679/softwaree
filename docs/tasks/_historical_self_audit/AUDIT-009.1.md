# TASK ID: AUDIT-009.1
# TITLE: Self-audit fix #5: PDF rendering — use weasyprint for HTML, not raw printpdf
# STATUS: pending
# DEPENDENCIES: AUDIT-008.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-013-pdf-rendering.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The spec uses printpdf (Rust). For Arabic, Hebrew, Hindi, and other
complex scripts, printpdf doesn't render text well. Switch to HTML
+ weasyprint (or browser print-to-PDF via headless Chrome).

## WHY THIS WAS FOUND IN SELF-AUDIT
The original PDF tasks used printpdf, which is great for simple
English but fails for:
- RTL languages (Arabic, Hebrew)
- Complex scripts (Hindi, Chinese, Arabic)
- Tables with merged cells
- Headers/footers with images
- Fonts that aren't embedded

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-013-pdf-rendering.md`:

```markdown
# ADR-013: PDF Rendering — HTML + Headless Browser

## Status
Accepted, 2026-08-09

## Context

We need to generate PDFs for:
- Sick-leave certificates
- Lab reports
- Invoices
- Reports

We support 8 languages including Arabic (RTL), Hindi, Chinese, and
other complex scripts.

## Decision

Use **HTML + headless browser** to generate PDFs. Specifically:

### Library choice

| Library | Verdict |
|---|---|
| `printpdf` (Rust) | ❌ Poor RTL, no complex scripts, ugly tables |
| `pdf-writer` (Rust) | ❌ Same as printpdf |
| `wkhtmltopdf` (deprecated) | ❌ Old WebKit, abandoned |
| `weasyprint` (Python) | ⚠️ Good but adds Python dep |
| **Headless Chrome (`chromiumoxide` for Rust)** | ✅ Best |
| **Tauri's `window.print()`** | ✅ Free, uses system browser |

**Winner: `chromiumoxide` (Rust wrapper around headless Chrome)**.

### Why

1. **Best text rendering** — full Chrome engine, handles RTL, CJK,
   complex scripts, ligatures, diacritics
2. **WYSIWYG** — what you see in the browser is what you print
3. **Standard** — every dev knows HTML/CSS
4. **Customizable** — easy to add headers, footers, page numbers
5. **Headless** — runs on the Admin computer, no network needed
6. **Free** — Chromium is open source

### Implementation

```rust
// Rust side
use chromiumoxide::browser::Browser;

async fn render_pdf(html: String) -> Result<Vec<u8>> {
    let browser = Browser::launch(BrowserConfig::builder().build()?).await?;
    let tab = browser.new_page("about:blank").await?;
    tab.set_content(html).await?;
    let pdf = tab.pdf(true).await?;  // landscape=false
    Ok(pdf)
}
```

### Templates

PDFs are HTML templates in `templates/`:
- `sick-leave.{locale}.html`
- `lab-report.{locale}.html`
- `invoice.{locale}.html`

Each module can register its own templates.

### Fonts

We bundle these fonts (all SIL OFL licensed):
- Inter (Latin)
- Noto Sans Arabic (Arabic, RTL)
- Noto Sans Devanagari (Hindi)
- Noto Sans CJK SC (Chinese simplified)
- Noto Sans (fallback)

### Performance

- First PDF: 1-2s (browser startup)
- Subsequent: 200-500ms (browser reused)
- We keep a long-lived browser process in the Admin

## Consequences

### Positive
- Beautiful, correct PDFs in all 8 languages
- No Python dependency
- Easy to customize
- Future-proof (Chrome engine stays updated)

### Negative
- ~150 MB for Chromium (downloaded on first run)
- Memory: ~200 MB while rendering
- Slightly slower than raw PDF libraries

### Mitigations
- Lazy download (only when user generates first PDF)
- Share browser process across PDFs
- Cache rendered templates

## References
- puppeteer (Node) equivalent
- `chromiumoxide` crate
- Tauri WebView as alternative (smaller, but limited CSS)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-013-pdf-rendering.md || { echo "FAIL"; exit 1; }
grep -q "chromiumoxide" docs/architecture/02-DECISIONS/ADR-013-pdf-rendering.md || { echo "FAIL"; exit 1; }
echo "OK"
```
