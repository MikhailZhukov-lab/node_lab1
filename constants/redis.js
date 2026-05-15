const REDIS_TTL_SECONDS = {
  inventoryList: 60 * 60 * 24,
  jwtAccessToken: 15 * 60,
  jwtRefreshToken: 7 * 24 * 60 * 60,
  referenceCategories: 120,
};

const REDIS_KEYS = {
  inventoryListIndex: 'inventory:v2:list:index',
  jwtBlacklistPrefix: 'jwt:blacklist:',
  jwtRefreshTokenPrefix: 'jwt:refresh:',
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
