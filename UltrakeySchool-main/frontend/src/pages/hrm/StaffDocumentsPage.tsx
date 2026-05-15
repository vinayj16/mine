import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface StaffDocument {
  _id: string;
  documentId: string;
  staff: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  documentType: string;
  documentName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'pending';
  notes?: string;
}

const StaffDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<StaffDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    staff: '',
    documentType: 'contract',
    documentName: '',
    expiryDate: '',
    status: 'pending',
    notes: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/hrm/staff-documents', {
        params: { limit: 100 }
      });
      
      if (response.data.success) {
        setDocuments(response.data.data.documents || []);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed');
        return;
      }
      
      setFormData({ ...formData, file, documentName: formData.documentName || file.name });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!formData.staff) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      setUploading(true);
      
      const uploadData = new FormData();
      uploadData.append('document', formData.file);
      uploadData.append('staff', formData.staff);
      uploadData.append('documentType', formData.documentType);
      uploadData.append('documentName', formData.documentName);
      uploadData.append('status', formData.status);
      if (formData.expiryDate) uploadData.append('expiryDate', formData.expiryDate);
      if (formData.notes) uploadData.append('notes', formData.notes);

      const response = await apiClient.post('/hrm/staff-documents', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Document uploaded successfully');
        setShowAddModal(false);
        setFormData({
          staff: '',
          documentType: 'contract',
          documentName: '',
          expiryDate: '',
          status: 'pending',
          notes: '',
          file: null
        });
        fetchDocuments();
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: StaffDocument) => {
    try {
      const response = await apiClient.get(`/hrm/staff-documents/${doc._id}/download`, {
        responseType: 'blob'
      });
      
      // response.data is the blob when responseType is 'blob'
      const blob = response.data as any;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.documentName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error(error.response?.data?.message || 'Failed to download document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/hrm/staff-documents/${id}`);
      
      if (response.data.success) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || doc.documentType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'expired':
        return 'bg-danger';
      case 'pending':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Staff Documents</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">HRM</li>
              <li className="breadcrumb-item active" aria-current="page">
                Staff Documents
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-primary d-flex align-items-center mb-2" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-file-plus me-2" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h4 className="card-title">Document Management</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start me-2">
              <span className="icon-addon">
                <i className="ti ti-search" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-select" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Documents</option>
              <option value="contract">Contracts</option>
              <option value="certificate">Certificates</option>
              <option value="id-proof">ID Proofs</option>
              <option value="medical">Medical</option>
              <option value="resume">Resumes</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" />
                    </div>
                  </th>
                  <th>Staff Name</th>
                  <th>Document Type</th>
                  <th>Document Name</th>
                  <th>Upload Date</th>
                  <th>Expiry Date</th>
                  <th>File Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <p className="text-muted mb-0">No documents found</p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-md me-2">
                            {doc.staff.avatar ? (
                              <img 
                                src={doc.staff.avatar} 
                                className="img-fluid rounded-circle" 
                                alt={doc.staff.name}
                              />
                            ) : (
                              <div className="avatar-title bg-primary rounded-circle">
                                {doc.staff.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </span>
                          <span>{doc.staff.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{doc.documentType}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="ti ti-file-text me-2 text-primary" />
                          <span className="text-truncate" style={{ maxWidth: '150px' }}>
                            {doc.documentName}
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(doc.uploadDate)}</td>
                      <td>
                        <span className={doc.status === 'expired' ? 'text-danger' : ''}>
                          {formatDate(doc.expiryDate || '')}
                        </span>
                      </td>
                      <td>{formatFileSize(doc.fileSize)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical" />
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowViewModal(true);
                                }}
                              >
                                <i className="ti ti-eye me-2" />
                                View
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item"
                                onClick={() => handleDownload(doc)}
                              >
                                <i className="ti ti-download me-2" />
                                Download
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger" 
                                onClick={() => handleDelete(doc._id)}
                              >
                                <i className="ti ti-trash me-2" />
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleUpload}>
                <div className="modal-header">
                  <h5 className="modal-title">Upload Document</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowAddModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Staff Member <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter staff ID"
                          value={formData.staff}
                          onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                          required
                        />
                        <small className="text-muted">Enter the staff member's database ID</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Document Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={formData.documentType}
                          onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                          required
                        >
                          <option value="contract">Contract</option>
                          <option value="certificate">Certificate</option>
                          <option value="id-proof">ID Proof</option>
                          <option value="medical">Medical</option>
                          <option value="resume">Resume</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Document Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter document name"
                      value={formData.documentName}
                      onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Upload File <span className="text-danger">*</span></label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                    />
                    <small className="text-muted">Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB)</small>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Expiry Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Add any notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-upload me-2" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Document Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar avatar-lg me-3">
                        {selectedDocument.staff.avatar ? (
                          <img 
                            src={selectedDocument.staff.avatar} 
                            className="img-fluid rounded-circle" 
                            alt={selectedDocument.staff.name}
                          />
                        ) : (
                          <div className="avatar-title bg-primary rounded-circle">
                            {selectedDocument.staff.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </span>
                      <div>
                        <h6 className="mb-1">{selectedDocument.staff.name}</h6>
                        <small className="text-muted">{selectedDocument.staff.email}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Document Type</label>
                      <span className="badge bg-light text-dark fs-6">{selectedDocument.documentType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Document Name</label>
                      <p className="form-control-plaintext">{selectedDocument.documentName}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">File Size</label>
                      <p className="form-control-plaintext">{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Upload Date</label>
                      <p className="form-control-plaintext">{formatDate(selectedDocument.uploadDate)}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Expiry Date</label>
                      <p className={`form-control-plaintext ${selectedDocument.status === 'expired' ? 'text-danger' : ''}`}>
                        {formatDate(selectedDocument.expiryDate || '')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <span className={`badge ${getStatusBadge(selectedDocument.status)} fs-6`}>
                        {selectedDocument.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedDocument.notes && (
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Notes</label>
                        <p className="form-control-plaintext">{selectedDocument.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <i className="ti ti-download me-2" />
                  Download Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffDocumentsPage;
