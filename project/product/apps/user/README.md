# User App

The read-only projection consumer. Connects to an Admin over our WireGuard mesh, receives authorized events, never writes to upstream tables.

## Tech stack
- Tauri 2 (Rust backend)
- React 19 + Vite 5
- TanStack Router + TanStack Query
- Tailwind CSS 4
- SQLite (local projection, sqlx)

## How it works

1. The User connects to the same our mesh as the Admin
2. The Admin's device appears in the **Connect** page (tag:admin)
3. User clicks Connect, performs signed handshake
4. The User receives a stream of events from the Admin's sync server
5. Events are applied to the local SQLite projection
6. UI queries the local projection (never the Admin directly)

## No write surface

The User can only read. It has no command that mutates the Admin. Adding write capability requires the User to escalate to a peer (a real-world decision the architecture deliberately forbids in v1).

## Development

```bash
pnpm install
pnpm tauri dev
Build
pnpm build  # tauri build
Key commands (Tauri)
ping — health check

login_user(userId, displayName), logout_user(token)

get_tailscale_status — list Admin peers on the tailnet

connect_to_admin(host, port, userId, projectId, authToken) — start sync

disconnect_from_admin

sync_now — request a fresh delta

list_projection(table) — read from the local projection

query_event_log(fromSequence, limit) — read raw events
