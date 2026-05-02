import backupService from '#services/backup.service';

const downloadBackup = async (request, reply) => {
  const { timestamp } = request.params;
  const backupStream = await backupService.getBackupReadStream(timestamp);

  if (!backupStream) {
    return reply.notFound('Backup not found');
  }

  return reply
    .type('application/gzip')
    .header(
      'Content-Disposition',
      `attachment; filename="${request.params.timestamp}.gz"`
    )
    .send(backupStream);
};

export default {
  downloadBackup,
};
