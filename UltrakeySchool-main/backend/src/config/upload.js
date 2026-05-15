/**
 * File Upload Configuration
 * Handles file uploads with validation and storage
 */
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File type configurations
export const FILE_TYPES = {
  IMAGE: {
    extensions: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'],
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  DOCUMENT: {
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  VIDEO: {
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    mimeTypes: ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  AUDIO: {
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
  ARCHIVE: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    maxSize: 50 * 1024 * 1024, // 50MB
  }
};

// Get allowed file types for a category
export const getAllowedTypes = (category = 'DOCUMENT') => {
  return FILE_TYPES[category] || FILE_TYPES.DOCUMENT;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.body.folder || 'general';
    const folderPath = path.join(uploadDir, folder);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter with enhanced validation
const fileFilter = (req, file, cb) => {
  const fileType = req.body.fileType || 'DOCUMENT';
  const allowedConfig = getAllowedTypes(fileType);
  
  if (!allowedConfig) {
    return cb(new Error(`Invalid file type category: ${fileType}`));
  }
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  const isExtensionAllowed = allowedConfig.extensions.includes(ext);
  const isMimeTypeAllowed = allowedConfig.mimeTypes.includes(file.mimetype);
  
  if (isExtensionAllowed && isMimeTypeAllowed) {
    return cb(null, true);
  }
  
  cb(new Error(`Invalid file type. Allowed: ${allowedConfig.extensions.join(', ')}`));
};

// Upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter,
});

// Image upload (stricter validation)
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: FILE_TYPES.IMAGE.maxSize,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const isExtensionAllowed = FILE_TYPES.IMAGE.extensions.includes(ext);
    const isMimeTypeAllowed = FILE_TYPES.IMAGE.mimeTypes.includes(file.mimetype);
    
    if (isExtensionAllowed && isMimeTypeAllowed) {
      return cb(null, true);
    }
    
    cb(new Error(`Only image files are allowed: ${FILE_TYPES.IMAGE.extensions.join(', ')}`));
  },
});

// Document upload
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: FILE_TYPES.DOCUMENT.maxSize,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const isExtensionAllowed = FILE_TYPES.DOCUMENT.extensions.includes(ext);
    const isMimeTypeAllowed = FILE_TYPES.DOCUMENT.mimeTypes.includes(file.mimetype);
    
    if (isExtensionAllowed && isMimeTypeAllowed) {
      return cb(null, true);
    }
    
    cb(new Error(`Only document files are allowed: ${FILE_TYPES.DOCUMENT.extensions.join(', ')}`));
  },
});

// Multiple files upload
export const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Single file upload
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Multiple fields upload
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Get file URL
export const getFileUrl = (filename, folder = 'general') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Delete file
export const deleteFile = (filepath) => {
  const fullPath = path.join(uploadDir, filepath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

// Get file info
export const getFileInfo = (filepath) => {
  const fullPath = path.join(uploadDir, filepath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: path.extname(filepath),
      name: path.basename(filepath)
    };
  }
  return { exists: false };
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Validate file size
export const validateFileSize = (size, category = 'DOCUMENT') => {
  const allowedConfig = getAllowedTypes(category);
  return size <= allowedConfig.maxSize;
};

// Get upload directory path
export const getUploadDir = () => uploadDir;

export default {
  upload,
  uploadImage,
  uploadDocument,
  uploadMultiple,
  uploadSingle,
  uploadFields,
  getFileUrl,
  deleteFile,
  getFileInfo,
  formatFileSize,
  validateFileSize,
  getUploadDir,
  FILE_TYPES,
  getAllowedTypes
};
