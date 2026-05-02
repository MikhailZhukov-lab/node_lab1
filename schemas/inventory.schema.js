const inventoryItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
    category: { type: 'string' },
    image: { type: ['string', 'null'] },
  },
  required: ['id', 'name', 'quantity', 'price', 'category'],
  additionalProperties: false,
};

const inventoryItemDetailsSchema = {
  type: 'object',
  properties: {
    ...inventoryItemSchema.properties,
    externalCategoryId: {
      anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }],
    },
    externalCategoryName: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
    tax: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
    },
  },
  required: [
    ...inventoryItemSchema.required,
    'externalCategoryId',
    'externalCategoryName',
    'tax',
  ],
  additionalProperties: false,
};

const inventoryItemImportSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
    category: { type: 'string' },
    image: { type: ['string', 'null'] },
  },
  required: ['name', 'quantity', 'price', 'category'],
  additionalProperties: false,
};

const inventoryItemCreateBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
    category: { type: 'string' },
    image: { type: ['string', 'null'] },
  },
  required: ['name', 'quantity', 'price', 'category'],
  additionalProperties: false,
};

const inventoryItemUpdateBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
    category: { type: 'string' },
    image: { type: ['string', 'null'] },
  },
  minProperties: 1,
  additionalProperties: false,
};

const inventoryParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
  },
  required: ['id'],
  additionalProperties: false,
};

const inventoryListQuerySchema = {
  type: 'object',
  properties: {
    category: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

const inventoryExportQuerySchema = {
  type: 'object',
  properties: {
    transform: { type: 'boolean', default: false },
  },
  additionalProperties: false,
};

const inventoryPaginatedListQuerySchema = {
  type: 'object',
  properties: {
    category: { type: 'string', minLength: 1 },
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, default: 10 },
  },
  additionalProperties: false,
};

const inventoryErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['statusCode', 'error', 'message'],
  additionalProperties: false,
};

const inventoryImportResponseSchema = {
  type: 'object',
  properties: {
    imported: { type: 'integer', minimum: 0 },
    rejected: { type: 'integer', minimum: 0 },
    rejectedRecords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          line: { type: 'integer', minimum: 1 },
          reason: { type: 'string' },
        },
        required: ['line', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['imported', 'rejected', 'rejectedRecords'],
  additionalProperties: false,
};

const inventoryDeleteResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    item: inventoryItemSchema,
  },
  required: ['message', 'item'],
  additionalProperties: false,
};

const inventoryPaginatedListResponseSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: inventoryItemSchema,
    },
    total: { type: 'integer', minimum: 0 },
    page: { type: 'integer', minimum: 1 },
    limit: { type: 'integer', minimum: 1 },
    totalPages: { type: 'integer', minimum: 1 },
  },
  required: ['data', 'total', 'page', 'limit', 'totalPages'],
  additionalProperties: false,
};

const getInventoryListSchema = {
  summary: 'Get inventory items',
  tags: ['Inventory v1'],
  querystring: inventoryListQuerySchema,
  response: {
    200: {
      type: 'array',
      items: inventoryItemSchema,
    },
  },
};

const getInventoryPaginatedListSchema = {
  summary: 'Get paginated inventory items',
  tags: ['Inventory v2'],
  querystring: inventoryPaginatedListQuerySchema,
  response: {
    200: inventoryPaginatedListResponseSchema,
  },
};

const createInventorySchema = {
  summary: 'Create inventory item',
  tags: ['Inventory v1'],
  body: inventoryItemCreateBodySchema,
  response: {
    201: inventoryItemSchema,
  },
};

const updateInventorySchema = {
  summary: 'Update inventory item',
  tags: ['Inventory v1'],
  params: inventoryParamsSchema,
  body: inventoryItemUpdateBodySchema,
  response: {
    200: inventoryItemSchema,
    404: inventoryErrorSchema,
  },
};

const deleteInventorySchema = {
  summary: 'Delete inventory item',
  tags: ['Inventory v1'],
  params: inventoryParamsSchema,
  response: {
    200: inventoryDeleteResponseSchema,
    404: inventoryErrorSchema,
  },
};

const getInventoryDetailsSchema = {
  summary: 'Get inventory item details with external reference data',
  tags: ['Inventory v1'],
  params: inventoryParamsSchema,
  response: {
    200: inventoryItemDetailsSchema,
    404: inventoryErrorSchema,
  },
};

const exportInventorySchema = {
  summary: 'Export inventory items to CSV',
  tags: ['Inventory v1'],
  querystring: inventoryExportQuerySchema,
  response: {
    200: {
      type: 'string',
    },
  },
};

const getInventoryStreamSchema = {
  summary: 'Stream inventory items as NDJSON',
  tags: ['Inventory v1'],
  response: {
    200: {
      type: 'string',
    },
  },
};

const importInventorySchema = {
  summary: 'Import inventory items from CSV or JSON',
  tags: ['Inventory v1'],
  consumes: ['multipart/form-data'],
  response: {
    200: inventoryImportResponseSchema,
    400: inventoryErrorSchema,
  },
};

const uploadInventoryImageSchema = {
  summary: 'Upload image for inventory item',
  tags: ['Inventory v1'],
  consumes: ['multipart/form-data'],
  params: inventoryParamsSchema,
  response: {
    200: inventoryItemSchema,
    400: inventoryErrorSchema,
    404: inventoryErrorSchema,
  },
};

export {
  createInventorySchema,
  deleteInventorySchema,
  exportInventorySchema,
  getInventoryDetailsSchema,
  getInventoryListSchema,
  getInventoryPaginatedListSchema,
  getInventoryStreamSchema,
  importInventorySchema,
  inventoryItemImportSchema,
  inventoryItemDetailsSchema,
  inventoryItemSchema,
  inventoryParamsSchema,
  uploadInventoryImageSchema,
  updateInventorySchema,
};
