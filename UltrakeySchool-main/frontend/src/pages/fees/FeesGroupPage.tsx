import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface FeesGroup {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const FeesGroupPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<FeesGroup | null>(null);
  
  const [newGroup, setNewGroup] = useState<{ name: string; description: string; isActive: boolean }>({ 
    name: '', 
    description: '',
    isActive: true
  });

  const exportToCSV = () => {
    if (!feesGroups.length) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Name', 'Description', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...feesGroups.map(g => [g.name, g.description, g.isActive ? 'Active' : 'Inactive', new Date(g.createdAt).toLocaleDateString()].map(v => `"${v}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fees_groups_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exported successfully');
  };

  const exportToPDF = () => {
    if (!feesGroups.length) {
      toast.error('No data to export');
      return;
    }
    const content = `
      <html><head><style>
        body { font-family: Arial; padding: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #4CAF50; color: white; }
      </style></head>
      <body>
        <h1>Fees Groups Report</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <tr><th>Name</th><th>Description</th><th>Status</th><th>Created</th></tr>
          ${feesGroups.map(g => `<tr><td>${g.name}</td><td>${g.description}</td><td>${g.isActive ? 'Active' : 'Inactive'}</td><td>${new Date(g.createdAt).toLocaleDateString()}</td></tr>`).join('')}
        </table>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(content); win.document.close(); win.print(); }
    toast.success('PDF generated');
  };

  useEffect(() => {
    fetchFeesGroups();
  }, []);

  const fetchFeesGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/finance/fees');
      
      if (response.data.success && response.data.data) {
        const data = response.data.data.feeStructures || response.data.data;
        // Ensure data is always an array
        setFeesGroups(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Error fetching fee groups:', err);
      setError(err.message || 'Failed to load fee groups');
      toast.error('Failed to load fee groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.post('/finance/fees', newGroup);
      
      if (response.data.success) {
        toast.success('Fee group created successfully');
        setShowAddModal(false);
        setNewGroup({ name: '', description: '', isActive: true });
        fetchFeesGroups();
      }
    } catch (err: any) {
      console.error('Error creating fee group:', err);
      toast.error(err.response?.data?.message || 'Failed to create fee group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.put(`/finance/fees/${selectedGroup._id}`, newGroup);
      
      if (response.data.success) {
        toast.success('Fee group updated successfully');
        setShowEditModal(false);
        fetchFeesGroups();
      }
    } catch (err: any) {
      console.error('Error updating fee group:', err);
      toast.error(err.response?.data?.message || 'Failed to update fee group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.delete(`/finance/fees/${selectedGroup._id}`);
      
      if (response.data.success) {
        toast.success('Fee group deleted successfully');
        setShowDeleteModal(false);
        setSelectedGroup(null);
        fetchFeesGroups();
      }
    } catch (err: any) {
      console.error('Error deleting fee group:', err);
      toast.error(err.response?.data?.message || 'Failed to delete fee group');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (group: FeesGroup) => {
    setSelectedGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description,
      isActive: group.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (group: FeesGroup) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchFeesGroups}>
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
                <Link to="#">Fees Collection</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Fees Group</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchFeesGroups}
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
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
                <button className="dropdown-item rounded-1" onClick={exportToPDF}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToCSV}>
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>                  
          <div className="mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Fees Group
            </button>
          </div>
        </div>
      </div>

      {/* Fees Group List */}
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
                <form onSubmit={(e) => e.preventDefault()}>
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
                            {Array.isArray(feesGroups) && feesGroups.length > 0 ? (
                              Array.from(new Set(feesGroups.map(group => group.name))).map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))
                            ) : (
                              <option value="">No groups available</option>
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
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Viewed
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Added
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
                  <th>Fees Group</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(feesGroups) && feesGroups.length > 0 ? (
                  feesGroups.map((group: any) => (
                    <tr key={group._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to="#" className="link-primary">{group._id?.slice(-6) || 'N/A'}</Link>
                      </td>
                      <td>{group.name || 'N/A'}</td>
                      <td>{group.description || 'No description'}</td>
                      <td>
                        <span className={`badge badge-soft-${group.isActive ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className={`ti ti-circle-filled fs-5 me-1`}></i>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
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
                                  onClick={() => openEditModal(group)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => openDeleteModal(group)}
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
                    <td colSpan={6} className="text-center py-4">
                      <p className="text-muted mb-0">No fee groups found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Fees Group Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Fees Group</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddGroup}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Fees Group</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newGroup.name}
                          onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={newGroup.description}
                          onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
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
                            checked={newGroup.isActive}
                            onChange={(e) => setNewGroup({...newGroup, isActive: e.target.checked})}
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
                        Adding...
                      </>
                    ) : (
                      'Add Fees Group'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fees Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Fees Group</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditGroup}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Fees Group</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newGroup.name}
                          onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={newGroup.description}
                          onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
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
                            checked={newGroup.isActive}
                            onChange={(e) => setNewGroup({...newGroup, isActive: e.target.checked})}
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
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
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
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this fees group? This action cannot be undone.</p>
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
                    onClick={handleDeleteGroup}
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

export default FeesGroupPage;
