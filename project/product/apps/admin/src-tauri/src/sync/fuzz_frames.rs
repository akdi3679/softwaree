//! Fuzz target for the sync frame decoder.
//!
//! NOTE: not yet wired into cargo-fuzz. Once a fuzz harness is set up,
//! this file should move into apps/admin/fuzz/fuzz_targets/. For now it
//! lives here as documentation of the intended target.
//!
//! To activate (in a fuzz workspace):
//!   cargo fuzz run fuzz_frames

#![cfg(fuzzing)]
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let _ = std::str::from_utf8(data);
});
