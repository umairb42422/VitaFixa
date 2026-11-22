import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import {
  AccessTokenVerifier,
  AuthenticatedUser,
  InvalidAccessTokenError,
} from '../../application/interfaces/access-token-verifier';

/** Audience of Supabase user access tokens (ADR-002 section 2.2). */
const EXPECTED_AUDIENCE = 'authenticated';
/**
 * Asymmetric algorithms only; "none" and shared-secret (HS*) tokens are rejected.
 * ES256 and RS256 are the asymmetric options of Supabase JWT signing keys.
 */
const ALLOWED_ALGORITHMS = ['ES256', 'RS256'];

export interface SupabaseAuthAdapterOptions {
  /** Supabase project URL, e.g. https://<project-ref>.supabase.co */
  supabaseUrl: string;
  /** Key resolver override, for tests only. Defaults to the project's remote JWKS. */
  keyResolver?: JWTVerifyGetKey;
}

/**
 * Verifies Supabase access tokens locally against the project's public keys (JWKS).
 * No signing secret is used or stored.
 */
export class SupabaseAuthAdapter extends AccessTokenVerifier {
  private readonly issuer: string;
  private readonly keyResolver: JWTVerifyGetKey;

  constructor(options: SupabaseAuthAdapterOptions) {
    super();
    const base = new URL(options.supabaseUrl); // throws on an invalid URL
    const authUrl = `${base.origin}${base.pathname.replace(/\/+$/, '')}/auth/v1`;
    this.issuer = authUrl;
    this.keyResolver =
      options.keyResolver ?? createRemoteJWKSet(new URL(`${authUrl}/.well-known/jwks.json`));
  }

  /** Fails fast (fail securely) when the project URL is not configured. */
  static fromEnvironment(env: NodeJS.ProcessEnv): SupabaseAuthAdapter {
    const supabaseUrl = env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is required to verify access tokens');
    }
    return new SupabaseAuthAdapter({ supabaseUrl });
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    try {
      const { payload } = await jwtVerify(token, this.keyResolver, {
        issuer: this.issuer,
        audience: EXPECTED_AUDIENCE,
        algorithms: ALLOWED_ALGORITHMS,
        requiredClaims: ['sub', 'exp'],
      });
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new InvalidAccessTokenError();
      }
      return { authUserId: payload.sub };
    } catch {
      // Deliberately discard the cause: no token or claim details leave this class.
      throw new InvalidAccessTokenError();
    }
  }
}
