CREATE TABLE invitations (
    invitation_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    invited_by_user_id TEXT NOT NULL,
    invited_email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    initial_role TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    accepted_at TEXT,
    accepted_by_user_id TEXT,
    revoked_at TEXT,
    revoked_reason TEXT,
    created_at TEXT NOT NULL
);
