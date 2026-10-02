// Placeholder MinIO client
export const BACKUP_BUCKET = process.env.MINIO_BUCKET ?? 'cloud-backups';

export const minio = {
  async getObject(bucket: string, path: string) {
    // In real implementation, use MinIO SDK to return a readable stream
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array());
        controller.close();
      },
    });
  },
  async putObject(bucket: string, path: string, data: Buffer) {
    // no-op
  },
};
