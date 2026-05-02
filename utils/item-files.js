import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRootPath = fileURLToPath(new URL('..', import.meta.url));
const itemsDirectoryPath = join(projectRootPath, 'data', 'items');
const uploadsDirectoryPath = join(projectRootPath, 'uploads');

const getItemFilePath = (id) => join(itemsDirectoryPath, `${id}.json`);

const getItemTempFilePath = (id) => join(itemsDirectoryPath, `${id}.tmp.json`);

const getItemUploadDirectoryPath = (id) => join(uploadsDirectoryPath, `${id}`);

const getItemImagePath = (id, mimetype = 'image/jpeg') =>
  mimetype === 'image/png' ? `/${id}/image.png` : `/${id}/image.jpg`;

const ensureItemsDirectory = async () => {
  await mkdir(itemsDirectoryPath, { recursive: true });
};

const ensureItemUploadDirectory = async (id) => {
  const uploadPath = getItemUploadDirectoryPath(id);
  await mkdir(uploadPath, { recursive: true });
};

const readJsonFile = async (filePath) => {
  const fileContent = await readFile(filePath, 'utf8');
  return JSON.parse(fileContent);
};

const listItemFileNames = async () => {
  try {
    const fileNames = await readdir(itemsDirectoryPath);

    return fileNames.filter((fileName) => /^\d+\.json$/u.test(fileName));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

const writeJsonFileAtomically = async (id, data) => {
  const targetFilePath = getItemFilePath(id);
  const temporaryFilePath = getItemTempFilePath(id);
  const payload = JSON.stringify(data, null, 2);

  await ensureItemsDirectory();

  try {
    await writeFile(temporaryFilePath, payload, 'utf8');
    await rename(temporaryFilePath, targetFilePath);
  } catch (error) {
    try {
      await rm(temporaryFilePath, { force: true });
    } catch {
      // Preserve the original filesystem error if tmp cleanup fails too.
    }

    throw error;
  }
};

export {
  ensureItemsDirectory,
  ensureItemUploadDirectory,
  getItemFilePath,
  getItemImagePath,
  getItemUploadDirectoryPath,
  itemsDirectoryPath,
  listItemFileNames,
  projectRootPath,
  readJsonFile,
  writeJsonFileAtomically,
};
