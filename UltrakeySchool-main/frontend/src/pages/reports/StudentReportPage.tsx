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
  avatar?: string;
  classId?: {
    _id: string;
    name: string;
    grade?: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  gender: string;
  guardianId?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  dateOfJoining?: string;
  dateOfBirth: string;
  isActive: boolean;
  status?: string;
}

const StudentReportPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState({
    classId: '',
    section: '',
    search: '',
    gender: '',
    status: '',
    academicYear: '2024-2025'
  });
  const [sortBy, setSortBy] = useState('ascending');

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        schoolId,
        limit: 100
      };

      if (filters.classId) params.classId = filters.classId;
      if (filters.section) params.section = filters.section;
      if (filters.search) params.search = filters.search;
      if (filters.gender) params.gender = filters.gender;
      if (filters.status) params.status = filters.status;

      const response = await apiClient.get('/students', { params });

      if (response.data.success) {
        const studentData = response.data.data || [];
        setStudents(studentData);

        if (studentData.length === 0) {
          toast.info('No students found for the selected filters');
        }
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
  }, []);

  const handleRefresh = () => {
    fetchStudents();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setShowFilter(false);
    fetchStudents();
  };

  const resetFilters = () => {
    setFilters({
      classId: '',
      section: '',
      search: '',
      gender: '',
      status: '',
      academicYear: '2024-2025'
    });
    fetchStudents();
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    const sorted = [...students].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      
      if (sortType === 'ascending') {
        return nameA.localeCompare(nameB);
      } else if (sortType === 'descending') {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });
    setStudents(sorted);
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export to ${type} feature coming soon`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
   
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Student Report</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Report</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Student Report</li>
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

        {/* Student List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Student Report List</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control date-range bookingrange" 
                  placeholder="Select"
                  value="Academic Year : 2024 / 2025" 
                  readOnly
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
                      className={`dropdown-item rounded-1 ${sortBy === 'recently-viewed' ? 'active' : ''}`}
                      onClick={() => handleSort('recently-viewed')}
                    >
                      Recently Viewed
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item rounded-1 ${sortBy === 'recently-added' ? 'active' : ''}`}
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
                        name="classId"
                        value={filters.classId}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Classes</option>
                        <option>I</option>
                        <option>II</option>
                        <option>III</option>
                        <option>IV</option>
                        <option>V</option>
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
                        <option value="">All Sections</option>
                        <option>A</option>
                        <option>B</option>
                        <option>C</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Search</label>
                      <input
                        type="text"
                        className="form-control"
                        name="search"
                        placeholder="Search by name, admission no, roll no..."
                        value={filters.search}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <select 
                        className="form-select"
                        name="gender"
                        value={filters.gender}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <select 
                        className="form-select"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
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

          <div className="card-body p-0 py-3">
            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading student reports...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-3">
                <div className="alert alert-danger" role="alert">
                  <i className="ti ti-alert-circle me-2"></i>
                  {error}
                  <button
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={fetchStudents}
                  >
                    <i className="ti ti-refresh me-1"></i>Retry
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && students.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-users-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No students found</p>
                <p className="text-muted small">Student reports will appear here once students are enrolled</p>
              </div>
            )}

            {/* Student Table */}
            {!loading && !error && students.length > 0 && (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Admission No</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Gender</th>
                    <th>Parent</th>
                    <th>Date of Join</th>
                    <th>DOB</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <Link to="#" className="link-primary">{student.admissionNumber}</Link>
                      </td>
                      <td>{student.rollNumber || 'N/A'}</td>
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
                      <td>{student.classId?.name || 'N/A'}</td>
                      <td>{student.sectionId?.name || 'N/A'}</td>
                      <td>{student.gender}</td>
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
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>{formatDate(student.dateOfJoining)}</td>
                      <td>{formatDate(student.dateOfBirth)}</td>
                      <td>
                        <span
                          className={`badge ${
                            student.isActive
                              ? 'badge-soft-success'
                              : 'badge-soft-danger'
                          } d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      
    </>
  );
};

export default StudentReportPage;