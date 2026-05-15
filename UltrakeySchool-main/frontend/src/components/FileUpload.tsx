/**
 * File Upload Component
 * Reusable component for file uploads with drag & drop support
 */

import React, { useState, useRef, useCallback } from 'react';
import uploadService, { 
  type FileTypeCategory, 
  type UploadOptions, 
  validateFile, 
  formatFileSize,
  getFileIcon,
  FILE_TYPES
} from '../services/uploadService';

interface FileUploadProps {
  // Upload configuration
  fileType?: FileTypeCategory;
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  
  // Callbacks
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  onFileSelect?: (files: File[]) => void;
  
  // UI customization
  accept?: string;
  label?: string;
  description?: string;
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: any;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  fileType = 'DOCUMENT',
  folder = 'uploads',
  multiple = false,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  onFileSelect,
  accept,
  label = 'Upload Files',
  description,
  showPreview = true,
  disabled = false,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get accept attribute from file type
  const getAcceptAttribute = () => {
    if (accept) return accept;
    const config = FILE_TYPES[fileType];
    return config.extensions.map(ext => `.${ext}`).join(',');
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    
    // Validate file count
    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Only one file is allowed');
      return;
    }
    
    if (fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validatedFiles: FileWithProgress[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const validation = validateFile(file, fileType);
      if (validation.isValid) {
        validatedFiles.push({
          file,
          progress: 0,
          status: 'pending'
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
    }

    if (validatedFiles.length > 0) {
      setFiles(validatedFiles);
      onFileSelect?.(validatedFiles.map(f => f.file));
    }
  }, [fileType, multiple, maxFiles, onUploadError, onFileSelect]);

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Upload files
  const uploadFiles = async () => {
    const options: UploadOptions = {
      folder,
      fileType,
      isPublic: true,
      processImage: fileType === 'IMAGE'
    };

    const uploadedFiles: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i];
      
      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' as const } : f
      ));

      try {
        const result = await uploadService.uploadSingle(
          fileWithProgress.file,
          {
            ...options,
            onProgress: (progress) => {
              setFiles(prev => prev.map((f, idx) => 
                idx === i ? { ...f, progress } : f
              ));
            }
          }
        );

        if (result.success && result.file) {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'success' as const, uploadedFile: result.file } : f
          ));
          uploadedFiles.push(result.file);
        } else {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error' as const, error: result.error } : f
          ));
          onUploadError?.(result.error || 'Upload failed');
        }
      } catch (error: any) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const, error: error.message } : f
        ));
        onUploadError?.(error.message);
      }
    }

    if (uploadedFiles.length > 0) {
      onUploadComplete?.(uploadedFiles);
    }
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Drop zone */}
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute()}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        <div className="upload-icon">📁</div>
        <h3>{label}</h3>
        {description && <p className="upload-description">{description}</p>}
        <p className="upload-hint">
          Drag & drop files here or click to browse
        </p>
        <p className="upload-info">
          Allowed: {FILE_TYPES[fileType].extensions.join(', ')} 
          (Max: {formatFileSize(FILE_TYPES[fileType].maxSize)})
        </p>
      </div>

      {/* File list */}
      {showPreview && files.length > 0 && (
        <div className="file-upload-list">
          <div className="file-list-header">
            <h4>Selected Files ({files.length})</h4>
            <button onClick={clearFiles} className="btn-clear">Clear All</button>
          </div>
          
          {files.map((fileWithProgress, index) => (
            <div key={index} className={`file-item status-${fileWithProgress.status}`}>
              <div className="file-icon">{getFileIcon(fileWithProgress.file.name)}</div>
              
              <div className="file-info">
                <div className="file-name">{fileWithProgress.file.name}</div>
                <div className="file-size">{formatFileSize(fileWithProgress.file.size)}</div>
                
                {fileWithProgress.status === 'uploading' && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${fileWithProgress.progress}%` }}
                    />
                  </div>
                )}
                
                {fileWithProgress.status === 'error' && (
                  <div className="file-error">{fileWithProgress.error}</div>
                )}
                
                {fileWithProgress.status === 'success' && (
                  <div className="file-success">✓ Uploaded successfully</div>
                )}
              </div>
              
              <button 
                onClick={() => removeFile(index)}
                className="btn-remove"
                disabled={fileWithProgress.status === 'uploading'}
              >
                ✕
              </button>
            </div>
          ))}
          
          {files.some(f => f.status === 'pending') && (
            <button 
              onClick={uploadFiles}
              className="btn-upload"
              disabled={disabled}
            >
              Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
