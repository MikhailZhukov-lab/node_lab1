const authUserSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'email'],
  additionalProperties: false,
};

const authBodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};

const authErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['statusCode', 'error', 'message'],
  additionalProperties: false,
};

const authTokenSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    user: authUserSchema,
  },
  required: ['accessToken', 'user'],
  additionalProperties: false,
};

const registerAuthSchema = {
  summary: 'Register user',
  tags: ['Auth'],
  body: authBodySchema,
  response: {
    201: authUserSchema,
    409: authErrorSchema,
  },
};

const loginAuthSchema = {
  summary: 'Login user',
  description:
    'Returns access token in body and stores refresh token in httpOnly cookie.',
  tags: ['Auth'],
  body: authBodySchema,
  response: {
    200: authTokenSchema,
    401: authErrorSchema,
  },
};

const refreshAuthSchema = {
  summary: 'Refresh access token',
  description:
    'Reads refresh token from httpOnly cookie and returns a new access token.',
  tags: ['Auth'],
  response: {
    200: authTokenSchema,
    401: authErrorSchema,
  },
};

const logoutAuthSchema = {
  summary: 'Logout user',
  description: 'Requires Authorization header in Bearer format.',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  response: {
    204: {
      type: 'null',
    },
    401: authErrorSchema,
  },
};

export {
  authErrorSchema,
  authTokenSchema,
  authUserSchema,
  loginAuthSchema,
  logoutAuthSchema,
  refreshAuthSchema,
  registerAuthSchema,
};
