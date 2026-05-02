const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'HOSTNAME',
    'NODE_ENV',
    'ADMIN_API_KEY',
    'CORS_ORIGIN',
    'MYSQL_HOST',
    'MYSQL_PORT',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DB',
  ],
  properties: {
    PORT: {
      type: 'integer',
      minimum: 0,
      maximum: 65535,
      default: 3000,
    },
    HOSTNAME: {
      type: 'string',
      minLength: 1,
      default: '127.0.0.1',
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    ADMIN_API_KEY: {
      type: 'string',
      minLength: 8,
    },
    CORS_ORIGIN: {
      type: 'string',
      minLength: 1,
    },
    GITHUB_TOKEN: {
      type: 'string',
    },
    MYSQL_HOST: {
      type: 'string',
      minLength: 1,
    },
    MYSQL_PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
    },
    MYSQL_USER: {
      type: 'string',
      minLength: 1,
    },
    MYSQL_PASSWORD: {
      type: 'string',
    },
    MYSQL_DB: {
      type: 'string',
      minLength: 1,
    },
  },
};

export default envSchema;
