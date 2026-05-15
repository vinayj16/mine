import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

const ROOT_FOLDER = process.env.FILE_STORAGE_ROOT || path.resolve(process.cwd(), 'uploads');
const BASE_URL = process.env.FILE_BASE_URL || process.env.BASE_URL || 'http://localhost:5000';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

class StorageService {
  constructor() {
    this.rootDir = ROOT_FOLDER;
    this.baseUrl = BASE_URL;
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;
    this.ensureDirectory(this.rootDir);
  }

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  resolveKeyPath(key) {
    const normalized = key.replace(/^\/*/, '').split('/').filter(Boolean);
    return path.join(this.rootDir, ...normalized);
  }

  buildUrl(key) {
    const normalized = key.replace(/^\/*/, '');
    return `${this.baseUrl}/${normalized}`;
  }

  buildKey(folder = 'uploads', institutionId, fileName) {
    const baseFolder = 'uploads';
    const cleanedFolder = folder ? folder.replace(/^\/+|\/+$/g, '') : 'general';
    const folderPath = cleanedFolder === baseFolder ? baseFolder : `${baseFolder}/${cleanedFolder}`;
    const institutionFolder = institutionId ? `institution_${institutionId}` : 'general';
    const timestamp = Date.now();
    const randomId = uuidv4().split('-')[0];
    const name = fileName ? path.basename(fileName, path.extname(fileName)) : `file-${timestamp}`;
    const extension = fileName ? path.extname(fileName) : '';
    const fileNameFinal = `${name}-${timestamp}-${randomId}${extension || ''}`;
    return `${folderPath}/${institutionFolder}/${fileNameFinal}`;
  }

  async validateFile(file) {
    const errors = [];
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    const isAllowed =
      allowedImageTypes.includes(file.mimetype) ||
      allowedDocumentTypes.includes(file.mimetype);

    if (!isAllowed) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.originalname)) {
      errors.push('Filename contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async processImage(buffer, options = {}) {
    const { quality = 80, maxWidth = 1200, maxHeight = 1200, format = 'jpeg' } = options;

    try {
      let image = sharp(buffer);
      const metadata = await image.metadata();

      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      if (format.toLowerCase() === 'webp') {
        image = image.webp({ quality });
      } else if (format.toLowerCase() === 'png') {
        image = image.png({ compressionLevel: 6 });
      } else {
        image = image.jpeg({ quality, progressive: true });
      }

      return await image.toBuffer();
    } catch (error) {
      logger.error('Image processing failed:', error);
      return buffer;
    }
  }

  async uploadFile(file, options = {}) {
    const {
      folder = 'uploads',
      fileName,
      institutionId,
      processImage = true,
      quality = 80
    } = options;

    const key = this.buildKey(folder, institutionId, fileName || file.originalname);
    const fullPath = this.resolveKeyPath(key);
    this.ensureDirectory(path.dirname(fullPath));

    let buffer = file.buffer;
    if (processImage && allowedImageTypes.includes(file.mimetype)) {
      buffer = await this.processImage(buffer, { quality });
    }

    await writeFile(fullPath, buffer);

    return {
      success: true,
      file: {
        key,
        url: this.buildUrl(key),
        size: buffer.length,
        mimetype: file.mimetype,
        originalName: file.originalname,
        institutionId: institutionId || null
      }
    };
  }

  async uploadMultipleFiles(files, options = {}) {
    const uploads = await Promise.allSettled(files.map((file) => this.uploadFile(file, options)));
    const successful = [];
    const failed = [];
    uploads.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successful.push(result.value);
      } else {
        failed.push({
          file: files[index]?.originalname || `file_${index}`,
          error: result.reason ? result.reason.message : 'Upload failed'
        });
      }
    });

    return {
      success: failed.length === 0,
      successful,
      failed,
      total: files.length,
      uploaded: successful.length,
      errors: failed.length
    };
  }

  async deleteFile(key) {
    const normalizedKey = key.replace(/^\/*/, '');
    const fullPath = this.resolveKeyPath(normalizedKey);
    try {
      await unlink(fullPath);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getFileMetadata(key) {
    const normalizedKey = key.replace(/^\/*/, '');
    const fullPath = this.resolveKeyPath(normalizedKey);
    try {
      const stats = await stat(fullPath);
      return {
        success: true,
        metadata: {
          size: stats.size,
          lastModified: stats.mtime,
          createdAt: stats.birthtime,
          path: normalizedKey
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listFiles(prefix = '', maxKeys = 1000, continuationToken = null) {
    const normalizedPrefix = prefix.replace(/^\/*/, '').replace(/\/+$/, '');
    const directoryPath = normalizedPrefix
      ? this.resolveKeyPath(normalizedPrefix)
      : this.rootDir;

    if (!fs.existsSync(directoryPath)) {
      return { success: true, files: [], isTruncated: false };
    }

    const files = [];
    const traverse = async (dir, relativePath = '') => {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxKeys) break;
        const currentPath = path.join(dir, entry.name);
        const relativeKey = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await traverse(currentPath, relativeKey);
        } else {
          const stats = await stat(currentPath);
          files.push({
            key: normalizedPrefix ? `${normalizedPrefix}/${relativeKey}` : relativeKey,
            size: stats.size,
            lastModified: stats.mtime,
            url: this.buildUrl(normalizedPrefix ? `${normalizedPrefix}/${relativeKey}` : relativeKey)
          });
        }
      }
    };

    await traverse(directoryPath);

    return {
      success: true,
      files,
      isTruncated: files.length >= maxKeys,
      nextContinuationToken: null
    };
  }

  getPresignedUrl(key, expiresIn = 3600) {
    const normalizedKey = key.replace(/^\/*/, '');
    return {
      success: true,
      url: this.buildUrl(normalizedKey),
      expiresIn
    };
  }

  async checkHealth() {
    try {
      this.ensureDirectory(this.rootDir);
      const stats = await stat(this.rootDir);
      return {
        success: true,
        message: 'Local storage accessible',
        path: this.rootDir,
        size: stats.size
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        path: this.rootDir
      };
    }
  }
}

export default new StorageService();
