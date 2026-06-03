import React, { useState, useEffect } from 'react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getInstitutionId } from '../../utils/auth';
import apiClient from '../../api/client';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const StudentsPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{studentId: string; studentName: string} | null>(null);
  const [filters, setFilters] = useState({
    classId: '',
    sectionId: '',
    search: '',
    status: '',
    gender: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  const institutionId = getInstitutionId();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { institutionId };
      
      if (filters.search) params.search = filters.search;
      if (filters.classId) params.classId = filters.classId;
      if (filters.sectionId) params.section = filters.sectionId;
      if (filters.gender) params.gender = filters.gender;
      if (filters.status) params.status = filters.status;

      const response = await apiClient.get('/students', { params });

      if (response.data.success) {
        setStudents(response.data.data || []);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load students');
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load students';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters.search, filters.classId, filters.sectionId, filters.gender, filters.status]);

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    setShowDeleteModal(true);
    setDeleteTarget({ studentId, studentName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await apiClient.delete(`/students/${deleteTarget.studentId}`);

      if (response.data.success) {
        toast.success('Student deleted successfully');
        fetchStudents();
      }
    } catch (err: any) {
      console.error('Error deleting student:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete student';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setFilters({ classId: '', sectionId: '', search: '', status: '', gender: '' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    const exportData = students.map(student => ({
      'Admission No': student.admissionNumber,
      'Roll No': student.rollNumber || 'N/A',
      Name: `${student.firstName} ${student.lastName}`,
      Class: student.classId?.name || 'N/A',
      Section: student.sectionId?.name || 'N/A',
      Gender: capitalize(student.gender),
      Status: capitalize(student.status),
      'Date of Join': formatDate(student.admissionDate),
      DOB: formatDate(student.dateOfBirth)
    }));
    if (type === 'pdf') {
      exportToPDF(exportData, 'students', [
        { key: 'Admission No', label: 'Admission No' },
        { key: 'Roll No', label: 'Roll No' },
        { key: 'Name', label: 'Name' },
        { key: 'Class', label: 'Class' },
        { key: 'Section', label: 'Section' },
        { key: 'Gender', label: 'Gender' },
        { key: 'Status', label: 'Status' },
        { key: 'Date of Join', label: 'Date of Join' },
        { key: 'DOB', label: 'DOB' }
      ], 'Students List');
    } else {
      exportToExcel(exportData, 'students');
    }
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Students</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Students</li>
              <li className="breadcrumb-item active" aria-current="page">
                All Students
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchStudents}
              disabled={loading}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button type="button" className="btn btn-outline-light bg-white btn-icon me-1">
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
            <Link to="/dashboard/student/add" className="btn btn-primary d-flex align-items-center">
              <i className="ti ti-square-rounded-plus me-2" />
              Add Student
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Students List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-search" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name or admission no"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i className="ti ti-filter me-2" />
                Filter
              </button>
              <div className="dropdown-menu drop-width p-0">
                <div className="d-flex align-items-center border-bottom p-3">
                  <h4 className="mb-0">Filter</h4>
                </div>
                <div className="p-3 pb-0 border-bottom">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Gender</label>
                        <select 
                          className="form-select"
                          value={filters.gender}
                          onChange={(e) => setFilters(prev => ({...prev, gender: e.target.value}))}
                        >
                          <option value="">All</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                        >
                          <option value="">All</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="graduated">Graduated</option>
                          <option value="transferred">Transferred</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 d-flex align-items-center justify-content-end">
                  <button className="btn btn-light me-3" onClick={handleResetFilters}>Reset</button>
                  <button className="btn btn-primary" data-bs-toggle="dropdown">Apply</button>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
              <button className="btn btn-icon btn-sm primary-hover active me-1">
                <i className="ti ti-list-tree" />
              </button>
              <Link to="/dashboard/student/grid" className="btn btn-icon btn-sm bg-light primary-hover">
                <i className="ti ti-grid-dots" />
              </Link>
            </div>
            <div className="dropdown mb-3">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2" />
                Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button className="dropdown-item rounded-1">Ascending</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Descending</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Recently Viewed</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Recently Added</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading students...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
              <h4 className="mb-3">{error}</h4>
              <button className="btn btn-primary" onClick={fetchStudents}>
                <i className="ti ti-refresh me-2"></i>
                Retry
              </button>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-users-off fs-1 text-muted mb-3"></i>
              <h4 className="mb-3">No students found</h4>
              <p className="text-muted mb-3">No students match your current filters.</p>
              <button className="btn btn-light me-2" onClick={handleResetFilters}>
                Reset Filters
              </button>
              <Link to="/dashboard/student/add" className="btn btn-primary">
                <i className="ti ti-plus me-2"></i>
                Add Student
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>Admission No</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Date of Join</th>
                    <th>DOB</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const fullName = `${student.firstName} ${student.lastName}`;
                    const classLabel = student.classId?.name || 'N/A';
                    const section = student.sectionId?.name || 'N/A';
                    const statusBadge = student.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger';

                    return (
                      <tr key={student._id}>
                        <td>{student.admissionNumber}</td>
                        <td>{student.rollNumber || 'N/A'}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-md flex-shrink-0 me-2">
                              <img 
                                src={`https://ui-avatars.com/api/?name=${fullName}&background=random`} 
                                className="rounded-circle" 
                                alt={fullName} 
                              />
                            </span>
                            <div className="overflow-hidden">
                              <h6 className="text-truncate mb-0">{fullName}</h6>
                              <small className="text-muted">{classLabel}</small>
                            </div>
                          </div>
                        </td>
                        <td>{classLabel}</td>
                        <td>{section}</td>
                        <td>{capitalize(student.gender)}</td>
                        <td>
                          <span className={`badge ${statusBadge}`}>
                            {capitalize(student.status)}
                          </span>
                        </td>
                        <td>{formatDate(student.admissionDate)}</td>
                        <td>{formatDate(student.dateOfBirth)}</td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                              <i className="ti ti-dots-vertical fs-14" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <Link className="dropdown-item rounded-1" to={`/students/details/${student._id}`}>
                                  <i className="ti ti-menu me-2" />
                                  View Student
                                </Link>
                              </li>
                              <li>
                                <Link className="dropdown-item rounded-1" to={`/students/edit/${student._id}`}>
                                  <i className="ti ti-edit-circle me-2" />
                                  Edit
                                </Link>
                              </li>
                              <li>
                                <Link className="dropdown-item rounded-1" to="/student-promotion">
                                  <i className="ti ti-arrow-ramp-right-2 me-2" />
                                  Promote Student
                                </Link>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => handleDeleteStudent(student._id, fullName)}
                                  disabled={deleting}
                                >
                                  <i className="ti ti-trash-x me-2" />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.studentName}? This action cannot be undone.` : ''} />
    </>
  );
};

export default StudentsPage;
