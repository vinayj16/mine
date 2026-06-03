import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import { useAuth } from '../../../store/authStore'

interface AttendanceToday {
  present: number;
  absent: number;
  percentage: string | number;
}

interface Overview {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeStudents: number;
  attendanceToday: AttendanceToday;
  pendingFees: number;
  recentAdmissions: number;
  totalStaff: number;
  totalParents: number;
  activeTeachers: number;
  totalEvents: number;
  totalNotices: number;
  pendingLeaves: number;
  classPerformance: { className: string; studentCount: number }[];
}

interface ExamStats {
  totalExams: number;
  upcoming: number;
  completed: number;
  avgScore: number | null;
}

interface AttendanceTrend {
  month: string;
  present: number;
  absent: number;
  percentage: number;
}

interface DashboardData {
  overview: Overview;
  attendanceOverview: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    totalStudents: number;
    attendanceRate: number;
  };
  feeStats: {
    totalAmount: number;
    paidAmount: number;
    pendingFees: number;
    collected: number;
    collectionRate: number;
  };
  examStats: ExamStats | null;
  attendanceTrend: AttendanceTrend[];
  recentActivities: any[];
  upcomingEvents: any[];
}

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/dashboard/admin');
      if (response.data.success) {
        const data = response.data.data;
        setDashboardData(data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="ti ti-alert-circle me-2 fs-4"></i>
          <div className="flex-grow-1">
            <h5 className="alert-heading">Error Loading Dashboard</h5>
            <p className="mb-0">{error}</p>
          </div>
          <button className="btn btn-outline-danger ms-3" onClick={fetchDashboardData}>
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-5">
        <i className="ti ti-database-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
        <p className="mt-2 text-muted">No dashboard data available</p>
      </div>
    );
  }

  const { overview, attendanceOverview, feeStats, examStats, attendanceTrend, recentActivities, upcomingEvents } = dashboardData;
  const principalName = user?.name || user?.username || 'Principal';

  const safeAttendanceTrend = attendanceTrend || [];

  return (
    <div className="principal-dashboard">

      {/* WELCOME BANNER */}
      <div className="card bg-gradient-primary text-white mb-4 border-0">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h3 className="text-white mb-1">Welcome Back, {principalName}</h3>
              <p className="mb-0 opacity-75">Principal Dashboard - Institution Overview</p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <button className="btn btn-light btn-sm" onClick={handleRefresh}>
                <i className="ti ti-refresh me-1"></i>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-primary-transparent rounded me-3">
                  <i className="ti ti-users fs-24 text-primary"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Total Students</h6>
                  <h3 className="mb-0">{overview?.totalStudents || 0}</h3>
                  <small className="text-success">
                    <i className="ti ti-arrow-up me-1"></i>{overview?.activeStudents || 0} Active
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-success-transparent rounded me-3">
                  <i className="ti ti-user-check fs-24 text-success"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Total Teachers</h6>
                  <h3 className="mb-0">{overview?.totalTeachers || 0}</h3>
                  <small className="text-muted">{overview?.activeTeachers || 0} Active</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-warning-transparent rounded me-3">
                  <i className="ti ti-building fs-24 text-warning"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Total Classes</h6>
                  <h3 className="mb-0">{overview?.totalClasses || 0}</h3>
                  <small className="text-muted">Active Classes</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-info-transparent rounded me-3">
                  <i className="ti ti-calendar-check fs-24 text-info"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Attendance Today</h6>
                  <h3 className="mb-0">{overview?.attendanceToday?.percentage || 0}%</h3>
                  <small className="text-success">{overview?.attendanceToday?.present || 0} Present</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW STATS */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-danger-transparent rounded me-3">
                  <i className="ti ti-currency-rupee fs-24 text-danger"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Pending Fees</h6>
                  <h3 className="mb-0">{overview?.pendingFees || 0}</h3>
                  <small className="text-danger">Requires Action</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-primary-transparent rounded me-3">
                  <i className="ti ti-user-plus fs-24 text-primary"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Recent Admissions</h6>
                  <h3 className="mb-0">{overview?.recentAdmissions || 0}</h3>
                  <small className="text-muted">Last 7 Days</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-warning-transparent rounded me-3">
                  <i className="ti ti-calendar-event fs-24 text-warning"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Total Events</h6>
                  <h3 className="mb-0">{overview?.totalEvents || 0}</h3>
                  <small className="text-muted">Upcoming: {upcomingEvents?.length || 0}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-info-transparent rounded me-3">
                  <i className="ti ti-file-text fs-24 text-info"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">Notices</h6>
                  <h3 className="mb-0">{overview?.totalNotices || 0}</h3>
                  <small className="text-muted">Active notices</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEE & EXAM STATS */}
      {feeStats && (feeStats.totalAmount > 0 || feeStats.collected > 0) && (
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Fee Amount</h6>
                <h4 className="mb-0">{formatCurrency(feeStats.totalAmount || 0)}</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Collected</h6>
                <h4 className="mb-0 text-success">{formatCurrency(feeStats.collected || 0)}</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Collection Rate</h6>
                <h4 className="mb-0 text-info">{feeStats.collectionRate || 0}%</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Pending Amount</h6>
                <h4 className="mb-0 text-danger">{formatCurrency(feeStats.pendingFees || 0)}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* ATTENDANCE TREND */}
        {safeAttendanceTrend.length > 0 && (
          <div className="col-xxl-6 col-xl-12 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">
                  <i className="ti ti-chart-bar text-primary me-2"></i>Attendance Trend (6 Months)
                </h5>
              </div>
              <div className="card-body">
                {safeAttendanceTrend.map((item) => (
                  <div key={item.month} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="fw-medium">{item.month}</small>
                      <small className="fw-bold">{item.percentage}%</small>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar ${item.percentage >= 90 ? 'bg-success' : item.percentage >= 75 ? 'bg-info' : 'bg-warning'}`}
                        role="progressbar"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-success">Present: {item.present}</small>
                      <small className="text-danger">Absent: {item.absent}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXAM STATS */}
        {examStats && (
          <div className="col-xxl-3 col-xl-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">
                  <i className="ti ti-file-text text-warning me-2"></i>Exam Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="bg-light rounded p-3 text-center">
                      <h4 className="mb-1">{examStats.totalExams || 0}</h4>
                      <small className="text-muted">Total Exams</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-3 text-center">
                      <h4 className="mb-1 text-info">{examStats.upcoming || 0}</h4>
                      <small className="text-muted">Upcoming</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-3 text-center">
                      <h4 className="mb-1 text-success">{examStats.completed || 0}</h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-3 text-center">
                      <h4 className="mb-1 text-primary">{examStats.avgScore !== null ? `${examStats.avgScore}%` : 'N/A'}</h4>
                      <small className="text-muted">Avg Score</small>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <Link to="/dashboard/principal/exams" className="btn btn-sm btn-outline-warning">View Exams</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPCOMING EVENTS */}
        <div className="col-xxl-3 col-xl-6 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3">
              <h5 className="card-title mb-0">
                <i className="ti ti-calendar-event text-danger me-2"></i>Upcoming Events
              </h5>
              <Link to="/dashboard/principal/events" className="btn btn-sm btn-outline-danger">View All</Link>
            </div>
            <div className="card-body">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="list-group list-group-flush">
                  {upcomingEvents.slice(0, 4).map((event: any, idx: number) => (
                    <div key={idx} className="list-group-item px-0 border-0 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{event.title}</h6>
                          <small className="text-muted text-capitalize">{event.type}</small>
                        </div>
                        <span className="badge bg-light text-dark flex-shrink-0 ms-2">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-calendar-event fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No upcoming events</p>
                </div>
              )}

              {/* TODAY'S ATTENDANCE */}
              <div className="mt-3 pt-3 border-top">
                <h6 className="fw-medium mb-2">Today's Attendance</h6>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="bg-light rounded p-2 text-center">
                      <h5 className="text-success mb-0">{attendanceOverview?.present || 0}</h5>
                      <small className="text-muted">Present</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-2 text-center">
                      <h5 className="text-danger mb-0">{attendanceOverview?.absent || 0}</h5>
                      <small className="text-muted">Absent</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-2 text-center">
                      <h5 className="text-warning mb-0">{attendanceOverview?.late || 0}</h5>
                      <small className="text-muted">Late</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded p-2 text-center">
                      <h5 className="text-info mb-0">{attendanceOverview?.halfDay || 0}</h5>
                      <small className="text-muted">Half Day</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      {recentActivities && recentActivities.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">
                  <i className="ti ti-activity text-primary me-2"></i>Recent Activities
                </h5>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  {recentActivities.slice(0, 8).map((activity: any, index: number) => {
                    const safeActivity = activity || {};
                    return (
                      <div key={index} className="list-group-item px-0">
                        <div className="d-flex align-items-start">
                          <div className="avatar avatar-sm bg-light rounded me-2 flex-shrink-0">
                            <i className={`${safeActivity.icon || 'ti ti-activity'} fs-14`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-1">{safeActivity.description || safeActivity.title || safeActivity.activity}</p>
                            <small className="text-muted">
                              <i className="ti ti-clock me-1"></i>
                              {safeActivity.timestamp ? formatDate(safeActivity.timestamp) : ''}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0">
                <i className="ti ti-apps text-primary me-2"></i>Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/students" className="card border-0 border-bottom border-primary border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-primary rounded mb-2 mx-auto">
                        <i className="ti ti-users fs-24"></i>
                      </div>
                      <h6 className="mb-0">Students</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/teachers" className="card border-0 border-bottom border-success border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-success rounded mb-2 mx-auto">
                        <i className="ti ti-user-check fs-24"></i>
                      </div>
                      <h6 className="mb-0">Teachers</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/attendance/student" className="card border-0 border-bottom border-warning border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-warning rounded mb-2 mx-auto">
                        <i className="ti ti-calendar-check fs-24"></i>
                      </div>
                      <h6 className="mb-0">Attendance</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/classes" className="card border-0 border-bottom border-dark border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-dark rounded mb-2 mx-auto">
                        <i className="ti ti-clipboard-text fs-24"></i>
                      </div>
                      <h6 className="mb-0">Classes</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/fees-collection" className="card border-0 border-bottom border-info border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-info rounded mb-2 mx-auto">
                        <i className="ti ti-currency-rupee fs-24"></i>
                      </div>
                      <h6 className="mb-0">Fees</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/exams" className="card border-0 border-bottom border-secondary border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-secondary rounded mb-2 mx-auto">
                        <i className="ti ti-file-text fs-24"></i>
                      </div>
                      <h6 className="mb-0">Exams</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/library" className="card border-0 border-bottom border-warning border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-warning rounded mb-2 mx-auto">
                        <i className="ti ti-books fs-24"></i>
                      </div>
                      <h6 className="mb-0">Library</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/events" className="card border-0 border-bottom border-danger border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-danger rounded mb-2 mx-auto">
                        <i className="ti ti-calendar-event fs-24"></i>
                      </div>
                      <h6 className="mb-0">Events</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/notice-board" className="card border-0 border-bottom border-info border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-info rounded mb-2 mx-auto">
                        <i className="ti ti-speakerphone fs-24"></i>
                      </div>
                      <h6 className="mb-0">Notices</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/sports" className="card border-0 border-bottom border-success border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-success rounded mb-2 mx-auto">
                        <i className="ti ti-ball fs-24"></i>
                      </div>
                      <h6 className="mb-0">Sports</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/salaries" className="card border-0 border-bottom border-primary border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-primary rounded mb-2 mx-auto">
                        <i className="ti ti-wallet fs-24"></i>
                      </div>
                      <h6 className="mb-0">Salaries</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/school-settings" className="card border-0 border-bottom border-secondary border-2 animate-card">
                    <div className="card-body text-center py-3">
                      <div className="avatar avatar-lg bg-secondary rounded mb-2 mx-auto">
                        <i className="ti ti-settings fs-24"></i>
                      </div>
                      <h6 className="mb-0">Settings</h6>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
