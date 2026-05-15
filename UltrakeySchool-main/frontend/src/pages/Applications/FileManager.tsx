import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import fileManagerService from '../../services/fileManagerService';

export interface FileManagerItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  fileType?: 'pdf' | 'doc' | 'xls' | 'img' | 'video' | 'audio' | 'other';
  icon?: string;
  size: number;
  fileCount: number;
  parentId?: string;
  ownerId: string;
  ownerName: string;
  ownerImg?: string;
  institutionId?: string;
  tags: string[];
  isFavorite: boolean;
  isShared: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  path?: string;
  mimeType?: string;
}

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
  usedSize: number;
  totalSize: number;
}

interface Statistics {
  folders: number;
  files: number;
  favorites: number;
  shared: number;
  byFileType: {
    pdf?: number;
    doc?: number;
    xls?: number;
    img?: number;
    video?: number;
    audio?: number;
    other?: number;
  };
  totalFolders?: number;
  totalFiles?: number;
}

const FileManagerPage: React.FC = () => {
  const [items, setItems] = useState<FileManagerItem[]>(() => {
    const stored = localStorage.getItem('filemanager_items');
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'all' | 'folders' | 'files' | 'favorites' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('folder');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'folder' as 'file' | 'folder',
    fileType: 'other' as 'pdf' | 'doc' | 'xls' | 'img' | 'video' | 'audio' | 'other',
    description: '',
    tags: ''
  });

  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    fetchItems();
  }, [currentView]);

  useEffect(() => {
    fetchStorageInfo();
    fetchStatistics();
  }, [items]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params: any = { ownerId: userId };
      
      if (currentView === 'folders') {
        params.type = 'folder';
      } else if (currentView === 'files') {
        params.type = 'file';
      } else if (currentView === 'favorites') {
        params.isFavorite = true;
      } else if (currentView === 'trash') {
        params.isDeleted = true;
      }

      try {
        const response = await fileManagerService.getAllItems(params);
        const itemsArray = response?.data?.items || response?.data || [];
        const finalItems = Array.isArray(itemsArray) ? itemsArray : [];
        setItems(finalItems);
        localStorage.setItem('filemanager_items', JSON.stringify(finalItems));
      } catch {
        setItems([]);
      }
    } catch (error: any) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      // Calculate from localStorage items
      const totalSize = items.reduce((acc, item) => acc + (item.size || 0), 0);
      const maxSize = 100 * 1024 * 1024; // 100MB
      const used = totalSize / (1024 * 1024); // Convert to MB
      const total = maxSize / (1024 * 1024); // Convert to MB
      const percentage = Math.min((used / total) * 100, 100);
      
      const storageData = { 
        used, 
        total, 
        percentage, 
        usedSize: totalSize, 
        totalSize: maxSize 
      };
      
      setStorageInfo(storageData);
    } catch (error: any) {
      console.error('Error fetching storage info:', error);
      setStorageInfo({ used: 0, total: 100, percentage: 0, usedSize: 0, totalSize: 100 * 1024 * 1024 })
    }
  };

  const fetchStatistics = async () => {
    try {
      // Calculate from localStorage items
      const folders = items.filter(item => item.type === 'folder').length;
      const files = items.filter(item => item.type === 'file').length;
      const favorites = items.filter(item => item.isFavorite).length;
      const shared = items.filter(item => item.isShared).length;
      
      const byFileType = files > 0 ? items.reduce((acc, item) => {
        if (item.type === 'file' && item.fileType) {
          acc[item.fileType] = (acc[item.fileType] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) : {};
      
      const statsData = { 
        folders, 
        files, 
        favorites, 
        shared, 
        byFileType,
        totalFolders: folders,
        totalFiles: files
      };
      
      setStatistics(statsData);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      setStatistics({ folders: 0, files: 0, favorites: 0, shared: 0, byFileType: {} })
    }
  };

  const handleCreateItem = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return;
      }

      const newItem: FileManagerItem = {
        _id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        fileType: formData.type === 'file' ? formData.fileType : undefined,
        size: 0,
        fileCount: formData.type === 'folder' ? 0 : 1,
        ownerId: userId,
        ownerName: 'Current User',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isFavorite: false,
        isShared: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to local state for demo
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      localStorage.setItem('filemanager_items', JSON.stringify(updatedItems));

      toast.success(`${formData.type === 'folder' ? 'Folder' : 'File'} created successfully`);
      setShowCreateModal(false);
      setFormData({ name: '', type: 'folder', fileType: 'other', description: '', tags: '' });
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast.error(error.message || 'Failed to create item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      // Demo mode - work with local state
      const updatedItems = items.filter(item => item._id !== id);
      setItems(updatedItems);
      localStorage.setItem('filemanager_items', JSON.stringify(updatedItems));
      
      toast.success('Item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      // Demo mode - work with local state
      const updatedItems = items.map(item => 
        item._id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      setItems(updatedItems);
      localStorage.setItem('filemanager_items', JSON.stringify(updatedItems));
      
      toast.success('Favorite status updated');
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await fileManagerService.bulkDeleteItems(selectedItems);
      toast.success('Selected items deleted successfully');
      setSelectedItems([]);
      fetchItems();
      fetchStorageInfo();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error bulk deleting items:', error);
      toast.error(error.message || 'Failed to delete selected items');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchItems();
      return;
    }

    try {
      const response = await fileManagerService.searchItems(searchQuery, userId);
      setItems(response.data?.items || []);
    } catch (error: any) {
      console.error('Error searching items:', error);
      toast.error(error.message || 'Failed to search items');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadFiles(files);
      setShowUploadModal(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFiles(Array.from(files));
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = currentUser?.name || currentUser?.firstName || 'Demo User';
      
      for (const file of uploadFiles) {
        const data = {
          name: file.name,
          type: 'file' as const,
          fileType: getFileTypeFromMime(file.type) as 'pdf' | 'doc' | 'xls' | 'img' | 'video' | 'audio' | 'other',
          size: file.size,
          ownerId: userId,
          ownerName: userName,
          status: 'active' as const
        };
        await fileManagerService.createItem(data);
      }

      toast.success('Files uploaded successfully');
      setShowUploadModal(false);
      setUploadFiles([]);
      fetchItems();
      fetchStorageInfo();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to upload files');
    }
  };

  const getFileTypeFromMime = (mimeType: string): string => {
    if (!mimeType) return 'other';
    
    const type = mimeType.toLowerCase();
    
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('doc') || type.includes('word')) return 'doc';
    if (type.includes('xls') || type.includes('excel')) return 'xls';
    if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return 'img';
    if (type.includes('mp4') || type.includes('avi') || type.includes('mov')) return 'video';
    if (type.includes('mp3') || type.includes('wav') || type.includes('ogg')) return 'audio';
    
    return 'other';
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf': return 'ti ti-file-type-pdf';
      case 'doc': return 'ti ti-file-type-doc';
      case 'xls': return 'ti ti-file-type-xls';
      case 'img': return 'ti ti-photo';
      case 'video': return 'ti ti-video';
      case 'audio': return 'ti ti-music';
      default: return 'ti ti-file';
    }
  };

  const folders = items.filter(i => i.type === 'folder');
  const files = items.filter(i => i.type === 'file');

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="mb-1">File Manager</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="#">Dashboard</a>
              </li>
              <li className="breadcrumb-item">Application</li>
              <li className="breadcrumb-item active" aria-current="page">
                File Manager
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchItems}>
            <i className="ti ti-refresh me-2" />Refresh
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <button 
                className="btn btn-primary w-100 mb-3"
                onClick={() => {
                  setCreateType('folder');
                  setFormData(prev => ({ ...prev, type: 'folder' }));
                  setShowCreateModal(true);
                }}
              >
                <i className="ti ti-folder-plus me-2" />New Folder
              </button>

              <button 
                className="btn btn-outline-primary w-100 mb-3"
                onClick={() => {
                  setCreateType('file');
                  setFormData(prev => ({ ...prev, type: 'file' }));
                  setShowCreateModal(true);
                }}
              >
                <i className="ti ti-file-plus me-2" />New File
              </button>

              <button 
                className="btn btn-success w-100 mb-3"
                onClick={() => setShowUploadModal(true)}
              >
                <i className="ti ti-upload me-2" />Upload Files
              </button>

              <nav className="mb-3">
                <button 
                  className={`btn btn-link text-start w-100 ${currentView === 'all' ? 'active' : ''}`}
                  onClick={() => setCurrentView('all')}
                >
                  <i className="ti ti-files me-2" />All Files
                </button>
                <button 
                  className={`btn btn-link text-start w-100 ${currentView === 'folders' ? 'active' : ''}`}
                  onClick={() => setCurrentView('folders')}
                >
                  <i className="ti ti-folder me-2" />Folders
                </button>
                <button 
                  className={`btn btn-link text-start w-100 ${currentView === 'files' ? 'active' : ''}`}
                  onClick={() => setCurrentView('files')}
                >
                  <i className="ti ti-file me-2" />Files
                </button>
                <button 
                  className={`btn btn-link text-start w-100 ${currentView === 'favorites' ? 'active' : ''}`}
                  onClick={() => setCurrentView('favorites')}
                >
                  <i className="ti ti-star me-2" />Favorites
                </button>
                <button 
                  className={`btn btn-link text-start w-100 ${currentView === 'trash' ? 'active' : ''}`}
                  onClick={() => setCurrentView('trash')}
                >
                  <i className="ti ti-trash me-2" />Trash
                </button>
              </nav>

              {storageInfo && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Storage</h6>
                    <span className="text-muted small">{storageInfo.percentage}%</span>
                  </div>
                  <div className="progress mb-2" style={{ height: '8px' }}>
                    <div 
                      className={`progress-bar ${storageInfo.percentage > 80 ? 'bg-danger' : 'bg-primary'}`}
                      style={{ width: `${storageInfo.percentage}%` }}
                    />
                  </div>
                  <small className="text-muted">
                    {formatSize(storageInfo.usedSize)} of {formatSize(storageInfo.totalSize)} used
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-9 col-md-12">
          <div 
            className={`card mb-3 ${isDragging ? 'border-primary' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
              border: isDragging ? '2px dashed #007bff' : '1px solid #dee2e6',
              backgroundColor: isDragging ? '#f8f9fa' : 'transparent'
            }}
          >
            <div className="card-body">
              {isDragging && (
                <div className="text-center py-4">
                  <i className="ti ti-upload text-primary" style={{ fontSize: '48px' }} />
                  <p className="mt-2 mb-0">Drop files here to upload</p>
                </div>
              )}
              
              {!isDragging && (
                <>
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search files and folders..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className="btn btn-primary" onClick={handleSearch}>
                          <i className="ti ti-search" />
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6 text-end mt-2 mt-md-0">
                      <button 
                        className="btn btn-success btn-sm me-2"
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <i className="ti ti-upload me-2" />Browse Files
                      </button>
                      {selectedItems.length > 0 && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={handleBulkDelete}
                        >
                          <i className="ti ti-trash me-2" />
                          Delete Selected ({selectedItems.length})
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {statistics && (
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <i className="ti ti-folder text-primary" style={{ fontSize: '32px' }} />
                    <h4 className="mt-2 mb-0">{statistics.totalFolders || 0}</h4>
                    <p className="text-muted mb-0">Folders</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <i className="ti ti-file text-success" style={{ fontSize: '32px' }} />
                    <h4 className="mt-2 mb-0">{statistics.totalFiles || 0}</h4>
                    <p className="text-muted mb-0">Files</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <i className="ti ti-file-type-pdf text-danger" style={{ fontSize: '32px' }} />
                    <h4 className="mt-2 mb-0">{statistics.byFileType?.pdf || 0}</h4>
                    <p className="text-muted mb-0">PDF Files</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <i className="ti ti-photo text-warning" style={{ fontSize: '32px' }} />
                    <h4 className="mt-2 mb-0">{statistics.byFileType?.img || 0}</h4>
                    <p className="text-muted mb-0">Images</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-folder-off" style={{ fontSize: '64px', opacity: 0.3 }} />
                <p className="text-muted mt-3">No items found</p>
              </div>
            </div>
          ) : (
            <>
              {folders.length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Folders</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {folders.map(folder => (
                        <div key={folder._id} className="col-md-4 mb-3">
                          <div className="border rounded p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center">
                                <i className="ti ti-folder text-warning me-2" style={{ fontSize: '24px' }} />
                                <h6 className="mb-0">{folder.name}</h6>
                              </div>
                              <div>
                                <button 
                                  className="btn btn-link btn-sm p-0 me-2"
                                  onClick={(e) => handleToggleFavorite(folder._id, e)}
                                >
                                  <i className={`ti ti-star ${folder.isFavorite ? 'text-warning' : ''}`} />
                                </button>
                                <button 
                                  className="btn btn-link btn-sm p-0 text-danger"
                                  onClick={() => handleDeleteItem(folder._id)}
                                >
                                  <i className="ti ti-trash" />
                                </button>
                              </div>
                            </div>
                            <div className="text-muted small">
                              {folder.fileCount} items • {formatDate(folder.updatedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Files</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>
                              <input 
                                type="checkbox" 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(files.map(f => f._id));
                                  } else {
                                    setSelectedItems([]);
                                  }
                                }}
                              />
                            </th>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Type</th>
                            <th>Modified</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.map(file => (
                            <tr key={file._id}>
                              <td>
                                <input 
                                  type="checkbox"
                                  checked={selectedItems.includes(file._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems(prev => [...prev, file._id]);
                                    } else {
                                      setSelectedItems(prev => prev.filter(id => id !== file._id));
                                    }
                                  }}
                                />
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className={`${getFileIcon(file.fileType)} me-2`} />
                                  <span>{file.name}</span>
                                </div>
                              </td>
                              <td>{formatSize(file.size)}</td>
                              <td>
                                <span className="badge bg-secondary">{file.fileType}</span>
                              </td>
                              <td>{formatDate(file.updatedAt)}</td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-link"
                                    onClick={(e) => handleToggleFavorite(file._id, e)}
                                  >
                                    <i className={`ti ti-star ${file.isFavorite ? 'text-warning' : ''}`} />
                                  </button>
                                  <button 
                                    className="btn btn-link text-danger"
                                    onClick={() => handleDeleteItem(file._id)}
                                  >
                                    <i className="ti ti-trash" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Create New {createType === 'folder' ? 'Folder' : 'File'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`Enter ${createType} name`}
                  />
                </div>
                {createType === 'file' && (
                  <div className="mb-3">
                    <label className="form-label">File Type</label>
                    <select
                      className="form-select"
                      value={formData.fileType}
                      onChange={(e) => setFormData(prev => ({ ...prev, fileType: e.target.value as any }))}
                    >
                      <option value="other">Other</option>
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                      <option value="xls">Spreadsheet</option>
                      <option value="img">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCreateItem}
                >
                  Create {createType === 'folder' ? 'Folder' : 'File'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Files</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowUploadModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Files</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    onChange={handleFileSelect}
                  />
                </div>
                {uploadFiles.length > 0 && (
                  <div className="mb-3">
                    <h6>Files to upload:</h6>
                    <ul className="list-group">
                      {uploadFiles.map((file, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{file.name}</span>
                          <span>{formatSize(file.size)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0}
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default FileManagerPage;
