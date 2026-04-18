import inventoryRepository from '#repositories/inventory.repository';

const getList = async (query = {}) => {
  const items = await inventoryRepository.findAll();

  if (query && query.category) {
    return items.filter((item) => item.category === query.category);
  }

  return items;
};

const getPaginatedList = async (query = {}) => {
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || 10;
  const normalizedPage = Math.max(page, 1);
  const normalizedLimit = Math.max(limit, 1);
  const items = await getList(query);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / normalizedLimit), 1);
  const startIndex = (normalizedPage - 1) * normalizedLimit;
  const data = items.slice(startIndex, startIndex + normalizedLimit);

  return {
    data,
    limit: normalizedLimit,
    page: normalizedPage,
    total,
    totalPages,
  };
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
  getPaginatedList,
  initializeInventoryStorage,
  removeItem,
  updateItem,
};
