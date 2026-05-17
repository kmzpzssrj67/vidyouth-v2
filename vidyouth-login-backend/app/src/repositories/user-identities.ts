/**
 * user_identities repository — external OAuth/OIDC identities (migration 007).
 *
 * One Vidyouth user can own multiple provider identities (google, microsoft).
 * Lookup is by (provider, provider_subject); the subject is the provider's
 * stable user id ("sub" claim), never the email (emails change / are reused).
 */

import { query } from '../db/pg.js';

export type IdentityProvider = 'google' | 'microsoft';

export interface UserIdentityRecord {
  id: string;
  user_id: string;
  provider: IdentityProvider;
  provider_subject: string;
  email: string | null;
  email_verified: boolean;
  display_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

const COLUMNS = `
  id, user_id, provider, provider_subject, email, email_verified,
  display_name, avatar_url, created_at, updated_at, last_login_at
`;

export async function findIdentityByProviderSubject(
  provider: IdentityProvider,
  providerSubject: string,
): Promise<UserIdentityRecord | null> {
  const result = await query<UserIdentityRecord>(
    `SELECT ${COLUMNS} FROM user_identities
     WHERE provider = $1 AND provider_subject = $2 LIMIT 1`,
    [provider, providerSubject],
  );
  return result.rows[0] ?? null;
}

export interface LinkIdentityInput {
  userId: string;
  provider: IdentityProvider;
  providerSubject: string;
  email?: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/** Insert the identity, or update the mutable profile fields + last_login_at
 *  if (provider, provider_subject) already exists. Idempotent. */
export async function upsertIdentity(
  input: LinkIdentityInput,
): Promise<UserIdentityRecord> {
  const result = await query<UserIdentityRecord>(
    `INSERT INTO user_identities
       (user_id, provider, provider_subject, email, email_verified,
        display_name, avatar_url, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (provider, provider_subject) DO UPDATE SET
       email         = EXCLUDED.email,
       email_verified= EXCLUDED.email_verified,
       display_name  = EXCLUDED.display_name,
       avatar_url    = EXCLUDED.avatar_url,
       updated_at    = NOW(),
       last_login_at = NOW()
     RETURNING ${COLUMNS}`,
    [
      input.userId,
      input.provider,
      input.providerSubject,
      input.email ?? null,
      input.emailVerified ?? false,
      input.displayName ?? null,
      input.avatarUrl ?? null,
    ],
  );
  return result.rows[0] as UserIdentityRecord;
}
