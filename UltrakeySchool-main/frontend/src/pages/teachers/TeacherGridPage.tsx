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

const TeacherGridPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const schoolId = '507f1f77bcf86cd799439011'; // This should come from auth context

  useEffect(() => {
    fetchTeachers();
  }, [pagination.page, searchTerm]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/teachers', {
        params: {
          schoolId,
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined
        }
      });

      if (response.data.success) {
        setTeachers(response.data.data || []);
        // Backend returns pagination at root level
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
          <h3 className="page-title mb-1">Teachers</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Teachers Grid
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

      <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
        <h4 className="mb-3">Teachers Grid ({pagination.total})</h4>
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
            <Link to="/teachers" className="btn btn-icon btn-sm bg-light primary-hover me-1">
              <i className="ti ti-list-tree" />
            </Link>
            <button className="btn btn-icon btn-sm primary-hover active">
              <i className="ti ti-grid-dots" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {teachers.length === 0 && !loading && (
        <div className="card">
          <div className="card-body text-center py-5">
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
        </div>
      )}

      {/* Teachers Grid */}
      {teachers.length > 0 && (
        <>
          <div className="row">
            {teachers.map((teacher) => (
              <div className="col-xxl-3 col-xl-4 col-md-6 d-flex" key={teacher._id}>
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <Link to={`/teachers/${teacher._id}`} className="link-primary">
                      {teacher.employeeId || teacher._id.slice(-6)}
                    </Link>
                    <div className="d-flex align-items-center">
                      <span className={`badge ${getStatusBadge(teacher.status)} d-inline-flex align-items-center me-1`}>
                        <i className="ti ti-circle-filled fs-5 me-1" />
                        {teacher.status}
                      </span>
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
                              View Details
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
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="bg-light-300 rounded-2 p-3 mb-3">
                      <div className="d-flex align-items-center">
                        <Link to={`/teachers/${teacher._id}`} className="avatar avatar-lg flex-shrink-0">
                          <img 
                            src={teacher.photo || `https://ui-avatars.com/api/?name=${teacher.firstName}+${teacher.lastName}&background=random`} 
                            className="img-fluid rounded-circle" 
                            alt={`${teacher.firstName} ${teacher.lastName}`} 
                          />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="text-dark text-truncate mb-0">
                            <Link to={`/teachers/${teacher._id}`}>
                              {teacher.firstName} {teacher.lastName}
                            </Link>
                          </h6>
                          <p className="mb-0">{teacher.designation}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1">Email</p>
                      <p className="text-dark mb-2 text-truncate">{teacher.email}</p>
                      <p className="mb-1">Phone</p>
                      <p className="text-dark mb-2">{teacher.phone}</p>
                      <p className="mb-1">Department</p>
                      <p className="text-dark mb-0">{teacher.departmentId?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="card-footer d-flex align-items-center justify-content-between">
                    <div className="d-flex flex-wrap gap-1">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        teacher.subjects.slice(0, 2).map((subject) => (
                          <span key={subject._id} className="badge badge-soft-info">
                            {subject.name}
                          </span>
                        ))
                      ) : (
                        <span className="badge badge-soft-secondary">No subjects</span>
                      )}
                      {teacher.subjects && teacher.subjects.length > 2 && (
                        <span className="badge badge-soft-secondary">
                          +{teacher.subjects.length - 2}
                        </span>
                      )}
                    </div>
                    <Link to={`/teachers/${teacher._id}`} className="btn btn-light btn-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
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
        </>
      )}
    </>
  );
};

export default TeacherGridPage;
