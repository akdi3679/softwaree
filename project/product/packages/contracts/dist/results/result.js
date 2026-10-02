/**
 * Helper: build a success result.
 */
export function ok(value) {
    return { ok: true, value };
}
/**
 * Helper: build a failure result.
 */
export function err(error) {
    return { ok: false, error };
}
//# sourceMappingURL=result.js.map