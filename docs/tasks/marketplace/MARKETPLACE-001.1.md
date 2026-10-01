# TASK ID: MARKETPLACE-001.1
# TITLE: Add module marketplace — schema for third-party modules
# STATUS: pending
# DEPENDENCIES: COMPLIANCE-001.4
# ALLOWED FILES: platform-cloud/src/marketplace/publisher.ts, platform-cloud/src/marketplace/review.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add a marketplace layer: third-party developers can publish modules, customers can browse/install.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/marketplace/publisher.ts`:

```typescript
import { z } from 'zod';
import { db } from '../db';
import { modules, moduleVersions, modulePublishers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { signModule } from '../modules/signer';

export const PublishRequestSchema = z.object({
  publisher_id: z.string(),
  module_id: z.string().regex(/^[a-z0-9_-]+$/),
  name: z.string().min(3).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(2000),
  category: z.enum(['medical', 'food-lab', 'retail', 'service', 'industrial', 'other']),
  min_plan: z.enum(['local', 'starter', 'team', 'enterprise']),
  price_cents: z.number().int().min(0), // 0 = free
  binary: z.string(), // base64
  screenshots: z.array(z.string()).max(5).default([]), // base64
});

export interface PublishResult {
  module_id: string;
  version: string;
  sha256: string;
  review_status: 'pending_review';
}

/**
 * Publish a new module.
 * 1. Validate input
 * 2. Verify publisher is registered and verified
 * 3. Compute SHA-256
 * 4. Store binary
 * 5. Sign with cloud_root (project_license is filled at install time)
 * 6. Insert into DB with status 'pending_review'
 * 7. Notify reviewers
 */
export async function publish(req: z.infer<typeof PublishRequestSchema>): Promise<PublishResult> {
  // Verify publisher
  const publisher = await db.select().from(modulePublishers).where(eq(modulePublishers.id, req.publisher_id)).limit(1);
  if (publisher.length === 0) throw new Error('publisher not found');
  if (publisher[0].verified !== true) throw new Error('publisher not verified');

  // Decode + hash
  const binary = Buffer.from(req.binary, 'base64');
  const sha256 = await import('node:crypto').then(m => m.createHash('sha256').update(binary).digest('hex'));

  // Sign
  const manifest = {
    module_id: req.module_id,
    name: req.name,
    version: req.version,
    description: req.description,
    min_core_version: '0.1.0',
    min_app_version: '0.1.0',
    required_permissions: [],
    provided_commands: [],
    provided_events: [],
    provided_queries: [],
    capabilities: [],
    binary_format: 'wasm32-wasip2' as const,
    binary_size_bytes: binary.length,
    sha256,
    signed_by: 'cloud_root',
    signed_at: new Date().toISOString(),
  };

  // Insert module row (if not exists) and version row
  const existing = await db.select().from(modules).where(eq(modules.moduleId, req.module_id)).limit(1);
  if (existing.length === 0) {
    await db.insert(modules).values({
      moduleId: req.module_id,
      name: req.name,
      description: req.description,
      category: req.category,
      minPlan: req.min_plan,
      priceCents: req.price_cents,
      publisherId: req.publisher_id,
      requiredPermissions: [],
      providedCommands: [],
      providedEvents: [],
      providedQueries: [],
      publishedAt: new Date().toISOString(),
      reviewStatus: 'pending',
    });
  }

  // Sign the version
  const signed = signModule(manifest, binary, 'placeholder', 'placeholder');

  await db.insert(moduleVersions).values({
    moduleId: req.module_id,
    version: req.version,
    sha256,
    sizeBytes: binary.length,
    manifestJson: JSON.stringify(manifest),
    binary: req.binary,
    signatures: JSON.stringify(signed.signatures),
    publishedAt: new Date().toISOString(),
    reviewStatus: 'pending',
  });

  return {
    module_id: req.module_id,
    version: req.version,
    sha256,
    review_status: 'pending_review',
  };
}
```

Create `platform-cloud/src/marketplace/review.ts`:

```typescript
import { db } from '../db';
import { modules, moduleVersions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ReviewAction {
  module_id: string;
  version: string;
  action: 'approve' | 'reject';
  reason?: string;
  reviewer_id: string;
}

/**
 * Review a module version. Approve or reject.
 * Approve: status changes to 'published', visible in marketplace.
 * Reject: status changes to 'rejected', publisher notified.
 */
export async function review(action: ReviewAction): Promise<void> {
  const now = new Date().toISOString();
  const status = action.action === 'approve' ? 'published' : 'rejected';
  await db.update(moduleVersions)
    .set({
      reviewStatus: status,
      reviewReason: action.reason,
      reviewedAt: now,
      reviewerId: action.reviewer_id,
    })
    .where(eq(moduleVersions.moduleId, action.module_id))
    .where(eq(moduleVersions.version, action.version));
}

/**
 * Automated security review:
 * 1. Run the module in a sandbox for 30 seconds
 * 2. Check it doesn't make unexpected network calls
 * 3. Check it doesn't try to read /etc/passwd
 * 4. Check it doesn't fork
 * 5. Check fuel usage is reasonable
 */
export async function automatedReview(moduleId: string, version: string): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];
  // In real impl, this would run a Wasmtime instance in a restricted env
  // For v1, we stub it
  return { passed: issues.length === 0, issues };
}
```

## TESTS

```bash
cd platform-cloud
test -f src/marketplace/publisher.ts || { echo "FAIL"; exit 1; }
test -f src/marketplace/review.ts || { echo "FAIL: no review"; exit 1; }
grep -q "publish" src/marketplace/publisher.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
