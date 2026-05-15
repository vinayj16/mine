import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AttendanceReportData {
  overview: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    leaveToday: number;
    monthlyAttendanceRate: number;
    weeklyAttendanceRate: number;
  };
  dailyAttendance: {
    date: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
    attendanceRate: number;
  }[];
  classWiseAttendance: {
    className: string;
    totalStudents: number;
    present: number;
    absent: number;
    attendanceRate: number;
  }[];
  monthlyTrend: {
    month: string;
    attendanceRate: number;
    presentCount: number;
    absentCount: number;
  }[];
}

const AdminAttendanceReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, selectedClass]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setReportData({
        overview: {
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          leaveToday: 0,
          monthlyAttendanceRate: 0,
          weeklyAttendanceRate: 0
        },
        dailyAttendance: [
          { date: 'Mon', present: 0, absent: 0, late: 0, leave: 0, total: 0, attendanceRate: 0 },
          { date: 'Tue', present: 0, absent: 0, late: 0, leave: 0, total: 0, attendanceRate: 0 },
          { date: 'Wed', present: 0, absent: 0, late: 0, leave: 0, total: 0, attendanceRate: 0 },
          { date: 'Thu', present: 0, absent: 0, late: 0, leave: 0, total: 0, attendanceRate: 0 },
          { date: 'Fri', present: 0, absent: 0, late: 0, leave: 0, total: 0, attendanceRate: 0 }
        ],
        classWiseAttendance: [
          { className: 'Grade 1-A', totalStudents: 0, present: 0, absent: 0, attendanceRate: 0 },
          { className: 'Grade 2-A', totalStudents: 0, present: 0, absent: 0, attendanceRate: 0 },
          { className: 'Grade 3-A', totalStudents: 0, present: 0, absent: 0, attendanceRate: 0 }
        ],
        monthlyTrend: [
          { month: 'Jan', attendanceRate: 0, presentCount: 0, absentCount: 0 },
          { month: 'Feb', attendanceRate: 0, presentCount: 0, absentCount: 0 },
          { month: 'Mar', attendanceRate: 0, presentCount: 0, absentCount: 0 },
          { month: 'Apr', attendanceRate: 0, presentCount: 0, absentCount: 0 },
          { month: 'May', attendanceRate: 0, presentCount: 0, absentCount: 0 },
          { month: 'Jun', attendanceRate: 0, presentCount: 0, absentCount: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching attendance report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceStatusData = reportData ? [
    { name: 'Present', value: reportData.overview.presentToday, color: '#10b981' },
    { name: 'Absent', value: reportData.overview.absentToday, color: '#ef4444' },
    { name: 'Late', value: reportData.overview.lateToday, color: '#f59e0b' },
    { name: 'Leave', value: reportData.overview.leaveToday, color: '#6b7280' }
  ] : [];

  const handleExportReport = () => {
    // Handle export logic
    console.log('Exporting attendance report...');
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
          <h3 className="page-title mb-1">Attendance Report</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active">Attendance Report</li>
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
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.presentToday}</h4>
                  <p className="mb-0">Present Today</p>
                  <small>Students present</small>
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
                  <h4 className="mb-1">{reportData?.overview.absentToday}</h4>
                  <p className="mb-0">Absent Today</p>
                  <small>Students absent</small>
                </div>
                <i className="ti ti-user-x fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.lateToday}</h4>
                  <p className="mb-0">Late Today</p>
                  <small>Students late</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.monthlyAttendanceRate}%</h4>
                  <p className="mb-0">Monthly Rate</p>
                  <small>Attendance rate</small>
                </div>
                <i className="ti ti-chart-line fs-24"></i>
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
              <label className="form-label">Period</label>
              <select 
                className="form-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Class</label>
              <select 
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                <option value="grade1">Grade 1</option>
                <option value="grade2">Grade 2</option>
                <option value="grade3">Grade 3</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Date Range</label>
              <input type="date" className="form-control" />
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary w-100">Apply Filters</button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
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
                <LineChart data={reportData?.dailyAttendance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Class-wise Attendance</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.classWiseAttendance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#10b981" />
              <Bar dataKey="absent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Monthly Attendance Trend</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="presentCount" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="absentCount" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Detailed Attendance Report</h5>
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
                  <th>Class</th>
                  <th>Total Students</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Leave</th>
                  <th>Attendance Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.classWiseAttendance.map((classData, index) => (
                  <tr key={index}>
                    <td>{classData.className}</td>
                    <td>{classData.totalStudents}</td>
                    <td>
                      <span className="badge bg-success">{classData.present}</span>
                    </td>
                    <td>
                      <span className="badge bg-danger">{classData.absent}</span>
                    </td>
                    <td>
                      <span className="badge bg-warning">0</span>
                    </td>
                    <td>
                      <span className="badge bg-info">0</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ width: `${classData.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span>{classData.attendanceRate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        classData.attendanceRate >= 75 ? 'bg-success' : 
                        classData.attendanceRate >= 60 ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {classData.attendanceRate >= 75 ? 'Good' : 
                         classData.attendanceRate >= 60 ? 'Average' : 'Poor'}
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

export default AdminAttendanceReportPage;
