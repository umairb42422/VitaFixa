import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../../common/decorators/public.decorator';
import {
  AccessTokenVerifier,
  AuthenticatedUser,
  InvalidAccessTokenError,
} from '../../application/interfaces/access-token-verifier';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  /** Set only from a verified token. */
  user?: AuthenticatedUser;
}

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

/**
 * Global guard (registered in IdentityModule). Every route requires a valid
 * Bearer access token unless marked with @Public().
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers['authorization'];
    const match = typeof header === 'string' ? BEARER_PATTERN.exec(header) : null;
    if (!match) {
      throw new UnauthorizedException();
    }

    try {
      request.user = await this.verifier.verify(match[1]);
      return true;
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw new UnauthorizedException();
      }
      throw error; // unexpected failure: surfaces as 500, never as access granted
    }
  }
}
