import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExternalFetchMock } from '../helpers/fetch-stubs.js';
import {
  closeTestApp,
  createTestApp,
  resetTestState,
} from '../helpers/test-app.js';

describe('auth integration', () => {
  let app;

  beforeEach(async () => {
    app = await createTestApp();
    vi.stubGlobal('fetch', createExternalFetchMock());
    await resetTestState(app);
  });

  it('handles register, login, refresh and logout flow without listening on a network port', async () => {
    expect(app.server.listening).toBe(false);

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'auth@example.com',
        password: 'secret123',
      },
    });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.json()).toEqual({
      email: 'auth@example.com',
      id: expect.any(Number),
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'auth@example.com',
        password: 'secret123',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.cookies[0]?.name).toBe('refreshToken');

    const { accessToken } = loginResponse.json();
    const refreshCookie = loginResponse.cookies[0];
    const refreshCookieHeader = `${refreshCookie.name}=${refreshCookie.value}`;

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: {
        cookie: refreshCookieHeader,
      },
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.json().accessToken).toEqual(expect.any(String));

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: refreshCookieHeader,
      },
    });

    expect(logoutResponse.statusCode).toBe(204);

    const protectedResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'Blocked item',
        quantity: 1,
        price: 10,
        category: 'Books',
      },
    });

    expect(protectedResponse.statusCode).toBe(401);
  });

  it('returns conflict on duplicate register and unauthorized on bad login or refresh', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'auth@example.com',
        password: 'secret123',
      },
    });

    const duplicateResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'auth@example.com',
        password: 'secret123',
      },
    });

    expect(duplicateResponse.statusCode).toBe(409);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'auth@example.com',
        password: 'wrong-password',
      },
    });

    expect(loginResponse.statusCode).toBe(401);

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
    });

    expect(refreshResponse.statusCode).toBe(401);
  });

  afterEach(async () => {
    await closeTestApp(app);
  });
});
