/**
 * OpenAPI 3.0 Specification Generator for DPDPA Privacy Compliance Suite
 */

export function getOpenAPISpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'DPDPA Privacy Compliance Suite API',
      version: '1.0.0',
      description:
        'Authoritative Central Compliance Database (CCD) and modular Privacy Operations REST API for Indian Organisations under the Digital Personal Data Protection Act, 2023.',
      contact: {
        name: 'DPDPA Platform Engineering',
        email: 'api-support@dpdpa-suite.internal',
      },
      license: {
        name: 'Apache-2.0',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Primary Tenant API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        TenantAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-tenant-id',
          description: 'Tenant UUID for row-level isolation',
        },
        UserRole: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-role',
          description: 'Verified role: viewer | editor | approver | admin | ppoc_cpo',
        },
      },
    },
    security: [{ TenantAuth: [], UserRole: [] }],
    paths: {
      '/cpo/health': {
        get: {
          summary: 'Retrieve CPO Health Score and Operational Readiness Metrics',
          description: 'Computes weighted DPDPA compliance health score across entitled modules.',
          responses: {
            '200': { description: 'Calculated health score and breakdown' },
          },
        },
      },
      '/cpo/board-report': {
        get: {
          summary: 'Generate 15-Section Board Readiness Report',
          description: 'Returns point-in-time snapshot with 15 statutory compliance sections.',
          responses: {
            '200': { description: 'Full executive report JSON' },
          },
        },
      },
      '/consent/records': {
        get: {
          summary: 'List active consent records for current tenant',
          responses: { '200': { description: 'Array of consent records' } },
        },
      },
      '/consent/withdraw': {
        post: {
          summary: 'Withdraw consent and trigger automated cessation task',
          description: 'Atomically updates consent state, writes audit log, and creates outbox event.',
          responses: { '200': { description: 'Consent withdrawn successfully' } },
        },
      },
      '/discovery/assets': {
        get: {
          summary: 'List electronic and physical personal data assets',
          responses: { '200': { description: 'Asset inventory list' } },
        },
      },
      '/mapper/ropa': {
        get: {
          summary: 'List Records of Processing Activities (RoPA)',
          responses: { '200': { description: 'RoPA entries with legal basis' } },
        },
      },
      '/rights/requests': {
        get: {
          summary: 'List Data Principal Rights Requests (DSR/Grievance)',
          responses: { '200': { description: 'Rights queue' } },
        },
      },
      '/breach/incidents': {
        get: {
          summary: 'List personal data breach incidents and statutory notifications',
          responses: { '200': { description: 'Breach incident list' } },
        },
      },
      '/events/stream': {
        get: {
          summary: 'Server-Sent Events (SSE) live compliance event stream',
          responses: { '200': { description: 'Text event stream' } },
        },
      },
    },
  };
}
