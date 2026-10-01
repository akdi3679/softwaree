# TASK ID: SUPPORT-002.2
# TITLE: Add support CLI tool
# STATUS: pending
# DEPENDENCIES: SUPPORT-002.1
# ALLOWED FILES: tools/support-cli/src/main.rs, tools/support-cli/Cargo.toml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Internal CLI for our support team to search users, projects, modules.

## REQUIRED IMPLEMENTATION

Create `tools/support-cli/Cargo.toml`:

```toml
[package]
name = "support-cli"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
clap = { version = "4", features = ["derive"] }
serde_json = "1"
anyhow = "1"
```

Create `tools/support-cli/src/main.rs`:

```rust
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "support")]
struct Cli {
    /// Cloud base URL
    #[arg(long, env = "CLOUD_URL", default_value = "https://api.example.com")]
    cloud_url: String,
    /// API token (must have ops role)
    #[arg(long, env = "CLOUD_TOKEN")]
    token: String,
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Search accounts
    SearchAccounts {
        query: String,
        #[arg(long, default_value = "20")]
        limit: u32,
    },
    /// Look up a project
    Project { project_id: String },
    /// List devices for a project
    Devices { project_id: String },
    /// Audit log search
    AuditSearch {
        account_id: String,
        #[arg(long)]
        since: Option<String>,
        #[arg(long)]
        until: Option<String>,
    },
    /// Suspend an account
    Suspend { account_id: String, reason: String },
    /// Restore an account
    Restore { account_id: String },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let client = reqwest::Client::new();
    match cli.cmd {
        Cmd::SearchAccounts { query, limit } => {
            let r: serde_json::Value = client.get(format!("{}/v1/admin/accounts", cli.cloud_url))
                .bearer_auth(&cli.token)
                .query(&[("q", &query), ("limit", &limit.to_string())])
                .send().await?.json().await?;
            println!("{}", serde_json::to_string_pretty(&r)?);
        }
        Cmd::Project { project_id } => {
            let r: serde_json::Value = client.get(format!("{}/v1/admin/projects/{}", cli.cloud_url, project_id))
                .bearer_auth(&cli.token)
                .send().await?.json().await?;
            println!("{}", serde_json::to_string_pretty(&r)?);
        }
        Cmd::Devices { project_id } => {
            let r: serde_json::Value = client.get(format!("{}/v1/admin/projects/{}/devices", cli.cloud_url, project_id))
                .bearer_auth(&cli.token)
                .send().await?.json().await?;
            println!("{}", serde_json::to_string_pretty(&r)?);
        }
        Cmd::AuditSearch { account_id, since, until } => {
            let r: serde_json::Value = client.get(format!("{}/v1/admin/accounts/{}/audit", cli.cloud_url, account_id))
                .bearer_auth(&cli.token)
                .query(&[("since", &since.unwrap_or_default()), ("until", &until.unwrap_or_default())])
                .send().await?.json().await?;
            println!("{}", serde_json::to_string_pretty(&r)?);
        }
        Cmd::Suspend { account_id, reason } => {
            let r = client.post(format!("{}/v1/admin/accounts/{}/suspend", cli.cloud_url, account_id))
                .bearer_auth(&cli.token)
                .json(&serde_json::json!({ "reason": reason }))
                .send().await?;
            println!("status: {}", r.status());
        }
        Cmd::Restore { account_id } => {
            let r = client.post(format!("{}/v1/admin/accounts/{}/restore", cli.cloud_url, account_id))
                .bearer_auth(&cli.token)
                .send().await?;
            println!("status: {}", r.status());
        }
    }
    Ok(())
}
```

## TESTS

```bash
cd tools
test -f support-cli/Cargo.toml || { echo "FAIL"; exit 1; }
test -f support-cli/src/main.rs || { echo "FAIL: no main"; exit 1; }
grep -q "Suspend" support-cli/src/main.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
