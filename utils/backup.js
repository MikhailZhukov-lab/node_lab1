import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const itemsDirectory = join(projectRoot, 'data', 'items');
const backupsDirectory = join(projectRoot, 'data', 'backups');
const MAX_BACKUPS = 5;

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

async function getBackupFolders() {
  try {
    const folders = await readdir(backupsDirectory);
    return folders
      .filter((folder) => /^\d{8}-\d{6}$/u.test(folder))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function createBackup() {
  await mkdir(backupsDirectory, { recursive: true });

  const timestamp = formatTimestamp(new Date());
  const backupPath = join(backupsDirectory, timestamp);

  await mkdir(backupPath, { recursive: true });

  try {
    const files = await readdir(itemsDirectory);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const source = join(itemsDirectory, file);
      const destination = join(backupPath, file);
      await copyFile(source, destination);
    }
  } catch {
    // Ignore if items directory doesn't exist
  }

  const folders = await getBackupFolders();
  const foldersToDelete = folders.slice(MAX_BACKUPS);

  for (const folder of foldersToDelete) {
    await rm(join(backupsDirectory, folder), { recursive: true, force: true });
  }

  return backupPath;
}

export { createBackup };
