import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const externalServiceUrl = 'http://127.0.0.1:3001/categories';
const cacheTtlMs = 120_000;
const fetchTimeoutMs = 5_000;
const retryDelaysMs = [1_000, 2_000, 4_000];
const projectRootPath = fileURLToPath(new URL('..', import.meta.url));
const cacheDirectoryPath = join(projectRootPath, 'data', 'cache');
const cacheFilePath = join(cacheDirectoryPath, 'reference.json');

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureCacheDirectory() {
  await mkdir(cacheDirectoryPath, { recursive: true });
}

async function readCacheFile() {
  try {
    const rawCache = await readFile(cacheFilePath, 'utf8');
    return JSON.parse(rawCache);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    return null;
  }
}

function isCacheActive(cachePayload) {
  if (!cachePayload || !Array.isArray(cachePayload.categories)) {
    return false;
  }

  const cachedAt = Number(cachePayload.cachedAt);

  if (!Number.isFinite(cachedAt)) {
    return false;
  }

  return Date.now() - cachedAt < cacheTtlMs;
}

async function writeCacheFile(categories) {
  await ensureCacheDirectory();
  await writeFile(
    cacheFilePath,
    JSON.stringify(
      {
        cachedAt: Date.now(),
        categories,
      },
      null,
      2
    ),
    'utf8'
  );
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

async function getReferenceCategories() {
  const cachePayload = await readCacheFile();

  if (isCacheActive(cachePayload)) {
    return cachePayload.categories;
  }

  const categories = await fetchCategories();
  await writeCacheFile(categories);

  return categories;
}

async function getItemDetailsWithReference(item) {
  try {
    const categories = await getReferenceCategories();
    const matchedCategory = categories.find(
      (category) =>
        normalizeCategoryName(category.name) === normalizeCategoryName(item.category)
    );

    return buildDetailsWithExternalFields(item, matchedCategory);
  } catch {
    return buildDetailsWithExternalFields(item, null);
  }
}

export {
  cacheFilePath,
  getItemDetailsWithReference,
};
