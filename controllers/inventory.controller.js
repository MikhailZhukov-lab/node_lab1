const { validateItem } = require('#validators/inventory.validator');

let inventory = [
  { id: 1, name: 'Ноутбук', quantity: 5, price: 1200 },
  { id: 2, name: 'Мишка', quantity: 15, price: 25 },
];

const getItems = async (request, reply) => {
  return reply.send(inventory);
};

const addItem = async (request, reply) => {
  const newItem = request.body;

  const isValid = validateItem(newItem);
  if (!isValid) {
    return reply.status(400).send({
      error: 'Невалідні дані',
      details: validateItem.errors,
    });
  }

  newItem.id =
    inventory.length > 0 ? inventory[inventory.length - 1].id + 1 : 1;
  inventory.push(newItem);

  return reply.status(201).send(newItem);
};

module.exports = { getItems, addItem };
