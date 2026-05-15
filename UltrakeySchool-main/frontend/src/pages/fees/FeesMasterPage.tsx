import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface FeesMaster {
  status: any;
  _id: string;
  name: string;
  description?: string;
  amount: number;
  dueDate?: string;
  fineType?: string;
  fineAmount?: number;
  finePercentage?: number;
  isActive: boolean;
}

const FeesMasterPage: React.FC = () => {

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feesMasters, setFeesMasters] = useState<FeesMaster[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<FeesMaster | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: '',
    fineType: 'None',
    percentage: '',
    fineAmount: '',
    isActive: true
  });

  // Fetch fee masters on component mount
  useEffect(() => {
    fetchFeesMasters();
  }, []);

  const fetchFeesMasters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/finance/fees');
      
      if (response.data.success && response.data.data) {
        const data = response.data.data.feeStructures || response.data.data;
        setFeesMasters(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Error fetching fee masters:', err);
      setError(err.message || 'Failed to load fee masters');
      toast.error('Failed to load fee masters');
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
      
      const payload: any = {
        name: formData.name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        fineType: formData.fineType,
        isActive: formData.isActive
      };
      
      if (formData.fineType === 'Percentage') {
        payload.finePercentage = parseFloat(formData.percentage);
      } else if (formData.fineType === 'Fixed') {
        payload.fineAmount = parseFloat(formData.fineAmount);
      }
      
      if (selectedMaster) {
        // Update existing fee master
        const response = await apiClient.put(`/finance/fees/${selectedMaster._id}`, payload);
        
        if (response.data.success) {
          toast.success('Fee master updated successfully');
          setShowEditModal(false);
          fetchFeesMasters();
        }
      } else {
        // Add new fee master
        const response = await apiClient.post('/finance/fees', payload);
        
        if (response.data.success) {
          toast.success('Fee master created successfully');
          setShowAddModal(false);
          fetchFeesMasters();
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        amount: '',
        dueDate: '',
        fineType: 'None',
        percentage: '',
        fineAmount: '',
        isActive: true
      });
      setSelectedMaster(null);
    } catch (err: any) {
      console.error('Error saving fee master:', err);
      toast.error(err.response?.data?.message || 'Failed to save fee master');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMaster) return;
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.delete(`/finance/fees/${selectedMaster._id}`);
      
      if (response.data.success) {
        toast.success('Fee master deleted successfully');
        setShowDeleteModal(false);
        setSelectedMaster(null);
        fetchFeesMasters();
      }
    } catch (err: any) {
      console.error('Error deleting fee master:', err);
      toast.error(err.response?.data?.message || 'Failed to delete fee master');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchFeesMasters}>
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
              <li className="breadcrumb-item active" aria-current="page">Fees Master</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchFeesMasters}
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
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => {
                    if (!feesMasters.length) { toast.error('No data to export'); return; }
                    const headers = ['Name', 'Amount', 'Status', 'Due Date'];
                    const rows = feesMasters.map(f => [
                      f.name, f.amount, f.status, f.dueDate || 'N/A'
                    ].map(v => `"${v}"`).join(','));
                    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `fees_master_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                    toast.success('Exported successfully');
                  }}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as CSV
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => {
                    if (!feesMasters.length) { toast.error('No data to export'); return; }
                    const content = `<html><head><style>body{font-family:Arial;padding:20px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#4CAF50;color:white}</style></head><body>
                      <h1>Fees Master Report</h1>
                      <p>Generated: ${new Date().toLocaleDateString()}</p>
                      <table><tr><th>Name</th><th>Amount</th><th>Status</th><th>Due Date</th></tr>
                      ${feesMasters.map(f => `<tr><td>${f.name}</td><td>₹${f.amount}</td><td>${f.status}</td><td>${f.dueDate || 'N/A'}</td></tr>`).join('')}
                      </table></body></html>`;
                    const win = window.open('', '_blank');
                    if (win) { win.document.write(content); win.document.close(); win.print(); }
                    toast.success('PDF generated');
                  }}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>
              Add Fees Master
            </button>
          </div>
        </div>
      </div>

      {/* Fees Master List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Fees Master</h4>
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
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-0">
                          <label className="form-label">Status</label>
                          <select className="form-select">
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
                  <th>Description</th>
                  <th>Due Date</th>
                  <th>Amount ($)</th>
                  <th>Fine Type</th>
                  <th>Fine Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feesMasters.length > 0 ? (
                  feesMasters.map((master: any) => (
                    <tr key={master._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <a href="#" className="link-primary">{master._id?.slice(-6) || 'N/A'}</a>
                      </td>
                      <td>{master.name || 'N/A'}</td>
                      <td>{master.description || 'No description'}</td>
                      <td>{formatDate(master.dueDate)}</td>
                      <td>${master.amount?.toLocaleString() || 0}</td>
                      <td>{master.fineType || 'None'}</td>
                      <td>
                        {master.fineType === 'Percentage' 
                          ? `${master.finePercentage || 0}%` 
                          : master.fineType === 'Fixed' 
                            ? `$${master.fineAmount || 0}` 
                            : '-'}
                      </td>
                      <td>
                        <span className={`badge badge-soft-${master.isActive ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className={`ti ti-circle-filled fs-5 me-1`}></i>
                          {master.isActive ? 'Active' : 'Inactive'}
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
                                    setSelectedMaster(master);
                                    setFormData({
                                      name: master.name || '',
                                      description: master.description || '',
                                      amount: master.amount?.toString() || '',
                                      dueDate: master.dueDate ? master.dueDate.split('T')[0] : '',
                                      fineType: master.fineType || 'None',
                                      percentage: master.finePercentage?.toString() || '',
                                      fineAmount: master.fineAmount?.toString() || '',
                                      isActive: master.isActive
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
                                    setSelectedMaster(master);
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
                      <p className="text-muted mb-0">No fee masters found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Add/Edit Modal Form */}
      {(showAddModal || showEditModal) && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{showEditModal ? 'Edit' : 'Add'} Fees Master</h4>
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
                        <label className="form-label">Name</label>
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
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Due Date</label>
                            <input 
                              type="date" 
                              className="form-control" 
                              name="dueDate"
                              value={formData.dueDate}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Amount</label>
                            <div className="input-group">
                              <span className="input-group-text">₹</span>
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
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Fine Type</label>
                        <div className="d-flex gap-3">
                          <label className="d-flex align-items-center">
                            <input 
                              type="radio" 
                              name="fineType" 
                              value="None"
                              checked={formData.fineType === 'None'}
                              onChange={handleInputChange}
                              className="me-2"
                            />
                            None
                          </label>
                          <label className="d-flex align-items-center">
                            <input 
                              type="radio" 
                              name="fineType" 
                              value="Percentage"
                              checked={formData.fineType === 'Percentage'}
                              onChange={handleInputChange}
                              className="me-2"
                            />
                            Percentage
                          </label>
                          <label className="d-flex align-items-center">
                            <input 
                              type="radio" 
                              name="fineType" 
                              value="Fixed"
                              checked={formData.fineType === 'Fixed'}
                              onChange={handleInputChange}
                              className="me-2"
                            />
                            Fixed
                          </label>
                        </div>
                      </div>
                      {formData.fineType === 'Percentage' && (
                        <div className="mb-3">
                          <label className="form-label">Percentage</label>
                          <div className="input-group">
                            <input 
                              type="number" 
                              className="form-control" 
                              name="percentage"
                              value={formData.percentage}
                              onChange={handleInputChange}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <span className="input-group-text">%</span>
                          </div>
                        </div>
                      )}
                      {formData.fineType === 'Fixed' && (
                        <div className="mb-3">
                          <label className="form-label">Fine Amount</label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input 
                              type="number" 
                              className="form-control" 
                              name="fineAmount"
                              value={formData.fineAmount}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      )}
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
                          name="status"
                          checked={formData.isActive}
                          onChange={handleToggle}
                        />
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
                      showEditModal ? 'Update' : 'Add Fees Master'
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
                <p>Are you sure you want to delete this fee master? This action cannot be undone.</p>
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

export default FeesMasterPage;
