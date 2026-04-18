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
  querystring: inventoryListQuerySchema,
  response: {
    200: {
      type: 'array',
      items: inventoryItemSchema,
    },
  },
};

const getInventoryPaginatedListSchema = {
  querystring: inventoryPaginatedListQuerySchema,
  response: {
    200: inventoryPaginatedListResponseSchema,
  },
};

const createInventorySchema = {
  body: inventoryItemCreateBodySchema,
  response: {
    201: inventoryItemSchema,
  },
};

const updateInventorySchema = {
  params: inventoryParamsSchema,
  body: inventoryItemUpdateBodySchema,
  response: {
    200: inventoryItemSchema,
    404: inventoryErrorSchema,
  },
};

const deleteInventorySchema = {
  params: inventoryParamsSchema,
  response: {
    200: inventoryDeleteResponseSchema,
    404: inventoryErrorSchema,
  },
};

export {
  createInventorySchema,
  deleteInventorySchema,
  getInventoryListSchema,
  getInventoryPaginatedListSchema,
  inventoryItemImportSchema,
  inventoryItemSchema,
  inventoryParamsSchema,
  updateInventorySchema,
};
