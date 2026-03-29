const memoryUsageValueSchema = {
  type: 'integer',
  minimum: 0,
};

const unauthorizedSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['statusCode', 'error', 'message'],
  additionalProperties: false,
};

const healthPublicSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', const: 'ok' },
      },
      required: ['status'],
      additionalProperties: false,
    },
  },
};

const healthDetailsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        pid: { type: 'integer' },
        nodeVersion: { type: 'string' },
        platform: { type: 'string' },
        uptime: { type: 'number' },
        memoryUsage: {
          type: 'object',
          properties: {
            rss: memoryUsageValueSchema,
            heapTotal: memoryUsageValueSchema,
            heapUsed: memoryUsageValueSchema,
            external: memoryUsageValueSchema,
            arrayBuffers: memoryUsageValueSchema,
          },
          required: [
            'rss',
            'heapTotal',
            'heapUsed',
            'external',
            'arrayBuffers',
          ],
          additionalProperties: false,
        },
      },
      required: ['pid', 'nodeVersion', 'platform', 'uptime', 'memoryUsage'],
      additionalProperties: false,
    },
    401: unauthorizedSchema,
  },
};

export { healthDetailsSchema, healthPublicSchema, unauthorizedSchema };
