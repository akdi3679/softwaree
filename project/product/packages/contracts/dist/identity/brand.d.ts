/**
 * Type-level branding primitive.
 *
 * A branded type is structurally the same as its underlying type (e.g. `string`)
 * but nominally distinct. This prevents accidental cross-type assignment
 * (e.g., passing a UserId where a ProjectId is expected).
 *
 * Branded types have ZERO runtime cost. The brand only exists in the type system.
 *
 * @example
 * type ProjectId = Branded<'ProjectId', string>;
 * type UserId = Branded<'UserId', string>;
 *
 * const a: ProjectId = 'p_1' as ProjectId;
 * const b: UserId = a; // ? Type error: Type 'ProjectId' is not assignable to type 'UserId'
 */
export type Branded<TBrand extends string, TValue> = TValue & {
    readonly __brand: TBrand;
};
//# sourceMappingURL=brand.d.ts.map