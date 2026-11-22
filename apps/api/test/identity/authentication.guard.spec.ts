import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../../src/common/decorators/public.decorator';
import {
  AccessTokenVerifier,
  InvalidAccessTokenError,
} from '../../src/modules/identity/application/interfaces/access-token-verifier';
import {
  AuthenticatedRequest,
  AuthenticationGuard,
} from '../../src/modules/identity/presentation/guards/authentication.guard';

class SampleController {
  protected(): void {}
  @Public()
  open(): void {}
}

function contextFor(handler: () => void, headers: AuthenticatedRequest['headers']) {
  const request: AuthenticatedRequest = { headers };
  const context = {
    getHandler: () => handler,
    getClass: () => SampleController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AuthenticationGuard', () => {
  const verify = jest.fn();
  const guard = new AuthenticationGuard(new Reflector(), { verify } as AccessTokenVerifier);
  const sample = new SampleController();

  beforeEach(() => verify.mockReset());

  it('lets @Public() routes through without a token and without verifying', async () => {
    const { context } = contextFor(sample.open, {});
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a missing Authorization header (protected by default)', async () => {
    const { context } = contextFor(sample.protected, {});
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it.each(['', 'Bearer', 'Bearer ', 'Basic abc', 'abc', 'Bearer a b'])(
    'rejects a malformed Authorization header %p',
    async (value) => {
      const { context } = contextFor(sample.protected, { authorization: value });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(verify).not.toHaveBeenCalled();
    },
  );

  it('rejects an invalid or expired token with 401', async () => {
    verify.mockRejectedValue(new InvalidAccessTokenError());
    const { context, request } = contextFor(sample.protected, { authorization: 'Bearer bad.token.value' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  it('accepts a valid token and attaches the verified user', async () => {
    verify.mockResolvedValue({ authUserId: 'user-1' });
    const { context, request } = contextFor(sample.protected, { authorization: 'bearer good.token.value' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('good.token.value');
    expect(request.user).toEqual({ authUserId: 'user-1' });
  });

  it('does not grant access on unexpected verifier failures', async () => {
    verify.mockRejectedValue(new Error('boom'));
    const { context, request } = contextFor(sample.protected, { authorization: 'Bearer x.y.z' });
    await expect(guard.canActivate(context)).rejects.toThrow('boom');
    expect(request.user).toBeUndefined();
  });
});
