import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportData {
  attendanceReport: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    totalStudents: number;
  };
  studentReport: {
    totalStudents: number;
    activeStudents: number;
    newAdmissions: number;
    graduatedStudents: number;
  };
  gradeReport: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    gradeD: number;
    gradeF: number;
  };
  feesReport: {
    totalFees: number;
    collectedFees: number;
    pendingFees: number;
    overdueFees: number;
  };
}

const AdminReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>('attendance');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setReportData({
        attendanceReport: {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          totalStudents: 0
        },
        studentReport: {
          totalStudents: 0,
          activeStudents: 0,
          newAdmissions: 0,
          graduatedStudents: 0
        },
        gradeReport: {
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          gradeD: 0,
          gradeF: 0
        },
        feesReport: {
          totalFees: 0,
          collectedFees: 0,
          pendingFees: 0,
          overdueFees: 0
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceData = reportData ? [
    { name: 'Present', value: reportData.attendanceReport.present, color: '#10b981' },
    { name: 'Absent', value: reportData.attendanceReport.absent, color: '#ef4444' },
    { name: 'Late', value: reportData.attendanceReport.late, color: '#f59e0b' },
    { name: 'Leave', value: reportData.attendanceReport.leave, color: '#6b7280' }
  ] : [];

  const gradeData = reportData ? [
    { name: 'Grade A', value: reportData.gradeReport.gradeA, color: '#10b981' },
    { name: 'Grade B', value: reportData.gradeReport.gradeB, color: '#3b82f6' },
    { name: 'Grade C', value: reportData.gradeReport.gradeC, color: '#f59e0b' },
    { name: 'Grade D', value: reportData.gradeReport.gradeD, color: '#f97316' },
    { name: 'Grade F', value: reportData.gradeReport.gradeF, color: '#ef4444' }
  ] : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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
          <h3 className="page-title mb-1">Reports</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Reports</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchReportData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-download me-2"></i>Export Report
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedReport === 'attendance' ? 'active' : ''}`}
                  onClick={() => setSelectedReport('attendance')}
                >
                  <i className="ti ti-calendar-check me-2"></i>
                  Attendance Report
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedReport === 'student' ? 'active' : ''}`}
                  onClick={() => setSelectedReport('student')}
                >
                  <i className="ti ti-users me-2"></i>
                  Student Report
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedReport === 'grade' ? 'active' : ''}`}
                  onClick={() => setSelectedReport('grade')}
                >
                  <i className="ti ti-star me-2"></i>
                  Grade Report
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedReport === 'fees' ? 'active' : ''}`}
                  onClick={() => setSelectedReport('fees')}
                >
                  <i className="ti ti-cash me-2"></i>
                  Fees Report
                </button>
              </div>
            </div>
            <div className="col-md-9">
              {/* Attendance Report */}
              {selectedReport === 'attendance' && reportData && (
                <div>
                  <h4 className="mb-4">Attendance Report</h4>
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h5>Present</h5>
                          <h3>{reportData.attendanceReport.present}</h3>
                          <small>Students today</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-danger text-white">
                        <div className="card-body">
                          <h5>Absent</h5>
                          <h3>{reportData.attendanceReport.absent}</h3>
                          <small>Students today</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-warning text-white">
                        <div className="card-body">
                          <h5>Late</h5>
                          <h3>{reportData.attendanceReport.late}</h3>
                          <small>Students today</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-secondary text-white">
                        <div className="card-body">
                          <h5>Leave</h5>
                          <h3>{reportData.attendanceReport.leave}</h3>
                          <small>Students today</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <h5>Attendance Overview</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={attendanceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {attendanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Student Report */}
              {selectedReport === 'student' && reportData && (
                <div>
                  <h4 className="mb-4">Student Report</h4>
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="card bg-primary text-white">
                        <div className="card-body">
                          <h5>Total Students</h5>
                          <h3>{reportData.studentReport.totalStudents}</h3>
                          <small>Enrolled students</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h5>Active Students</h5>
                          <h3>{reportData.studentReport.activeStudents}</h3>
                          <small>Currently active</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-info text-white">
                        <div className="card-body">
                          <h5>New Admissions</h5>
                          <h3>{reportData.studentReport.newAdmissions}</h3>
                          <small>This month</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-warning text-white">
                        <div className="card-body">
                          <h5>Graduated</h5>
                          <h3>{reportData.studentReport.graduatedStudents}</h3>
                          <small>This year</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <h5>Student Statistics</h5>
                      <p className="text-muted">Detailed student statistics and trends will be displayed here.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grade Report */}
              {selectedReport === 'grade' && reportData && (
                <div>
                  <h4 className="mb-4">Grade Report</h4>
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h5>Grade A</h5>
                          <h3>{reportData.gradeReport.gradeA}</h3>
                          <small>Excellent</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-primary text-white">
                        <div className="card-body">
                          <h5>Grade B</h5>
                          <h3>{reportData.gradeReport.gradeB}</h3>
                          <small>Good</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-warning text-white">
                        <div className="card-body">
                          <h5>Grade C</h5>
                          <h3>{reportData.gradeReport.gradeC}</h3>
                          <small>Average</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-danger text-white">
                        <div className="card-body">
                          <h5>Grade D/F</h5>
                          <h3>{reportData.gradeReport.gradeD + reportData.gradeReport.gradeF}</h3>
                          <small>Needs Improvement</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <h5>Grade Distribution</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={gradeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8">
                            {gradeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Fees Report */}
              {selectedReport === 'fees' && reportData && (
                <div>
                  <h4 className="mb-4">Fees Report</h4>
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="card bg-primary text-white">
                        <div className="card-body">
                          <h5>Total Fees</h5>
                          <h3>{formatCurrency(reportData.feesReport.totalFees)}</h3>
                          <small>This academic year</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h5>Collected</h5>
                          <h3>{formatCurrency(reportData.feesReport.collectedFees)}</h3>
                          <small>Received payments</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-warning text-white">
                        <div className="card-body">
                          <h5>Pending</h5>
                          <h3>{formatCurrency(reportData.feesReport.pendingFees)}</h3>
                          <small>Awaiting payment</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-danger text-white">
                        <div className="card-body">
                          <h5>Overdue</h5>
                          <h3>{formatCurrency(reportData.feesReport.overdueFees)}</h3>
                          <small>Late payments</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <h5>Fee Collection Summary</h5>
                      <div className="progress mb-3" style={{ height: '25px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${reportData.feesReport.totalFees > 0 ? (reportData.feesReport.collectedFees / reportData.feesReport.totalFees) * 100 : 0}%` }}
                        >
                          {reportData.feesReport.totalFees > 0 ? Math.round((reportData.feesReport.collectedFees / reportData.feesReport.totalFees) * 100) : 0}% Collected
                        </div>
                      </div>
                      <p className="text-muted">Fee collection progress and detailed financial reports will be displayed here.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
