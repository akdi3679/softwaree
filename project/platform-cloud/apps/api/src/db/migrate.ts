import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  console.log('[migrate] running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('[migrate] done');
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
