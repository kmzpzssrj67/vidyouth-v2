/**
 * OAuth / OIDC start routes for Google and Microsoft.
 *
 * These routes begin the browser redirect flow. The callback routes are
 * present so provider redirects do not 404 while the token-exchange step is
 * wired in.
 */

import type { FastifyInstance, FastifyReply } from 'fastify';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

type Provider = 'google' | 'microsoft';

interface ProviderConfig {
  clientId?: string | undefined;
  clientSecret?: string | undefined;
  redirectUri?: string | undefined;
  authorizationEndpoint: string;
  scope: string;
}

const stateCookieName = (provider: Provider) => `vidyouth_oauth_${provider}_state`;

function missingConfig(provider: Provider, config: ProviderConfig): string[] {
  const missing: string[] = [];
  if (!config.clientId) missing.push(`${provider.toUpperCase()}_CLIENT_ID`);
  if (!config.clientSecret) missing.push(`${provider.toUpperCase()}_CLIENT_SECRET`);
  if (!config.redirectUri) missing.push(`${provider.toUpperCase()}_REDIRECT_URI`);
  return missing;
}

function setStateCookie(reply: FastifyReply, provider: Provider, state: string) {
  reply.header(
    'Set-Cookie',
    `${stateCookieName(provider)}=${state}; Path=/auth/${provider}/callback; HttpOnly; SameSite=Lax; Max-Age=600`,
  );
}

function buildAuthorizationUrl(config: ProviderConfig, state: string): string {
  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set('client_id', config.clientId ?? '');
  url.searchParams.set('redirect_uri', config.redirectUri ?? '');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', state);
  return url.toString();
}

function providerConfig(provider: Provider): ProviderConfig {
  if (provider === 'google') {
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      scope: 'openid email profile',
    };
  }

  const tenant = env.MICROSOFT_TENANT_ID || 'common';
  return {
    clientId: env.MICROSOFT_CLIENT_ID,
    clientSecret: env.MICROSOFT_CLIENT_SECRET,
    redirectUri: env.MICROSOFT_REDIRECT_URI,
    authorizationEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    scope: 'openid email profile',
  };
}

async function startOauth(app: FastifyInstance, provider: Provider): Promise<void> {
  app.get(`/auth/${provider}`, async (_req, reply) => {
    const config = providerConfig(provider);
    const missing = missingConfig(provider, config);
    if (missing.length > 0) {
      reply.code(501).send({
        error: 'oauth_not_configured',
        provider,
        missing,
        message: `Add ${missing.join(', ')} in app/.env, then restart the API container.`,
      });
      return;
    }

    const state = randomBytes(24).toString('hex');
    setStateCookie(reply, provider, state);
    reply.redirect(buildAuthorizationUrl(config, state));
  });

  app.get(`/auth/${provider}/callback`, async (req, reply) => {
    const query = req.query as { code?: string; state?: string; error?: string; error_description?: string };
    if (query.error) {
      reply.code(400).send({
        error: 'oauth_provider_error',
        provider,
        detail: query.error_description ?? query.error,
      });
      return;
    }

    reply.code(501).send({
      error: 'oauth_callback_not_wired',
      provider,
      hasCode: Boolean(query.code),
      hasState: Boolean(query.state),
      message: 'Provider redirect works. Next step is exchanging the code, creating a Vidyouth session, and redirecting to the frontend.',
    });
  });
}

export async function oauthRoutes(app: FastifyInstance): Promise<void> {
  await startOauth(app, 'google');
  await startOauth(app, 'microsoft');
}
