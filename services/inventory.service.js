import { getItemDetailsWithReference } from '#utils/reference-data';

function createInventoryService(inventoryRepository) {
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

  const getDetailsById = async (id) => {
    const item = await inventoryRepository.findById(id);

    if (!item) {
      return null;
    }

    return getItemDetailsWithReference(item);
  };

  const addItem = async (payload) => inventoryRepository.create(payload);

  const updateItem = async (id, payload) =>
    inventoryRepository.update(id, payload);

  const removeItem = async (id) => inventoryRepository.remove(id);

  const initializeInventoryStorage = async () => inventoryRepository.initialize();

  return {
    addItem,
    getDetailsById,
    getById,
    getList,
    getPaginatedList,
    initializeInventoryStorage,
    removeItem,
    updateItem,
  };
}

let inventoryServiceInstance = null;

function configureInventoryService({ inventoryRepository }) {
  inventoryServiceInstance = createInventoryService(inventoryRepository);
}

function getInventoryServiceInstance() {
  if (!inventoryServiceInstance) {
    throw new Error('Inventory service has not been configured yet');
  }

  return inventoryServiceInstance;
}

const inventoryService = {
  addItem(payload) {
    return getInventoryServiceInstance().addItem(payload);
  },
  getDetailsById(id) {
    return getInventoryServiceInstance().getDetailsById(id);
  },
  getById(id) {
    return getInventoryServiceInstance().getById(id);
  },
  getList(query) {
    return getInventoryServiceInstance().getList(query);
  },
  getPaginatedList(query) {
    return getInventoryServiceInstance().getPaginatedList(query);
  },
  initializeInventoryStorage() {
    return getInventoryServiceInstance().initializeInventoryStorage();
  },
  removeItem(id) {
    return getInventoryServiceInstance().removeItem(id);
  },
  updateItem(id, payload) {
    return getInventoryServiceInstance().updateItem(id, payload);
  },
};

export { configureInventoryService, createInventoryService };
export default inventoryService;
