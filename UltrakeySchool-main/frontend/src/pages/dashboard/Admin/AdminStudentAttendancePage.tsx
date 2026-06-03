import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import apiClient from '../../../api/client';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';

interface StudentAttendanceData {
  overview: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    leaveToday: number;
    attendanceRate: number;
    weeklyAverage: number;
    monthlyAverage: number;
  };
  classWiseAttendance: {
    className: string;
    section: string;
    totalStudents: number;
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
  gradeDistribution: {
    grade: string;
    totalStudents: number;
    present: number;
    attendanceRate: number;
  }[];
  attendanceStatus: {
    status: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

const COLORS = { present: '#10b981', absent: '#ef4444', late: '#f59e0b', leave: '#6b7280' };

const AdminStudentAttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedGrade]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel from real backend APIs
      const [studentsResponse, attendanceResponse] = await Promise.all([
        apiClient.get('/students', { params: { limit: 1000 } }),
        apiClient.get('/attendance/bulk', { params: { userType: 'student', date: selectedDate, grade: selectedGrade, section: selectedSectionId } }).catch(() => null),
        apiClient.get('/attendance/stats', { params: { dateRange: 'today', userType: 'student' } }).catch(() => null)
      ]);

      const studentsArray = studentsResponse.data?.data || [];
      const allStudents = Array.isArray(studentsArray) ? studentsArray : [];
      setStudents(allStudents);
      const totalStudents = allStudents.length;

      // Get attendance records from bulk endpoint
      const attendanceRecordsData = attendanceResponse?.data?.data || [];
      const attendanceStats = attendanceResponse?.[1]?.data?.data || null;

      // Calculate real stats from attendance data
      const records = Array.isArray(attendanceRecordsData) ? attendanceRecordsData : [];
      
      // Calculate status counts from actual attendance records
      const presentToday = records.filter((r: any) => r.status === 'present').length;
      const absentToday = records.filter((r: any) => r.status === 'absent').length;
      const lateToday = records.filter((r: any) => r.status === 'late').length;
      const leaveToday = records.filter((r: any) => r.status === 'leave' || r.status === 'emergency').length;
      
      // If no attendance records exist yet, defaults to 0
      const presentCount = attendanceStats?.present ?? presentToday;
      const absentCount = attendanceStats?.absent ?? absentToday;
      const lateCount = attendanceStats?.late ?? lateToday;
      const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      // Build class-wise from student data with real attendance if available
      const classMap = new Map();
      allStudents.forEach((student: any) => {
        const className = student.classId?.className || student.class || 'Grade 1';
        const section = student.section || 'A';
        const key = `${className}-${section}`;
        if (!classMap.has(key)) {
          classMap.set(key, { className, section, totalStudents: 0, present: 0, absent: 0, late: 0, leave: 0 });
        }
        const data = classMap.get(key);
        data.totalStudents++;
      });

      // Apply attendance data to class groups
      records.forEach((rec: any) => {
        const student = allStudents.find((s: any) => s._id === rec.userId?._id || s._id === rec.userId);
        if (student) {
          const className = student.classId?.className || student.class || 'Grade 1';
          const section = student.section || 'A';
          const key = `${className}-${section}`;
          const data = classMap.get(key);
          if (data) {
            if (rec.status === 'present') data.present++;
            else if (rec.status === 'absent') data.absent++;
            else if (rec.status === 'late') data.late++;
            else if (rec.status === 'leave' || rec.status === 'emergency') data.leave++;
          }
        }
      });

      const classWiseAttendance = Array.from(classMap.values()).map((c: any) => ({
        className: c.className,
        section: c.section,
        totalStudents: c.totalStudents,
        present: c.present,
        absent: c.absent,
        late: c.late,
        leave: c.leave,
        attendanceRate: c.totalStudents > 0 ? Math.round((c.present / c.totalStudents) * 100) : 0
      }));

      const statusCounts = [
        { status: 'Present', count: presentCount, percentage: 0, color: COLORS.present },
        { status: 'Absent', count: absentCount, percentage: 0, color: COLORS.absent },
        { status: 'Late', count: lateCount, percentage: 0, color: COLORS.late },
        { status: 'Leave', count: leaveToday, percentage: 0, color: COLORS.leave }
      ];
      const totalStatus = statusCounts.reduce((sum, s) => sum + s.count, 0);
      statusCounts.forEach(s => { s.percentage = totalStatus > 0 ? (s.count / totalStatus) * 100 : 0; });

      setAttendanceData({
        overview: {
          totalStudents,
          presentToday: presentCount,
          absentToday: absentCount,
          lateToday: lateCount,
          leaveToday,
          attendanceRate,
          weeklyAverage: Math.round((presentCount / Math.max(totalStudents, 1)) * 100),
          monthlyAverage: attendanceRate
        },
        classWiseAttendance,
        weeklyTrend: [
          { day: 'Mon', present: presentCount, absent: absentCount, late: lateCount, attendanceRate },
          { day: 'Tue', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Wed', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Thu', present: 0, absent: 0, late: 0, attendanceRate: 0 },
          { day: 'Fri', present: 0, absent: 0, late: 0, attendanceRate: 0 }
        ],
        gradeDistribution: Array.from(classMap.entries()).slice(0, 5).map(([key, c]: any) => ({
          grade: c.className,
          totalStudents: c.totalStudents,
          present: c.present,
          attendanceRate: c.totalStudents > 0 ? Math.round((c.present / c.totalStudents) * 100) : 0
        })),
        attendanceStatus: statusCounts
      });
    } catch (error) {
      console.error('Error fetching student attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    setShowAttendanceModal(true);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedGrade('all');
    setSelectedSectionId('all');
    setAttendanceRecords({});
    try {
      const response = await apiClient.get('/students', { params: { limit: 50 } });
      const data = response.data;
      if (data.success && data.data) {
        setStudents(data.data.slice(0, 50));
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(attendanceRecords);
      if (entries.length === 0) {
        toast.warn('Please mark attendance for at least one student');
        setSaving(false);
        return;
      }
      const records = entries.map(([studentId, status]) => ({
        userId: studentId,
        userType: 'student',
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
    students.forEach(s => { newRecords[s._id] = status; });
    setAttendanceRecords(newRecords);
  };

  const handleExportReport = (type: 'pdf' | 'excel') => {
    const classData = attendanceData?.classWiseAttendance || [];
    const exportData = classData.map(c => ({
      Class: c.className,
      Section: c.section,
      'Total Students': c.totalStudents,
      Present: c.present,
      Absent: c.absent,
      Late: c.late,
      Leave: c.leave,
      'Attendance Rate': `${c.attendanceRate}%`
    }));
    if (type === 'pdf') {
      exportToPDF(exportData, 'student-attendance', [
        { key: 'Class', label: 'Class' },
        { key: 'Section', label: 'Section' },
        { key: 'Total Students', label: 'Total Students' },
        { key: 'Present', label: 'Present' },
        { key: 'Absent', label: 'Absent' },
        { key: 'Late', label: 'Late' },
        { key: 'Leave', label: 'Leave' },
        { key: 'Attendance Rate', label: 'Attendance Rate' }
      ], 'Student Attendance Report');
    } else {
      exportToExcel(exportData, 'student-attendance');
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
          <h3 className="page-title mb-1">Student Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Attendance</li>
              <li className="breadcrumb-item active">Student Attendance</li>
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
              <label className="form-label">Section</label>
              <select className="form-select" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
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
                  className={`nav-link text-start mb-2 ${selectedSection === 'classwise' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('classwise')}
                >
                  <i className="ti ti-users me-2"></i>
                  Class-wise
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
                    <h5 className="card-title mb-0">Grade-wise Attendance</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData?.gradeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" />
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
                  <button className="btn btn-outline-success btn-sm" onClick={() => handleExportReport('pdf')}>
                    <i className="ti ti-download me-1"></i>Export
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Section</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.attendanceStatus.reduce((sum, s) => sum + s.count, 0) === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No attendance records found for {selectedDate}. Click "Mark Attendance" to record attendance.
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center">
                            <span className="text-success fw-bold">{attendanceData?.overview.presentToday} Present</span>
                            {' | '}
                            <span className="text-danger fw-bold">{attendanceData?.overview.absentToday} Absent</span>
                            {' | '}
                            <span className="text-warning fw-bold">{attendanceData?.overview.lateToday} Late</span>
                            {' | '}
                            <span className="text-muted fw-bold">{attendanceData?.overview.leaveToday} Leave</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Class-wise */}
          {selectedSection === 'classwise' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Class-wise Attendance</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Section</th>
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
                      {attendanceData?.classWiseAttendance.map((classData, index) => (
                        <tr key={index}>
                          <td>{classData.className}</td>
                          <td>{classData.section}</td>
                          <td>{classData.totalStudents}</td>
                          <td><span className="badge bg-success">{classData.present}</span></td>
                          <td><span className="badge bg-danger">{classData.absent}</span></td>
                          <td><span className="badge bg-warning">{classData.late}</span></td>
                          <td><span className="badge bg-info">{classData.leave}</span></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                <div className="progress-bar" style={{ width: `${classData.attendanceRate}%` }}></div>
                              </div>
                              <span>{classData.attendanceRate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${classData.attendanceRate >= 90 ? 'bg-success' :
                              classData.attendanceRate >= 75 ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {classData.attendanceRate >= 90 ? 'Excellent' :
                               classData.attendanceRate >= 75 ? 'Good' : 'Needs Attention'}
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
                  <button className="btn btn-outline-success btn-sm" onClick={() => handleExportReport('excel')}>
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
              </div>
            </div>
          )}
        </div>
      </div>

      {showAttendanceModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Mark Student Attendance</h5>
                <button type="button" className="btn-close" onClick={() => setShowAttendanceModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-3">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Class/Grade</label>
                    <select className="form-select" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                      <option value="all">All Classes</option>
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Section</label>
                    <select className="form-select" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
                      <option value="all">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Student List ({students.length} students)</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-success" onClick={() => handleMarkAll('present')}>Mark All Present</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleMarkAll('absent')}>Mark All Absent</button>
                  </div>
                </div>
                <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="table table-bordered table-hover">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Late</th>
                        <th>Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted">No students found</td></tr>
                      ) : students.map((student) => (
                        <tr key={student._id}>
                          <td><span className="badge bg-secondary">{student.rollNo || student.rollNumber || '-'}</span></td>
                          <td>{student.firstName} {student.lastName}</td>
                          <td className="text-center">
                            <input type="radio" name={`att-${student._id}`} checked={attendanceRecords[student._id] === 'present'} onChange={() => setAttendanceRecords({ ...attendanceRecords, [student._id]: 'present' })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`att-${student._id}`} checked={attendanceRecords[student._id] === 'absent'} onChange={() => setAttendanceRecords({ ...attendanceRecords, [student._id]: 'absent' })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`att-${student._id}`} checked={attendanceRecords[student._id] === 'late'} onChange={() => setAttendanceRecords({ ...attendanceRecords, [student._id]: 'late' })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`att-${student._id}`} checked={attendanceRecords[student._id] === 'leave'} onChange={() => setAttendanceRecords({ ...attendanceRecords, [student._id]: 'leave' })} />
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

export default AdminStudentAttendancePage;
