import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';

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

const StudentOwnResultsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [studentName, setStudentName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(`${currentYear}-${currentYear+1}`);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get student profile
      const profileResponse = await apiClient.get('/students/me');
      if (profileResponse.data.success && profileResponse.data.data) {
        const student = profileResponse.data.data;
        setStudentName(`${student.firstName || student.name || ''} ${student.lastName || ''}`.trim() || 'Student');
        setClassName(student.classId?.name ? `${student.classId.name}${student.sectionId?.name ? ' - ' + student.sectionId.name : ''}` : 'N/A');
        
        // Fetch results using student ID
        const studentId = student._id;
        const institutionId = student.institutionId;
        
        const resultsResponse = await apiClient.get(`/students/${studentId}/results`, {
          params: { 
            institutionId,
            academicYear: selectedYear
          }
        });
        
        if (resultsResponse.data.success) {
          setResults(resultsResponse.data.data || []);
        }
      } else {
        setError('Unable to load student information');
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load results';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedYear]);

  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(2);
  };

  const getResultBadgeClass = (result: string) => {
    return result === 'pass' ? 'badge-success' : 'badge-danger';
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">My Results</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                My Results
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading results...</span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
            <h4 className="mb-3">{error}</h4>
            <button className="btn btn-primary" onClick={fetchResults}>
              <i className="ti ti-refresh me-2"></i>
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl me-3">
                  <div className="avatar-initial rounded-circle bg-primary text-white">
                    {studentName.charAt(0)}
                  </div>
                </div>
                <div>
                  <h5 className="mb-1">{studentName}</h5>
                  <p className="text-muted mb-0">{className}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Exam Results</h4>
              <div className="dropdown mb-3">
                <select 
                  className="form-select" 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {[0,1,2,3].map(i => {
                    const y = currentYear - i;
                    return <option key={y} value={`${y}-${y+1}`}>{`${y}-${y+1}`}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="card-body">
              {results.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-file-off fs-1 text-muted mb-3"></i>
                  <h4 className="mb-3">No results available</h4>
                  <p className="text-muted">Your exam results have not been published yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Exam Name</th>
                        <th>Date</th>
                        <th>Total Marks</th>
                        <th>Obtained</th>
                        <th>Percentage</th>
                        <th>Result</th>
                        <th>Rank</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result._id}>
                          <td className="fw-semibold">{result.examName}</td>
                          <td>{new Date(result.examDate).toLocaleDateString()}</td>
                          <td>{result.totalMarks}</td>
                          <td className="fw-semibold">{result.marksObtained}</td>
                          <td>
                            <span className={`badge ${result.percentage >= 40 ? 'badge-success' : 'badge-warning'}`}>
                              {formatPercentage(result.percentage)}%
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getResultBadgeClass(result.result)}`}>
                              {result.result.toUpperCase()}
                            </span>
                          </td>
                          <td>{result.rank || '-'}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="ti ti-eye me-1"></i>
                              View Details
                            </button>
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
      )}
    </>
  );
};

export default StudentOwnResultsPage;
