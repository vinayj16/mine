import { apiClient } from '../api/client';
import type { ApiResponse } from './api';

// File type categories matching backend
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
} as const;

export type FileTypeCategory = keyof typeof FILE_TYPES;

export interface UploadedFile {
  key: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  folder: string;
  uploadedAt: string;
}

export interface UploadOptions {
  folder?: string;
  fileType?: FileTypeCategory;
  isPublic?: boolean;
  processImage?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

export interface MultipleUploadResult {
  success: boolean;
  uploaded: UploadedFile[];
  failed: Array<{ filename: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, category: FileTypeCategory = 'DOCUMENT'): { isValid: boolean; error?: string } {
  const config = FILE_TYPES[category];
  
  if (!config) {
    return { isValid: false, error: 'Invalid file type category' };
  }
  
  // Check file size
  if (file.size > config.maxSize) {
    return { 
      isValid: false, 
      error: `File size exceeds maximum allowed (${formatFileSize(config.maxSize)})` 
    };
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !(config.extensions as readonly string[]).includes(extension)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed: ${config.extensions.join(', ')}` 
    };
  }
  
  // Check MIME type
  if (!(config.mimeTypes as readonly string[]).includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file format` 
    };
  }
  
  return { isValid: true };
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    // Images
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    // Documents
    pdf: '📄', doc: '📝', docx: '📝', txt: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📊', pptx: '📊',
    // Media
    mp4: '🎥', avi: '🎥', mov: '🎥', wmv: '🎥',
    mp3: '🎵', wav: '🎵', ogg: '🎵',
    // Archives
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
  };
  
  return iconMap[extension || ''] || '📎';
}

const uploadService = {
  /**
   * Upload single file
   */
  async uploadSingle(
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = validateFile(file, options.fileType);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (options.folder) formData.append('folder', options.folder);
      if (options.fileType) formData.append('fileType', options.fileType);
      if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));
      if (options.processImage !== undefined) formData.append('processImage', String(options.processImage));
      
      // Upload with progress tracking
      const response = await apiClient.post<UploadedFile>('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(progress);
          }
        },
      });
      
      if (response.data.success && response.data.data) {
        return { success: true, file: response.data.data };
      }
      
      return { success: false, error: response.data.message || 'Upload failed' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Upload failed' 
      };
    }
  },

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<MultipleUploadResult> {
    try {
      // Validate all files
      const validationErrors: Array<{ filename: string; error: string }> = [];
      files.forEach(file => {
        const validation = validateFile(file, options.fileType);
        if (!validation.isValid) {
          validationErrors.push({ filename: file.name, error: validation.error || 'Invalid file' });
        }
      });
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          uploaded: [],
          failed: validationErrors,
          summary: { total: files.length, successful: 0, failed: validationErrors.length }
        };
      }
      
      // Create form data
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      if (options.folder) formData.append('folder', options.folder);
      if (options.fileType) formData.append('fileType', options.fileType);
      if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));
      if (options.processImage !== undefined) formData.append('processImage', String(options.processImage));
      
      // Upload
      const response = await apiClient.post<MultipleUploadResult>('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(progress);
          }
        },
      });
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          uploaded: response.data.data.uploaded || [],
          failed: response.data.data.failed || [],
          summary: response.data.data.summary || { total: files.length, successful: 0, failed: 0 }
        };
      }
      
      return {
        success: false,
        uploaded: [],
        failed: files.map(f => ({ filename: f.name, error: 'Upload failed' })),
        summary: { total: files.length, successful: 0, failed: files.length }
      };
    } catch (error: any) {
      return {
        success: false,
        uploaded: [],
        failed: files.map(f => ({ 
          filename: f.name, 
          error: error.response?.data?.message || error.message || 'Upload failed' 
        })),
        summary: { total: files.length, successful: 0, failed: files.length }
      };
    }
  },

  /**
   * Upload profile image
   */
  async uploadProfileImage(
    file: File, 
    userId?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Validate image
      const validation = validateFile(file, 'IMAGE');
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      
      const formData = new FormData();
      formData.append('image', file);
      
      const endpoint = userId ? `/upload/profile/${userId}` : '/upload/profile';
      
      const response = await apiClient.post<UploadedFile>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      
      if (response.data.success && response.data.data) {
        return { success: true, file: response.data.data };
      }
      
      return { success: false, error: response.data.message || 'Upload failed' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Upload failed' 
      };
    }
  },

  /**
   * Upload document
   */
  async uploadDocument(
    file: File,
    documentType: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Validate document
      const validation = validateFile(file, 'DOCUMENT');
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      if (description) formData.append('description', description);
      
      const response = await apiClient.post<UploadedFile>('/upload/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      
      if (response.data.success && response.data.data) {
        return { success: true, file: response.data.data };
      }
      
      return { success: false, error: response.data.message || 'Upload failed' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Upload failed' 
      };
    }
  },

  /**
   * Delete file
   */
  async deleteFile(key: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/upload/${key}`);
    return response.data;
  },

  /**
   * Get presigned URL for private file
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<ApiResponse<{ url: string; expiresIn: number }>> {
    const response = await apiClient.get(`/upload/presigned/${key}`, {
      params: { expiresIn }
    });
    return response.data;
  },

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/upload/metadata/${key}`);
    return response.data;
  },

  /**
   * List institution files
   */
  async listFiles(folder: string = 'uploads'): Promise<ApiResponse<{ files: UploadedFile[] }>> {
    const response = await apiClient.get('/upload/list', {
      params: { folder }
    });
    return response.data;
  },

  /**
   * Bulk delete files
   */
  async bulkDelete(keys: string[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/upload/bulk-delete', { keys });
    return response.data;
  }
};

export default uploadService;
