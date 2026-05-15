import { access, rm } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  ensureItemUploadDirectory,
  getItemImagePath,
  getItemUploadDirectoryPath,
} from '../../utils/item-files.js';

describe('item file helpers', () => {
  it('builds upload paths for jpg and png files', () => {
    expect(getItemImagePath(50000)).toBe('/50000/image.jpg');
    expect(getItemImagePath(50000, 'image/png')).toBe('/50000/image.png');
    expect(getItemUploadDirectoryPath(50000)).toMatch(/50000$/);
  });

  it('creates upload directory when needed', async () => {
    const uploadPath = getItemUploadDirectoryPath(59999);

    await ensureItemUploadDirectory(59999);
    await expect(access(uploadPath)).resolves.toBeUndefined();

    await rm(uploadPath, { recursive: true, force: true });
  });
});
