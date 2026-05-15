const REDIS_TTL_SECONDS = {
  inventoryList: 60 * 60 * 24,
  referenceCategories: 120,
};

const REDIS_KEYS = {
  inventoryListIndex: 'inventory:v2:list:index',
  referenceCategories: 'reference:categories',
};

function buildInventoryListCacheKey({
  category = '',
  limit = 10,
  page = 1,
} = {}) {
  return `inventory:v2:list:page=${page}:limit=${limit}:category=${category}`;
}

export { buildInventoryListCacheKey, REDIS_KEYS, REDIS_TTL_SECONDS };
