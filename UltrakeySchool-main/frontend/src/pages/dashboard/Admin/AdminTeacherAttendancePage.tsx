import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AttendanceApiService } from '../../../api/adminService';

interface TeacherAttendanceData {
  overview: {
    totalTeachers: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    leaveToday: number;
    attendanceRate: number;
    weeklyAverage: number;
    monthlyAverage: number;
  };
  departmentWiseAttendance: {
    department: string;
    totalTeachers: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    attendanceRate: number;
  }[];
  weeklyTrend: {
    day: string;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  }[];
  attendanceStatus: {
    status: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  teacherList: {
    id: string;
    name: string;
    department: string;
    subject: string;
    employeeId: string;
    checkInTime: string;
    checkOutTime: string;
    status: 'present' | 'absent' | 'late' | 'leave';
    workingHours: string;
    overtime: string;
  }[];
}

const AdminTeacherAttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<TeacherAttendanceData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedDepartment]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        overview,
        teacherList,
        departmentWiseAttendance,
        weeklyTrend
      ] = await Promise.all([
        AttendanceApiService.getTeacherOverview(selectedDate, selectedDepartment === 'all' ? undefined : selectedDepartment),
        AttendanceApiService.getTeacherList(selectedDate, selectedDepartment === 'all' ? undefined : selectedDepartment),
        AttendanceApiService.getTeacherDepartmentWise(selectedDate),
        AttendanceApiService.getTeacherWeeklyTrend(selectedDepartment === 'all' ? undefined : selectedDepartment)
      ]);

      // Calculate attendance status from overview data
      const overviewData = overview as any;
      const attendanceStatus = [
        { status: 'Present', count: overviewData?.presentToday || 0, percentage: 0, color: '#10b981' },
        { status: 'Absent', count: overviewData?.absentToday || 0, percentage: 0, color: '#ef4444' },
        { status: 'Late', count: overviewData?.lateToday || 0, percentage: 0, color: '#f59e0b' },
        { status: 'Leave', count: overviewData?.leaveToday || 0, percentage: 0, color: '#6b7280' }
      ];
      
      // Calculate percentages
      const total = attendanceStatus.reduce((sum, item) => sum + item.count, 0);
      attendanceStatus.forEach(item => {
        item.percentage = total > 0 ? (item.count / total) * 100 : 0;
      });

      setAttendanceData({
        overview: overviewData || {
          totalTeachers: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          leaveToday: 0,
          attendanceRate: 0,
          weeklyAverage: 0,
          monthlyAverage: 0
        },
        teacherList: (teacherList as any[]) || [],
        departmentWiseAttendance: (departmentWiseAttendance as any[]) || [
          { department: 'Science', totalTeachers: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 },
          { department: 'Mathematics', totalTeachers: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 },
          { department: 'English', totalTeachers: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 },
          { department: 'Social Studies', totalTeachers: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 },
          { department: 'Computer Science', totalTeachers: 0, present: 0, absent: 0, late: 0, leave: 0, attendanceRate: 0 }
        ],
        weeklyTrend: (weeklyTrend as any[]) || [
          { day: 'Mon', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Tue', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Wed', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Thu', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Fri', present: 0, absent: 0, late: 0, attendanceRate: 0 }
        ],
        attendanceStatus
      });

    } catch (error: any) {
      console.error('Error fetching teacher attendance data:', error);
      
      // Set empty data on error
      setAttendanceData({
        overview: {
          totalTeachers: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          leaveToday: 0,
          attendanceRate: 0,
          weeklyAverage: 0,
          monthlyAverage: 0
        },
        teacherList: [],
        departmentWiseAttendance: [],
        weeklyTrend: [],
        attendanceStatus: [
          { status: 'Present', count: 0, percentage: 0, color: '#10b981' },
          { status: 'Absent', count: 0, percentage: 0, color: '#ef4444' },
          { status: 'Late', count: 0, percentage: 0, color: '#f59e0b' },
          { status: 'Leave', count: 0, percentage: 0, color: '#6b7280' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      // Get attendance marking data
      const response = await AttendanceApiService.markTeacherAttendance(selectedDate, selectedDepartment === 'all' ? undefined : selectedDepartment);
      
      console.log('Attendance marking page opened:', response);
      
      // Refresh data to show updated attendance
      await fetchAttendanceData();
      
    } catch (error: any) {
      console.error('Error opening attendance marking:', error);
      
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 403) {
        console.error('Access forbidden: You do not have permission to mark attendance');
      }
    }
  };

  const handleExportReport = async (reportType: string = 'daily') => {
    try {
      await AttendanceApiService.exportTeacherAttendance({
        reportType,
        date: selectedDate,
        department: selectedDepartment === 'all' ? undefined : selectedDepartment,
        format: 'excel'
      }, `teacher-attendance-${reportType}-${selectedDate}.xlsx`);
      
      console.log('Teacher attendance report exported successfully');
      
    } catch (error: any) {
      console.error('Error exporting teacher attendance report:', error);
      
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 403) {
        console.error('Access forbidden: You do not have permission to export reports');
      }
    }
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
          <h3 className="page-title mb-1">Teacher Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Attendance</li>
              <li className="breadcrumb-item active">Teacher Attendance</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchAttendanceData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleMarkAttendance}>
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
                  <h4 className="mb-1">{attendanceData?.overview.totalTeachers}</h4>
                  <p className="mb-0">Total Teachers</p>
                  <small>Teaching staff</small>
                </div>
                <i className="ti ti-chalkboard-user fs-24"></i>
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
                  <small>Present teachers</small>
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
                  <small>Absent teachers</small>
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

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Department</label>
              <select 
                className="form-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                <option value="science">Science</option>
                <option value="mathematics">Mathematics</option>
                <option value="english">English</option>
                <option value="social">Social Studies</option>
                <option value="computer">Computer Science</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Shift</label>
              <select className="form-select">
                <option value="all">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary w-100">Apply Filters</button>
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
                  className={`nav-link text-start mb-2 ${selectedSection === 'daily' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('daily')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Daily Attendance
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'department' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('department')}
                >
                  <i className="ti ti-building me-2"></i>
                  Department-wise
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'trends' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('trends')}
                >
                  <i className="ti ti-chart-line me-2"></i>
                  Trends
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Reports
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
                          data={attendanceData?.attendanceStatus || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {attendanceData?.attendanceStatus.map((entry, index) => (
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
                      <LineChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Department-wise Attendance</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData?.departmentWiseAttendance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attendanceRate" fill="#3b82f6" />
                        <Bar dataKey="present" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Attendance */}
          {selectedSection === 'daily' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Daily Attendance - {selectedDate}</h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={handleMarkAttendance}>
                    <i className="ti ti-calendar-check me-1"></i>Mark Attendance
                  </button>
                  <button className="btn btn-outline-success btn-sm" onClick={() => handleExportReport()}>
                    <i className="ti ti-download me-1"></i>Export
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
                        <th>Department</th>
                        <th>Subject</th>
                        <th>Employee ID</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Check-out Time</th>
                        <th>Working Hours</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.teacherList.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-muted">
                            No attendance records found for {selectedDate}. Click "Mark Attendance" to record attendance.
                          </td>
                        </tr>
                      ) : (
                        attendanceData?.teacherList.map((teacher) => (
                          <tr key={teacher.id}>
                            <td>
                              <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                                  {teacher.name.charAt(0).toUpperCase()}
                                </div>
                                {teacher.name}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-primary">{teacher.department}</span>
                            </td>
                            <td>{teacher.subject}</td>
                            <td>{teacher.employeeId}</td>
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
                            <td>{teacher.checkOutTime}</td>
                            <td>{teacher.workingHours}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                              </div>
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

          {/* Department-wise */}
          {selectedSection === 'department' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Department-wise Attendance</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Total Teachers</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Late</th>
                        <th>Leave</th>
                        <th>Attendance Rate</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.departmentWiseAttendance.map((deptData, index) => (
                        <tr key={index}>
                          <td>{deptData.department}</td>
                          <td>{deptData.totalTeachers}</td>
                          <td>
                            <span className="badge bg-success">{deptData.present}</span>
                          </td>
                          <td>
                            <span className="badge bg-danger">{deptData.absent}</span>
                          </td>
                          <td>
                            <span className="badge bg-warning">{deptData.late}</span>
                          </td>
                          <td>
                            <span className="badge bg-info">{deptData.leave}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                <div 
                                  className="progress-bar" 
                                  style={{ width: `${deptData.attendanceRate}%` }}
                                ></div>
                              </div>
                              <span>{deptData.attendanceRate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              deptData.attendanceRate >= 95 ? 'bg-success' : 
                              deptData.attendanceRate >= 85 ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {deptData.attendanceRate >= 95 ? 'Excellent' : 
                               deptData.attendanceRate >= 85 ? 'Good' : 'Needs Attention'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="View Details">
                                <i className="ti ti-eye"></i>
                              </button>
                              <button className="btn btn-outline-info" title="View Teachers">
                                <i className="ti ti-users"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Trends */}
          {selectedSection === 'trends' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Attendance Trends Analysis</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Weekly Comparison</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="present" fill="#10b981" />
                        <Bar dataKey="absent" fill="#ef4444" />
                        <Bar dataKey="late" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-md-6">
                    <h6>Attendance Rate Trend</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-primary">Weekly Average</h6>
                        <h4>{attendanceData?.overview.weeklyAverage}%</h4>
                        <small className="text-muted">Last 7 days</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-success">Monthly Average</h6>
                        <h4>{attendanceData?.overview.monthlyAverage}%</h4>
                        <small className="text-muted">Last 30 days</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-info">Today's Rate</h6>
                        <h4>{attendanceData?.overview.attendanceRate}%</h4>
                        <small className="text-muted">Current date</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Attendance Reports</h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="ti ti-calendar me-1"></i>Date Range
                  </button>
                  <button className="btn btn-outline-success btn-sm" onClick={() => handleExportReport()}>
                    <i className="ti ti-download me-1"></i>Export Report
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                        <h6>Daily Report</h6>
                        <p className="text-muted small">Day-wise attendance summary</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar fs-24 text-success mb-2"></i>
                        <h6>Weekly Report</h6>
                        <p className="text-muted small">Weekly attendance analysis</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-warning mb-2"></i>
                        <h6>Monthly Report</h6>
                        <p className="text-muted small">Monthly attendance trends</p>
                        <button className="btn btn-warning btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-user fs-24 text-info mb-2"></i>
                        <h6>Teacher-wise Report</h6>
                        <p className="text-muted small">Individual teacher attendance</p>
                        <button className="btn btn-info btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-building fs-24 text-danger mb-2"></i>
                        <h6>Department-wise Report</h6>
                        <p className="text-muted small">Attendance by department</p>
                        <button className="btn btn-danger btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-circle fs-24 text-secondary mb-2"></i>
                        <h6>Low Attendance Report</h6>
                        <p className="text-muted small">Teachers with low attendance</p>
                        <button className="btn btn-secondary btn-sm">Generate</button>
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

export default AdminTeacherAttendancePage;
