#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::device_key::DeviceKey;
    use crate::db::projection_db::ProjectionDb;
    use crate::projection::applier::{apply_batch, WireEvent};
    use serde_json::json;
    use tempfile::tempdir;

    #[test]
    fn device_key_sign_and_verify() {
        let key = DeviceKey::generate();
        let msg = b"hello";
        let sig = key.sign(msg);
        DeviceKey::verify(&key.public_key_bytes(), msg, &sig).unwrap();
    }

    #[tokio::test]
    async fn apply_user_created_event() {
        let tmp = tempdir().unwrap();
        let db_path = tmp.path().join("proj.sqlite");
        let db = ProjectionDb::open(&db_path, "proj_test").await.unwrap();
        let event = WireEvent {
            sequence: 1,
            event_id: "evt_abc".into(),
            event_type: "user.created".into(),
            aggregate_type: "user".into(),
            aggregate_id: "usr_xyz".into(),
            aggregate_version: 1,
            actor_user_id: "usr_admin".into(),
            device_id: "dev_a".into(),
            occurred_at: chrono::Utc::now().to_rfc3339(),
            correlation_id: None,
            causation_id: None,
            payload: json!({"user_id":"usr_xyz","email":"a@b.c","display_name":"A B"}),
        };
        let last = apply_batch(&db, &[event]).await.unwrap();
        assert_eq!(last, 1);
        assert_eq!(db.get_position().await.unwrap(), 1);
    }
}
