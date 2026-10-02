use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "support", about = "Ops CLI for the Product Cloud")]
struct Cli {
    /// Cloud base URL
    #[arg(long, env = "CLOUD_URL", default_value = "https://api.example.com")]
    cloud_url: String,
    /// API token (must have ops role)
    #[arg(long, env = "CLOUD_TOKEN", default_value = "")]
    token: String,
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Search audit log by actor_user_id
    AuditSearch {
        actor_user_id: String,
        #[arg(long)]
        since: Option<String>,
        #[arg(long)]
        until: Option<String>,
    },
    /// Look up sessions for a user
    Sessions { user_id: String },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let client = reqwest::Client::new();

    match cli.cmd {
        Cmd::AuditSearch { actor_user_id, since, until } => {
            let mut url = format!(
                "{}/v1/support/audit/search?actor_user_id={}",
                cli.cloud_url, actor_user_id
            );
            if let Some(s) = since { url.push_str(&format!("&from={s}")); }
            if let Some(u) = until { url.push_str(&format!("&to={u}")); }
            let r: serde_json::Value = client
                .get(&url)
                .bearer_auth(&cli.token)
                .send()
                .await?
                .json()
                .await?;
            println!("{}", serde_json::to_string_pretty(&r)?);
        }
        Cmd::Sessions { user_id } => {
            let url = format!("{}/v1/support/sessions/{}", cli.cloud_url, user_id);
            let r: serde_json::Value = client
                .get(&url)
                .bearer_auth(&cli.token)
                .send()
                .await?
                .json()
                .await?;
            println!("{}", serde_json::to_string_pretty(&r)?);
        }
    }
    Ok(())
}