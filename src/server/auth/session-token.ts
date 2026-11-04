import { jwtVerify, SignJWT } from 'jose';

// Signing and verifying the web session JWT. No `server-only` / `next/headers`
// imports here so `src/proxy.ts` can use it too.

export const SESSION_COOKIE = 'rc_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = 'CLIENT' | 'EVALUATOR' | 'ADMIN';
export type SessionPayload = { userId: string; role: SessionRole };

const DEV_FALLBACK_SECRET = 'dev-only-secret-do-not-use-in-production-0000';
let warned = false;

function key() {
  let secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
    }
    if (!warned) {
      console.warn('[auth] JWT_SECRET is not set; using an insecure development secret.');
      warned = true;
    }
    secret = DEV_FALLBACK_SECRET;
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    const role = payload.role;
    if (!payload.sub || (role !== 'CLIENT' && role !== 'EVALUATOR' && role !== 'ADMIN')) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}
