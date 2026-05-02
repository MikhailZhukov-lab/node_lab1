import { getItemDetailsWithReference } from '#utils/reference-data';

let inventoryRepository = null;

function configureInventoryService(repository) {
  inventoryRepository = repository;
}

function getInventoryRepository() {
  if (!inventoryRepository) {
    throw new Error('Inventory repository has not been configured');
  }

  return inventoryRepository;
}

const getList = async (query = {}) => {
  const items = await getInventoryRepository().findAll();

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

const getById = async (id) => getInventoryRepository().findById(id);

const getDetailsById = async (id) => {
  const item = await getInventoryRepository().findById(id);

  if (!item) {
    return null;
  }

  return getItemDetailsWithReference(item);
};

const addItem = async (payload) => getInventoryRepository().create(payload);

const updateItem = async (id, payload) =>
  getInventoryRepository().update(id, payload);

const removeItem = async (id) => getInventoryRepository().remove(id);

const initializeInventoryStorage = async () =>
  getInventoryRepository().initialize();

const createItemReadStream = () => getInventoryRepository().createReadStream();

export default {
  addItem,
  configureInventoryService,
  createItemReadStream,
  getDetailsById,
  getById,
  getList,
  getPaginatedList,
  initializeInventoryStorage,
  removeItem,
  updateItem,
};

export { configureInventoryService };
