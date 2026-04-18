import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import itemModel from '#models/item.model';
import {
  ensureItemsDirectory,
  listItemFileNames,
  readJsonFile,
  writeJsonFileAtomically,
} from '#utils/item-files';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const modelPath = join(projectRoot, 'src', 'models', 'item.model.js');
const versionFilePath = join(projectRoot, 'data', 'version.json');
const itemModelEntries = Object.entries(itemModel);

function getModelHash(modelContent) {
  return createHash('md5').update(modelContent).digest('hex');
}

async function getStoredHash() {
  try {
    const versionContent = await readFile(versionFilePath, 'utf8');
    const versionData = JSON.parse(versionContent);
    return versionData.modelHash;
  } catch {
    return null;
  }
}

async function saveVersionHash(hash) {
  await mkdir(dirname(versionFilePath), { recursive: true });
  await writeFile(
    versionFilePath,
    JSON.stringify({ modelHash: hash }, null, 2),
    'utf8'
  );
}

function applyModelDefaults(storedItem) {
  const migratedItem = { ...storedItem };
  let changed = false;

  for (const [key, defaultValue] of itemModelEntries) {
    if (!Object.hasOwn(migratedItem, key) || migratedItem[key] === undefined) {
      migratedItem[key] = defaultValue;
      changed = true;
    }
  }

  return { changed, item: migratedItem };
}

async function migrate() {
  const modelContent = await readFile(modelPath, 'utf8');
  const newHash = getModelHash(modelContent);
  const currentHash = await getStoredHash();

  if (currentHash === newHash) {
    console.log('No migration needed. Model hash matches stored hash.');
    return;
  }

  console.log('Model changed. Running migration...');

  await ensureItemsDirectory();
  const itemFileNames = await listItemFileNames();

  for (const fileName of itemFileNames) {
    const itemId = Number.parseInt(fileName, 10);
    const storedItem = await readJsonFile(
      join(projectRoot, 'data', 'items', fileName)
    );
    const { changed, item } = applyModelDefaults(storedItem);

    if (changed) {
      await writeJsonFileAtomically(itemId, item);
      console.log(`Migrated: ${fileName}`);
    }
  }

  await saveVersionHash(newHash);
  console.log('Migration complete.');
}

async function checkModelVersion() {
  const modelContent = await readFile(modelPath, 'utf8');
  const currentHash = getModelHash(modelContent);
  const storedHash = await getStoredHash();
  return currentHash !== storedHash;
}

async function runMigration() {
  await migrate();
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  migrate().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { checkModelVersion, runMigration };
