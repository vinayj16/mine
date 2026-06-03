import { useState, useEffect } from 'react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { exportToPDF, exportToExcel, type ExportColumn } from '../../utils/exportUtils';
import apiClient from '../../api/client';

interface TeacherUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  joiningDate?: string;
  gender?: string;
  institutionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TeacherListPage = () => {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchTeachers();
  }, [pagination.page]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/users', {
        params: {
          role: 'teacher',
          search: searchTerm || undefined,
          page: pagination.page,
          limit: pagination.limit
        }
      });

      if (response.data.success) {
        setTeachers(response.data.data || []);
        const pag = response.data.pagination;
        if (pag) {
          setPagination(prev => ({
            ...prev,
            total: pag.total,
            totalPages: pag.pages || Math.ceil(pag.total / pag.limit)
          }));
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

  const handleDelete = async (id: string) => {
    setShowDeleteModal(true);
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget);
      await apiClient.delete(`/users/${deleteTarget}`);
      toast.success('Teacher deleted successfully');
      setTeachers(prev => prev.filter(t => t._id !== deleteTarget));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setDeleting(null);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
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
      default:
        return 'badge-soft-secondary';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTeachers();
  };

  const exportColumns: ExportColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'joiningDate', label: 'Date of Join', format: (v) => v ? formatDate(v) : 'N/A' },
    { key: 'status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!teachers.length) { toast.error('No data to export'); return; }
    if (type === 'pdf') {
      exportToPDF(teachers, 'teachers-list', exportColumns, 'Teachers List');
    } else {
      exportToExcel(teachers, 'teachers-list', exportColumns);
    }
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
                <button className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-file-type-pdf me-2" />
                  Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
                  <i className="ti ti-file-type-xls me-2" />
                  Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <Link to="/dashboard/admin/teachers/add" className="btn btn-primary d-flex align-items-center">
              <i className="ti ti-square-rounded-plus me-2" />
              Add Teacher
            </Link>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="alert alert-info d-flex align-items-center gap-2 mb-0 py-2">
            <i className="ti ti-info-circle"></i>
            <small>Showing teachers from your institution's user accounts. Total: <strong>{pagination.total}</strong></small>
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
                <Link to="/dashboard/admin/teachers/add" className="btn btn-primary">
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
                    <th>Designation</th>
                    <th>Department</th>
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
                        <span className="link-primary">
                          {teacher.employeeId || teacher._id.slice(-6)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-md me-2">
                            <img
                              src={teacher.avatar || `https://ui-avatars.com/api/?name=${teacher.name}&background=random`}
                              className="img-fluid rounded-circle"
                              alt={teacher.name}
                            />
                          </span>
                          <div className="overflow-hidden">
                            <span className="text-dark mb-0 d-block fw-medium">
                              {teacher.name}
                            </span>
                            <small className="text-muted">{teacher.employeeId || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{teacher.designation || 'N/A'}</td>
                      <td>{teacher.department || 'N/A'}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.phone || 'N/A'}</td>
                      <td>{formatDate(teacher.joiningDate!)}</td>
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
                              <Link className="dropdown-item rounded-1" to={`/dashboard/admin/teachers/${teacher._id}`}>
                                <i className="ti ti-eye me-2" />
                                View
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item rounded-1" to={`/dashboard/admin/teachers/edit/${teacher._id}`}>
                                <i className="ti ti-edit-circle me-2" />
                                Edit
                              </Link>
                            </li>
                            <li>
                              <button
                                className="dropdown-item rounded-1 text-danger"
                                onClick={() => handleDelete(teacher._id)}
                                disabled={deleting === teacher._id}
                              >
                                {deleting === teacher._id ? (
                                  <><span className="spinner-border spinner-border-sm me-2" /> Deleting...</>
                                ) : (
                                  <><i className="ti ti-trash me-2" /> Delete</>
                                )}
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
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(Math.max(pagination.totalPages, 1))].map((_, index) => (
                    <li key={index} className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPagination(prev => ({ ...prev, page: index + 1 }))}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Delete this teacher? This will permanently remove their account." />
    </>
  );
};

export default TeacherListPage;
