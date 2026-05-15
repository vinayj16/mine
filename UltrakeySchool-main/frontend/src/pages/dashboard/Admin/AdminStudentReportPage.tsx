import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface StudentReportData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    newAdmissions: number;
    graduatedStudents: number;
    maleStudents: number;
    femaleStudents: number;
  };
  gradeDistribution: {
    grade: string;
    totalStudents: number;
    maleStudents: number;
    femaleStudents: number;
  }[];
  performanceData: {
    grade: string;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }[];
  admissionTrend: {
    month: string;
    admissions: number;
    withdrawals: number;
  }[];
  attendanceData: {
    grade: string;
    averageAttendance: number;
    excellentAttendance: number;
    goodAttendance: number;
    needsImprovement: number;
  }[];
}

const AdminStudentReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  useEffect(() => {
    fetchReportData();
  }, [selectedGrade, selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setReportData({
        overview: {
          totalStudents: 0,
          activeStudents: 0,
          newAdmissions: 0,
          graduatedStudents: 0,
          maleStudents: 0,
          femaleStudents: 0
        },
        gradeDistribution: [
          { grade: 'Grade 1', totalStudents: 0, maleStudents: 0, femaleStudents: 0 },
          { grade: 'Grade 2', totalStudents: 0, maleStudents: 0, femaleStudents: 0 },
          { grade: 'Grade 3', totalStudents: 0, maleStudents: 0, femaleStudents: 0 },
          { grade: 'Grade 4', totalStudents: 0, maleStudents: 0, femaleStudents: 0 },
          { grade: 'Grade 5', totalStudents: 0, maleStudents: 0, femaleStudents: 0 }
        ],
        performanceData: [
          { grade: 'Grade 1', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { grade: 'Grade 2', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { grade: 'Grade 3', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { grade: 'Grade 4', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { grade: 'Grade 5', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 }
        ],
        admissionTrend: [
          { month: 'Jan', admissions: 0, withdrawals: 0 },
          { month: 'Feb', admissions: 0, withdrawals: 0 },
          { month: 'Mar', admissions: 0, withdrawals: 0 },
          { month: 'Apr', admissions: 0, withdrawals: 0 },
          { month: 'May', admissions: 0, withdrawals: 0 },
          { month: 'Jun', admissions: 0, withdrawals: 0 }
        ],
        attendanceData: [
          { grade: 'Grade 1', averageAttendance: 0, excellentAttendance: 0, goodAttendance: 0, needsImprovement: 0 },
          { grade: 'Grade 2', averageAttendance: 0, excellentAttendance: 0, goodAttendance: 0, needsImprovement: 0 },
          { grade: 'Grade 3', averageAttendance: 0, excellentAttendance: 0, goodAttendance: 0, needsImprovement: 0 },
          { grade: 'Grade 4', averageAttendance: 0, excellentAttendance: 0, goodAttendance: 0, needsImprovement: 0 },
          { grade: 'Grade 5', averageAttendance: 0, excellentAttendance: 0, goodAttendance: 0, needsImprovement: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching student report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const genderData = reportData ? [
    { name: 'Male', value: reportData.overview.maleStudents, color: '#3b82f6' },
    { name: 'Female', value: reportData.overview.femaleStudents, color: '#ec4899' }
  ] : [];

  const handleExportReport = () => {
    // Handle export logic
    console.log('Exporting student report...');
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

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Report</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active">Student Report</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchReportData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleExportReport}>
            <i className="ti ti-download me-2"></i>Export Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.totalStudents}</h4>
                  <p className="mb-0">Total Students</p>
                  <small>Enrolled students</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.activeStudents}</h4>
                  <p className="mb-0">Active Students</p>
                  <small>Currently enrolled</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.newAdmissions}</h4>
                  <p className="mb-0">New Admissions</p>
                  <small>This month</small>
                </div>
                <i className="ti ti-user-plus fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.maleStudents}</h4>
                  <p className="mb-0">Male Students</p>
                  <small>{reportData?.overview.femaleStudents} Female</small>
                </div>
                <i className="ti ti-gender-male fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">Grade</label>
              <select 
                className="form-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="all">All Grades</option>
                <option value="grade1">Grade 1</option>
                <option value="grade2">Grade 2</option>
                <option value="grade3">Grade 3</option>
                <option value="grade4">Grade 4</option>
                <option value="grade5">Grade 5</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Period</label>
              <select 
                className="form-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="current">Current Year</option>
                <option value="last">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Report Type</label>
              <select className="form-select">
                <option value="overview">Overview</option>
                <option value="performance">Performance</option>
                <option value="attendance">Attendance</option>
                <option value="demographics">Demographics</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary w-100">Generate Report</button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Gender Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Grade Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData?.gradeDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalStudents" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Data */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Academic Performance by Grade</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.performanceData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageScore" fill="#10b981" />
              <Bar dataKey="passRate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admission/Withdrawal Trend */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Admission & Withdrawal Trend</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.admissionTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="admissions" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Attendance Overview by Grade</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.attendanceData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageAttendance" fill="#3b82f6" />
              <Bar dataKey="excellentAttendance" fill="#10b981" />
              <Bar dataKey="needsImprovement" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Student Performance Summary</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm">
              <i className="ti ti-printer me-1"></i>Print
            </button>
            <button className="btn btn-outline-success btn-sm">
              <i className="ti ti-download me-1"></i>Excel
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Total Students</th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Average Score</th>
                  <th>Pass Rate</th>
                  <th>Avg Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.gradeDistribution.map((gradeData, index) => (
                  <tr key={index}>
                    <td>{gradeData.grade}</td>
                    <td>{gradeData.totalStudents}</td>
                    <td>{gradeData.maleStudents}</td>
                    <td>{gradeData.femaleStudents}</td>
                    <td>
                      <span className="badge bg-primary">
                        {reportData?.performanceData[index]?.averageScore || 0}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        (reportData?.performanceData[index]?.passRate || 0) >= 80 ? 'bg-success' : 
                        (reportData?.performanceData[index]?.passRate || 0) >= 60 ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {reportData?.performanceData[index]?.passRate || 0}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        (reportData?.attendanceData[index]?.averageAttendance || 0) >= 90 ? 'bg-success' : 
                        (reportData?.attendanceData[index]?.averageAttendance || 0) >= 75 ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {reportData?.attendanceData[index]?.averageAttendance || 0}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        (reportData?.performanceData[index]?.passRate || 0) >= 80 && 
                        (reportData?.attendanceData[index]?.averageAttendance || 0) >= 90 ? 'bg-success' : 
                        (reportData?.performanceData[index]?.passRate || 0) >= 60 && 
                        (reportData?.attendanceData[index]?.averageAttendance || 0) >= 75 ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {(reportData?.performanceData[index]?.passRate || 0) >= 80 && 
                         (reportData?.attendanceData[index]?.averageAttendance || 0) >= 90 ? 'Excellent' : 
                         (reportData?.performanceData[index]?.passRate || 0) >= 60 && 
                         (reportData?.attendanceData[index]?.averageAttendance || 0) >= 75 ? 'Good' : 'Needs Attention'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentReportPage;
