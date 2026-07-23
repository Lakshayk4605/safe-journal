import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtAccessPayload, JwtRefreshPayload } from '../interfaces';

// @types/jsonwebtoken@9 types `expiresIn` as `number | StringValue` (a template-literal
// type from the `ms` package), not a plain `string`. Our env values are validated at
// startup by Zod but are still statically typed as `string`, so we narrow with a single
// explicit assertion at the boundary where the untyped config value meets the SDK's
// stricter type — this is the standard pattern for this exact library, not a blanket
// safety opt-out.
type ExpiresIn = SignOptions['expiresIn'];

function asExpiresIn(value: string): ExpiresIn {
  return value as ExpiresIn;
}

export function signAccessToken(payload: Omit<JwtAccessPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: asExpiresIn(env.JWT_ACCESS_EXPIRES_IN),
  });
}

export function signRefreshToken(payload: Omit<JwtRefreshPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: asExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  // jwt.verify returns `string | JwtPayload`, which does not structurally overlap
  // enough with our narrower domain type for a direct assertion — go through
  // `unknown`, which is the correct (not unsafe) way to narrow an SDK's generic
  // return type into an application-specific shape we control and validate elsewhere.
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as unknown as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as unknown as JwtRefreshPayload;
}

/** Converts JWT_REFRESH_EXPIRES_IN (e.g. "30d") to a Date used for DB expiry tracking. */
export function refreshTokenExpiryDate(): Date {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  const now = new Date();
  if (!match) {
    now.setDate(now.getDate() + 30);
    return now;
  }
  const [, amountStr, unit] = match;
  const amount = Number(amountStr);
  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + amount);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + amount);
      break;
    case 'h':
      now.setHours(now.getHours() + amount);
      break;
    case 'd':
      now.setDate(now.getDate() + amount);
      break;
  }
  return now;
}
