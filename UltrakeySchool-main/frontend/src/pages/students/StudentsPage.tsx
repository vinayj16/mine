import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  classId?: {
    _id: string;
    name: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  admissionDate: string;
  status: string;
  email?: string;
  phone?: string;
}

const StudentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [deleting, setDeleting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { schoolId };
      
      if (searchTerm) params.search = searchTerm;
      if (classFilter) params.classId = classFilter;
      if (sectionFilter) params.section = sectionFilter;
      if (genderFilter) params.gender = genderFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.get('/students', { params });

      if (response.data.success) {
        setStudents(response.data.data || []);
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
  }, [searchTerm, classFilter, sectionFilter, genderFilter, statusFilter]);

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await apiClient.delete(`/students/${studentId}`);

      if (response.data.success) {
        toast.success('Student deleted successfully');
        fetchStudents(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Error deleting student:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete student';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setClassFilter('');
    setSectionFilter('');
    setGenderFilter('');
    setStatusFilter('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
            <Link to="/students/add" className="btn btn-primary d-flex align-items-center">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                          value={genderFilter}
                          onChange={(e) => setGenderFilter(e.target.value)}
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
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
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
              <Link to="/students/grid" className="btn btn-icon btn-sm bg-light primary-hover">
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
              <Link to="/students/add" className="btn btn-primary">
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
    </>
  );
};

export default StudentsPage;
