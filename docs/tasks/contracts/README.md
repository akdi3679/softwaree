# CONTRACT — Shared Types and Schemas

Micro-tasks for the shared `@product/contracts` package: branded ID types, command/event envelopes, error contracts, result types, sync types, and Zod schemas. These are the single source of truth for data shapes used by Admin, User, Cloud, and modules.

## Groups

| Group | Topic | Tasks |
|---|---|---|
| CONTRACT-001 | Branded ID types | CONTRACT-001.1 → 001.7 (7 tasks) |
| CONTRACT-002 | Brand helper | CONTRACT-002.1 → 002.3 (3 tasks) |
| CONTRACT-003 | Version types | CONTRACT-003.1 → 003.4 (4 tasks) |
| CONTRACT-004 | Time types | CONTRACT-004.1 → 004.2 (2 tasks) |
| CONTRACT-005 | Error types | CONTRACT-005.1 → 005.7 (7 tasks) |
| CONTRACT-006 | Result types | CONTRACT-006.1 → 006.3 (3 tasks) |
| CONTRACT-007 | Command envelope | CONTRACT-007.1 → 007.7 (7 tasks) |
| CONTRACT-008 | Query envelope | CONTRACT-008.1 → 008.5 (5 tasks) |
| CONTRACT-009 | Event envelope | CONTRACT-009.1 → 009.9 (9 tasks) |
| CONTRACT-010 | Sync types | CONTRACT-010.1 → 010.8 (8 tasks) |
| CONTRACT-011 | Pagination | CONTRACT-011.1 → 011.3 (3 tasks) |
| CONTRACT-012 | Domain enums (project, device, module state) | CONTRACT-012.1 → 012.6 (6 tasks) |
| CONTRACT-013 | Identity domain | CONTRACT-013.1 → 013.4 (4 tasks) |
| CONTRACT-014 | Project domain | CONTRACT-014.1 → 014.5 (5 tasks) |
| CONTRACT-015 | Plan/entitlement domain | CONTRACT-015.1 → 015.4 (4 tasks) |
| CONTRACT-016 | Module domain | CONTRACT-016.1 → 016.6 (6 tasks) |
| CONTRACT-017 | Test infrastructure | CONTRACT-017.1 → 017.3 (3 tasks) |

## Total: 88 micro-tasks

## Order of execution

MUST be in numerical order. Branded IDs (CONTRACT-001) come first because everything else depends on them.

## After CONTRACT is done

Move to `tasks/cloud/` for the Cloud platform implementation.
