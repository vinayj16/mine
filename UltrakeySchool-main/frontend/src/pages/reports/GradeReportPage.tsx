import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface SubjectMarks {
  subjectId?: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  grade?: string;
  remarks?: string;
}

interface GradeReport {
  _id: string;
  studentId: {
    _id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    rollNumber?: string;
    avatar?: string;
  };
  examId?: {
    _id: string;
    name: string;
    examType: string;
  };
  classId?: {
    _id: string;
    name: string;
    section: string;
  };
  subjects: SubjectMarks[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string;
  rank?: number;
  teacherRemarks?: string;
  principalRemarks?: string;
  status: string;
  academicYear: string;
  term: string;
}

const GradeReportPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeReports, setGradeReports] = useState<GradeReport[]>([]);
  const [filters, setFilters] = useState({
    classId: '',
    examId: '',
    academicYear: '2024-2025',
    term: '',
    status: 'published'
  });

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';

  const fetchGradeReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { 
        schoolId
      };
      
      if (filters.classId) params.classId = filters.classId;
      if (filters.examId) params.examId = filters.examId;
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.term) params.term = filters.term;
      if (filters.status) params.status = filters.status;

      const response = await apiClient.get(`/results/schools/${schoolId}`, {
        params
      });

      if (response.data.success) {
        const results = response.data.data || [];
        setGradeReports(results);
        
        if (results.length === 0) {
          toast.info('No grade reports found for the selected filters');
        }
      }
    } catch (err: any) {
      console.error('Error fetching grade reports:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load grade reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeReports();
  }, []);

  const handleRefresh = () => {
    fetchGradeReports();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setShowFilter(false);
    fetchGradeReports();
  };

  const resetFilters = () => {
    setFilters({
      classId: '',
      examId: '',
      academicYear: '2024-2025',
      term: '',
      status: 'published'
    });
    fetchGradeReports();
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export to ${type} feature coming soon`);
  };

  const getGradeClass = (grade: string) => {
    if (grade === 'F') return 'text-danger';
    if (['A+', 'A', 'B+', 'B', 'O'].includes(grade)) return 'text-success';
    return '';
  };

  const isFailingMark = (mark: number, passingMark: number = 35): boolean => {
    return mark < passingMark;
  };

  return (
    <>

        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Grade Report</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Report</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Grade Report</li>
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

        {/* Grade Report List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Grade Report List</h4>
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
                    <button className="dropdown-item rounded-1 active">
                      Ascending
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Descending
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Recently Viewed
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
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
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Academic Year</label>
                      <select 
                        className="form-select"
                        name="academicYear"
                        value={filters.academicYear}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Years</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2023-2024">2023-2024</option>
                        <option value="2022-2023">2022-2023</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Term</label>
                      <select 
                        className="form-select"
                        name="term"
                        value={filters.term}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Terms</option>
                        <option value="1st">1st Term</option>
                        <option value="2nd">2nd Term</option>
                        <option value="3rd">3rd Term</option>
                        <option value="midterm">Mid Term</option>
                        <option value="final">Final</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <select 
                        className="form-select"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
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
              <p className="mt-2 text-muted">Loading grade reports...</p>
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
                  onClick={fetchGradeReports}
                >
                  <i className="ti ti-refresh me-1"></i>Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && gradeReports.length === 0 && (
            <div className="card-body text-center py-5">
              <i className="ti ti-report-analytics" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No grade reports found</p>
              <p className="text-muted small">Grade reports will appear here once exam results are recorded</p>
            </div>
          )}

          {/* Grade Reports Table */}
          {!loading && !error && gradeReports.length > 0 && (
          <div className="card-body p-0 py-3">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    {gradeReports[0]?.subjects.map((subject, idx) => (
                      <th key={idx}>{subject.subjectName}</th>
                    ))}
                    <th>Total</th>
                    <th>Percent(%)</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeReports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <Link to="#" className="link-primary">
                          {report.studentId.admissionNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {report.studentId.avatar ? (
                            <img
                              src={report.studentId.avatar}
                              className="avatar avatar-md rounded-circle me-2"
                              alt={`${report.studentId.firstName} ${report.studentId.lastName}`}
                            />
                          ) : (
                            <div className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center">
                              <i className="ti ti-user fs-16 text-muted"></i>
                            </div>
                          )}
                          <div>
                            <p className="text-dark mb-0">
                              <Link to="#">
                                {report.studentId.firstName} {report.studentId.lastName}
                              </Link>
                            </p>
                            {report.studentId.rollNumber && (
                              <span className="fs-12">Roll No : {report.studentId.rollNumber}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {report.subjects.map((subject, idx) => (
                        <td 
                          key={idx}
                          className={isFailingMark(subject.marksObtained) ? 'text-danger' : ''}
                        >
                          {subject.marksObtained}/{subject.totalMarks}
                        </td>
                      ))}
                      <td>{report.totalMarksObtained}/{report.totalMaxMarks}</td>
                      <td>{report.percentage.toFixed(2)}%</td>
                      <td className={getGradeClass(report.overallGrade)}>{report.overallGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>

    </>
  );
};

export default GradeReportPage;
