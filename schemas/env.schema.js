const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'HOSTNAME',
    'NODE_ENV',
    'ADMIN_API_KEY',
    'CORS_ORIGIN',
    'MONGO_URL',
    'MONGO_DB_NAME',
    'USD_TO_UAH_RATE',
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
    MONGO_URL: {
      type: 'string',
      minLength: 1,
    },
    MONGO_DB_NAME: {
      type: 'string',
      minLength: 1,
    },
    USD_TO_UAH_RATE: {
      type: 'number',
      exclusiveMinimum: 0,
    },
  },
};

export default envSchema;
