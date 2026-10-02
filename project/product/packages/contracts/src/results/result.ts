/**
 * Result<T, E> — a discriminated union for success/failure.
 *
 * Used at every IPC/network boundary instead of throwing exceptions.
 * Forces callers to handle the failure case explicitly.
 *
 * @example
 *   const r: Result<Patient, ValidationError> = await createPatient(input);
 *   if (r.ok) {
 *     console.log(r.value.name);
 *   } else {
 *     console.log(r.error.code);
 *   }
 */
export type Result<TValue, TError> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError };

/**
 * Helper: build a success result.
 */
export function ok<TValue>(value: TValue): Result<TValue, never> {
  return { ok: true, value };
}

/**
 * Helper: build a failure result.
 */
export function err<TError>(error: TError): Result<never, TError> {
  return { ok: false, error };
}
