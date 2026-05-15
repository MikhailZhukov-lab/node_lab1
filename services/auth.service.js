import argon2 from 'argon2';
import { ERROR_MESSAGES } from '#constants/error-messages';

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

function createAuthService({ usersRepository }) {
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

  return {
    login,
    register,
  };
}

let authServiceInstance = null;

function configureAuthService({ usersRepository }) {
  authServiceInstance = createAuthService({
    usersRepository,
  });
}

function getAuthServiceInstance() {
  if (!authServiceInstance) {
    throw new Error('Auth service has not been configured yet');
  }

  return authServiceInstance;
}

const authService = {
  login(payload) {
    return getAuthServiceInstance().login(payload);
  },
  register(payload) {
    return getAuthServiceInstance().register(payload);
  },
};

export { configureAuthService, createAuthService };
export default authService;
