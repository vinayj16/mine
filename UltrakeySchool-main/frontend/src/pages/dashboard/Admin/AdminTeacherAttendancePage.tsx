import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import apiClient from '../../../api/client';

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
  }[];
}

const COLORS = { present: '#10b981', absent: '#ef4444', late: '#f59e0b', leave: '#6b7280' };

const AdminTeacherAttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<TeacherAttendanceData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedDepartment]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch teachers and attendance data from real backend
      const [teachersResponse, attendanceResponse] = await Promise.all([
        apiClient.get('/users', { params: { role: 'teacher', limit: 500 } }).catch(() => ({ data: { success: true, data: [] } })),
        apiClient.get('/attendance/bulk', { params: { userType: 'teacher', date: selectedDate } }).catch(() => ({ data: { success: true, data: [] } }))
      ]);

      const teachersArray = teachersResponse.data?.data || [];
      const allTeachers = Array.isArray(teachersArray) ? teachersArray : [];
      const attendanceRecordsData = attendanceResponse.data?.data || [];
      const records = Array.isArray(attendanceRecordsData) ? attendanceRecordsData : [];
      setTeachers(allTeachers);

      const totalTeachers = allTeachers.length;
      const presentToday = records.filter((r: any) => r.status === 'present').length;
      const absentToday = records.filter((r: any) => r.status === 'absent').length;
      const lateToday = records.filter((r: any) => r.status === 'late').length;
      const leaveToday = records.filter((r: any) => r.status === 'leave' || r.status === 'emergency').length;
      const attendanceRate = totalTeachers > 0 ? Math.round((presentToday / totalTeachers) * 100) : 0;

      // Build department-wise attendance
      const deptMap = new Map();
      allTeachers.forEach((t: any) => {
        const dept = t.department || 'General';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { department: dept, totalTeachers: 0, present: 0, absent: 0, late: 0, leave: 0 });
        }
        deptMap.get(dept).totalTeachers++;
      });

      records.forEach((rec: any) => {
        const teacher = allTeachers.find((t: any) => t._id === rec.userId?._id || t._id === rec.userId);
        if (teacher) {
          const dept = teacher.department || 'General';
          const data = deptMap.get(dept);
          if (data) {
            if (rec.status === 'present') data.present++;
            else if (rec.status === 'absent') data.absent++;
            else if (rec.status === 'late') data.late++;
            else if (rec.status === 'leave' || rec.status === 'emergency') data.leave++;
          }
        }
      });

      const departmentWiseAttendance = Array.from(deptMap.values()).map((d: any) => ({
        ...d,
        attendanceRate: d.totalTeachers > 0 ? Math.round((d.present / d.totalTeachers) * 100) : 0
      }));

      // Build teacher list from attendance records
      const teacherList = records.map((rec: any) => {
        const teacher = allTeachers.find((t: any) => t._id === rec.userId?._id || t._id === rec.userId) || {};
        return {
          id: rec._id || rec.userId?._id,
          name: rec.staffName || teacher.name || 'Unknown',
          department: rec.department || teacher.department || 'General',
          subject: teacher.subject || teacher.designation || '',
          employeeId: teacher.employeeId || '',
          checkInTime: rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOutTime: rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
          status: rec.status || 'absent'
        };
      });

      const statusCounts = [
        { status: 'Present', count: presentToday, percentage: 0, color: COLORS.present },
        { status: 'Absent', count: absentToday, percentage: 0, color: COLORS.absent },
        { status: 'Late', count: lateToday, percentage: 0, color: COLORS.late },
        { status: 'Leave', count: leaveToday, percentage: 0, color: COLORS.leave }
      ];
      const totalStatus = statusCounts.reduce((sum, s) => sum + s.count, 0);
      statusCounts.forEach(s => { s.percentage = totalStatus > 0 ? (s.count / totalStatus) * 100 : 0; });

      setAttendanceData({
        overview: { totalTeachers, presentToday, absentToday, lateToday, leaveToday, attendanceRate, weeklyAverage: attendanceRate, monthlyAverage: attendanceRate },
        departmentWiseAttendance,
        weeklyTrend: [
          { day: 'Mon', present: presentToday, absent: absentToday, late: lateToday, attendanceRate },
          { day: 'Tue', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Wed', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Thu', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Fri', present: 0, absent: 0, late: 0, attendanceRate: 0 }
        ],
        attendanceStatus: statusCounts,
        teacherList
      });

    } catch (error: any) {
      console.error('Error fetching teacher attendance data:', error);
      setAttendanceData({
        overview: { totalTeachers: 0, presentToday: 0, absentToday: 0, lateToday: 0, leaveToday: 0, attendanceRate: 0, weeklyAverage: 0, monthlyAverage: 0 },
        teacherList: [],
        departmentWiseAttendance: [],
        weeklyTrend: [],
        attendanceStatus: [
          { status: 'Present', count: 0, percentage: 0, color: COLORS.present },
          { status: 'Absent', count: 0, percentage: 0, color: COLORS.absent },
          { status: 'Late', count: 0, percentage: 0, color: COLORS.late },
          { status: 'Leave', count: 0, percentage: 0, color: COLORS.leave }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    setShowAttendanceModal(true);
    setAttendanceRecords({});
    try {
      const response = await apiClient.get('/users', { params: { role: 'teacher', limit: 50 } }).catch(() => ({ data: { success: true, data: [] } }));
      const teachersArray = response.data?.data || [];
      setTeachers(Array.isArray(teachersArray) ? teachersArray : []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(attendanceRecords);
      if (entries.length === 0) {
        toast.warn('Please mark attendance for at least one teacher');
        setSaving(false);
        return;
      }
      const records = entries.map(([userId, status]) => ({
        userId,
        userType: 'teacher',
        date: selectedDate,
        status
      }));
      const response = await apiClient.post('/attendance/bulk-mark', {
        attendanceRecords: records,
        date: selectedDate
      });
      if (response.data.success) {
        setShowAttendanceModal(false);
        fetchAttendanceData();
      }
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status: string) => {
    const newRecords: Record<string, string> = {};
    teachers.forEach(t => { newRecords[t._id] = status; });
    setAttendanceRecords(newRecords);
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
              <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Department</label>
              <select className="form-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                <option value="all">All Departments</option>
                <option value="science">Science</option>
                <option value="mathematics">Mathematics</option>
                <option value="english">English</option>
                <option value="social">Social Studies</option>
                <option value="computer">Computer Science</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary w-100" onClick={fetchAttendanceData}>Apply Filters</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Attendance Sections</h5>
              <div className="nav flex-column nav-pills">
                <button className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`} onClick={() => setSelectedSection('overview')}>
                  <i className="ti ti-chart-pie me-2"></i>Overview
                </button>
                <button className={`nav-link text-start mb-2 ${selectedSection === 'daily' ? 'active' : ''}`} onClick={() => setSelectedSection('daily')}>
                  <i className="ti ti-calendar me-2"></i>Daily Attendance
                </button>
                <button className={`nav-link text-start mb-2 ${selectedSection === 'department' ? 'active' : ''}`} onClick={() => setSelectedSection('department')}>
                  <i className="ti ti-building me-2"></i>Department-wise
                </button>
                <button className={`nav-link text-start mb-2 ${selectedSection === 'trends' ? 'active' : ''}`} onClick={() => setSelectedSection('trends')}>
                  <i className="ti ti-chart-line me-2"></i>Trends
                </button>
                <button className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`} onClick={() => setSelectedSection('reports')}>
                  <i className="ti ti-file-text me-2"></i>Reports
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header"><h5 className="card-title mb-0">Today's Attendance Status</h5></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={attendanceData?.attendanceStatus || []} cx="50%" cy="50%" labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80} fill="#8884d8" dataKey="count">
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
                  <div className="card-header"><h5 className="card-title mb-0">Weekly Attendance Trend</h5></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" /><YAxis /><Tooltip />
                        <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header"><h5 className="card-title mb-0">Department-wise Attendance</h5></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData?.departmentWiseAttendance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" /><YAxis /><Tooltip />
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
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Teacher Name</th>
                        <th>Department</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Check-out Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.teacherList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No attendance records found for {selectedDate}. Click "Mark Attendance" to record attendance.
                          </td>
                        </tr>
                      ) : (
                        attendanceData?.teacherList.map((teacher) => (
                          <tr key={teacher.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                                  {teacher.name.charAt(0).toUpperCase()}
                                </div>
                                {teacher.name}
                              </div>
                            </td>
                            <td><span className="badge bg-primary">{teacher.department}</span></td>
                            <td>{teacher.subject}</td>
                            <td>
                              <span className={`badge ${teacher.status === 'present' ? 'bg-success' :
                                teacher.status === 'absent' ? 'bg-danger' :
                                teacher.status === 'late' ? 'bg-warning' : 'bg-info'}`}>
                                {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                              </span>
                            </td>
                            <td>{teacher.checkInTime}</td>
                            <td>{teacher.checkOutTime}</td>
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
              <div className="card-header"><h5 className="card-title mb-0">Department-wise Attendance</h5></div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.departmentWiseAttendance.map((deptData, index) => (
                        <tr key={index}>
                          <td>{deptData.department}</td>
                          <td>{deptData.totalTeachers}</td>
                          <td><span className="badge bg-success">{deptData.present}</span></td>
                          <td><span className="badge bg-danger">{deptData.absent}</span></td>
                          <td><span className="badge bg-warning">{deptData.late}</span></td>
                          <td><span className="badge bg-info">{deptData.leave}</span></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                <div className="progress-bar" style={{ width: `${deptData.attendanceRate}%` }}></div>
                              </div>
                              <span>{deptData.attendanceRate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${deptData.attendanceRate >= 95 ? 'bg-success' :
                              deptData.attendanceRate >= 85 ? 'bg-warning' : 'bg-danger'}`}>
                              {deptData.attendanceRate >= 95 ? 'Excellent' :
                               deptData.attendanceRate >= 85 ? 'Good' : 'Needs Attention'}
                            </span>
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
              <div className="card-header"><h5 className="card-title mb-0">Attendance Trends Analysis</h5></div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Weekly Comparison</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip />
                        <Bar dataKey="present" fill="#10b981" /><Bar dataKey="absent" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-md-6">
                    <h6>Attendance Rate Trend</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={attendanceData?.weeklyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip />
                        <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border"><div className="card-body text-center">
                      <h6 className="text-primary">Weekly Average</h6><h4>{attendanceData?.overview.weeklyAverage}%</h4>
                    </div></div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border"><div className="card-body text-center">
                      <h6 className="text-success">Monthly Average</h6><h4>{attendanceData?.overview.monthlyAverage}%</h4>
                    </div></div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border"><div className="card-body text-center">
                      <h6 className="text-info">Today's Rate</h6><h4>{attendanceData?.overview.attendanceRate}%</h4>
                    </div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header"><h5 className="card-title mb-0">Attendance Reports</h5></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100"><div className="card-body text-center">
                      <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                      <h6>Daily Report</h6><p className="text-muted small">Day-wise attendance summary</p>
                      <button className="btn btn-primary btn-sm">Generate</button>
                    </div></div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100"><div className="card-body text-center">
                      <i className="ti ti-calendar fs-24 text-success mb-2"></i>
                      <h6>Weekly Report</h6><p className="text-muted small">Weekly attendance analysis</p>
                      <button className="btn btn-success btn-sm">Generate</button>
                    </div></div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100"><div className="card-body text-center">
                      <i className="ti ti-chart-bar fs-24 text-warning mb-2"></i>
                      <h6>Monthly Report</h6><p className="text-muted small">Monthly attendance trends</p>
                      <button className="btn btn-warning btn-sm">Generate</button>
                    </div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Mark Teacher Attendance - {selectedDate}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAttendanceModal(false)} />
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Teacher List ({teachers.length} teachers)</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-success" onClick={() => handleMarkAll('present')}>Mark All Present</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleMarkAll('absent')}>Mark All Absent</button>
                  </div>
                </div>
                <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="table table-bordered table-hover">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Teacher Name</th>
                        <th>Department</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Late</th>
                        <th>Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted">No teachers found</td></tr>
                      ) : teachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td>{teacher.name || teacher.firstName + ' ' + teacher.lastName}</td>
                          <td><span className="badge bg-secondary">{teacher.department || 'General'}</span></td>
                          <td className="text-center">
                            <input type="radio" name={`att-${teacher._id}`} checked={attendanceRecords[teacher._id] === 'present'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [teacher._id]: 'present' })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`att-${teacher._id}`} checked={attendanceRecords[teacher._id] === 'absent'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [teacher._id]: 'absent' })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`att-${teacher._id}`} checked={attendanceRecords[teacher._id] === 'late'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [teacher._id]: 'late' })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`att-${teacher._id}`} checked={attendanceRecords[teacher._id] === 'leave'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [teacher._id]: 'leave' })} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveAttendance} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherAttendancePage;
