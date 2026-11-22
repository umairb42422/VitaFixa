import { HealthController } from '../src/common/health/health.controller';

describe('HealthController', () => {
  it('returns a minimal ok status with no extra details', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
