import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import StudentSelector from '../../components/students/StudentSelector';

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  classId?: {
    name: string;
  };
  sectionId?: {
    name: string;
  };
  status: string;
  email?: string;
  phone?: string;
}

interface SubjectResult {
  subjectName: string;
  maxMarks: number;
  minMarks: number;
  marksObtained: number;
  status: 'pass' | 'fail';
}

interface ExamResult {
  _id: string;
  examName: string;
  examDate: string;
  subjects: SubjectResult[];
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  rank?: number;
  result: 'pass' | 'fail';
  academicYear: string;
}

const StudentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedYear, setSelectedYear] = useState('2024/2025');

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/students/${id}`, {
        params: { schoolId }
      });

      if (response.data.success) {
        setStudent(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching student:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load student details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!id) return;

    try {
      setResultsLoading(true);

      const response = await apiClient.get(`/students/${id}/results`, {
        params: { 
          schoolId,
          academicYear: selectedYear
        }
      });

      if (response.data.success) {
        setResults(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      toast.error(err.response?.data?.message || 'Failed to load exam results');
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (student) {
      fetchResults();
    }
  }, [student, selectedYear]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getResultBadge = (status: string) => {
    return status.toLowerCase() === 'pass' ? 'badge-soft-success' : 'badge-soft-danger';
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

  if (error || !student) {
    if (!id && !error) {
      return (
        <StudentSelector
          redirectPath="/students/results"
          title="Select Student for Results"
          description="Choose a student to view their exam results"
        />
      );
    }
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">{error || 'Student not found'}</h4>
          <button className="btn btn-primary" onClick={fetchStudent}>
            <i className="ti ti-refresh me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const classLabel = [student.classId?.name, student.sectionId?.name].filter(Boolean).join(', ') || 'N/A';

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Results</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Students</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Results
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button">
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/students/edit/${id}`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Student
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Sidebar */}
        <div className="col-xxl-3 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="border-bottom pb-3 mb-3">
                <div className="text-center">
                  <div className="avatar avatar-xxl mb-3">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${fullName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={fullName} 
                    />
                  </div>
                  <h5 className="mb-1">{fullName}</h5>
                  <p className="text-muted mb-2">{classLabel}</p>
                  <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {capitalize(student.status)}
                  </span>
                </div>
              </div>

              <div>
                <h6 className="mb-3">Basic Information</h6>
                <div className="mb-2">
                  <p className="text-muted mb-1">Admission No</p>
                  <p className="fw-medium mb-0">{student.admissionNumber}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Roll No</p>
                  <p className="fw-medium mb-0">{student.rollNumber || 'N/A'}</p>
                </div>
                {student.email && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Email</p>
                    <p className="fw-medium mb-0">{student.email}</p>
                  </div>
                )}
                {student.phone && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Phone</p>
                    <p className="fw-medium mb-0">{student.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-xxl-9 col-xl-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Exam & Results</h4>
              <div className="dropdown mb-3">
                <select 
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2024/2025">Year: 2024 / 2025</option>
                  <option value="2023/2024">Year: 2023 / 2024</option>
                  <option value="2022/2023">Year: 2022 / 2023</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              {resultsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading results...</span>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-file-off fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No exam results found</h5>
                  <p className="text-muted">No exam results available for this academic year.</p>
                </div>
              ) : (
                <div className="accordions-items-seperate" id="studentResultAccordion">
                  {results.map((exam, index) => (
                    <div className="accordion-item" key={exam._id}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${index === 0 ? '' : 'collapsed'}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#student-result-${index}`}
                          aria-expanded={index === 0}
                          aria-controls={`student-result-${index}`}
                        >
                          <span className={`avatar avatar-sm ${exam.result === 'pass' ? 'bg-success' : 'bg-danger'} me-2`}>
                            <i className={`ti ${exam.result === 'pass' ? 'ti-checks' : 'ti-x'}`} />
                          </span>
                          {exam.examName} - {formatDate(exam.examDate)}
                        </button>
                      </h2>
                      <div
                        id={`student-result-${index}`}
                        className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                        data-bs-parent="#studentResultAccordion"
                      >
                        <div className="accordion-body">
                          <div className="table-responsive">
                            <table className="table">
                              <thead className="thead-light">
                                <tr>
                                  <th>Subject</th>
                                  <th>Max Marks</th>
                                  <th>Min Marks</th>
                                  <th>Marks Obtained</th>
                                  <th className="text-end">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {exam.subjects.map((subject, subIndex) => (
                                  <tr key={subIndex}>
                                    <td>{subject.subjectName}</td>
                                    <td>{subject.maxMarks}</td>
                                    <td>{subject.minMarks}</td>
                                    <td>{subject.marksObtained}</td>
                                    <td className="text-end">
                                      <span className={`badge ${getResultBadge(subject.status)} d-inline-flex align-items-center`}>
                                        <i className="ti ti-circle-filled fs-5 me-1" />
                                        {capitalize(subject.status)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                <tr>
                                  <td className="bg-dark text-white">
                                    Rank: {exam.rank || 'N/A'}
                                  </td>
                                  <td className="bg-dark text-white">
                                    Total: {exam.totalMarks}
                                  </td>
                                  <td className="bg-dark text-white" colSpan={2}>
                                    Marks Obtained: {exam.marksObtained}
                                  </td>
                                  <td className="bg-dark text-white text-end">
                                    <div className="d-flex align-items-center justify-content-end">
                                      <span className="me-2">Percentage: {exam.percentage.toFixed(2)}%</span>
                                      <h6 className="fw-normal text-white mb-0">
                                        Result:{' '}
                                        <span className={exam.result === 'pass' ? 'text-success' : 'text-danger'}>
                                          {capitalize(exam.result)}
                                        </span>
                                      </h6>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentResultPage;
