import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface LibraryMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  studentId?: string;
  employeeId?: string;
}

const LibraryMembersPage: React.FC = () => {
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/users', {
        params: {
          role: 'student,teacher,staff' // Filter for library-eligible users
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        // Ensure data is always an array
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error('Error fetching members:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch library members';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMemberCardNo = (member: LibraryMember): string => {
    return member.studentId || member.employeeId || member._id.slice(-6);
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return 'bg-primary';
      case 'teacher':
        return 'bg-success';
      case 'staff':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const response = await apiClient.delete(`/users/${selectedMember._id}`);
      
      if (response.data.success) {
        toast.success('Member removed successfully');
        setShowDeleteModal(false);
        setSelectedMember(null);
        fetchMembers();
      }
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
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

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Members</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchMembers}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Library Members</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <a href="#!">Management</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Library Members</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1" 
                title="Refresh"
                onClick={fetchMembers}
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1" 
                title="Print"
                onClick={() => window.print()}
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
          </div>
        </div>
        {/* /Page Header */}

        {/* Library Members List */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Library Members List</h4>
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
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Date of Join</th>
                    <th>Mobile</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <p className="text-muted mb-0">No library members found</p>
                      </td>
                    </tr>
                  ) : (
                    members.map(member => (
                      <tr key={member._id}>
                        <td>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td><Link to="#" className="link-primary">{getMemberCardNo(member)}</Link></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-md me-2">
                              {member.avatar ? (
                                <img 
                                  src={member.avatar} 
                                  className="img-fluid rounded-circle" 
                                  alt={member.name} 
                                />
                              ) : (
                                <div className="avatar-title bg-primary rounded-circle">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-dark mb-0">{member.name}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadge(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td>{member.email}</td>
                        <td>{formatDate(member.createdAt)}</td>
                        <td>{member.phone || 'N/A'}</td>
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
                                  <Link 
                                    to={`/users/${member._id}`}
                                    className="dropdown-item rounded-1"
                                  >
                                    <i className="ti ti-eye me-2"></i>View Details
                                  </Link>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1 text-danger"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowDeleteModal(true);
                                    }}
                                  >
                                    <i className="ti ti-trash-x me-2"></i>Remove
                                  </button>
                                </li>
                              </ul>
                            </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Removal</h4>
                <p className="mb-4">
                  Are you sure you want to remove "{selectedMember.name}" from library members? 
                  This action cannot be undone.
                </p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedMember(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteMember}
                  >
                    Yes, Remove
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

export default LibraryMembersPage;
