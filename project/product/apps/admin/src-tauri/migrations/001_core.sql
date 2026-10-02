CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    admin_last_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    business_name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    activated_at TEXT,
    archived_at TEXT
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
);

CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_built_in INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(name)
);

CREATE TABLE role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    scope TEXT,
    granted_at TEXT NOT NULL,
    PRIMARY KEY (role_id, permission)
);

CREATE TABLE user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TEXT NOT NULL,
    granted_by TEXT,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE audit_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occurred_at TEXT NOT NULL,
    actor_user_id TEXT,
    actor_device_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    result TEXT NOT NULL,
    details TEXT,
    prev_hash TEXT NOT NULL,
    entry_hash TEXT NOT NULL
);

CREATE INDEX idx_audit_occurred ON audit_entries(occurred_at);
CREATE INDEX idx_audit_actor ON audit_entries(actor_user_id);
CREATE INDEX idx_audit_target ON audit_entries(target_type, target_id);
