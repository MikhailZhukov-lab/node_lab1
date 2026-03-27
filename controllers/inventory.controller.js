import { validateItem } from '#validators/inventory.validator';

let inventory = [
  { id: 1, name: 'Ноутбук', quantity: 5, price: 1200 },
  { id: 2, name: 'Мишка', quantity: 15, price: 25 },
];

const getList = async (request, reply) => {
  return inventory;
};

const addItem = async (request, reply) => {
  const valid = validateItem(request.body);
  if (!valid) {
    return reply.status(400).send({
      error: 'Validation Failed',
      details: validateItem.errors,
    });
  }

  const newItem = { id: inventory.length + 1, ...request.body };
  inventory.push(newItem);
  return reply.status(201).send(newItem);
};

export default { getList, addItem };
