# TASK ID: MULTI-001.1
# TITLE: Add multi-region routing layer
# STATUS: pending
# DEPENDENCIES: PORTAL-001.3
# ALLOWED FILES: platform-cloud/src/multi-region/router.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
When the user logs in, route them to the closest Cloud region (EU/US/APAC).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/multi-region/router.ts`:

```typescript
import { db } from '../db';
import { accounts } from '../db/schema';
import { eq } from 'drizzle-orm';

const REGION_BY_COUNTRY: Record<string, string> = {
  // EU
  DE: 'eu', FR: 'eu', NL: 'eu', IT: 'eu', ES: 'eu', PL: 'eu', SE: 'eu', IE: 'eu',
  GB: 'eu', UK: 'eu', CH: 'eu', AT: 'eu', BE: 'eu', DK: 'eu', FI: 'eu', NO: 'eu',
  // US
  US: 'us', CA: 'us', MX: 'us',
  // APAC
  JP: 'apac', KR: 'apac', CN: 'apac', IN: 'apac', SG: 'apac', AU: 'apac', NZ: 'apac', HK: 'apac', TW: 'apac',
};

const REGION_URLS: Record<string, string> = {
  eu: process.env.CLOUD_EU_URL || 'https://cloud-eu.product.local',
  us: process.env.CLOUD_US_URL || 'https://cloud-us.product.local',
  apac: process.env.CLOUD_APAC_URL || 'https://cloud-apac.product.local',
};

export function regionForCountry(country: string): string {
  return REGION_BY_COUNTRY[country.toUpperCase()] || 'us';
}

export function urlForRegion(region: string): string {
  return REGION_URLS[region] || REGION_URLS.us!;
}

/// Resolve where to send this request based on the account's home region.
/// If the account is in EU, send them to the EU Cloud, etc.
export async function resolveRegion(accountId: string): Promise<string> {
  const account = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (account.length === 0) return 'us';
  return account[0].region ?? 'us';
}

/// In production, the edge (Cloudflare) handles routing.
/// This function is for when a request hits a non-primary region.
export function shouldRedirectToHome(req: Request, accountRegion: string): { redirect: boolean; url?: string } {
  const currentRegion = process.env.CURRENT_REGION || 'us';
  if (accountRegion !== currentRegion) {
    return { redirect: true, url: urlForRegion(accountRegion) };
  }
  return { redirect: false };
}
```

Add region column to accounts via migration:

```sql
ALTER TABLE accounts ADD COLUMN region TEXT NOT NULL DEFAULT 'us';
```

## TESTS

```bash
cd platform-cloud
test -f src/multi-region/router.ts || { echo "FAIL"; exit 1; }
grep -q "regionForCountry" src/multi-region/router.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
