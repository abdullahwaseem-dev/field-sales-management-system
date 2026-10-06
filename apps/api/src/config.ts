import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  PORTAL_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  /** Development only: return OTP codes in the API response (no SMS gateway configured yet). */
  OTP_DEV_ECHO: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  /** Stadia Maps key for the server-side tile proxy (optional on localhost). */
  STADIA_API_KEY: z.string().optional(),
  /** Shared secret for /internal/jobs/* (scheduler → API on serverless hosting). */
  JOBS_SECRET: z.string().min(32).optional(),
  /** Session-mode connection for LISTEN (live map) when DATABASE_URL is a transaction pooler. */
  DATABASE_URL_SESSION: z.string().url().optional(),
  /** PEM of the database server's CA (e.g. Supabase Root 2021 CA) for verified TLS. */
  DATABASE_CA_CERT: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  JOBS_ENABLED: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  /** Public demo deployment: protected shared accounts, demo sign-ins advertised, simulator enabled. */
  DEMO_MODE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  }
  const config = parsed.data;
  if (config.NODE_ENV === 'test' && config.TEST_DATABASE_URL) config.DATABASE_URL = config.TEST_DATABASE_URL;
  if (config.NODE_ENV === 'production' && config.OTP_DEV_ECHO) throw new Error('OTP_DEV_ECHO must be false in production');
  return config;
}

export const CONFIG = Symbol('CONFIG');
