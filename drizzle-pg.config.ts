import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/database/src/schema-pg/index.ts',
  out: './packages/database/src/migrations-pg',
  dialect: 'postgresql',
});
