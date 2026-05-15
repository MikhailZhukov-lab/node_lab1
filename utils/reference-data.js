import { REDIS_KEYS, REDIS_TTL_SECONDS } from '#constants/redis';

const externalServiceUrl = 'http://127.0.0.1:3001/categories';
const fetchTimeoutMs = 5_000;
const retryDelaysMs = [1_000, 2_000, 4_000];

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchCategories() {
  let lastError;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const response = await fetch(externalServiceUrl, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `External service request failed with status ${response.status}`
        );
      }

      const payload = await response.json();

      if (!Array.isArray(payload)) {
        throw new Error('External service returned invalid payload');
      }

      return payload;
    } catch (error) {
      lastError = error;

      if (attempt < retryDelaysMs.length) {
        await delay(retryDelaysMs[attempt]);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

function normalizeCategoryName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function buildDetailsWithExternalFields(item, categoryReference) {
  const externalCategoryId = Number.parseInt(categoryReference?.id, 10);
  const parsedTax = Number(categoryReference?.tax);

  return {
    ...item,
    externalCategoryId: Number.isInteger(externalCategoryId)
      ? externalCategoryId
      : null,
    externalCategoryName: categoryReference?.name ?? null,
    tax: Number.isFinite(parsedTax) ? parsedTax : null,
  };
}

function parseCachedCategories(value) {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

async function getReferenceCategories(redis) {
  const cachedValue = await redis.get(REDIS_KEYS.referenceCategories);
  const cachedCategories = parseCachedCategories(cachedValue);

  if (cachedCategories) {
    return cachedCategories;
  }

  const categories = await fetchCategories();
  await redis.set(
    REDIS_KEYS.referenceCategories,
    JSON.stringify(categories),
    'EX',
    REDIS_TTL_SECONDS.referenceCategories
  );

  return categories;
}

async function getItemDetailsWithReference(item, redis) {
  try {
    const categories = await getReferenceCategories(redis);
    const matchedCategory = categories.find(
      (category) =>
        normalizeCategoryName(category.name) ===
        normalizeCategoryName(item.category)
    );

    return buildDetailsWithExternalFields(item, matchedCategory);
  } catch {
    return buildDetailsWithExternalFields(item, null);
  }
}

export { getItemDetailsWithReference };
