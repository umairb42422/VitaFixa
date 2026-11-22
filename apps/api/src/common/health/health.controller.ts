import { Controller, Get } from '@nestjs/common';

/**
 * Basic public health check: GET /api/v1/health (API-SPECIFICATION.md section 8.1).
 * Must not expose secrets, configuration or infrastructure details.
 * /health/ready and /health/live are not implemented: the spec marks them
 * "Internal/authorized" and authentication does not exist yet.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
