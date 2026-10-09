import { neon } from "@neondatabase/serverless";

/**
 * Validates and retrieves the database connection string.
 * Trims extraneous whitespace and strips accidental quotes added in environment variables.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure it in your Vercel project settings."
    );
  }
  return url.trim().replace(/^["']|["']$/g, "");
}

/**
 * Neon serverless SQL client.
 */
export const sql = neon(getDatabaseUrl());

/**
 * Idempotent schema initialization.
 * Defines the complete Todo table schema matching production expectations.
 * Memoized so it will run at most once per serverless instance lifecycle.
 */
let schemaInitPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS todos (
          id         BIGSERIAL PRIMARY KEY,
          title      VARCHAR(255) NOT NULL,
          description TEXT,
          priority   VARCHAR(50)  NOT NULL DEFAULT 'medium',
          due_date   TIMESTAMPTZ,
          completed  BOOLEAN      NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
      `;
    } catch (error) {
      // Clear memoized promise on failure to permit retry
      schemaInitPromise = null;
      throw error;
    }
  })();

  return schemaInitPromise;
}

/**
 * Backward compatibility alias for ensureSchema.
 */
export const initDb = ensureSchema;

/**
 * Logs server errors safely without leaking credentials (passwords, connection strings)
 * to client responses or raw logs.
 */
export function safeLogError(context: string, error: unknown): void {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const rawStack = error instanceof Error ? error.stack : undefined;

  // Redact PostgreSQL connection strings and credentials from logs
  const redact = (str: string) =>
    str
      .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, "$1***$3")
      .replace(/(password=)[^&\s]+/gi, "$1***");

  const sanitizedMessage = redact(rawMessage);
  const sanitizedStack = rawStack ? redact(rawStack) : "";

  console.error(
    `[Database Error] ${context}: ${sanitizedMessage}`,
    sanitizedStack ? `\nStack: ${sanitizedStack}` : ""
  );
}
