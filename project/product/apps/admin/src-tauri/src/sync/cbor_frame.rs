use serde::Serialize;

use crate::error::{AppError, AppResult};

pub fn encode<T: Serialize>(value: &T) -> AppResult<Vec<u8>> {
    let mut buf = Vec::new();
    ciborium::ser::into_writer(value, &mut buf)
        .map_err(|e| AppError::Protocol(format!("cbor encode: {e}")))?;
    Ok(buf)
}

pub fn decode<T: serde::de::DeserializeOwned>(bytes: &[u8]) -> AppResult<T> {
    ciborium::de::from_reader(bytes)
        .map_err(|e| AppError::Protocol(format!("cbor decode: {e}")))
}
