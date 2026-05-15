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
  classId?: {
    _id: string;
    name: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  status: string;
}

const StudentPromotionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Promotion form states
  const [currentSession, setCurrentSession] = useState('2024-2025');
  const [targetSession, setTargetSession] = useState('2025-2026');
  const [currentClass, setCurrentClass] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [targetSection, setTargetSection] = useState('');

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudents = async () => {
    if (!currentClass) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: any = { 
        schoolId,
        classId: currentClass,
        status: 'active'
      };
      
      if (currentSection) {
        params.section = currentSection;
      }

      const response = await apiClient.get('/students', { params });

      if (response.data.success) {
        const studentsData = response.data.data;
        // Ensure it's an array
        setStudents(Array.isArray(studentsData) ? studentsData : []);
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
  }, [currentClass, currentSection]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(new Set(students.map(s => s._id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handlePromoteStudents = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student to promote');
      return;
    }

    if (!targetClass || !targetSection) {
      toast.error('Please select target class and section');
      return;
    }

    try {
      setPromoting(true);

      const response = await apiClient.post('/students/promote', {
        studentIds: Array.from(selectedStudents),
        currentClassId: currentClass,
        currentSectionId: currentSection,
        targetClassId: targetClass,
        targetSectionId: targetSection,
        targetSession,
        schoolId
      });

      if (response.data.success) {
        toast.success(`Successfully promoted ${selectedStudents.size} student(s)`);
        setSelectedStudents(new Set());
        fetchStudents();
      }
    } catch (err: any) {
      console.error('Error promoting students:', err);
      toast.error(err.response?.data?.message || 'Failed to promote students');
    } finally {
      setPromoting(false);
    }
  };

  const handleReset = () => {
    setCurrentClass('');
    setCurrentSection('');
    setTargetClass('');
    setTargetSection('');
    setSelectedStudents(new Set());
    setStudents([]);
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Promotion</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Students</li>
              <li className="breadcrumb-item active" aria-current="page">
                Student Promotion
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchStudents}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1">
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
                  <i className="ti ti-file-type-pdf me-1" />
                  Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1" />
                  Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="alert alert-outline-primary bg-primary-transparent p-2 d-flex align-items-center flex-wrap row-gap-2 mb-4">
        <i className="ti ti-info-circle me-1" />
        <strong className="me-1">Note:</strong>
        Promoting students from the present class to the next class will create an enrollment record for the next session.
      </div>

      {/* Promotion Form */}
      <div className="card mb-4">
        <div className="card-header border-0 pb-0">
          <div className="bg-light-gray p-3 rounded">
            <h4>Promotion</h4>
            <p>Select current and destination classes for promotion</p>
          </div>
        </div>
        <div className="card-body">
          <div className="d-md-flex align-items-center justify-content-between">
            {/* Current Session */}
            <div className="card flex-fill w-100 border-0">
              <div className="card-body pb-1">
                <div className="mb-3">
                  <label className="form-label">
                    Current Session <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={currentSession}
                    onChange={(e) => setCurrentSession(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label mb-2">
                    Promotion from Class <span className="text-danger">*</span>
                  </label>
                  <div className="d-block d-md-flex">
                    <div className="mb-3 flex-fill me-md-3 me-0">
                      <label className="form-label">Class</label>
                      <select 
                        className="form-select"
                        value={currentClass}
                        onChange={(e) => setCurrentClass(e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="class-1">I</option>
                        <option value="class-2">II</option>
                        <option value="class-3">III</option>
                        <option value="class-4">IV</option>
                        <option value="class-5">V</option>
                      </select>
                    </div>
                    <div className="mb-3 flex-fill">
                      <label className="form-label">Section</label>
                      <select 
                        className="form-select"
                        value={currentSection}
                        onChange={(e) => setCurrentSection(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <span className="badge bg-primary badge-xl text-white d-flex align-items-center justify-content-center mx-md-4 mx-auto my-4 my-md-0">
              <i className="ti ti-arrows-exchange fs-16" />
            </span>

            {/* Target Session */}
            <div className="card flex-fill w-100 border-0">
              <div className="card-body pb-1">
                <div className="mb-3">
                  <label className="form-label">
                    Promote to Session <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={targetSession}
                    onChange={(e) => setTargetSession(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label mb-2">
                    Promote to Class <span className="text-danger">*</span>
                  </label>
                  <div className="d-block d-md-flex">
                    <div className="mb-3 flex-fill me-md-3 me-0">
                      <label className="form-label">Class</label>
                      <select 
                        className="form-select"
                        value={targetClass}
                        onChange={(e) => setTargetClass(e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="class-2">II</option>
                        <option value="class-3">III</option>
                        <option value="class-4">IV</option>
                        <option value="class-5">V</option>
                        <option value="class-6">VI</option>
                      </select>
                    </div>
                    <div className="mb-3 flex-fill">
                      <label className="form-label">Section</label>
                      <select 
                        className="form-select"
                        value={targetSection}
                        onChange={(e) => setTargetSection(e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button 
              type="button" 
              className="btn btn-light me-3"
              onClick={handleReset}
            >
              Reset Promotion
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handlePromoteStudents}
              disabled={promoting || selectedStudents.size === 0}
            >
              {promoting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Promoting...
                </>
              ) : (
                <>Promote {selectedStudents.size > 0 ? `${selectedStudents.size} Student(s)` : 'Students'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Students List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                value={`Academic Year: ${currentSession}`} 
                readOnly 
              />
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
          ) : !currentClass ? (
            <div className="text-center py-5">
              <i className="ti ti-school fs-1 text-muted mb-3"></i>
              <h4 className="mb-3">Select a class to view students</h4>
              <p className="text-muted">Please select a current class from the promotion form above.</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-users-off fs-1 text-muted mb-3"></i>
              <h4 className="mb-3">No students found</h4>
              <p className="text-muted">No active students found in the selected class.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          checked={selectedStudents.size === students.length && students.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Admission No</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const fullName = `${student.firstName} ${student.lastName}`;
                    const classLabel = student.classId?.name || 'N/A';
                    const section = student.sectionId?.name || 'N/A';
                    const statusBadge = student.status === 'active' ? 'badge-soft-success' : 'badge-soft-warning';

                    return (
                      <tr key={student._id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input 
                              className="form-check-input" 
                              type="checkbox"
                              checked={selectedStudents.has(student._id)}
                              onChange={() => handleSelectStudent(student._id)}
                            />
                          </div>
                        </td>
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
                        <td>
                          <span className={`badge ${statusBadge}`}>
                            {capitalize(student.status)}
                          </span>
                        </td>
                        <td>
                          <Link 
                            to={`/students/details/${student._id}`}
                            className="btn btn-outline-light bg-white btn-icon btn-sm me-2"
                          >
                            <i className="ti ti-eye" />
                          </Link>
                          <button 
                            className="btn btn-outline-light bg-white btn-icon btn-sm"
                            onClick={() => handleSelectStudent(student._id)}
                            title="Toggle selection for promotion"
                          >
                            <i className="ti ti-arrow-ramp-right-2" />
                          </button>
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

export default StudentPromotionPage;
