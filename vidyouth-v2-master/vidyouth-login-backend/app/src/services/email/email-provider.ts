import type { FastifyBaseLogger } from 'fastify';

export interface SendVerificationEmailInput {
  to: string;
  verificationUrl: string;
  expiresAt: Date;
  logger: FastifyBaseLogger;
}

export interface EmailProvider {
  sendVerificationEmail(input: SendVerificationEmailInput): Promise<void>;
}
