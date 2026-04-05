import inventoryRepository from '#repositories/inventory.repository';

const getList = async (query = {}) => {
  const items = await inventoryRepository.findAll();

  if (query && query.category) {
    return items.filter((item) => item.category === query.category);
  }

  return items;
};

const getById = async (id) => inventoryRepository.findById(id);

const addItem = async (payload) => inventoryRepository.create(payload);

const updateItem = async (id, payload) =>
  inventoryRepository.update(id, payload);

const removeItem = async (id) => inventoryRepository.remove(id);

const initializeInventoryStorage = async () => inventoryRepository.initialize();

export default {
  addItem,
  getById,
  getList,
  initializeInventoryStorage,
  removeItem,
  updateItem,
};
