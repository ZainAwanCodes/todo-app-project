import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);

/**
 * Idempotent schema bootstrap.
 * Creates the todos table and adds any missing columns from the full schema.
 * Safe to call on every request (Neon caches the connection).
 */
export async function initDb() {
  // Create base table (legacy shape) if it doesn't exist yet
  await sql`
    CREATE TABLE IF NOT EXISTS todos (
      id         SERIAL PRIMARY KEY,
      title      TEXT        NOT NULL DEFAULT '',
      completed  BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Migrate: add full-schema columns when they are missing
  await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS title       TEXT        NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS description TEXT`;
  await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority    TEXT        NOT NULL DEFAULT 'medium'`;
  await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date    TIMESTAMPTZ`;
  await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

  // Attempt to back-fill title from legacy "text" column if it exists
  try {
    await sql`UPDATE todos SET title = text WHERE title = '' AND text <> ''`;
  } catch (err) {
    // text column might not exist, ignore
  }
}
