/**
 * File Upload Service
 * Handles file uploads using Multer and local/AWS S3 storage
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Define upload directories
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const PROFILE_PICS_DIR = path.join(UPLOAD_DIR, 'profile-pics');
const DOCUMENTS_DIR = path.join(UPLOAD_DIR, 'documents');
const IMAGES_DIR = path.join(UPLOAD_DIR, 'images');
const EXAMS_DIR = path.join(UPLOAD_DIR, 'exams');
const HOMEWORK_DIR = path.join(UPLOAD_DIR, 'homework');

// Create directories
[UPLOAD_DIR, PROFILE_PICS_DIR, DOCUMENTS_DIR, IMAGES_DIR, EXAMS_DIR, HOMEWORK_DIR].forEach(ensureDirectoryExists);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = UPLOAD_DIR;

    if (file.fieldname === 'profile_pic') {
      dest = PROFILE_PICS_DIR;
    } else if (file.fieldname === 'document') {
      dest = DOCUMENTS_DIR;
    } else if (file.fieldname === 'image') {
      dest = IMAGES_DIR;
    } else if (file.fieldname === 'exam_paper') {
      dest = EXAMS_DIR;
    } else if (file.fieldname === 'homework_file') {
      dest = HOMEWORK_DIR;
    }

    ensureDirectoryExists(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter
});

// Single file upload
export const uploadSingle = upload.single('file');

// Multiple files upload
export const uploadMultiple = upload.array('files', 10);

// Profile picture upload
export const uploadProfilePic = upload.single('profile_pic');

// Document upload
export const uploadDocument = upload.single('document');

// Multiple document upload
export const uploadDocuments = upload.array('documents', 10);

// Get file path
export const getFilePath = (filename, type = 'uploads') => {
  const paths = {
    uploads: UPLOAD_DIR,
    'profile-pics': PROFILE_PICS_DIR,
    documents: DOCUMENTS_DIR,
    images: IMAGES_DIR,
    exams: EXAMS_DIR,
    homework: HOMEWORK_DIR
  };

  return path.join(paths[type] || UPLOAD_DIR, filename);
};

// Get file URL
export const getFileUrl = (filename, type = 'uploads') => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Delete file
export const deleteFile = async (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`File deleted: ${filepath}`);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (error) {
    logger.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// Delete file by filename and type
export const deleteFileByName = async (filename, type = 'uploads') => {
  const filepath = getFilePath(filename, type);
  return deleteFile(filepath);
};

// Get file info
export const getFileInfo = (file) => {
  return {
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: getFileUrl(file.filename, file.fieldname)
  };
};

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadProfilePic,
  uploadDocument,
  uploadDocuments,
  getFilePath,
  getFileUrl,
  deleteFile,
  deleteFileByName,
  getFileInfo
};
