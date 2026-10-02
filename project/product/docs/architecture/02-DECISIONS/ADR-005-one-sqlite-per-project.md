# ADR-005: One SQLite File Per Project

**Status:** Accepted
**Date:** 2026-01-28
**Supersedes:** none
**Superseded by:** none

---

## Context

A single Admin device may hold multiple projects (Enterprise plan). Each
project has its own event stream, its own audit chain, its own users, its
own modules.

Options:

1. One SQLite file per device, projects partitioned by a `project_id` column.
2. One SQLite file per project.

## Decision

One SQLite file per project.

The Admin device opens the project's file lazily when the user selects
that project. Migrations, backups, and module tables are all scoped to a
single project's file.

The User app mirrors this: one projection file per project.

## Consequences

Positive:

- Hard isolation: a bug in one project's query cannot see another
  project's rows.
- Backups are a single file copy + encryption.
- Deleting a project is a file deletion.
- Migrations can be applied per-project.
- Concurrent access to different projects is trivial (two files, two
  pools).

Negative:

- Cross-project queries (e.g. analytics over multiple projects) require
  ATTACH or app-level joins.
- One extra file handle per open project.

These downsides are acceptable: cross-project analytics is not a v1
requirement.

## Alternatives considered

**Single file with project_id columns.** Rejected: every query must
remember the filter. A single forgotten WHERE clause would be a
compliance incident.

**One schema per project inside one file.** Rejected: SQLite schema
namespacing is limited and complicates migrations.

## References

- docs/architecture/00-OVERVIEW.md section 3.2
- docs/architecture/06-MIGRATIONS.md