import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Teacher {
  _id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  designation: string;
  subjects?: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  classes?: string[];
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TeacherListPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Get institutionId from localStorage user data
  const getInstitutionId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.institutionId || user.schoolId || user.school || user.schoolID;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return null;
  };

  const institutionId = getInstitutionId();

  useEffect(() => {
    if (institutionId) {
      fetchTeachers();
    }
  }, [pagination.page, searchTerm, institutionId]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/teachers', {
        params: {
          schoolId: institutionId,
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined
        }
      });

      if (response.data.success) {
        setTeachers(response.data.data || []);
        // Backend returns pagination at root level, not in meta
        const backendResponse = response.data as any;
        if (backendResponse.pagination) {
          setPagination({
            page: backendResponse.pagination.page,
            limit: backendResponse.pagination.limit,
            total: backendResponse.pagination.total,
            totalPages: backendResponse.pagination.pages
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch teachers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedTeachers(teachers.map(t => t._id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const toggleTeacherSelection = (id: string) => {
    if (selectedTeachers.includes(id)) {
      setSelectedTeachers(selectedTeachers.filter(teacherId => teacherId !== id));
    } else {
      setSelectedTeachers([...selectedTeachers, id]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-soft-success';
      case 'inactive':
        return 'badge-soft-danger';
      case 'on_leave':
        return 'badge-soft-warning';
      default:
        return 'badge-soft-secondary';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchTeachers();
  };

  // Loading state
  if (loading && teachers.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && teachers.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Teachers</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchTeachers}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Teacher List</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Teacher List
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchTeachers}
              title="Refresh"
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer" />
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2" />
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-2" />
                  Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-2" />
                  Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <Link to="/institution/teachers/add" className="btn btn-primary d-flex align-items-center">
              <i className="ti ti-square-rounded-plus me-2" />
              Add Teacher
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Teachers List ({pagination.total})</h4>
          <div className="d-flex align-items-center flex-wrap">
            <form onSubmit={handleSearch} className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-search" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
              <button className="btn btn-icon btn-sm primary-hover active me-1">
                <i className="ti ti-list-tree" />
              </button>
              <Link to="/teachers/grid" className="btn btn-icon btn-sm bg-light primary-hover">
                <i className="ti ti-grid-dots" />
              </Link>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {/* Empty State */}
          {teachers.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="ti ti-users-off fs-1 text-muted mb-3"></i>
              <h5 className="mb-2">No Teachers Found</h5>
              <p className="text-muted mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first teacher'}
              </p>
              {!searchTerm && (
                <Link to="/institution/teachers/add" className="btn btn-primary">
                  <i className="ti ti-plus me-2"></i>Add First Teacher
                </Link>
              )}
            </div>
          )}

          {/* Teachers Table */}
          {teachers.length > 0 && (
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Subjects</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Date of Join</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedTeachers.includes(teacher._id)}
                            onChange={() => toggleTeacherSelection(teacher._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <Link to={`/teachers/${teacher._id}`} className="link-primary">
                          {teacher.employeeId || teacher._id.slice(-6)}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-md me-2">
                            <img 
                              src={teacher.photo || `https://ui-avatars.com/api/?name=${teacher.firstName}+${teacher.lastName}&background=random`} 
                              className="img-fluid rounded-circle" 
                              alt={`${teacher.firstName} ${teacher.lastName}`} 
                            />
                          </span>
                          <div className="overflow-hidden">
                            <Link to={`/teachers/${teacher._id}`} className="text-dark mb-0 d-block">
                              {teacher.firstName} {teacher.lastName}
                            </Link>
                            <small className="text-muted">{teacher.designation}</small>
                          </div>
                        </div>
                      </td>
                      <td>{teacher.departmentId?.name || 'N/A'}</td>
                      <td>
                        {teacher.subjects && teacher.subjects.length > 0
                          ? teacher.subjects.slice(0, 2).map(s => s.name).join(', ')
                          : 'N/A'}
                        {teacher.subjects && teacher.subjects.length > 2 && (
                          <span className="text-muted"> +{teacher.subjects.length - 2}</span>
                        )}
                      </td>
                      <td>{teacher.email}</td>
                      <td>{teacher.phone}</td>
                      <td>{formatDate(teacher.joinDate)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(teacher.status)} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1" />
                          {teacher.status}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button 
                            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" 
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical fs-14" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <Link className="dropdown-item rounded-1" to={`/teachers/${teacher._id}`}>
                                <i className="ti ti-menu me-2" />
                                View Teacher
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item rounded-1" to={`/teachers/${teacher._id}/edit`}>
                                <i className="ti ti-edit-circle me-2" />
                                Edit
                              </Link>
                            </li>
                            <li>
                              <button className="dropdown-item rounded-1">
                                <i className="ti ti-lock me-2" />
                                Login Details
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
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3">
              <div className="text-muted">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <li key={index} className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setPagination({ ...pagination, page: index + 1 })}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherListPage;
