/**
 * The success result of a query.
 *
 * - `result`: the typed result payload
 * - `durationMs`: query execution time
 * - `cached`: true if the result came from a cache, not a fresh query
 */
export interface QueryResult<TResult> {
    readonly result: TResult;
    readonly durationMs: number;
    readonly cached: boolean;
}
//# sourceMappingURL=result.d.ts.map