# TASK ID: AUDIT-023.1
# TITLE: Self-audit fix #19: clean up Tailscale/Headscale in ADRs
# STATUS: pending
# DEPENDENCIES: AUDIT-022.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-001-three-repository-model.md, docs/architecture/02-DECISIONS/ADR-003-tailscale-headscale-mesh-identity.md, docs/architecture/02-DECISIONS/ADR-007-triple-signed-modules.md, docs/architecture/02-DECISIONS/ADR-009-no-offline-writes-v1.md, docs/architecture/02-DECISIONS/ADR-010-roll-our-own-auth.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
The previous ADRs mentioned Tailscale/Headscale. After ADR-017 and
ADR-018, those references are wrong. Mark ADR-003 as superseded, and
remove/update Tailscale references in the others.

## WHY THIS WAS FOUND IN SELF-AUDIT
The Tailscale/Headscale references in the older ADRs are now
inconsistent with the new architecture (ADR-017, ADR-018). Need to
either remove or note as superseded.

## REQUIRED IMPLEMENTATION

### ADR-003 (Tailscale/Headscale mesh identity)
Add a "Superseded" header at the top:

```markdown
# ADR-003: ~~Tailscale/Headscale Mesh Identity~~ (SUPERSEDED)

> **Status**: Superseded by ADR-017 (pure local networking) and
> ADR-018 (stable IP mesh). This ADR is kept for history but is no
> longer the recommended approach.
```

### ADR-001 (three repo model)
Find any mention of Tailscale and either remove it or replace with
"private mesh networking" (which is now WireGuard + mDNS, our own).

### ADR-007 (triple-signed modules)
Tailscale references here are about the runtime, not the network.
These should remain (modules run inside the device, not via Tailscale).
Just verify they're about runtime, not networking.

### ADR-009 (no offline writes v1)
Tailscale/Headscale references are about connectivity assumptions.
Update to say "WireGuard + mDNS LAN mode" instead.

### ADR-010 (roll-our-own auth)
Tailscale/Headscale references here may be about identity. Update to
"device identity is Ed25519 keypair, not a third-party service".

## TESTS

```bash
cd /workspace
# ADR-003 should be marked superseded
grep -q "SUPERSEDED" docs/architecture/02-DECISIONS/ADR-003-tailscale-headscale-mesh-identity.md || { echo "FAIL: ADR-003 not marked"; exit 1; }

# Other ADRs should have no Tailscale/Headscale networking references
# (modules/runtime references are OK)
for f in docs/architecture/02-DECISIONS/ADR-001-three-repository-model.md \
         docs/architecture/02-DECISIONS/ADR-007-triple-signed-modules.md \
         docs/architecture/02-DECISIONS/ADR-009-no-offline-writes-v1.md \
         docs/architecture/02-DECISIONS/ADR-010-roll-our-own-auth.md; do
    if grep -i "tailscale\|headscale" "$f" >/dev/null 2>&1; then
        # Check if it's a networking context (which is wrong) or runtime (which is OK)
        if grep -i "tailscale\|headscale" "$f" | grep -i "network\|vpn\|mesh" >/dev/null 2>&1; then
            echo "FAIL: $f still has networking Tailscale/Headscale ref"
            exit 1
        fi
    fi
done
echo "OK"
```
