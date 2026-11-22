import { generateKeyPair } from 'jose';
import { InvalidAccessTokenError } from '../../src/modules/identity/application/interfaces/access-token-verifier';
import { SupabaseAuthAdapter } from '../../src/modules/identity/infrastructure/adapters/supabase-auth.adapter';
import { createTestKeys, ISSUER, signToken, SUPABASE_URL, TestKeys, unsignedToken } from './token-helpers';

describe('SupabaseAuthAdapter', () => {
  let keys: TestKeys;
  let adapter: SupabaseAuthAdapter;

  beforeAll(async () => {
    keys = await createTestKeys();
    adapter = new SupabaseAuthAdapter({ supabaseUrl: SUPABASE_URL, keyResolver: keys.keyResolver });
  });

  it('accepts a valid token and returns the verified user id', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { subject: 'user-abc' });
    await expect(adapter.verify(token)).resolves.toEqual({ authUserId: 'user-abc' });
  });

  it('rejects an expired token', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { expiresAt: Math.floor(Date.now() / 1000) - 60 });
    await expect(adapter.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a malformed token', async () => {
    await expect(adapter.verify('not-a-jwt')).rejects.toBeInstanceOf(InvalidAccessTokenError);
    await expect(adapter.verify('a.b.c')).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a tampered token', async () => {
    const token = await signToken(keys.privateKey, 'ES256');
    const [h, , s] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'someone-else', iss: ISSUER, aud: 'authenticated', exp: 9999999999 }),
    ).toString('base64url');
    await expect(adapter.verify(`${h}.${forgedPayload}.${s}`)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a token signed by an unknown key', async () => {
    const other = await generateKeyPair('ES256');
    const token = await signToken(other.privateKey, 'ES256');
    await expect(adapter.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects an unsigned (alg none) token', async () => {
    await expect(adapter.verify(unsignedToken())).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a shared-secret (HS256) token', async () => {
    const secret = new TextEncoder().encode('a-shared-secret-that-is-long-enough-123456');
    const token = await signToken(secret, 'HS256');
    await expect(adapter.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a wrong issuer', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { issuer: 'https://evil.example/auth/v1' });
    await expect(adapter.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a wrong audience', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { audience: 'anon' });
    await expect(adapter.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a token without a subject', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { subject: null });
    await expect(adapter.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('does not reveal why verification failed', async () => {
    const error = await adapter.verify('not-a-jwt').catch((e: Error) => e);
    expect((error as Error).message).toBe('Invalid access token');
  });

  describe('configuration', () => {
    it('refuses to start without SUPABASE_URL', () => {
      expect(() => SupabaseAuthAdapter.fromEnvironment({})).toThrow('SUPABASE_URL');
    });

    it('rejects an invalid SUPABASE_URL', () => {
      expect(() => new SupabaseAuthAdapter({ supabaseUrl: 'not a url' })).toThrow();
    });
  });
});
