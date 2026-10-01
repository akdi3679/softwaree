# TASK ID: CLOUD-002.7
# TITLE: Add structured logger
# STATUS: pending
# DEPENDENCIES: CLOUD-002.6
# ALLOWED FILES: platform-cloud/apps/api/src/lib/logger.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a structured pino logger with correlation ID support.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/lib/logger.ts`:

```typescript
import { pino } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'cloud-api' },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }
    : {}),
});

/**
 * Create a child logger with a correlation ID bound.
 */
export function withCorrelation(correlationId: string) {
  return logger.child({ correlationId });
}
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/lib/logger.ts || { echo "FAIL"; exit 1; }
grep -q "pino" apps/api/src/lib/logger.ts || { echo "FAIL"; exit 1; }
grep -q "withCorrelation" apps/api/src/lib/logger.ts || { echo "FAIL: no withCorrelation"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
