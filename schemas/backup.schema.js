const backupParamsSchema = {
  type: 'object',
  properties: {
    timestamp: {
      type: 'string',
      pattern: '^\\d{8}-\\d{6}$',
    },
  },
  required: ['timestamp'],
  additionalProperties: false,
};

const backupErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['statusCode', 'error', 'message'],
  additionalProperties: false,
};

const downloadBackupSchema = {
  summary: 'Download a gzip inventory backup',
  tags: ['Inventory v1'],
  params: backupParamsSchema,
  response: {
    200: {
      type: 'string',
      format: 'binary',
    },
    401: backupErrorSchema,
    404: backupErrorSchema,
  },
};

export { downloadBackupSchema };
