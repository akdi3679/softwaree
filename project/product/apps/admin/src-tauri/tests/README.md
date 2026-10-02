# Chaos & Load Tests

These tests exercise the SQLite storage layer directly to verify
invariants that survive crashes, corruption, concurrency, and load.

They do NOT require a running Cloud, a running Admin process, or any
external service. Each test spins up its own tempdir + SQLite pool.

## Test inventory

| File | Scenario | Runs by default? |
|---|---|---|
| chaos_clock_skew.rs | events with skewed occurred_at still order by sequence | yes |
| chaos_concurrent_events.rs | 1000 concurrent writers, verify contiguous sequence | yes |
| chaos_corrupt_sqlite.rs | corrupt DB, verify detection, restore from backup | yes |
| chaos_disconnect_mid_frame.rs | truncated CBOR frames are rejected by the decoder | yes |
| chaos_disk_full.rs | read-only dir makes DB open fail cleanly | yes |
| chaos_kill_midwrite.rs | rolled-back transaction leaves no partial state | yes |
| chaos_malicious_device.rs | wrong-device hello signature is rejected | yes |
| chaos_power_loss.rs | committed data survives a pool drop + reopen | yes |
| chaos_full_replay.rs | 1M event replay end to end | **ignored** |
| load_concurrent_users.rs | 100 readers + 1000 writes complete < 30s | yes |
| load_million_events.rs | 1M writes one-at-a-time | **ignored** |
| load_sustained.rs | 100K events, verify > 1000 events/sec | **ignored** |

## Running

    # Fast suite (default)
    cargo test --test chaos_clock_skew --test chaos_concurrent_events \
               --test chaos_corrupt_sqlite --test chaos_disconnect_mid_frame \
               --test chaos_disk_full --test chaos_kill_midwrite \
               --test chaos_malicious_device --test chaos_power_loss \
               --test load_concurrent_users

    # Long-running suite (release mode)
    cargo test --release --test chaos_full_replay -- --ignored --nocapture
    cargo test --release --test load_million_events -- --ignored --nocapture
    cargo test --release --test load_sustained -- --ignored --nocapture

## Honest boundaries

These tests exercise SQLite invariants and the sync decoder in
isolation. They do NOT:

- kill the actual Admin process mid-write (that needs an OS-level fault
  injector — see HANDOFF.md Category C8)
- inject real disk-full conditions (they simulate with read-only dirs)
- send partial WebSocket frames over the wire (they test the CBOR
  decoder directly)
- test the full command engine end-to-end (the engine's per-domain
  handlers are Category C, see HANDOFF.md)

For full chaos testing of a live Admin process, use the CI environment
that mounts a loop device with an enforced size limit.