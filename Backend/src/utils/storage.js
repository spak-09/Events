const path = require('path');
const fs = require('fs');

/**
 * Storage Provider Interface
 */
class StorageProvider {
  // eslint-disable-next-line no-unused-vars
  async save(file) {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line no-unused-vars
  async delete(filename) {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line no-unused-vars
  getUrl(filename) {
    throw new Error('Method not implemented.');
  }
}

/**
 * Local Disk Storage Provider
 */
class DiskStorageProvider extends StorageProvider {
  constructor(uploadDir = path.resolve(__dirname, '../../uploads')) {
    super();
    this.uploadDir = uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file) {
    // Multer diskStorage automatically saves the file to disk;
    // this returns the file reference and public URL.
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      path: file.path,
    };
  }

  async delete(filename) {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  getUrl(filename) {
    return `/uploads/${filename}`;
  }
}

/**
 * S3 Storage Provider (Ready for AWS S3 / Cloudflare R2 / MinIO integration)
 */
class S3StorageProvider extends StorageProvider {
  constructor(config = {}) {
    super();
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET;
    this.region = config.region || process.env.AWS_REGION || 'us-east-1';
  }

  async save(file) {
    // S3 client putObject would be invoked here
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${file.filename}`,
    };
  }

  async delete(filename) {
    // S3 client deleteObject would be invoked here
    return true;
  }

  getUrl(filename) {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`;
  }
}

const defaultStorageProvider = new DiskStorageProvider();

module.exports = {
  StorageProvider,
  DiskStorageProvider,
  S3StorageProvider,
  storage: defaultStorageProvider,
};
