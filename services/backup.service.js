import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import inventoryService from '#services/inventory.service';
import { projectRootPath } from '#utils/item-files';

const backupsDirectoryPath = join(projectRootPath, 'data', 'backups');
const MAX_BACKUPS = 5;
const backupTimestampPattern = /^\d{8}-\d{6}$/u;

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

async function listBackupArchives() {
  try {
    const fileNames = await readdir(backupsDirectoryPath);

    return fileNames
      .filter((fileName) => /^\d{8}-\d{6}\.gz$/u.test(fileName))
      .sort()
      .reverse();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function listBackupEntries() {
  try {
    const fileNames = await readdir(backupsDirectoryPath);
    const entries = [];

    for (const fileName of fileNames) {
      if (/^\d{8}-\d{6}\.gz$/u.test(fileName)) {
        entries.push({
          name: fileName,
          path: join(backupsDirectoryPath, fileName),
          timestamp: fileName.slice(0, -3),
        });
        continue;
      }

      if (!backupTimestampPattern.test(fileName)) {
        continue;
      }

      const entryPath = join(backupsDirectoryPath, fileName);
      const entryStats = await stat(entryPath);

      if (entryStats.isDirectory()) {
        entries.push({
          name: fileName,
          path: entryPath,
          timestamp: fileName,
        });
      }
    }

    return entries.sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp)
    );
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function pruneOldBackups(log) {
  const backupEntries = await listBackupEntries();
  const filesToDelete = backupEntries.slice(MAX_BACKUPS);

  for (const entry of filesToDelete) {
    await rm(entry.path, { recursive: true, force: true });
    log?.info?.({ backupPath: entry.path }, 'Deleted old backup archive');
  }
}

async function* createBackupPayloadStream(log) {
  yield '[\n';

  let isFirstRecord = true;

  for await (const item of inventoryService.createItemReadStream()) {
    try {
      if (!isFirstRecord) {
        yield ',\n';
      }

      yield JSON.stringify(item);
      isFirstRecord = false;
    } catch (error) {
      log?.warn?.(
        { err: error, itemId: item?.id ?? null },
        'Skipping inventory item during backup creation'
      );
    }
  }

  yield '\n]';
}

function buildBackupFilePath(timestamp) {
  if (!backupTimestampPattern.test(timestamp)) {
    return null;
  }

  return join(backupsDirectoryPath, `${timestamp}.gz`);
}

async function createBackup({ log } = {}) {
  await mkdir(backupsDirectoryPath, { recursive: true });

  const timestamp = formatTimestamp(new Date());
  const backupFilePath = buildBackupFilePath(timestamp);

  try {
    await pipeline(
      Readable.from(createBackupPayloadStream(log)),
      createGzip(),
      createWriteStream(backupFilePath)
    );
    await pruneOldBackups(log);

    return backupFilePath;
  } catch (error) {
    await rm(backupFilePath, { force: true });
    throw error;
  }
}

async function getBackupReadStream(timestamp) {
  const backupFilePath = buildBackupFilePath(timestamp);

  if (!backupFilePath) {
    return null;
  }

  try {
    await access(backupFilePath);
    return createReadStream(backupFilePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export default {
  createBackup,
  getBackupReadStream,
};

export { buildBackupFilePath, createBackup, getBackupReadStream };
