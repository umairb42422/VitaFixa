import { generateKeyPair, JWTVerifyGetKey, KeyLike, SignJWT } from 'jose';

export const SUPABASE_URL = 'https://test-project.supabase.co';
export const ISSUER = `${SUPABASE_URL}/auth/v1`;

export interface TestKeys {
  privateKey: KeyLike;
  keyResolver: JWTVerifyGetKey;
}

export async function createTestKeys(): Promise<TestKeys> {
  const { privateKey, publicKey } = await generateKeyPair('ES256');
  return { privateKey, keyResolver: async () => publicKey };
}

export interface TokenOptions {
  subject?: string | null;
  issuer?: string;
  audience?: string;
  /** Seconds since epoch. */
  expiresAt?: number;
}

export async function signToken(key: KeyLike | Uint8Array, alg: string, o: TokenOptions = {}): Promise<string> {
  const jwt = new SignJWT({}).setProtectedHeader({ alg, kid: 'test-key' }).setIssuedAt();
  if (o.subject !== null) jwt.setSubject(o.subject ?? 'user-123');
  jwt.setIssuer(o.issuer ?? ISSUER);
  jwt.setAudience(o.audience ?? 'authenticated');
  jwt.setExpirationTime(o.expiresAt ?? Math.floor(Date.now() / 1000) + 3600);
  return jwt.sign(key);
}

/** Unsigned ("alg": "none") token, which must always be rejected. */
export function unsignedToken(): string {
  const enc = (v: object) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ sub: 'user-123', iss: ISSUER, aud: 'authenticated', exp })}.`;
}
