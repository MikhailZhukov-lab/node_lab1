import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExternalFetchMock } from '../helpers/fetch-stubs.js';
import {
  closeTestApp,
  createTestApp,
  getTestEnvData,
  resetTestState,
} from '../helpers/test-app.js';

describe('platform integration', () => {
  let app;

  beforeEach(async () => {
    app = await createTestApp();
    vi.stubGlobal('fetch', createExternalFetchMock());
    await resetTestState(app);
  });

  it('serves health and docs endpoints', async () => {
    const healthResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });
    expect(healthResponse.statusCode).toBe(200);
    expect(healthResponse.json()).toEqual({ status: 'ok' });

    const forbiddenDetailsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/health/details',
    });
    expect(forbiddenDetailsResponse.statusCode).toBe(401);

    const detailsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/health/details',
      headers: {
        'x-api-key': getTestEnvData().ADMIN_API_KEY,
      },
    });
    expect(detailsResponse.statusCode).toBe(200);
    expect(detailsResponse.json()).toEqual(
      expect.objectContaining({
        nodeVersion: expect.any(String),
        pid: expect.any(Number),
      })
    );

    const docsResponse = await app.inject({
      method: 'GET',
      url: '/docs',
    });
    expect(docsResponse.statusCode).toBe(200);
    expect(docsResponse.body).toContain('Swagger UI');

    const docsJsonResponse = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });
    expect(docsJsonResponse.statusCode).toBe(200);
    expect(docsJsonResponse.json().openapi).toBeDefined();
  });

  it('serves github analytics endpoints with success and error responses', async () => {
    const v1Response = await app.inject({
      method: 'GET',
      url: '/api/v1/github/shared-repos?repo=owner/source',
    });
    expect(v1Response.statusCode).toBe(200);
    expect(v1Response.json()).toMatchObject({
      repo: 'owner/source',
    });

    const v2Response = await app.inject({
      method: 'GET',
      url: '/api/v2/github/shared-repos?repo=owner/source',
    });
    expect(v2Response.statusCode).toBe(200);
    expect(v2Response.json().repositories).toHaveLength(2);

    const invalidQueryResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/github/shared-repos?repo=invalid',
    });
    expect(invalidQueryResponse.statusCode).toBe(400);

    const missingRepoResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/github/shared-repos?repo=missing/repo',
    });
    expect(missingRepoResponse.statusCode).toBe(404);
  });

  afterEach(async () => {
    await closeTestApp(app);
  });
});
