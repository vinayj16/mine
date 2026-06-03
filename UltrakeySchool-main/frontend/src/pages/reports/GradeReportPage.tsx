import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import Avatar from '../../components/common/Avatar';

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
  const [studentInfo, setStudentInfo] = useState<{ name: string; class: string; roll: string } | null>(null);
  const [filters, setFilters] = useState({
    classId: '',
    examId: '',
    academicYear: '',
    term: '',
    status: ''
  });
  const currentYear = new Date().getFullYear();
  const acYears = [`${currentYear}-${currentYear+1}`, `${currentYear-1}-${currentYear}`, `${currentYear-2}-${currentYear-1}`];

  // Get institutionId from localStorage
  const getInstitutionId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) { const user = JSON.parse(userStr); return user.institutionId || user.institutionId || ''; }
    } catch { /* empty */ }
    return localStorage.getItem('institutionId') || localStorage.getItem('institutionId') || '';
  };
  const institutionId = getInstitutionId();

  const fetchGradeReports = async () => {
    try {
      setLoading(true);
      setError(null);

      let studentId = '';
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === 'student') {
            const meResp = await apiClient.get('/students/me');
            if (meResp.data?.success) {
              const me = meResp.data.data;
              studentId = me._id;
              setStudentInfo({
                name: `${me.firstName || ''} ${me.lastName || ''}`.trim() || me.name || 'Student',
                class: me.classId?.name || '',
                roll: me.rollNumber || ''
              });
            }
          }
        }
      } catch { /* empty - fall through with filters */ }

      const params: any = { 
        institutionId
      };
      
      if (studentId) params.studentId = studentId;
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.term) params.term = filters.term;
      if (filters.status) params.status = filters.status;

      const response = await apiClient.get(`/results`, {
        params
      });

      if (response.data.success) {
        const results = response.data.data || [];
        setGradeReports(results);
      }
    } catch (err: any) {
      console.error('Error fetching grade reports:', err);
      setError('Failed to load grade reports');
      toast.error('Failed to load grade reports');
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
      academicYear: '',
      term: '',
      status: ''
    });
    setGradeReports([]);
    fetchGradeReports();
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!gradeReports.length) { toast.error('No data to export'); return; }
    const exportData = gradeReports.map(r => ({
      'Admission No': r.studentId?.admissionNumber || '',
      'Student Name': `${r.studentId?.firstName || ''} ${r.studentId?.lastName || ''}`,
      Total: r.totalMarksObtained || 0,
      'Percent(%)': r.percentage || 0,
      Grade: r.overallGrade || '-'
    }));
    if (type === 'pdf') {
      exportToPDF(exportData, 'grade-report', Object.keys(exportData[0]).map(k => ({ key: k, label: k })));
    } else {
      exportToExcel(exportData, 'grade-report');
    }
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
                  value={studentInfo ? `${studentInfo.name}${studentInfo.class ? ' - ' + studentInfo.class : ''}` : 'Grade Report'} 
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
                        {acYears.map(y => <option key={y} value={y}>{y}</option>)}
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
              <p className="mt-2 text-muted">No grade reports found for this student</p>
              <p className="text-muted small">Grade reports will appear here once exam results are recorded for the selected filters</p>
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
                    {(gradeReports[0]?.subjects || []).map((subject, idx) => (
                      <th key={idx}>{subject?.subjectName || 'Subject ' + (idx + 1)}</th>
                    ))}
                    <th>Total</th>
                    <th>Percent(%)</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeReports.map((report) => {
                    const sid = report.studentId || {};
                    const sidName = `${sid.firstName || ''} ${sid.lastName || ''}`.trim() || 'Student';
                    return (
                    <tr key={report._id}>
                      <td>
                        <Link to="#" className="link-primary">
                          {sid.admissionNumber || 'N/A'}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Avatar
                            name={sidName}
                            src={sid.avatar}
                            size={36}
                            className="me-2"
                          />
                          <div>
                            <p className="text-dark mb-0">
                              <Link to="#">
                                {sidName}
                              </Link>
                            </p>
                            {sid.rollNumber && (
                              <span className="fs-12">Roll No : {sid.rollNumber}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {(report.subjects || []).map((subject, idx) => (
                        <td 
                          key={idx}
                          className={isFailingMark(subject?.marksObtained ?? 0) ? 'text-danger' : ''}
                        >
                          {subject?.marksObtained ?? 0}/{subject?.totalMarks ?? 0}
                        </td>
                      ))}
                      <td>{report.totalMarksObtained || 0}/{report.totalMaxMarks || 0}</td>
                      <td>{(report.percentage ?? 0).toFixed(2)}%</td>
                      <td className={getGradeClass(report.overallGrade || '')}>{report.overallGrade || '-'}</td>
                    </tr>
                    );
                  })}
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
