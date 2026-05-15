import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  closeTestApp,
  createTestApp,
  getTestEnvData,
  resetTestState,
} from '../helpers/test-app.js';

describe('app behavior integration', () => {
  let app;

  afterEach(async () => {
    await closeTestApp(app);
  });

  it('returns validation errors and rate limit responses through the shared error handler', async () => {
    app = await createTestApp({
      async configureApp(instance) {
        instance.get('/too-many', async () => {
          const error = new Error('Too Many Requests');
          error.statusCode = 429;
          throw error;
        });
      },
    });
    await resetTestState(app);

    const badRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'bad-email',
        password: '123',
      },
    });

    expect(badRequestResponse.statusCode).toBe(400);

    const tooManyResponse = await app.inject({
      method: 'GET',
      url: '/too-many',
    });

    expect(tooManyResponse.statusCode).toBe(429);
    expect(tooManyResponse.json()).toMatchObject({
      error: 'Too Many Requests',
      statusCode: 429,
    });
  });

  it('returns structured 500 errors for unexpected failures', async () => {
    app = await createTestApp({
      async configureApp(instance) {
        instance.get('/boom', async () => {
          throw new Error('boom');
        });
      },
    });
    await resetTestState(app);

    const response = await app.inject({
      method: 'GET',
      url: '/boom',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({
      error: 'Error',
      message: 'boom',
      statusCode: 500,
    });
  });

  it('applies production cors rules only for the configured origin', async () => {
    app = await createTestApp({
      envData: {
        ...getTestEnvData(),
        CORS_ORIGIN: 'http://allowed.example',
        NODE_ENV: 'production',
      },
    });
    await resetTestState(app);

    const allowedOriginResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: {
        origin: 'http://allowed.example',
      },
    });

    expect(allowedOriginResponse.headers['access-control-allow-origin']).toBe(
      'http://allowed.example'
    );

    const deniedOriginResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: {
        origin: 'http://blocked.example',
      },
    });

    expect(
      deniedOriginResponse.headers['access-control-allow-origin']
    ).toBeUndefined();
  });
});
