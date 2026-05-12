/**
 * Postgres pool. PgBouncer-ready: keeps the pool small per process so a
 * fleet of N app instances can sit behind a transaction-mode PgBouncer
 * without exhausting RDS max_connections.
 */

import pg from 'pg';
import { env } from '@/config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: env.PG_POOL_IDLE_MS,
  // RDS requires SSL in production. Trusts AWS RDS CA bundled into the OS
  // when running on Amazon Linux 2023; local dev disables it via env override.
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error({ err }, 'unexpected pg pool error');
});

/** Convenience for one-shot queries. Use a client checkout for transactions. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as unknown[]);
}

export async function pingDb(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
