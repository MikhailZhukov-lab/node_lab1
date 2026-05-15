import {
  buildInventoryListCacheKey,
  REDIS_KEYS,
  REDIS_TTL_SECONDS,
} from '#constants/redis';
import { getItemDetailsWithReference } from '#utils/reference-data';

function normalizePaginationQuery(query = {}) {
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || 10;

  return {
    category: String(query.category ?? ''),
    limit: Math.max(limit, 1),
    page: Math.max(page, 1),
  };
}

function parseCachedInventoryList(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createInventoryService({ inventoryRepository, redis }) {
  const invalidateInventoryListCache = async () => {
    const cacheKeys = await redis.smembers(REDIS_KEYS.inventoryListIndex);

    if (cacheKeys.length === 0) {
      return;
    }

    await redis.del(REDIS_KEYS.inventoryListIndex, ...cacheKeys);
  };

  const getList = async (query = {}) => {
    const items = await inventoryRepository.findAll();

    if (query && query.category) {
      return items.filter((item) => item.category === query.category);
    }

    return items;
  };

  const getPaginatedList = async (query = {}) => {
    const normalizedQuery = normalizePaginationQuery(query);
    const cacheKey = buildInventoryListCacheKey(normalizedQuery);
    const cachedValue = await redis.get(cacheKey);
    const cachedResult = parseCachedInventoryList(cachedValue);

    if (cachedResult) {
      return cachedResult;
    }

    const items = await getList(query);
    const total = items.length;
    const totalPages = Math.max(Math.ceil(total / normalizedQuery.limit), 1);
    const startIndex = (normalizedQuery.page - 1) * normalizedQuery.limit;
    const data = items.slice(startIndex, startIndex + normalizedQuery.limit);
    const result = {
      data,
      limit: normalizedQuery.limit,
      page: normalizedQuery.page,
      total,
      totalPages,
    };

    await redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      REDIS_TTL_SECONDS.inventoryList
    );
    await redis.sadd(REDIS_KEYS.inventoryListIndex, cacheKey);

    return result;
  };

  const getById = async (id) => inventoryRepository.findById(id);

  const getDetailsById = async (id) => {
    const item = await inventoryRepository.findById(id);

    if (!item) {
      return null;
    }

    return getItemDetailsWithReference(item, redis);
  };

  const addItem = async (payload) => {
    const createdItem = await inventoryRepository.create(payload);
    await invalidateInventoryListCache();
    return createdItem;
  };

  const updateItem = async (id, payload) => {
    const updatedItem = await inventoryRepository.update(id, payload);

    if (updatedItem) {
      await invalidateInventoryListCache();
    }

    return updatedItem;
  };

  const removeItem = async (id) => {
    const removedItem = await inventoryRepository.remove(id);

    if (removedItem) {
      await invalidateInventoryListCache();
    }

    return removedItem;
  };

  const initializeInventoryStorage = async () =>
    inventoryRepository.initialize();

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

function configureInventoryService({ inventoryRepository, redis }) {
  inventoryServiceInstance = createInventoryService({
    inventoryRepository,
    redis,
  });
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
