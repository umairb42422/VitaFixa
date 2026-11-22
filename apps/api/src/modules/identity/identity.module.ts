import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenVerifier } from './application/interfaces/access-token-verifier';
import { SupabaseAuthAdapter } from './infrastructure/adapters/supabase-auth.adapter';
import { AuthenticationGuard } from './presentation/guards/authentication.guard';

/**
 * Token verification and the global authentication guard (ADR-002).
 * Sign-up, login and logout are handled by Supabase Auth, not by this module.
 */
@Module({
  providers: [
    {
      provide: AccessTokenVerifier,
      useFactory: () => SupabaseAuthAdapter.fromEnvironment(process.env),
    },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
  ],
  exports: [AccessTokenVerifier],
})
export class IdentityModule {}
