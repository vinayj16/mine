import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface FeesType {
  _id: string;
  name: string;
  code?: string;
  description: string;
  isActive: boolean;
}

const FeesTypePage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feesTypes, setFeesTypes] = useState<FeesType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState<FeesType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  // Fetch fee types on component mount
  useEffect(() => {
    fetchFeesTypes();
  }, []);

  const fetchFeesTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/finance/fees');
      
      if (response.data.success && response.data.data) {
        const data = response.data.data.feeStructures || response.data.data;
        // Ensure data is always an array
        setFeesTypes(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Error fetching fee types:', err);
      setError(err.message || 'Failed to load fee types');
      toast.error('Failed to load fee types');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle toggle switch
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const payload = {
        name: formData.name,
        code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        isActive: formData.isActive
      };
      
      if (selectedType) {
        // Update existing fee type
        const response = await apiClient.put(`/finance/fees/${selectedType._id}`, payload);
        
        if (response.data.success) {
          toast.success('Fee type updated successfully');
          setShowEditModal(false);
          fetchFeesTypes();
        }
      } else {
        // Add new fee type
        const response = await apiClient.post('/finance/fees', payload);
        
        if (response.data.success) {
          toast.success('Fee type created successfully');
          setShowAddModal(false);
          fetchFeesTypes();
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true
      });
      setSelectedType(null);
    } catch (err: any) {
      console.error('Error saving fee type:', err);
      toast.error(err.response?.data?.message || 'Failed to save fee type');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedType) return;
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.delete(`/finance/fees/${selectedType._id}`);
      
      if (response.data.success) {
        toast.success('Fee type deleted successfully');
        setShowDeleteModal(false);
        setSelectedType(null);
        fetchFeesTypes();
      }
    } catch (err: any) {
      console.error('Error deleting fee type:', err);
      toast.error(err.response?.data?.message || 'Failed to delete fee type');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <i className="ti ti-alert-circle me-2" />
        {error}
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchFeesTypes}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Fees Collection</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Fees Collection</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Fees Type</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchFeesTypes}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Fees Type
            </button>
          </div>
        </div>
      </div>

      {/* Fees Type List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Fees Type</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="text" 
                className="form-control date-range bookingrange" 
                placeholder="Select"
                value="Academic Year : 2024 / 2025" 
                readOnly
              />
            </div>
            
            <div className="dropdown mb-3 me-2">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown" 
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Name</label>
                          <select className="form-select">
                            <option>Select</option>
                            {Array.isArray(feesTypes) && feesTypes.length > 0 ? (
                              Array.from(new Set(feesTypes.map(type => type.name))).map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))
                            ) : (
                              <option value="">No types available</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-0">
                          <label className="form-label">Status</label>
                          <select className="form-select">
                            <option>All</option>
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="dropdown mb-3">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button className="dropdown-item rounded-1 active">
                    Ascending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Descending
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0 py-3">
          <div className="table-responsive">
            <table className="table datatable">
              <thead className="thead-light">
                <tr>
                  <th className="no-sort">
                    <div className="form-check form-check-md">
                      <input className="form-check-input" type="checkbox" id="select-all" />
                    </div>
                  </th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(feesTypes) && feesTypes.length > 0 ? (
                  feesTypes.map((type: any) => (
                    <tr key={type._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <a href="#" className="link-primary">{type._id?.slice(-6) || 'N/A'}</a>
                      </td>
                      <td>{type.name || 'N/A'}</td>
                      <td>{type.code || type.name?.toLowerCase().replace(/\s+/g, '-') || 'N/A'}</td>
                      <td>{type.description || 'No description'}</td>
                      <td>
                        <span className={`badge badge-soft-${type.isActive ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className={`ti ti-circle-filled fs-5 me-1`}></i>
                          {type.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  onClick={() => {
                                    setSelectedType(type);
                                    setFormData({
                                      name: type.name || '',
                                      code: type.code || '',
                                      description: type.description || '',
                                      isActive: type.isActive
                                    });
                                    setShowEditModal(true);
                                  }}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedType(type);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <p className="text-muted mb-0">No fee types found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{showEditModal ? 'Edit' : 'Add'} Fees Type</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  disabled={submitting}
                >
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Fees Type Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Code</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="Auto-generated if left empty"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            checked={formData.isActive}
                            onChange={handleToggle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {showEditModal ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      showEditModal ? 'Update' : 'Add Fees Type'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this fees type? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeesTypePage;
