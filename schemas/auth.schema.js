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
  tags: ['Auth'],
  body: authBodySchema,
  response: {
    200: authUserSchema,
    401: authErrorSchema,
  },
};

const logoutAuthSchema = {
  summary: 'Logout user',
  tags: ['Auth'],
  response: {
    204: {
      type: 'null',
    },
    401: authErrorSchema,
  },
};

export {
  authBodySchema,
  authErrorSchema,
  authUserSchema,
  loginAuthSchema,
  logoutAuthSchema,
  registerAuthSchema,
};
