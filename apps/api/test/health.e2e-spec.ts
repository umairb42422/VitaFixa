import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_PREFIX } from '../src/common/constants';
import { AccessTokenVerifier } from '../src/modules/identity/application/interfaces/access-token-verifier';
import { SupabaseAuthAdapter } from '../src/modules/identity/infrastructure/adapters/supabase-auth.adapter';
import { AuthenticatedRequest } from '../src/modules/identity/presentation/guards/authentication.guard';
import { createTestKeys, signToken, SUPABASE_URL, TestKeys } from './identity/token-helpers';

/** Test-only route that is NOT marked @Public(), to prove routes are protected by default. */
@Controller('probe')
class ProbeController {
  @Get()
  whoami(@Req() req: AuthenticatedRequest): { authUserId?: string } {
    return { authUserId: req.user?.authUserId };
  }
}

describe('API authentication (e2e)', () => {
  let app: INestApplication;
  let keys: TestKeys;

  beforeAll(async () => {
    process.env.SUPABASE_URL = SUPABASE_URL;
    keys = await createTestKeys();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })
      .overrideProvider(AccessTokenVerifier)
      .useValue(new SupabaseAuthAdapter({ supabaseUrl: SUPABASE_URL, keyResolver: keys.keyResolver }))
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_PREFIX);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health is public: 200 without a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('health is not served without the version prefix', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('protects other routes by default: 401 without a token', async () => {
    await request(app.getHttpServer()).get('/api/v1/probe').expect(401);
  });

  it('returns 401 for an invalid token', async () => {
    await request(app.getHttpServer()).get('/api/v1/probe').set('Authorization', 'Bearer nope').expect(401);
  });

  it('returns 401 for an expired token', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { expiresAt: Math.floor(Date.now() / 1000) - 60 });
    await request(app.getHttpServer()).get('/api/v1/probe').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('allows a valid token and exposes only the verified user id', async () => {
    const token = await signToken(keys.privateKey, 'ES256', { subject: 'user-42' });
    const res = await request(app.getHttpServer())
      .get('/api/v1/probe')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({ authUserId: 'user-42' });
  });
});
