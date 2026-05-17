import type { FastifyBaseLogger } from 'fastify';

export interface SendOtpSmsInput {
  to: string;
  code: string;
  expiresInSec: number;
  logger: FastifyBaseLogger;
}

export interface SmsProvider {
  sendOtp(input: SendOtpSmsInput): Promise<void>;
}