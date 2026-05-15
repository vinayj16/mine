import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface ClassReport {
  _id: string;
  classId: string;
  name: string;
  grade?: string;
  section?: string;
  studentCount: number;
  capacity?: number;
}

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  classId: {
    _id: string;
    name: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  gender: string;
  dateOfBirth: string;
  guardianId?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  status: string;
}

const ClassReportPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassReport | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('ascending');
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    studentCount: ''
  });

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';

  const fetchClassReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/classes', {
        params: { schoolId, limit: 100 }
      });

      if (response.data.success) {
        const classes = response.data.data.classes || [];
        
        // Transform to class reports with student counts
        const reports: ClassReport[] = classes.map((cls: any) => ({
          _id: cls._id,
          classId: cls.classId,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          studentCount: cls.studentCount || 0,
          capacity: cls.capacity
        }));
        
        setClassReports(reports);
      }
    } catch (err: any) {
      console.error('Error fetching class reports:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load class reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (classId: string) => {
    try {
      setLoadingStudents(true);

      const response = await apiClient.get('/students', {
        params: { 
          schoolId,
          classId,
          limit: 100
        }
      });

      if (response.data.success) {
        setStudents(response.data.data.students || []);
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load students';
      toast.error(errorMessage);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchClassReports();
  }, []);

  const handleRefresh = () => {
    fetchClassReports();
  };

  const handleViewDetails = (classReport: ClassReport) => {
    setSelectedClass(classReport);
    setShowModal(true);
    fetchStudentsByClass(classReport._id);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    // Apply filters logic here
    fetchClassReports();
  };

  const resetFilters = () => {
    setFilters({
      class: '',
      section: '',
      studentCount: ''
    });
    fetchClassReports();
  };

  const handleSort = (type: string) => {
    setSortBy(type);
    // Implement sorting logic here
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export to ${type} feature coming soon`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active';
    return (
      <span
        className={`badge ${
          isActive ? 'badge-soft-success' : 'badge-soft-danger'
        } d-inline-flex align-items-center`}
      >
        <i className="ti ti-circle-filled fs-5 me-1"></i>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Class Report</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Report</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Class Report</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button
              className="btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('excel')}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Class Report List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Class Report List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="text" 
                className="form-control date-range bookingrange" 
                placeholder="Select"
                defaultValue="Academic Year : 2024 / 2025" 
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <button
                className="btn btn-outline-light bg-white dropdown-toggle"
                onClick={() => setShowFilter(!showFilter)}
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
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
                  <button 
                    className={`dropdown-item rounded-1 ${sortBy === 'ascending' ? 'active' : ''}`}
                    onClick={() => handleSort('ascending')}
                  >
                    Ascending
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 ${sortBy === 'descending' ? 'active' : ''}`}
                    onClick={() => handleSort('descending')}
                  >
                    Descending
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item rounded-1"
                    onClick={() => handleSort('recently-viewed')}
                  >
                    Recently Viewed
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item rounded-1"
                    onClick={() => handleSort('recently-added')}
                  >
                    Recently Added
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilter && (
          <div className="p-3 border-bottom">
            <form onSubmit={handleApplyFilters}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <select 
                      className="form-select"
                      name="class"
                      value={filters.class}
                      onChange={handleFilterChange}
                    >
                      <option value="">Select</option>
                      <option>I</option>
                      <option>II</option>
                      <option>III</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Section</label>
                    <select 
                      className="form-select"
                      name="section"
                      value={filters.section}
                      onChange={handleFilterChange}
                    >
                      <option value="">Select</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-0">
                    <label className="form-label">No Of Students</label>
                    <select 
                      className="form-select"
                      name="studentCount"
                      value={filters.studentCount}
                      onChange={handleFilterChange}
                    >
                      <option value="">Select</option>
                      <option>30</option>
                      <option>35</option>
                      <option>40</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button 
                  type="button" 
                  className="btn btn-light me-2"
                  onClick={resetFilters}
                >
                  Reset
                </button>
                <button type="submit" className="btn btn-primary">Apply</button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading class reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchClassReports}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && classReports.length === 0 && (
          <div className="card-body text-center py-5">
            <i className="ti ti-school" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No classes found</p>
          </div>
        )}

        {/* Class Reports Table */}
        {!loading && !error && classReports.length > 0 && (
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
                  <th>Class</th>
                  <th>Section</th>
                  <th>No of Students</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classReports.map((report) => (
                  <tr key={report._id}>
                    <td>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                        />
                      </div>
                    </td>
                    <td><Link to="#" className="link-primary">{report.classId}</Link></td>
                    <td>{report.name}</td>
                    <td>{report.section || '-'}</td>
                    <td>{report.studentCount}</td>
                    <td>
                      <button 
                        className="btn btn-light me-2"
                        onClick={() => handleViewDetails(report)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Student List - {selectedClass?.name} {selectedClass?.section && `(${selectedClass.section})`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {loadingStudents && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading students...</p>
                  </div>
                )}

                {!loadingStudents && students.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-users" style={{ fontSize: '48px', color: '#ccc' }}></i>
                    <p className="mt-2 text-muted">No students found in this class</p>
                  </div>
                )}

                {!loadingStudents && students.length > 0 && (
                  <div className="table-responsive">
                    <table className="table datatable">
                      <thead className="thead-light">
                        <tr>
                          <th className="no-sort">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="select-all2"
                              />
                            </div>
                          </th>
                          <th>Admission No</th>
                          <th>Roll No</th>
                          <th>Name</th>
                          <th>Class</th>
                          <th>Section</th>
                          <th>Gender</th>
                          <th>Parent Name</th>
                          <th>DOB</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student._id}>
                            <td>
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                />
                              </div>
                            </td>
                            <td>
                              <Link to="#" className="link-primary">
                                {student.admissionNumber}
                              </Link>
                            </td>
                            <td>{student.rollNumber || '-'}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    className="avatar avatar-md rounded-circle me-2"
                                    alt={`${student.firstName} ${student.lastName}`}
                                  />
                                ) : (
                                  <div className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center">
                                    <i className="ti ti-user fs-16 text-muted"></i>
                                  </div>
                                )}
                                <span>{student.firstName} {student.lastName}</span>
                              </div>
                            </td>
                            <td>{student.classId?.name || '-'}</td>
                            <td>{student.sectionId?.name || '-'}</td>
                            <td className="text-capitalize">{student.gender}</td>
                            <td>
                              {student.guardianId ? (
                                <div className="d-flex align-items-center">
                                  {student.guardianId.avatar ? (
                                    <img
                                      src={student.guardianId.avatar}
                                      className="avatar avatar-md rounded-circle me-2"
                                      alt={`${student.guardianId.firstName} ${student.guardianId.lastName}`}
                                    />
                                  ) : (
                                    <div className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center">
                                      <i className="ti ti-user fs-16 text-muted"></i>
                                    </div>
                                  )}
                                  <span>{student.guardianId.firstName} {student.guardianId.lastName}</span>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>{formatDate(student.dateOfBirth)}</td>
                            <td>{getStatusBadge(student.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClassReportPage;