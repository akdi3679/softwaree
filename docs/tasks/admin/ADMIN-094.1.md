# TASK ID: ADMIN-094.1
# TITLE: Add Admin: per-task status file
# STATUS: pending
# DEPENDENCIES: ADMIN-093.2
# ALLOWED FILES: tasks/STATUS.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When implementing tasks, mark them as done.

## REQUIRED IMPLEMENTATION

Create `tasks/STATUS.md`:

```markdown
# Task Implementation Status

This file is updated as tasks are completed. Format:

```
TASK-ID  STATUS     ASSIGNED-TO  COMPLETED-AT  NOTES
```

## Status values
- **TODO** — not started
- **WIP** — in progress
- **DONE** — completed and committed
- **BLOCKED** — waiting on something
- **SKIP** — decided not to do (with reason)

## Initial state

All tasks are TODO. Update this file as you work.

## Why this file

Without it, it's impossible to know:
- What's done
- What's in progress
- Who is working on what
- What's blocked

## Process

1. Pick a task from `/workspace/tasks/`
2. Mark it WIP in this file (and maybe assign yourself)
3. Implement it per the exact spec
4. Commit with the suggested commit message
5. Mark it DONE in this file
6. Move to the next

## Auto-update (optional)

A pre-commit hook can auto-mark the task as DONE based on the commit message.
Example `.git/hooks/pre-commit`:
```bash
COMMIT_MSG=$(git log -1 --pretty=%B)
if echo "$COMMIT_MSG" | grep -qE '\(ADMIN-001\.1\)'; then
  sed -i "s/^ADMIN-001\.1 .*/ADMIN-001\.1  DONE        .../" tasks/STATUS.md
fi
```

(v1: just update manually; v2: this is the auto-update)
```

## TESTS

```bash
cd /workspace
test -f tasks/STATUS.md || { echo "FAIL"; exit 1; }
grep -q "TODO" tasks/STATUS.md || { echo "FAIL"; exit 1; }
echo "OK"
```
