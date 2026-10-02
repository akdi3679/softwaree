CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    aggregate_type,
    aggregate_id,
    title,
    body,
    tokenize = 'porter unicode61'
);