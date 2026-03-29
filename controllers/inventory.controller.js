import { ERROR_MESSAGES } from '#constants/error-messages';

let inventory = [
  { id: 1, name: 'РќРѕСѓС‚Р±СѓРє', quantity: 5, price: 1200 },
  { id: 2, name: 'РњРёС€РєР°', quantity: 15, price: 25 },
];

const getList = async () => inventory;

const addItem = async (request, reply) => {
  const newItem = { id: inventory.length + 1, ...request.body };
  inventory.push(newItem);
  return reply.status(201).send(newItem);
};

const updateItem = async (request, reply) => {
  const itemId = Number.parseInt(request.params.id, 10);
  const index = inventory.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return reply.notFound(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND);
  }

  inventory[index] = { ...inventory[index], ...request.body };
  return reply.status(200).send(inventory[index]);
};

const removeItem = async (request, reply) => {
  const itemId = Number.parseInt(request.params.id, 10);
  const index = inventory.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return reply.notFound(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND);
  }

  const deletedItem = inventory.splice(index, 1)[0];

  return reply.status(200).send({
    message: 'РўРѕРІР°СЂ СѓСЃРїС–С€РЅРѕ РІРёРґР°Р»РµРЅРѕ',
    item: deletedItem,
  });
};

export default { getList, addItem, updateItem, removeItem };
