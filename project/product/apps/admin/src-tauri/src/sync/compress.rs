use crate::error::{AppError, AppResult};

const MIN_SIZE: usize = 1024;
const COMPRESSION_LEVEL: i32 = 3;

pub fn compress(data: &[u8]) -> AppResult<Vec<u8>> {
    if data.len() < MIN_SIZE {
        return Ok(data.to_vec());
    }
    zstd::encode_all(data, COMPRESSION_LEVEL)
        .map_err(|e| AppError::Protocol(format!("zstd encode: {e}")))
}

pub fn decompress(data: &[u8]) -> AppResult<Vec<u8>> {
    if data.len() < MIN_SIZE {
        return Ok(data.to_vec());
    }
    zstd::decode_all(data)
        .map_err(|e| AppError::Protocol(format!("zstd decode: {e}")))
}
