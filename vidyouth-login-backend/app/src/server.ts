/**
 * Fastify server bootstrap. Wires:
 *   - logger (pino)
 *   - helmet, CORS, rate-limit, sensible
 *   - auth decorator (so routes can use { preHandler: app.auth })
 *   - graceful shutdown on SIGINT / SIGTERM
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env, isProd } from './config/env.js';
import { closeDb } from './db/pg.js';
import { closeRedis } from './db/redis.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { signupRoutes } from './routes/signup.js';
import { oauthRoutes } from './routes/oauth.js';
import { otpRoutes } from './routes/otp.js';
import { meRoutes } from './routes/me.js';
import { emailVerifyRoutes } from './routes/email-verify.js';
import { passwordResetRoutes } from './routes/password-reset.js';
import { phoneAuthRoutes } from './routes/phone.js';
import { authRequired } from './middleware/auth.js';

declare module 'fastify' {
  interface FastifyInstance {
    auth: typeof authRequired;
  }
}

async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(isProd
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, singleLine: true },
            },
          }),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.code',
          'req.body.refresh_token',
        ],
        censor: '[redacted]',
      },
    },
    trustProxy: true, // ALB / CloudFront in front
    bodyLimit: 64 * 1024,
    disableRequestLogging: false,
  });

  await app.register(sensible);
  await app.register(helmet, {
    contentSecurityPolicy: false, // CSP belongs at the edge layer (CloudFront)
  });
  await app.register(cors, {
    origin: isProd ? ['https://vidyouth.com'] : true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.decorate('auth', authRequired);

  // health is unauthenticated and must be reachable even if other routes fail
  await app.register(healthRoutes);

  await app.register(authRoutes);
  await app.register(signupRoutes);
  await app.register(oauthRoutes);
  await app.register(otpRoutes);
  await app.register(meRoutes);
  await app.register(emailVerifyRoutes);
  await app.register(passwordResetRoutes);
  await app.register(phoneAuthRoutes);

  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, 'unhandled error');
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    reply.code(status).send({
      error: status >= 500 ? 'internal_error' : err.message,
    });
  });

  return app;
}

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info({ env: env.NODE_ENV, port: env.PORT }, 'vidyouth-login-api ready');
  } catch (err) {
    app.log.fatal({ err }, 'failed to start');
    process.exit(1);
  }

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      await closeDb();
      await closeRedis();
    } catch (err) {
      app.log.error({ err }, 'error during shutdown');
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
