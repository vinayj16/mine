import { useState, useEffect } from 'react';
import institutionSetupService from '../../services/institutionSetupService';
import apiService from '../../services/api';

interface InstitutionWithUsers {
  _id: string;
  name: string;
  type: string;
  instituteCode: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  principalId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  users: any[];
  stats: {
    totalUsers: number;
    teachers: number;
    students: number;
    parents: number;
    admins: number;
    staff: number;
  };
}

export default function InstitutionManagementPage() {
  const [institutions, setInstitutions] = useState<InstitutionWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionWithUsers | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await institutionSetupService.getInstitutionUsers('all');
      setInstitutions((response as any).data?.institutions);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredentials = async (institutionId: string, resetAll: boolean = false) => {
    try {
      const response = await apiService.post(`/institution-management/${institutionId}/create-credentials`, { resetAll });
      setCredentials((response as any).data?.credentials);
      setShowCredentialsModal(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create credentials');
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = !searchTerm || 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.instituteCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || inst.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const exportCredentials = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Institution Code', 'Temporary Password'],
      ...credentials.map(cred => [
        cred.name,
        cred.email,
        cred.role,
        cred.institutionCode,
        cred.temporaryPassword
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'institution-credentials.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchInstitutions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>Institution Management</h4>
          <p className="text-muted mb-0">Manage institutions and their users</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={fetchInstitutions}>
            <i className="ti ti-refresh me-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search institutions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="School">School</option>
                <option value="College">College</option>
                <option value="University">University</option>
              </select>
            </div>
            <div className="col-md-2">
              <div className="text-muted small">
                {filteredInstitutions.length} institutions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutions Grid */}
      <div className="row">
        {filteredInstitutions.map((institution) => (
          <div key={institution._id} className="col-lg-6 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1">{institution.name}</h6>
                  <div className="d-flex gap-2">
                    <span className="badge bg-primary">{institution.type}</span>
                    <span className={`badge ${institution.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                      {institution.status}
                    </span>
                    <span className="badge bg-info">{institution.instituteCode}</span>
                  </div>
                </div>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="ti ti-dots"></i>
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => setSelectedInstitution(institution)}
                      >
                        <i className="ti ti-eye me-2"></i>View Details
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleCreateCredentials(institution._id, true)}
                      >
                        <i className="ti ti-key me-2"></i>Create Credentials
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="card-body">
                {/* Institution Info */}
                <div className="row mb-3">
                  <div className="col-6">
                    <small className="text-muted">Email</small>
                    <div>{institution.email}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Phone</small>
                    <div>{institution.phone || 'N/A'}</div>
                  </div>
                </div>

                {/* Admin Info */}
                <div className="row mb-3">
                  <div className="col-6">
                    <small className="text-muted">Institution Admin</small>
                    <div>
                      {institution.adminId ? (
                        <>
                          <div>{institution.adminId.name}</div>
                          <small className="text-muted">{institution.adminId.email}</small>
                        </>
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Principal</small>
                    <div>
                      {institution.principalId ? (
                        <>
                          <div>{institution.principalId.name}</div>
                          <small className="text-muted">{institution.principalId.email}</small>
                        </>
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Statistics */}
                <div className="border-top pt-3">
                  <h6 className="mb-3">User Statistics</h6>
                  <div className="row text-center">
                    <div className="col-3">
                      <div className="h5 mb-0 text-primary">{institution.stats.totalUsers}</div>
                      <small className="text-muted">Total</small>
                    </div>
                    <div className="col-3">
                      <div className="h5 mb-0 text-success">{institution.stats.teachers}</div>
                      <small className="text-muted">Teachers</small>
                    </div>
                    <div className="col-3">
                      <div className="h5 mb-0 text-info">{institution.stats.students}</div>
                      <small className="text-muted">Students</small>
                    </div>
                    <div className="col-3">
                      <div className="h5 mb-0 text-warning">{institution.stats.admins}</div>
                      <small className="text-muted">Admins</small>
                    </div>
                  </div>
                  {institution.stats.parents > 0 && (
                    <div className="row text-center mt-2">
                      <div className="col-4">
                        <div className="h5 mb-0 text-secondary">{institution.stats.parents}</div>
                        <small className="text-muted">Parents</small>
                      </div>
                      <div className="col-4">
                        <div className="h5 mb-0 text-dark">{institution.stats.staff}</div>
                        <small className="text-muted">Staff</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Institution Details Modal */}
      {selectedInstitution && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedInstitution.name} - User Management</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedInstitution(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>Institution Code: <span className="badge bg-info">{selectedInstitution.instituteCode}</span></h6>
                </div>
                
                {/* Users by Role */}
                <div className="row">
                  {Object.entries(
                    (selectedInstitution.users as any[]).reduce((acc: any, user: any) => {
                      if (!acc[user.role]) acc[user.role] = [];
                      acc[user.role].push(user);
                      return acc;
                    }, {})
                  ).map(([role, users]: [string, any]) => (
                    <div key={role} className="col-md-6 mb-4">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">{role.replace('_', ' ').toUpperCase()} ({users.length})</h6>
                        </div>
                        <div className="card-body p-2">
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(users as any[]).slice(0, 5).map((user: any) => (
                                  <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                      <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                                        {user.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {(users as any[]).length > 5 && (
                                  <tr>
                                    <td colSpan={3} className="text-center text-muted">
                                      ... and {(users as any[]).length - 5} more
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleCreateCredentials(selectedInstitution._id, true)}
                >
                  <i className="ti ti-key me-2"></i>Create All Credentials
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedInstitution(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Credentials Generated</h5>
                <button type="button" className="btn-close" onClick={() => setShowCredentialsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="ti ti-info-circle me-2"></i>
                  These are temporary passwords. Users should change them after first login.
                </div>
                
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Institution Code</th>
                        <th>Temporary Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credentials.map((cred, index) => (
                        <tr key={index}>
                          <td>{cred.name}</td>
                          <td>{cred.email}</td>
                          <td>
                            <span className="badge bg-secondary">{cred.role}</span>
                          </td>
                          <td>
                            <code>{cred.institutionCode}</code>
                          </td>
                          <td>
                            <code className="text-primary">{cred.temporaryPassword}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-success" onClick={exportCredentials}>
                  <i className="ti ti-download me-2"></i>Export CSV
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCredentialsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
