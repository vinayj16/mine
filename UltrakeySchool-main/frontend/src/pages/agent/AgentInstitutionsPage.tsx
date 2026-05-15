import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import institutionService, { type Institution } from '../../services/institutionService';
import { useAuth } from '../../store/authStore';

const AgentInstitutionsPage = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [globalCount, setGlobalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'suspended'>('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { user } = useAuth();
  const agentId = user?.id || localStorage.getItem('userId') || '';
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      
      const response = await institutionService.getAgentInstitutions(agentId || 'demo-agent');
      setInstitutions(response.institutions || []);
      setGlobalCount(response.globalCount || 0);
    } catch (error: any) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await institutionService.deleteAgentInstitution(id);
      toast.success('Institution deleted successfully');
      fetchInstitutions();
    } catch (error: any) {
      toast.error('Failed to delete institution');
    }
  };

  // Filter institutions
  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         institution.contact?.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         institution.contact?.address?.state?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || institution.status.toLowerCase() === statusFilter;
    const matchesType = typeFilter === 'all' || institution.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstitutions = filteredInstitutions.slice(startIndex, endIndex);

  const uniqueTypes = ['all', ...Array.from(new Set(institutions.map(inst => inst.type)))];

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'pending': return 'bg-warning';
      case 'suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotalRevenue = () => {
    return institutions.reduce((sum, inst) => {
      return sum + (inst.subscription?.monthlyCost || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">My Institutions</h4>
          <p className="text-muted mb-0">Manage institutions you have created</p>
        </div>
        <Link to="/agent/institutions/add" className="btn btn-primary">
          <i className="ti ti-plus me-2" />Add Institution
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">My Institutions</h5>
                  <h3 className="mb-0">{institutions.length}</h3>
                  <small className="text-white-50">Created by you</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-check fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-dark text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">System Total</h5>
                  <h3 className="mb-0">{globalCount}</h3>
                  <small className="text-white-50">All in database</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-database fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Active</h5>
                  <h3 className="mb-0">{institutions.filter(i => i.status.toLowerCase() === 'active').length}</h3>
                  <small className="text-white-50">Active institutions</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Total Revenue</h5>
                  <h3 className="mb-0">₹{calculateTotalRevenue().toLocaleString()}</h3>
                  <small className="text-white-50">Monthly revenue</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Type</label>
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">&nbsp;</label>
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
              >
                <i className="ti ti-refresh me-2" />Reset
              </button>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">&nbsp;</label>
              <button 
                className="btn btn-outline-primary w-100"
                onClick={fetchInstitutions}
              >
                <i className="ti ti-reload me-2" />Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="ti ti-building me-2" />My Institutions
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Institution Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Established</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInstitutions.map((institution) => (
                  <tr key={institution._id}>
                    <td className="fw-semibold">{institution.name}</td>
                    <td>{institution.type}</td>
                    <td>
                      {institution.contact?.address?.city || '-'}, {institution.contact?.address?.state || '-'}
                    </td>
                    <td>{formatDate(institution.createdAt)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(institution.status)} text-white`}>
                        {getStatusText(institution.status)}
                      </span>
                    </td>
                    <td>{institution.subscription?.planName || 'N/A'}</td>
                    <td>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                          type="button" 
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots-vertical" />
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <Link 
                              to={`/agent/institutions/${institution._id}`}
                              className="dropdown-item"
                            >
                              <i className="ti ti-eye me-2" />View Details
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to={`/agent/institutions/${institution._id}/edit`}
                              className="dropdown-item"
                            >
                              <i className="ti ti-edit me-2" />Edit
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button 
                              className="dropdown-item text-danger"
                              onClick={() => handleDelete(institution._id, institution.name)}
                            >
                              <i className="ti ti-trash me-2" />Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentInstitutions.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-building-off fs-48 text-muted mb-3 d-block" />
              <h5 className="text-muted">No institutions found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start adding institutions to see them here'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Link to="/agent/institutions/add" className="btn btn-primary mt-2">
                  <i className="ti ti-plus me-2" />Add Your First Institution
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInstitutions.length)} of {filteredInstitutions.length} institutions
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentInstitutionsPage;
