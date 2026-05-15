import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { superAdminService, type Institution } from '../../services/superAdminService';

declare global {
  interface Window {
    bootstrap: any;
  }
}

const InstitutionsDegreeCollegesPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  interface NewInstitution {
    name: string;
    type: string;
    plan: string;
    status: string;
    subscriptionExpiry: string;
    contactEmail: string;
    contactPhone: string;
    instituteCode: string;
    website: string;
  }

  const [newInstitution, setNewInstitution] = useState<NewInstitution>({
    name: '',
    type: 'degree_college',
    plan: 'basic',
    status: 'active',
    subscriptionExpiry: '',
    contactEmail: '',
    contactPhone: '',
    instituteCode: '',
    website: ''
  });

  useEffect(() => {
    fetchInstitutions();
    
    // Listen for storage events to refresh data when institutions are updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'institutions_cache') {
        console.log('Institutions cache updated, refreshing degree colleges list...');
        fetchInstitutions();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      // Use the type-specific API endpoint
      const response = await superAdminService.getInstitutionsByType('Degree College');
      setInstitutions(response || []);
    } catch (error) {
      console.error('Error fetching degree colleges:', error);
      toast.error('Failed to load degree colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!newInstitution.name.trim()) {
        toast.error('Institution name is required');
        return;
      }
      if (!newInstitution.instituteCode?.trim()) {
        toast.error('Institution code is required');
        return;
      }
      if (!newInstitution.contactEmail?.trim()) {
        toast.error('Contact email is required');
        return;
      }
      if (!newInstitution.contactPhone?.trim()) {
        toast.error('Contact phone is required');
        return;
      }

      // Check for duplicate institution code
      const existingInstitution = institutions.find(
        inst => inst.instituteCode?.toLowerCase() === newInstitution.instituteCode?.toLowerCase()
      );
      
      if (existingInstitution) {
        toast.error(`Institution with code "${newInstitution.instituteCode}" already exists`);
        return;
      }

      // Prepare data with correct type
      const institutionData = {
        ...newInstitution,
        type: 'Degree College',
        status: 'active'
      };

      await superAdminService.createInstitution(institutionData as any);
      toast.success('Degree College created successfully');
      setShowAddModal(false);
      resetForm();
      fetchInstitutions();
    } catch (error: any) {
      console.error('Error creating degree college:', error);
      
      // Handle different error types
      if (error.response?.data?.error?.details) {
        const errorDetails = error.response.data.error.details;
        if (Array.isArray(errorDetails)) {
          errorDetails.forEach((detail: string) => toast.error(detail));
        } else {
          toast.error(errorDetails);
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create degree college. Please try again.');
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    
    try {
      await superAdminService.updateInstitution(selectedInstitution._id, selectedInstitution as any);
      toast.success('Degree College updated successfully');
      setShowEditModal(false);
      setSelectedInstitution(null);
      fetchInstitutions();
    } catch (error) {
      console.error('Error updating degree college:', error);
      toast.error('Failed to update degree college');
    }
  };

  const handleDelete = async () => {
    if (!selectedInstitution) return;
    
    try {
      await superAdminService.deleteInstitution(selectedInstitution._id);
      toast.success('Degree College deleted successfully');
      setShowDeleteModal(false);
      setSelectedInstitution(null);
      fetchInstitutions();
    } catch (error) {
      console.error('Error deleting degree college:', error);
      toast.error('Failed to delete degree college');
    }
  };

  const resetForm = () => {
    setNewInstitution({
      name: '',
      type: 'degree_college',
      plan: 'basic',
      status: 'Active',
      subscriptionExpiry: '',
      contactEmail: '',
      contactPhone: '',
      instituteCode: '',
      website: ''
    });
  };

  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (institution.contactEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || institution.status === filterStatus;
    const matchesPlan = !filterPlan || institution.plan === filterPlan;
    return matchesSearch && matchesFilter && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'Active': 'bg-success',
      'Suspended': 'bg-danger',
      'Expired': 'bg-warning'
    };
    return statusMap[status] || 'bg-secondary';
  };

  const getPlanBadge = (plan: string) => {
    const planMap: Record<string, string> = {
      'basic': 'bg-info',
      'premium': 'bg-primary',
      'enterprise': 'bg-warning'
    };
    return planMap[plan] || 'bg-secondary';
  };

  const calculateStats = () => {
    const total = institutions.length;
    const active = institutions.filter(inst => inst.status === 'Active').length;
    const suspended = institutions.filter(inst => inst.status === 'Suspended').length;
    const expired = institutions.filter(inst => inst.status === 'Expired').length;
    const totalRevenue = institutions.reduce((sum, inst) => {
      const revenue = inst.plan === 'basic' ? 1000 : inst.plan === 'premium' ? 5000 : 10000;
      return sum + revenue;
    }, 0);

    return { total, active, suspended, expired, totalRevenue };
  };

  const stats = calculateStats();

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Degree Colleges Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/super-admin/institutions">Institutions</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Degree Colleges</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="input-group me-2 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search degree colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="dropdown me-2 mb-2">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div className="dropdown me-2 mb-2">
            <select
              className="form-select"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-plus me-2"></i>Add Degree College
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ti ti-school"></i>
                  </div>
                </div>
                <div>
                  <h5 className="card-title mb-1">Total Degree Colleges</h5>
                  <h3 className="text-primary mb-0">{stats.total}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ti ti-check"></i>
                  </div>
                </div>
                <div>
                  <h5 className="card-title mb-1">Active Degree Colleges</h5>
                  <h3 className="text-success mb-0">{stats.active}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="avatar bg-warning text-white rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ti ti-alert-triangle"></i>
                  </div>
                </div>
                <div>
                  <h5 className="card-title mb-1">Suspended Degree Colleges</h5>
                  <h3 className="text-warning mb-0">{stats.suspended}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="avatar bg-danger text-white rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ti ti-x"></i>
                  </div>
                </div>
                <div>
                  <h5 className="card-title mb-1">Expired Degree Colleges</h5>
                  <h3 className="text-danger mb-0">{stats.expired}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted">Filters:</span>
              <span className="badge bg-secondary ms-2">Search</span>
              <span className="badge bg-secondary ms-1">Status: {filterStatus || 'All'}</span>
              <span className="badge bg-secondary ms-1">Plan: {filterPlan || 'All'}</span>
            </div>
            <div>
              <span className="text-muted">Showing {filteredInstitutions.length} of {institutions.length} degree colleges</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <div className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Select all logic
                            }
                          }}
                        />
                        <span className="ms-2">Degree College Name</span>
                      </div>
                    </th>
                    <th>Admin</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Revenue</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.length > 0 ? (
                    filteredInstitutions.map((institution) => (
                      <tr key={institution._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                            />
                            <span>{institution.name}</span>
                          </div>
                        </td>
                        <td>{institution.contactEmail}</td>
                        <td>
                          <span className={`badge ${getPlanBadge(institution.plan || 'basic')} text-white`}>
                            {institution.plan || 'basic'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(institution.status)} text-white`}>
                            {institution.status}
                          </span>
                        </td>
                        <td>1,234</td>
                        <td>${institution.plan === 'basic' ? '1,000' : institution.plan === 'premium' ? '5,000' : '10,000'}</td>
                        <td>{institution.subscriptionExpiry}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <button 
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => {
                                setSelectedInstitution(institution);
                                setShowEditModal(true);
                              }}
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setSelectedInstitution(institution);
                                setShowDeleteModal(true);
                              }}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <div className="text-muted">
                          <p className="text-muted">No degree colleges found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Degree College</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">College Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={newInstitution.name}
                      onChange={(e) => setNewInstitution({...newInstitution, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email*</label>
                    <input
                      type="email"
                      className="form-control"
                      name="contactEmail"
                      value={newInstitution.contactEmail}
                      onChange={(e) => setNewInstitution({...newInstitution, contactEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone*</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="contactPhone"
                      value={newInstitution.contactPhone}
                      onChange={(e) => setNewInstitution({...newInstitution, contactPhone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subscription Plan*</label>
                    <select
                      className="form-select"
                      name="plan"
                      value={newInstitution.plan}
                      onChange={(e) => setNewInstitution({...newInstitution, plan: e.target.value})}
                      required
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Degree College</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedInstitution && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Degree College</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowEditModal(false); setSelectedInstitution(null); }}>
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">College Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={selectedInstitution.name}
                      onChange={(e) => setSelectedInstitution({...selectedInstitution, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email*</label>
                    <input
                      type="email"
                      className="form-control"
                      name="contactEmail"
                      value={selectedInstitution.contactEmail}
                      onChange={(e) => setSelectedInstitution({...selectedInstitution, contactEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone*</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="contactPhone"
                      value={selectedInstitution.contactPhone}
                      onChange={(e) => setSelectedInstitution({...selectedInstitution, contactPhone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subscription Plan*</label>
                    <select
                      className="form-select"
                      name="plan"
                      value={selectedInstitution.plan}
                      onChange={(e) => setSelectedInstitution({...selectedInstitution, plan: e.target.value})}
                      required
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => { setShowEditModal(false); setSelectedInstitution(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedInstitution && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="delete-icon"><i className="ti ti-trash-x"></i></div>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete {selectedInstitution.name}? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button className="btn btn-light me-3" onClick={() => { setShowDeleteModal(false); setSelectedInstitution(null); }}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsDegreeCollegesPage;
