import argon2 from 'argon2';
import crypto from 'node:crypto';
import { REDIS_KEYS, REDIS_TTL_SECONDS } from '#constants/redis';
import { ERROR_MESSAGES } from '#constants/error-messages';

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    id: user.id,
  };
}

function buildRefreshTokenKey(userId) {
  return `${REDIS_KEYS.jwtRefreshTokenPrefix}${userId}`;
}

function createAuthService({
  usersRepository,
  redis,
  signAccessToken,
  signRefreshToken,
  verifyToken,
}) {
  const register = async ({ email, password }) => {
    const existingUser = await usersRepository.findByEmail(email);

    if (existingUser) {
      const error = new Error(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await argon2.hash(password);
    const createdUser = await usersRepository.create({
      email,
      password: hashedPassword,
    });

    return sanitizeUser(createdUser);
  };

  const login = async ({ email, password }) => {
    const user = await usersRepository.findByEmail(email);

    if (!user) {
      const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    return sanitizeUser(user);
  };

  const issueTokens = async (user) => {
    const accessToken = await signAccessToken({
      email: user.email,
      id: user.id,
      jti: crypto.randomUUID(),
      type: 'access',
    });
    const refreshToken = await signRefreshToken({
      email: user.email,
      id: user.id,
      jti: crypto.randomUUID(),
      type: 'refresh',
    });

    await redis.set(
      buildRefreshTokenKey(user.id),
      refreshToken,
      'EX',
      REDIS_TTL_SECONDS.jwtRefreshToken
    );

    return {
      accessToken,
      refreshToken,
      user,
    };
  };

  const refresh = async (refreshToken) => {
    const decodedRefreshToken = await verifyToken(refreshToken);

    if (decodedRefreshToken?.type !== 'refresh') {
      const error = new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      error.statusCode = 401;
      throw error;
    }

    const storedRefreshToken = await redis.get(
      buildRefreshTokenKey(decodedRefreshToken.id)
    );

    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      const error = new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      error.statusCode = 401;
      throw error;
    }

    const user = await usersRepository.findById(decodedRefreshToken.id);

    if (!user) {
      const error = new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      error.statusCode = 401;
      throw error;
    }

    const sanitizedUser = sanitizeUser(user);
    const accessToken = await signAccessToken({
      email: sanitizedUser.email,
      id: sanitizedUser.id,
      jti: crypto.randomUUID(),
      type: 'access',
    });

    return {
      accessToken,
      user: sanitizedUser,
    };
  };

  const logout = async ({ accessToken, accessTokenPayload, refreshToken }) => {
    if (accessTokenPayload?.jti && Number.isFinite(accessTokenPayload?.exp)) {
      const ttlSeconds = Math.max(
        Math.floor(accessTokenPayload.exp - Date.now() / 1000),
        1
      );

      await redis.set(
        `${REDIS_KEYS.jwtBlacklistPrefix}${accessTokenPayload.jti}`,
        accessToken,
        'EX',
        ttlSeconds
      );
    }

    if (refreshToken) {
      try {
        const decodedRefreshToken = await verifyToken(refreshToken);

        if (decodedRefreshToken?.id) {
          await redis.del(buildRefreshTokenKey(decodedRefreshToken.id));
        }
      } catch {
        // Ignore invalid refresh token on logout and continue cleanup.
      }
    }
  };

  return {
    issueTokens,
    login,
    logout,
    refresh,
    register,
  };
}

let authServiceInstance = null;

function configureAuthService({
  usersRepository,
  redis,
  signAccessToken,
  signRefreshToken,
  verifyToken,
}) {
  authServiceInstance = createAuthService({
    redis,
    signAccessToken,
    signRefreshToken,
    usersRepository,
    verifyToken,
  });
}

function getAuthServiceInstance() {
  if (!authServiceInstance) {
    throw new Error('Auth service has not been configured yet');
  }

  return authServiceInstance;
}

const authService = {
  issueTokens(user) {
    return getAuthServiceInstance().issueTokens(user);
  },
  login(payload) {
    return getAuthServiceInstance().login(payload);
  },
  logout(payload) {
    return getAuthServiceInstance().logout(payload);
  },
  refresh(refreshToken) {
    return getAuthServiceInstance().refresh(refreshToken);
  },
  register(payload) {
    return getAuthServiceInstance().register(payload);
  },
};

export { configureAuthService, createAuthService };
export default authService;
