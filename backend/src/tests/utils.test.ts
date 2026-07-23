import { comparePassword, hashPassword, hashToken, generateSecureToken } from '../utils/password';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

describe('password utils', () => {
  it('hashes and verifies a password correctly', async () => {
    const hash = await hashPassword('SuperSecret123');
    expect(hash).not.toEqual('SuperSecret123');
    await expect(comparePassword('SuperSecret123', hash)).resolves.toBe(true);
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
  });

  it('generates unique secure tokens', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toEqual(b);
    expect(a).toHaveLength(64); // 32 bytes -> 64 hex chars
  });

  it('produces a deterministic hash for the same token', () => {
    const token = generateSecureToken();
    expect(hashToken(token)).toEqual(hashToken(token));
  });
});

describe('jwt utils', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com', role: 'USER' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.type).toBe('access');
  });

  it('signs and verifies a refresh token round-trip', () => {
    const token = signRefreshToken({ sub: 'user-1', jti: 'token-id-1' });
    const payload = verifyRefreshToken(token);
    expect(payload.jti).toBe('token-id-1');
    expect(payload.type).toBe('refresh');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com', role: 'USER' });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });
});
