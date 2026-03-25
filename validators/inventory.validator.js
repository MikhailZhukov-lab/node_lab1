const Ajv = require('ajv');
const ajv = new Ajv();

// Описуємо, як має виглядати товар (інвентар)
const itemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    quantity: { type: 'integer', minimum: 0 },
    price: { type: 'number', minimum: 0 },
  },
  required: ['name', 'quantity', 'price'],
  additionalProperties: false,
};

const validateItem = ajv.compile(itemSchema);

module.exports = { validateItem };
