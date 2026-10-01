# TASK ID: MIGRATION-001.1
# TITLE: Add v1 → v2 migration plan document
# STATUS: pending
# DEPENDENCIES: SDK-001.3
# ALLOWED FILES: /workspace/docs/migration/V1-TO-V2.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document how customers will migrate from v1 (single Admin) to v2 (multi-Admin).

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/migration/V1-TO-V2.md`:

```markdown
# v1 → v2 migration

How to migrate a project from single-Admin to multi-Admin.

## What changes in v2

- Multiple Admins per project (e.g., 2 doctors sharing a clinic)
- All Admins must agree on writes (Raft consensus or CRDT)
- The "source of truth" becomes a quorum, not a single device

## Migration steps

1. **Backup**: Take a full backup before migrating
2. **Pick the leader**: Decide which Admin becomes the primary
3. **Add the second Admin**: Invite them as a co-admin via Cloud
4. **Sync the data**: The new Admin downloads the full project from the primary
5. **Test writes**: Both Admins can now write; verify conflicts are resolved correctly
6. **Cutover**: Set the primary to "follower"; both are now peers

## Data model changes

- Add `project_admins` table (project_id, admin_id, role, joined_at)
- Add `admin_replication_log` table (sequence, admin_id, payload) for Raft
- Add `admin_quorum_state` table (term, voted_for, last_log_index) for election

## Code changes

- The Admin's "I am the source of truth" assumption goes away
- The sync engine now has TWO endpoints: pull (from primary) and push (write to quorum)
- Conflict resolution: per-command, defined by the command's CRDT type
- The outbox pattern becomes a Raft log

## Backwards compatibility

- v1 Admins can still read v2 projects (they just can't write until upgraded)
- v2 Admins can read v1 projects (read-only mode)
- Modules from v1 still work in v2
- The Cloud API is unchanged

## Rollback

- We don't roll back from v2 to v1. Once a project is on v2, it stays.
- If you want to go back, restore from a v1 backup into a new project.

## Customer-facing script

We provide a script: `product-migrate-v1-to-v2` (download from Cloud).
It:
1. Backs up the v1 data
2. Uploads the v1 backup to the Cloud
3. Provisions a v2 project
4. Downloads the data into both Admins
5. Verifies consistency

## Timeline

- v2 alpha: 6 months from now
- v2 beta: 9 months from now
- v2 GA: 12 months from now
- v1 supported: 18 months from v2 GA

## What we DO NOT change

- The User's role (still read-only)
- Module triple-signing
- our WireGuard mesh as the primary network
- The sync protocol (v1 and v2 sync are wire-compatible)
```

## TESTS

```bash
cd /workspace
test -f docs/migration/V1-TO-V2.md || { echo "FAIL"; exit 1; }
grep -q "v1" docs/migration/V1-TO-V2.md || { echo "FAIL"; exit 1; }
echo "OK"
```
