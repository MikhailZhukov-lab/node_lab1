import argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REDIS_KEYS, REDIS_TTL_SECONDS } from '../../constants/redis.js';
import { ERROR_MESSAGES } from '../../constants/error-messages.js';
import { createAuthService } from '../../services/auth.service.js';

function createRedisDouble() {
  const store = new Map();

  return {
    del: vi.fn(async (key) => {
      store.delete(key);
    }),
    get: vi.fn(async (key) => store.get(key) ?? null),
    set: vi.fn(async (key, value) => {
      store.set(key, value);
    }),
    store,
  };
}

describe('auth service', () => {
  let redis;
  let usersRepository;
  let signAccessToken;
  let signRefreshToken;
  let verifyToken;
  let authService;

  beforeEach(() => {
    redis = createRedisDouble();
    usersRepository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    signAccessToken = vi.fn(async () => 'access-token');
    signRefreshToken = vi.fn(async () => 'refresh-token');
    verifyToken = vi.fn();
    authService = createAuthService({
      usersRepository,
      redis,
      signAccessToken,
      signRefreshToken,
      verifyToken,
    });
  });

  it('registers a new user and hides password hash', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockImplementation(async ({ email, password }) => ({
      email,
      id: 50000,
      password,
    }));

    const result = await authService.register({
      email: 'test@example.com',
      password: 'secret123',
    });

    expect(result).toEqual({
      email: 'test@example.com',
      id: 50000,
    });
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: expect.any(String),
      })
    );
  });

  it('rejects duplicate registration', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 7 });

    await expect(
      authService.register({
        email: 'test@example.com',
        password: 'secret123',
      })
    ).rejects.toMatchObject({
      message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
      statusCode: 409,
    });
  });

  it('logs user in with valid credentials', async () => {
    const passwordHash = await argon2.hash('secret123');
    usersRepository.findByEmail.mockResolvedValue({
      email: 'test@example.com',
      id: 50000,
      password: passwordHash,
    });

    const result = await authService.login({
      email: 'test@example.com',
      password: 'secret123',
    });

    expect(result).toEqual({
      email: 'test@example.com',
      id: 50000,
    });
  });

  it('rejects invalid login credentials', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({
      message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      statusCode: 401,
    });
  });

  it('issues access and refresh tokens and stores refresh token in redis', async () => {
    const result = await authService.issueTokens({
      email: 'test@example.com',
      id: 50000,
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        email: 'test@example.com',
        id: 50000,
      },
    });
    expect(redis.set).toHaveBeenCalledWith(
      `${REDIS_KEYS.jwtRefreshTokenPrefix}50000`,
      'refresh-token',
      'EX',
      REDIS_TTL_SECONDS.jwtRefreshToken
    );
  });

  it('refreshes access token when refresh token is valid', async () => {
    verifyToken.mockResolvedValue({
      email: 'test@example.com',
      id: 50000,
      type: 'refresh',
    });
    redis.store.set(
      `${REDIS_KEYS.jwtRefreshTokenPrefix}50000`,
      'refresh-token'
    );
    usersRepository.findById.mockResolvedValue({
      email: 'test@example.com',
      id: 50000,
      password: 'hash',
    });

    const result = await authService.refresh('refresh-token');

    expect(result).toEqual({
      accessToken: 'access-token',
      user: {
        email: 'test@example.com',
        id: 50000,
      },
    });
  });

  it('rejects refresh token with wrong type', async () => {
    verifyToken.mockResolvedValue({
      id: 50000,
      type: 'access',
    });

    await expect(authService.refresh('refresh-token')).rejects.toMatchObject({
      message: ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
      statusCode: 401,
    });
  });

  it('rejects refresh token when redis entry or user is missing', async () => {
    verifyToken.mockResolvedValue({
      id: 50000,
      type: 'refresh',
    });

    await expect(authService.refresh('refresh-token')).rejects.toMatchObject({
      message: ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
      statusCode: 401,
    });

    redis.store.set(
      `${REDIS_KEYS.jwtRefreshTokenPrefix}50000`,
      'refresh-token'
    );
    usersRepository.findById.mockResolvedValue(null);

    await expect(authService.refresh('refresh-token')).rejects.toMatchObject({
      message: ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
      statusCode: 401,
    });
  });

  it('blacklists access token and removes refresh token on logout', async () => {
    verifyToken.mockResolvedValue({
      id: 50000,
      type: 'refresh',
    });

    await authService.logout({
      accessToken: 'access-token',
      accessTokenPayload: {
        exp: Math.floor(Date.now() / 1000) + 120,
        jti: 'token-id',
      },
      refreshToken: 'refresh-token',
    });

    expect(redis.set).toHaveBeenCalledWith(
      `${REDIS_KEYS.jwtBlacklistPrefix}token-id`,
      'access-token',
      'EX',
      expect.any(Number)
    );
    expect(redis.del).toHaveBeenCalledWith(
      `${REDIS_KEYS.jwtRefreshTokenPrefix}50000`
    );
  });

  it('ignores invalid refresh token during logout cleanup', async () => {
    verifyToken.mockRejectedValue(new Error('bad token'));

    await expect(
      authService.logout({
        accessToken: null,
        accessTokenPayload: null,
        refreshToken: 'broken-token',
      })
    ).resolves.toBeUndefined();

    expect(redis.del).not.toHaveBeenCalled();
  });
});
