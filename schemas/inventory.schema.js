const inventoryItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
  },
  required: ['id', 'name', 'quantity', 'price'],
  additionalProperties: false,
};

const inventoryItemCreateBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
  },
  required: ['name', 'quantity', 'price'],
  additionalProperties: false,
};

const inventoryItemUpdateBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
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
  properties: {},
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

const getInventoryListSchema = {
  querystring: inventoryListQuerySchema,
  response: {
    200: {
      type: 'array',
      items: inventoryItemSchema,
    },
  },
};

const createInventorySchema = {
  querystring: inventoryListQuerySchema,
  body: inventoryItemCreateBodySchema,
  response: {
    201: inventoryItemSchema,
  },
};

const updateInventorySchema = {
  params: inventoryParamsSchema,
  querystring: inventoryListQuerySchema,
  body: inventoryItemUpdateBodySchema,
  response: {
    200: inventoryItemSchema,
    404: inventoryErrorSchema,
  },
};

const deleteInventorySchema = {
  params: inventoryParamsSchema,
  querystring: inventoryListQuerySchema,
  response: {
    200: inventoryDeleteResponseSchema,
    404: inventoryErrorSchema,
  },
};

export {
  createInventorySchema,
  deleteInventorySchema,
  getInventoryListSchema,
  inventoryItemSchema,
  updateInventorySchema,
};
