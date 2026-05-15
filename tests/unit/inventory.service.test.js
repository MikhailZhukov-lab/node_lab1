import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildInventoryListCacheKey,
  REDIS_KEYS,
} from '../../constants/redis.js';
import { createInventoryService } from '../../services/inventory.service.js';

function createRedisDouble() {
  const values = new Map();
  const sets = new Map();

  return {
    del: vi.fn(async (...keys) => {
      for (const key of keys) {
        values.delete(key);
        sets.delete(key);
      }
    }),
    get: vi.fn(async (key) => values.get(key) ?? null),
    sadd: vi.fn(async (key, value) => {
      const entry = sets.get(key) ?? new Set();
      entry.add(value);
      sets.set(key, entry);
    }),
    set: vi.fn(async (key, value) => {
      values.set(key, value);
    }),
    smembers: vi.fn(async (key) => Array.from(sets.get(key) ?? [])),
    sets,
    values,
  };
}

describe('inventory service', () => {
  let inventoryRepository;
  let redis;
  let inventoryService;

  beforeEach(() => {
    inventoryRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      initialize: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
    };
    redis = createRedisDouble();
    inventoryService = createInventoryService({
      inventoryRepository,
      redis,
    });
  });

  it('returns filtered list by category', async () => {
    inventoryRepository.findAll.mockResolvedValue([
      { category: 'Books', id: 1, name: 'A' },
      { category: 'Electronics', id: 2, name: 'B' },
    ]);

    const result = await inventoryService.getList({ category: 'Books' });

    expect(result).toEqual([{ category: 'Books', id: 1, name: 'A' }]);
  });

  it('returns paginated data from cache when available', async () => {
    const cacheKey = buildInventoryListCacheKey({
      category: '',
      limit: 1,
      page: 2,
    });

    redis.values.set(
      cacheKey,
      JSON.stringify({
        data: [{ id: 2, name: 'Cached item' }],
        limit: 1,
        page: 2,
        total: 3,
        totalPages: 3,
      })
    );

    const result = await inventoryService.getPaginatedList({
      page: 2,
      limit: 1,
    });

    expect(result.data[0].name).toBe('Cached item');
    expect(inventoryRepository.findAll).not.toHaveBeenCalled();
  });

  it('caches paginated data on cache miss', async () => {
    inventoryRepository.findAll.mockResolvedValue([
      { id: 1, name: 'A', category: 'Books' },
      { id: 2, name: 'B', category: 'Books' },
      { id: 3, name: 'C', category: 'Books' },
    ]);

    const result = await inventoryService.getPaginatedList({
      page: 2,
      limit: 2,
    });

    expect(result).toEqual({
      data: [{ id: 3, name: 'C', category: 'Books' }],
      limit: 2,
      page: 2,
      total: 3,
      totalPages: 2,
    });
    expect(redis.set).toHaveBeenCalled();
    expect(redis.sadd).toHaveBeenCalledWith(
      REDIS_KEYS.inventoryListIndex,
      buildInventoryListCacheKey({ page: 2, limit: 2, category: '' })
    );
  });

  it('returns details with reference data when item exists', async () => {
    inventoryRepository.findById.mockResolvedValue({
      id: 1,
      name: 'Keyboard',
      category: 'Electronics',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([{ id: 9, name: 'Electronics', tax: 20 }]),
            { status: 200 }
          )
      )
    );

    const result = await inventoryService.getDetailsById(1);

    expect(result).toMatchObject({
      category: 'Electronics',
      externalCategoryId: 9,
      externalCategoryName: 'Electronics',
      tax: 20,
    });
  });

  it('returns null details when item is missing and ignores broken cache payload', async () => {
    inventoryRepository.findById.mockResolvedValueOnce(null);

    await expect(inventoryService.getDetailsById(999)).resolves.toBeNull();

    redis.values.set(
      buildInventoryListCacheKey({ page: 1, limit: 10, category: '' }),
      '{broken-json'
    );
    inventoryRepository.findAll.mockResolvedValue([
      { id: 1, name: 'Item', category: 'Books' },
    ]);

    const result = await inventoryService.getPaginatedList();

    expect(result.total).toBe(1);
  });

  it('invalidates cached lists after create, update and remove', async () => {
    redis.sets.set(
      REDIS_KEYS.inventoryListIndex,
      new Set(['inventory:v2:list:page=1:limit=10:category='])
    );
    inventoryRepository.create.mockResolvedValue({ id: 1 });
    inventoryRepository.update.mockResolvedValue({ id: 1 });
    inventoryRepository.remove.mockResolvedValue({ id: 1 });

    await inventoryService.addItem({ name: 'New item' });
    await inventoryService.updateItem(1, { name: 'Updated item' });
    await inventoryService.removeItem(1);

    expect(redis.del).toHaveBeenCalledWith(
      REDIS_KEYS.inventoryListIndex,
      'inventory:v2:list:page=1:limit=10:category='
    );
  });
});
