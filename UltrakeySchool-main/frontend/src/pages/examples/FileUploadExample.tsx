/**
 * File Upload Example Page
 * Demonstrates how to use the FileUpload component
 */

import React, { useState } from 'react';
import FileUpload from '../../components/FileUpload';
import uploadService, { type FileTypeCategory, formatFileSize } from '../../services/uploadService';
import '../../styles/FileUpload.css';

const FileUploadExample: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileTypeCategory>('DOCUMENT');
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setUploadMessage({ type: 'success', text: `Successfully uploaded ${files.length} file(s)` });
    setTimeout(() => setUploadMessage(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setUploadMessage({ type: 'error', text: error });
    setTimeout(() => setUploadMessage(null), 5000);
  };

  const handleDeleteFile = async (key: string) => {
    try {
      await uploadService.deleteFile(key);
      setUploadedFiles(prev => prev.filter(f => f.key !== key));
      setUploadMessage({ type: 'success', text: 'File deleted successfully' });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error: any) {
      setUploadMessage({ type: 'error', text: error.message || 'Failed to delete file' });
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  return (
    <div className="file-upload-example-page">
      <div className="page-header">
        <h1>File Upload Example</h1>
        <p>Upload and manage files with drag & drop support</p>
      </div>

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`upload-message ${uploadMessage.type}`}>
          {uploadMessage.text}
        </div>
      )}

      {/* File Type Selector */}
      <div className="file-type-selector">
        <label>Select File Type:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value as FileTypeCategory)}
          className="file-type-select"
        >
          <option value="IMAGE">Images (JPEG, PNG, GIF, WebP)</option>
          <option value="DOCUMENT">Documents (PDF, DOC, XLS, PPT)</option>
          <option value="VIDEO">Videos (MP4, AVI, MOV)</option>
          <option value="AUDIO">Audio (MP3, WAV, OGG)</option>
          <option value="ARCHIVE">Archives (ZIP, RAR, 7Z)</option>
        </select>
      </div>

      {/* Single File Upload */}
      <div className="upload-section">
        <h2>Single File Upload</h2>
        <FileUpload
          fileType={selectedCategory}
          folder="examples"
          multiple={false}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          label="Upload Single File"
          description="Select one file to upload"
          showPreview={true}
        />
      </div>

      {/* Multiple Files Upload */}
      <div className="upload-section">
        <h2>Multiple Files Upload</h2>
        <FileUpload
          fileType={selectedCategory}
          folder="examples"
          multiple={true}
          maxFiles={5}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          label="Upload Multiple Files"
          description="Select up to 5 files to upload"
          showPreview={true}
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <h2>Uploaded Files ({uploadedFiles.length})</h2>
          <div className="uploaded-files-grid">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="uploaded-file-card">
                <div className="file-preview">
                  {file.mimetype?.startsWith('image/') ? (
                    <img src={file.url} alt={file.originalName} />
                  ) : (
                    <div className="file-icon-large">📄</div>
                  )}
                </div>
                <div className="file-details">
                  <h3>{file.originalName || file.filename}</h3>
                  <p className="file-meta">
                    Size: {formatFileSize(file.size)}
                  </p>
                  <p className="file-meta">
                    Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                  </p>
                  <div className="file-actions">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-view"
                    >
                      View
                    </a>
                    <button 
                      onClick={() => handleDeleteFile(file.key)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .file-upload-example-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 32px;
        }

        .page-header p {
          margin: 0;
          color: #718096;
          font-size: 16px;
        }

        .upload-message {
          padding: 12px 16px;
          margin-bottom: 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .upload-message.success {
          background-color: #f0fff4;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .upload-message.error {
          background-color: #fff5f5;
          color: #742a2a;
          border: 1px solid #fc8181;
        }

        .file-type-selector {
          margin-bottom: 32px;
          padding: 16px;
          background-color: #f7fafc;
          border-radius: 8px;
        }

        .file-type-selector label {
          display: block;
          margin-bottom: 8px;
          color: #2d3748;
          font-weight: 600;
        }

        .file-type-select {
          width: 100%;
          max-width: 400px;
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          background-color: #ffffff;
        }

        .upload-section {
          margin-bottom: 48px;
        }

        .upload-section h2 {
          margin: 0 0 16px 0;
          color: #2d3748;
          font-size: 24px;
        }

        .uploaded-files-section {
          margin-top: 48px;
        }

        .uploaded-files-section h2 {
          margin: 0 0 24px 0;
          color: #2d3748;
          font-size: 24px;
        }

        .uploaded-files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .uploaded-file-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background-color: #ffffff;
          transition: all 0.2s ease;
        }

        .uploaded-file-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .file-preview {
          width: 100%;
          height: 180px;
          background-color: #f7fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-icon-large {
          font-size: 64px;
        }

        .file-details {
          padding: 16px;
        }

        .file-details h3 {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 16px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-meta {
          margin: 4px 0;
          color: #718096;
          font-size: 13px;
        }

        .file-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-view,
        .btn-delete {
          flex: 1;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-view {
          background-color: #4299e1;
          color: #ffffff;
          border: none;
        }

        .btn-view:hover {
          background-color: #3182ce;
        }

        .btn-delete {
          background-color: transparent;
          color: #f56565;
          border: 1px solid #f56565;
        }

        .btn-delete:hover {
          background-color: #fff5f5;
        }

        @media (max-width: 768px) {
          .uploaded-files-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FileUploadExample;
