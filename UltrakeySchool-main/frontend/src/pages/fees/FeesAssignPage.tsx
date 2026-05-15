import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface FeesAssign {
  _id: string;
  feesGroup: string;
  feesType: string;
  class: string;
  section: string;
  amount: number;
  gender: string;
  category: string;
}

const FeesAssignPage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feesList, setFeesList] = useState<FeesAssign[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFees, setSelectedFees] = useState<FeesAssign | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    feesGroup: '',
    feesType: '',
    class: '',
    section: '',
    amount: '',
    gender: '',
    category: ''
  });

  // Fetch fees assignments on component mount
  useEffect(() => {
    fetchFeesAssignments();
  }, []);

  const fetchFeesAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/fees');
      
      if (response.data.success && response.data.data) {
        setFeesList(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching fees assignments:', err);
      setError(err.message || 'Failed to load fees assignments');
      toast.error('Failed to load fees assignments');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const payload = {
        feesGroup: formData.feesGroup,
        feesType: formData.feesType,
        class: formData.class,
        section: formData.section,
        amount: parseFloat(formData.amount),
        gender: formData.gender,
        category: formData.category
      };
      
      if (selectedFees) {
        // Update existing fees
        const response = await apiClient.put(`/fees/${selectedFees._id}`, payload);
        
        if (response.data.success) {
          toast.success('Fee assignment updated successfully');
          setShowEditModal(false);
          fetchFeesAssignments();
        }
      } else {
        // Add new fees
        const response = await apiClient.post('/fees', payload);
        
        if (response.data.success) {
          toast.success('Fee assignment created successfully');
          setShowAddModal(false);
          fetchFeesAssignments();
        }
      }
      
      // Reset form
      setFormData({
        feesGroup: '',
        feesType: '',
        class: '',
        section: '',
        amount: '',
        gender: '',
        category: ''
      });
      setSelectedFees(null);
    } catch (err: any) {
      console.error('Error saving fee assignment:', err);
      toast.error(err.response?.data?.message || 'Failed to save fee assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (fees: FeesAssign) => {
    setSelectedFees(fees);
    setFormData({
      feesGroup: fees.feesGroup,
      feesType: fees.feesType,
      class: fees.class,
      section: fees.section,
      amount: fees.amount.toString(),
      gender: fees.gender,
      category: fees.category
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedFees) return;
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.delete(`/fees/${selectedFees._id}`);
      
      if (response.data.success) {
        toast.success('Fee assignment deleted successfully');
        setShowDeleteModal(false);
        setSelectedFees(null);
        fetchFeesAssignments();
      }
    } catch (err: any) {
      console.error('Error deleting fee assignment:', err);
      toast.error(err.response?.data?.message || 'Failed to delete fee assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle select all
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(#select-all)');
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = e.target.checked;
    });
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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchFeesAssignments}>
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
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Fees Collection</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Assign Fees</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              title="Refresh"
              onClick={fetchFeesAssignments}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <a href="#!" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </a>
              </li>
              <li>
                <a href="#!" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </a>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Assign New
            </button>
          </div>
        </div>
      </div>

      {/* Fees List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Fees Collection</h4>
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
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Section</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Gender</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Both</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-0">
                          <label className="form-label">Student Category</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>BC</option>
                            <option>MBC</option>
                            <option>FC</option>
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
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="#!" className="dropdown-item rounded-1 active">
                    Ascending
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    Descending
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    Recently Viewed
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    Recently Added
                  </a>
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
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="select-all"
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th>S. No</th>
                  <th>Fees Group</th>
                  <th>Fees Type</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Amount ($)</th>
                  <th>Gender</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feesList.length > 0 ? (
                  feesList.map((fees: any, index: number) => (
                    <tr key={fees._id}>
                      <td>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>{index + 1}</td>
                      <td>{fees.feesGroup || 'N/A'}</td>
                      <td>{fees.feesType || 'N/A'}</td>
                      <td>{fees.class || 'N/A'}</td>
                      <td>{fees.section || 'N/A'}</td>
                      <td>{fees.amount?.toLocaleString() || 0}</td>
                      <td>{fees.gender || 'N/A'}</td>
                      <td>{fees.category || 'N/A'}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button 
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1" 
                                  onClick={() => handleEdit(fees)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedFees(fees);
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
                    <td colSpan={10} className="text-center py-4">
                      <p className="text-muted mb-0">No fee assignments found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Fees Assign Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign New Fees</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fees Group</label>
                        <select 
                          className="form-select"
                          name="feesGroup"
                          value={formData.feesGroup}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Admission-Fees</option>
                          <option>Tuition-Fees</option>
                          <option>Transport-Fees</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fees Type</label>
                        <select 
                          className="form-select"
                          name="feesType"
                          value={formData.feesType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Tuition Fees</option>
                          <option>Transport Fees</option>
                          <option>Library Fees</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select 
                          className="form-select"
                          name="class"
                          value={formData.class}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <select 
                          className="form-select"
                          name="section"
                          value={formData.section}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {['A', 'B', 'C', 'D'].map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Amount ($)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Gender</label>
                        <select 
                          className="form-select"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Both</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Student Category</label>
                        <select 
                          className="form-select"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>BC</option>
                          <option>MBC</option>
                          <option>FC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-light me-2" 
                      onClick={() => setShowAddModal(false)}
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
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fees Assign Modal */}
      {showEditModal && selectedFees && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Fees Assignment</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fees Group</label>
                        <select 
                          className="form-select"
                          name="feesGroup"
                          value={formData.feesGroup}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Admission-Fees</option>
                          <option>Tuition-Fees</option>
                          <option>Transport-Fees</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fees Type</label>
                        <select 
                          className="form-select"
                          name="feesType"
                          value={formData.feesType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Tuition Fees</option>
                          <option>Transport Fees</option>
                          <option>Library Fees</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select 
                          className="form-select"
                          name="class"
                          value={formData.class}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <select 
                          className="form-select"
                          name="section"
                          value={formData.section}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {['A', 'B', 'C', 'D'].map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Amount ($)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Gender</label>
                        <select 
                          className="form-select"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Both</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Student Category</label>
                        <select 
                          className="form-select"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>BC</option>
                          <option>MBC</option>
                          <option>FC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-light me-2" 
                      onClick={() => setShowEditModal(false)}
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
                          Updating...
                        </>
                      ) : (
                        'Update'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFees && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Fees Assignment</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this fees assignment?</p>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-light" 
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
                      'Delete'
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

export default FeesAssignPage;
