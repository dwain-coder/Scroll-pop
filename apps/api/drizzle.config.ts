import { defineConfig } from 'drizzle-kit';

if (!process.env['DIRECT_DATABASE_URL'] && !process.env['DATABASE_URL']) {
  throw new Error('DIRECT_DATABASE_URL or DATABASE_URL must be set for migrations');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DIRECT_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
  },
  verbose: true,
  strict: true,
});
