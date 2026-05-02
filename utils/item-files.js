import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRootPath = fileURLToPath(new URL('..', import.meta.url));
const uploadsDirectoryPath = join(projectRootPath, 'uploads');

const getItemUploadDirectoryPath = (id) => join(uploadsDirectoryPath, `${id}`);

const getItemImagePath = (id, mimetype = 'image/jpeg') =>
  mimetype === 'image/png' ? `/${id}/image.png` : `/${id}/image.jpg`;

const ensureItemUploadDirectory = async (id) => {
  const uploadPath = getItemUploadDirectoryPath(id);
  await mkdir(uploadPath, { recursive: true });
};

export {
  ensureItemUploadDirectory,
  getItemImagePath,
  getItemUploadDirectoryPath,
};
