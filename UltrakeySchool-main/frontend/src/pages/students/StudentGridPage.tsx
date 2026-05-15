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

const StudentGridPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddFeesModal, setShowAddFeesModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
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

  const handleAddFees = (student: Student) => {
    setSelectedStudent(student);
    setShowAddFeesModal(true);
  };

  const handleCloseModal = () => {
    setShowAddFeesModal(false);
    setSelectedStudent(null);
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
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Students Grid
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
              aria-label="Refresh"
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button type="button" className="btn btn-outline-light bg-white btn-icon me-1" aria-label="Print">
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

      <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
        <h4 className="mb-3">Students Grid</h4>
        <div className="d-flex align-items-center flex-wrap">
          <div className="input-icon-start mb-3 me-2 position-relative">
            <span className="icon-addon">
              <i className="ti ti-calendar" />
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Select" 
              defaultValue="Academic Year : 2024 / 2025" 
              readOnly 
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
                      <label className="form-label">Search</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by name or admission no"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
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
            <Link to="/students" className="btn btn-icon btn-sm bg-light primary-hover me-1">
              <i className="ti ti-list-tree" />
            </Link>
            <button className="btn btn-icon btn-sm primary-hover active">
              <i className="ti ti-grid-dots" />
            </button>
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

      <div className="row">
        {loading ? (
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading students...</span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
                <h4 className="mb-3">{error}</h4>
                <button className="btn btn-primary" onClick={fetchStudents}>
                  <i className="ti ti-refresh me-2"></i>
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
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
            </div>
          </div>
        ) : (
          students.map((student) => {
            const fullName = `${student.firstName} ${student.lastName}`;
            const classLabel = student.classId?.name || 'N/A';
            const section = student.sectionId?.name || 'N/A';
            const statusBadge = student.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger';

            return (
              <div className="col-xxl-3 col-xl-4 col-md-6 d-flex" key={student._id}>
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <Link to={`/students/details/${student._id}`} className="link-primary">
                      {student.admissionNumber}
                    </Link>
                    <div className="d-flex align-items-center">
                      <span className={`badge d-inline-flex align-items-center me-1 ${statusBadge}`}>
                        <i className="ti ti-circle-filled fs-5 me-1" />
                        {capitalize(student.status)}
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
                            <button className="dropdown-item rounded-1 text-danger">
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
                        <Link to={`/students/details/${student._id}`} className="avatar avatar-lg flex-shrink-0">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${fullName}&background=random`} 
                            className="img-fluid rounded-circle" 
                            alt={fullName} 
                          />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="mb-0 text-truncate">
                            <Link to={`/students/details/${student._id}`}>{fullName}</Link>
                          </h6>
                          <p className="mb-0">
                            {classLabel}, {section}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between gx-2">
                      <div>
                        <p className="mb-0">Roll No</p>
                        <p className="text-dark">{student.rollNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="mb-0">Gender</p>
                        <p className="text-dark">{capitalize(student.gender)}</p>
                      </div>
                      <div>
                        <p className="mb-0">Joined On</p>
                        <p className="text-dark">{formatDate(student.admissionDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {student.email && (
                        <a 
                          href={`mailto:${student.email}`}
                          className="btn btn-outline-light bg-white btn-icon d-flex align-items-center justify-content-center rounded-circle p-0 me-2"
                          title="Email"
                        >
                          <i className="ti ti-mail" />
                        </a>
                      )}
                      {student.phone && (
                        <a 
                          href={`tel:${student.phone}`}
                          className="btn btn-outline-light bg-white btn-icon d-flex align-items-center justify-content-center rounded-circle p-0 me-2"
                          title="Phone"
                        >
                          <i className="ti ti-phone" />
                        </a>
                      )}
                      <Link
                        to={`/students/details/${student._id}`}
                        className="btn btn-outline-light bg-white btn-icon d-flex align-items-center justify-content-center rounded-circle p-0 me-2"
                        title="View Details"
                      >
                        <i className="ti ti-eye" />
                      </Link>
                    </div>
                    <button 
                      className="btn btn-light btn-sm fw-semibold" 
                      onClick={() => handleAddFees(student)}
                    >
                      Add Fees
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Fees Modal */}
      {showAddFeesModal && selectedStudent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Add Fees - {selectedStudent.firstName} {selectedStudent.lastName}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Student Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={`${selectedStudent.firstName} ${selectedStudent.lastName}`} 
                        readOnly 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Admission No</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={selectedStudent.admissionNumber} 
                        readOnly 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={`${selectedStudent.classId?.name || 'N/A'} - ${selectedStudent.sectionId?.name || 'N/A'}`} 
                        readOnly 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Fees Group *</label>
                      <select className="form-select">
                        <option value="">Select Fees Group</option>
                        <option value="admission">Admission Fees</option>
                        <option value="tuition">Tuition Fees</option>
                        <option value="transport">Transport Fees</option>
                        <option value="hostel">Hostel Fees</option>
                        <option value="library">Library Fees</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Amount *</label>
                      <input type="number" className="form-control" placeholder="Enter amount" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Due Date *</label>
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Payment Mode</label>
                      <select className="form-select">
                        <option value="">Select Mode</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea className="form-control" rows={3} placeholder="Enter any additional notes"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  <i className="ti ti-x me-2"></i>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="ti ti-check me-2"></i>
                  Add Fees
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentGridPage;
