/**
 * Future auth identity repository.
 *
 * The current schema has email/mobile directly on users. Signup and OAuth need
 * a separate identity table so one user can own password, phone, Google, Apple,
 * GitHub, or Microsoft login methods without duplicating account records.
 */

export type AuthIdentityProvider =
  | 'password'
  | 'phone'
  | 'email_otp'
  | 'google'
  | 'apple'
  | 'github'
  | 'microsoft';

export interface AuthIdentityRecord {
  id: string;
  user_id: string;
  provider: AuthIdentityProvider;
  provider_subject: string;
  email: string | null;
  mobile: string | null;
  verified_at: Date | null;
  linked_at: Date;
  last_login_at: Date | null;
  metadata: Record<string, unknown> | null;
}

export interface LinkAuthIdentityInput {
  userId: string;
  provider: AuthIdentityProvider;
  providerSubject: string;
  email?: string | null;
  mobile?: string | null;
  verifiedAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface PasswordIdentityPlaceholderInput {
  userId: string;
  email: string;
}

export async function findAuthIdentityByProviderSubject(
  _provider: AuthIdentityProvider,
  _providerSubject: string,
): Promise<AuthIdentityRecord | null> {
  // TODO(oauth-identities): implement after auth_identities migration lands.
  return null;
}

export async function linkAuthIdentity(
  _input: LinkAuthIdentityInput,
): Promise<AuthIdentityRecord> {
  // TODO(oauth-identities): create provider identity rows for signup/OAuth.
  throw new Error('auth_identities_not_implemented');
}

export async function createPasswordIdentityPlaceholder(
  _input: PasswordIdentityPlaceholderInput,
): Promise<void> {
  // TODO(auth_identities migration): insert a password provider row with
  // provider_subject=email once the auth_identities table is available.
}