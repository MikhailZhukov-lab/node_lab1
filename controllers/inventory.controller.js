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

const updateItem = async (request, reply) => {
  const itemId = parseInt(request.params.id); // Отримуємо ID з URL
  const index = inventory.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return reply.status(404).send({ error: 'Товар не знайдено' });
  }

  inventory[index] = { ...inventory[index], ...request.body };
  
  return reply.status(200).send(inventory[index]);
};
const removeItem = async (request, reply) => {
  const itemId = parseInt(request.params.id); // Отримуємо ID з URL
  const index = inventory.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return reply.status(404).send({ error: 'Товар не знайдено' });
  }

  const deletedItem = inventory.splice(index, 1)[0];
  
  return reply.status(200).send({ 
    message: 'Товар успішно видалено', 
    item: deletedItem 
  });
};
export default { getList, addItem, updateItem, removeItem };
