/** Identity established from a verified access token. Never taken from client input. */
export interface AuthenticatedUser {
  /** Supabase user id (the verified "sub" claim). */
  authUserId: string;
}

/** Raised for any token that is missing required properties or fails verification. */
export class InvalidAccessTokenError extends Error {
  constructor() {
    super('Invalid access token');
    this.name = 'InvalidAccessTokenError';
  }
}

/** Application-level port; implemented by the Supabase adapter (ADR-002 section 2.2). */
export abstract class AccessTokenVerifier {
  /** Resolves with the authenticated user, or rejects with InvalidAccessTokenError. */
  abstract verify(token: string): Promise<AuthenticatedUser>;
}
