# TASK ID: CONTRACT-002.1
# TITLE: Create brand.ts with type-level branding helper
# STATUS: pending
# DEPENDENCIES: REPO-007.8
# ALLOWED FILES: product/packages/contracts/src/identity/brand.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the type-level branding helper. This is the primitive that all branded ID types use. It must be zero-runtime: just type-level.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity/brand.ts` with EXACTLY this content:

```typescript
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
 * const b: UserId = a; // ❌ Type error: Type 'ProjectId' is not assignable to type 'UserId'
 */
export type Branded<TBrand extends string, TValue> = TValue & {
  readonly __brand: TBrand;
};
```

## ACCEPTANCE CRITERIA
- [ ] File exists at the specified path
- [ ] Exports the `Branded` type
- [ ] Type is generic over brand name and underlying value type
- [ ] No runtime code (only types)

## TESTS

```bash
cd product

test -f packages/contracts/src/identity/brand.ts || { echo "FAIL"; exit 1; }

# Must compile
cat > /tmp/brand_test.ts <<'EOF'
import type { Branded } from './packages/contracts/src/identity/brand';

type ProjectId = Branded<'ProjectId', string>;
type UserId = Branded<'UserId', string>;

const a: ProjectId = 'p_1' as ProjectId;
const b: UserId = 'u_1' as UserId;

// This MUST fail to compile (the test verifies the helper exists; the failure
// is expected but we just check the type file is parseable)
const c: ProjectId = a;
const d: string = c;

export { a, b, d };
EOF

pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }

# Verify the brand symbol is present in the type
grep -q "readonly __brand" packages/contracts/src/identity/brand.ts || { echo "FAIL: no __brand"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- ADR-002-admin-as-source-of-truth.md (branded IDs prevent cross-type confusion)
- https://www.typescriptlang.org/play?#code/CYUwxgNghgTiAEYD2A7AzgF3iAysuAlhgC4QC8
