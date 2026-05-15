import { describe, expect, it, vi } from 'vitest';
import { REDIS_KEYS } from '../../constants/redis.js';
import { getItemDetailsWithReference } from '../../utils/reference-data.js';

function createRedisDouble() {
  const values = new Map();

  return {
    get: vi.fn(async (key) => values.get(key) ?? null),
    set: vi.fn(async (key, value) => {
      values.set(key, value);
    }),
    values,
  };
}

describe('reference data helper', () => {
  it('loads categories from cache when available', async () => {
    const redis = createRedisDouble();
    redis.values.set(
      REDIS_KEYS.referenceCategories,
      JSON.stringify([{ id: 7, name: 'Books', tax: 7 }])
    );

    const result = await getItemDetailsWithReference(
      {
        category: 'Books',
        id: 1,
        name: 'Book',
      },
      redis
    );

    expect(result).toMatchObject({
      externalCategoryId: 7,
      externalCategoryName: 'Books',
      tax: 7,
    });
  });

  it('fetches categories and caches them on cache miss', async () => {
    const redis = createRedisDouble();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([{ id: 9, name: 'Electronics', tax: 20 }]),
            {
              status: 200,
            }
          )
      )
    );

    const result = await getItemDetailsWithReference(
      {
        category: 'Electronics',
        id: 1,
        name: 'Keyboard',
      },
      redis
    );

    expect(result).toMatchObject({
      externalCategoryId: 9,
      externalCategoryName: 'Electronics',
      tax: 20,
    });
    expect(redis.set).toHaveBeenCalled();
  });

  it('falls back to null external fields when external service fails', async () => {
    const redis = createRedisDouble();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network failure');
      })
    );

    try {
      const resultPromise = getItemDetailsWithReference(
        {
          category: 'Unknown',
          id: 1,
          name: 'Item',
        },
        redis
      );
      await vi.runAllTimersAsync();

      await expect(resultPromise).resolves.toMatchObject({
        externalCategoryId: null,
        externalCategoryName: null,
        tax: null,
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
