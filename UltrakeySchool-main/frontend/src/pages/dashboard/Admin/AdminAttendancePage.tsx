import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AttendanceData {
  overview: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    halfDayToday: number;
    attendanceRate: number;
  };
  studentAttendance: {
    grade: string;
    section: string;
    totalStudents: number;
    present: number;
    absent: number;
    percentage: number;
  }[];
  teacherAttendance: {
    teacherName: string;
    subject: string;
    status: 'present' | 'absent' | 'late' | 'leave';
    checkInTime: string;
  }[];
  weeklyTrend: {
    day: string;
    studentAttendance: number;
    teacherAttendance: number;
  }[];
}

const AdminAttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [, setGenerating] = useState(false);

  const generateReport = async (type: string) => {
    try {
      setGenerating(true);
      const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';
      const date = new Date().toISOString().split('T')[0];
      
      let endpoint = '';
      switch(type) {
        case 'daily':
          endpoint = `/api/v1/attendance/date/${date}`;
          break;
        case 'monthly':
          endpoint = `/api/v1/attendance/monthly-report?schoolId=${schoolId}`;
          break;
        case 'student':
          endpoint = `/api/v1/attendance?schoolId=${schoolId}`;
          break;
        case 'class':
          endpoint = `/api/v1/attendance/stats?schoolId=${schoolId}`;
          break;
        case 'low':
          endpoint = `/api/v1/attendance/low-attendance?schoolId=${schoolId}`;
          break;
      }
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      // Generate and download report
      if (data.success || data.data) {
        const reportData = data.data || data;
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-attendance-report-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Report generated: No data available for the selected period.');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setAttendanceData({
        overview: {
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          halfDayToday: 0,
          attendanceRate: 0
        },
        studentAttendance: [
          { grade: 'Grade 1', section: 'A', totalStudents: 0, present: 0, absent: 0, percentage: 0 },
          { grade: 'Grade 2', section: 'A', totalStudents: 0, present: 0, absent: 0, percentage: 0 },
          { grade: 'Grade 3', section: 'A', totalStudents: 0, present: 0, absent: 0, percentage: 0 }
        ],
        teacherAttendance: [],
        weeklyTrend: [
          { day: 'Mon', studentAttendance: 0, teacherAttendance: 0 },
          { day: 'Tue', studentAttendance: 0, teacherAttendance: 0 },
          { day: 'Wed', studentAttendance: 0, teacherAttendance: 0 },
          { day: 'Thu', studentAttendance: 0, teacherAttendance: 0 },
          { day: 'Fri', studentAttendance: 0, teacherAttendance: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceStatusData = attendanceData ? [
    { name: 'Present', value: attendanceData.overview.presentToday, color: '#10b981' },
    { name: 'Absent', value: attendanceData.overview.absentToday, color: '#ef4444' },
    { name: 'Late', value: attendanceData.overview.lateToday, color: '#f59e0b' },
    { name: 'Half Day', value: attendanceData.overview.halfDayToday, color: '#6b7280' }
  ] : [];

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
          <h3 className="page-title mb-1">Attendance Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Attendance</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchAttendanceData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-calendar-check me-2"></i>Mark Attendance
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
                  <h4 className="mb-1">{attendanceData?.overview.totalStudents}</h4>
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
                  <h4 className="mb-1">{attendanceData?.overview.presentToday}</h4>
                  <p className="mb-0">Present Today</p>
                  <small>Present students</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{attendanceData?.overview.absentToday}</h4>
                  <p className="mb-0">Absent Today</p>
                  <small>Absent students</small>
                </div>
                <i className="ti ti-user-x fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{attendanceData?.overview.attendanceRate}%</h4>
                  <p className="mb-0">Attendance Rate</p>
                  <small>Today's rate</small>
                </div>
                <i className="ti ti-chart-line fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Attendance Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'students' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('students')}
                >
                  <i className="ti ti-users me-2"></i>
                  Student Attendance
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'teachers' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('teachers')}
                >
                  <i className="ti ti-chalkboard-user me-2"></i>
                  Teacher Attendance
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Attendance Reports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Today's Attendance Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={attendanceStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attendanceStatusData.map((entry, index) => (
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
                    <h5 className="card-title mb-0">Weekly Attendance Trend</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="studentAttendance" fill="#3b82f6" />
                        <Bar dataKey="teacherAttendance" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Attendance */}
          {selectedSection === 'students' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Student Attendance</h5>
                <div className="d-flex gap-2">
                  <input type="date" className="form-control form-control-sm" />
                  <select className="form-select form-select-sm">
                    <option value="">All Grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-search me-1"></i>Search
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Grade</th>
                        <th>Section</th>
                        <th>Total Students</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.studentAttendance.map((attendance, index) => (
                        <tr key={index}>
                          <td>
                            <input type="checkbox" className="form-check-input" />
                          </td>
                          <td>{attendance.grade}</td>
                          <td>{attendance.section}</td>
                          <td>{attendance.totalStudents}</td>
                          <td>
                            <span className="badge bg-success">{attendance.present}</span>
                          </td>
                          <td>
                            <span className="badge bg-danger">{attendance.absent}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                <div 
                                  className="progress-bar" 
                                  style={{ width: `${attendance.percentage}%` }}
                                ></div>
                              </div>
                              <span>{attendance.percentage}%</span>
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="ti ti-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Attendance */}
          {selectedSection === 'teachers' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Teacher Attendance</h5>
                <div className="d-flex gap-2">
                  <input type="date" className="form-control form-control-sm" />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-calendar-check me-1"></i>Mark Attendance
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Teacher Name</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Check-out Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.teacherAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted">
                            No teacher attendance records found for the selected date.
                          </td>
                        </tr>
                      ) : (
                        attendanceData?.teacherAttendance.map((teacher, index) => (
                          <tr key={index}>
                            <td>
                              <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>{teacher.teacherName}</td>
                            <td>{teacher.subject}</td>
                            <td>
                              <span className={`badge ${
                                teacher.status === 'present' ? 'bg-success' :
                                teacher.status === 'absent' ? 'bg-danger' :
                                teacher.status === 'late' ? 'bg-warning' : 'bg-info'
                              }`}>
                                {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                              </span>
                            </td>
                            <td>{teacher.checkInTime}</td>
                            <td>-</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary">
                                <i className="ti ti-edit"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Attendance Reports</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                        <h6>Daily Attendance Report</h6>
                        <p className="text-muted small">Day-wise attendance summary</p>
                        <button className="btn btn-primary btn-sm" onClick={() => generateReport('daily')}>Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar fs-24 text-success mb-2"></i>
                        <h6>Monthly Attendance Report</h6>
                        <p className="text-muted small">Monthly attendance analysis</p>
                        <button className="btn btn-success btn-sm" onClick={() => generateReport('monthly')}>Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-user fs-24 text-warning mb-2"></i>
                        <h6>Student Wise Report</h6>
                        <p className="text-muted small">Individual student attendance</p>
                        <button className="btn btn-warning btn-sm" onClick={() => generateReport('student')}>Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-info mb-2"></i>
                        <h6>Class Wise Report</h6>
                        <p className="text-muted small">Attendance by class/section</p>
                        <button className="btn btn-info btn-sm" onClick={() => generateReport('class')}>Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-circle fs-24 text-danger mb-2"></i>
                        <h6>Low Attendance Report</h6>
                        <p className="text-muted small">Students with low attendance</p>
                        <button className="btn btn-danger btn-sm" onClick={() => generateReport('low')}>Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendancePage;
