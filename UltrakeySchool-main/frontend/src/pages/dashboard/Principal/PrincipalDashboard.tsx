import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import institutionSetupService from '../../../services/institutionSetupService';

interface InstitutionDetails {
  _id: string;
  name: string;
  type: string;
  instituteCode: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status: string;
  subscription?: {
    planName: string;
    endDate: string;
  };
  website?: string;
}

interface DashboardData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
    attendanceToday: {
      present: number;
      absent: number;
      percentage: string | number;
    };
    pendingFees: number;
    recentAdmissions: number;
    totalStaff?: number;
  };
  attendanceOverview: any;
  feeStats: any;
  recentActivities: any[];
  upcomingEvents: any[];
}

const PrincipalDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [institution, setInstitution] = useState<InstitutionDetails | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/dashboard/admin');

      if (response.data.success) {
        const data = response.data.data;
        const ov = data.overview || data;
        setDashboardData({
          overview: {
            totalStudents: ov.totalStudents || 0,
            totalTeachers: ov.totalTeachers || 0,
            totalClasses: ov.totalClasses || 0,
            activeStudents: ov.activeStudents || 0,
            attendanceToday: {
              present: ov.attendanceToday?.present || 0,
              absent: ov.attendanceToday?.absent || 0,
              percentage: ov.attendanceToday?.percentage || 0,
            },
            pendingFees: ov.pendingFees || 0,
            recentAdmissions: ov.recentAdmissions || 0,
            totalStaff: ov.totalStaff || 0,
          },
          attendanceOverview: data.attendanceOverview || null,
          feeStats: data.feeStats || null,
          recentActivities: data.recentActivities || [],
          upcomingEvents: data.upcomingEvents || [],
        });
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
    fetchInstitutionData();
  }, []);

  const fetchInstitutionData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      let institutionId = null;
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        institutionId = userData.institutionId;
      }
      
      if (!institutionId) {
        console.error('Institution ID not found');
        return;
      }

      const response = await institutionSetupService.getInstitutionDetails(institutionId) as any;
      setInstitution(response.data.institution);
    } catch (error: any) {
      console.error('Error fetching institution data:', error);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatDate = (dateString: string) => {
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
          <button
            className="btn btn-outline-danger ms-3"
            onClick={fetchDashboardData}
          >
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

  const { overview, attendanceOverview, feeStats, recentActivities, upcomingEvents } = dashboardData;

  // Safety checks
  const safeOverview = overview || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeStudents: 0,
    attendanceToday: { present: 0, absent: 0, percentage: 0 },
    pendingFees: 0,
    recentAdmissions: 0,
    totalStaff: 0,
  };

  const safeRecentActivities = recentActivities || [];
  const safeAttendanceOverview = attendanceOverview || {
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0
  };
  
  // Ensure feeStats exists with safe values
  const safeFeeStats = (feeStats && typeof feeStats === 'object') ? feeStats : {
    collected: 0,
    pending: 0,
    collectionRate: 0
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Principal Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Principal</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button
            className="btn btn-outline-light bg-white btn-icon me-2"
            onClick={handleRefresh}
            title="Refresh"
          >
            <i className="ti ti-refresh"></i>
          </button>
          <Link to="/dashboard/principal/fees-report" className="btn btn-primary">
            <i className="ti ti-report-analytics me-1"></i>View Reports
          </Link>
        </div>
      </div>

      {/* INSTITUTION DETAILS */}
      {institution && (
        <div className="card mb-4 border-primary">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="ti ti-building me-2"></i>Institution Details</h5>
            <span className="badge bg-light text-primary">Code: {institution.instituteCode}</span>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h4 className="text-primary mb-2">{institution.name}</h4>
                <p className="text-muted mb-1">
                  <i className="ti ti-map-pin me-2"></i>
                  {institution.address ? `${institution.address}, ` : ''}
                  {institution.city ? `${institution.city}, ` : ''}
                  {institution.state ? `${institution.state}, ` : ''}
                  {institution.country || 'India'}
                </p>
                <p className="text-muted mb-1">
                  <i className="ti ti-mail me-2"></i>{institution.email}
                </p>
                <p className="text-muted mb-0">
                  <i className="ti ti-phone me-2"></i>{institution.phone}
                </p>
              </div>
              <div className="col-md-6 text-md-end">
                <div className="mb-2">
                  <span className="text-muted">Type:</span>
                  <span className="badge bg-info ms-2">{institution.type}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted">Status:</span>
                  <span className={`badge ms-2 ${institution.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                    {institution.status}
                  </span>
                </div>
                {institution.subscription && (
                  <div className="mb-0">
                    <span className="text-muted">Plan:</span>
                    <span className="badge bg-primary ms-2">{institution.subscription.planName}</span>
                    <small className="text-muted d-block mt-1">
                      Expires: {formatDate(institution.subscription.endDate)}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW STATS */}
      <div className="row mb-4">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Total Students</h6>
                  <h3 className="mb-0">{safeOverview.totalStudents || 0}</h3>
                  <small className="text-success">
                    <i className="ti ti-arrow-up me-1"></i>
                    {safeOverview.activeStudents || 0} Active
                  </small>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent flex-shrink-0">
                  <i className="ti ti-users fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Total Teachers</h6>
                  <h3 className="mb-0">{safeOverview.totalTeachers || 0}</h3>
                  <small className="text-muted">Teaching Staff</small>
                </div>
                <div className="avatar avatar-lg bg-success-transparent flex-shrink-0">
                  <i className="ti ti-user-check fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Total Classes</h6>
                  <h3 className="mb-0">{safeOverview.totalClasses || 0}</h3>
                  <small className="text-muted">Active Classes</small>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent flex-shrink-0">
                  <i className="ti ti-school fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Attendance Today</h6>
                  <h3 className="mb-0">{safeOverview.attendanceToday?.percentage || 0}%</h3>
                  <small className="text-success">
                    {safeOverview.attendanceToday?.present || 0} Present
                  </small>
                </div>
                <div className="avatar avatar-lg bg-info-transparent flex-shrink-0">
                  <i className="ti ti-calendar-check fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="row mb-4">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Pending Fees</h6>
                  <h3 className="mb-0">{safeOverview.pendingFees || 0}</h3>
                  <small className="text-danger">Requires Action</small>
                </div>
                <div className="avatar avatar-lg bg-danger-transparent flex-shrink-0">
                  <i className="ti ti-currency-dollar fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Recent Admissions</h6>
                  <h3 className="mb-0">{safeOverview.recentAdmissions || 0}</h3>
                  <small className="text-muted">Last 7 Days</small>
                </div>
                <div className="avatar avatar-lg bg-purple-transparent flex-shrink-0">
                  <i className="ti ti-user-plus fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {feeStats && (
          <>
            <div className="col-xl-3 col-sm-6 d-flex">
              <div className="card flex-fill animate-card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="overflow-hidden">
                      <h6 className="text-muted mb-2">Fees Collected</h6>
                      <h3 className="mb-0">{formatCurrency(safeFeeStats.collected || 0)}</h3>
                      <small className="text-success">This Month</small>
                    </div>
                    <div className="avatar avatar-lg bg-success-transparent flex-shrink-0">
                      <i className="ti ti-cash fs-24"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 d-flex">
              <div className="card flex-fill animate-card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="overflow-hidden">
                      <h6 className="text-muted mb-2">Collection Rate</h6>
                      <h3 className="mb-0">{safeFeeStats.collectionRate || 0}%</h3>
                      <small className="text-muted">Overall</small>
                    </div>
                    <div className="avatar avatar-lg bg-info-transparent flex-shrink-0">
                      <i className="ti ti-chart-line fs-24"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MAIN CONTENT ROW */}
      <div className="row">
        {/* ATTENDANCE OVERVIEW */}
        {attendanceOverview && (
          <div className="col-xxl-6 col-xl-12 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0">Attendance Overview</h5>
                <Link to="/attendance" className="btn btn-sm btn-outline-primary">View Details</Link>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-6 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-success mb-1">{safeAttendanceOverview.present || 0}</h4>
                      <small className="text-muted">Present</small>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-danger mb-1">{safeAttendanceOverview.absent || 0}</h4>
                      <small className="text-muted">Absent</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-warning mb-1">{safeAttendanceOverview.late || 0}</h4>
                      <small className="text-muted">Late</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-info mb-1">{safeAttendanceOverview.halfDay || 0}</h4>
                      <small className="text-muted">Half Day</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPCOMING EVENTS */}
        <div className="col-xxl-6 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Upcoming Events</h5>
              <Link to="/events" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="list-group list-group-flush">
                  {upcomingEvents.map((event: any) => (
                    <div key={event.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{event.title}</h6>
                          <small className="text-muted text-capitalize">{event.type}</small>
                        </div>
                        <span className="badge badge-soft-info">
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
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      {safeRecentActivities && safeRecentActivities.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Recent Activities</h5>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  {safeRecentActivities.slice(0, 10).map((activity: any, index: number) => {
                    // Safety check for activity object
                    const safeActivity = activity || {};
                    return (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className="avatar avatar-sm bg-light rounded me-2 flex-shrink-0">
                          <i className="ti ti-activity fs-14"></i>
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1">{safeActivity.description || safeActivity.activity}</p>
                          <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            {formatDate(safeActivity.timestamp || safeActivity.createdAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                    );
                  })
                }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/students" className="card border-0 border-bottom border-primary border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-primary rounded mb-2 mx-auto">
                        <i className="ti ti-users fs-24"></i>
                      </div>
                      <h6 className="mb-0">Students</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/teachers" className="card border-0 border-bottom border-success border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-success rounded mb-2 mx-auto">
                        <i className="ti ti-user-check fs-24"></i>
                      </div>
                      <h6 className="mb-0">Teachers</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/attendance/student" className="card border-0 border-bottom border-warning border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-warning rounded mb-2 mx-auto">
                        <i className="ti ti-calendar-check fs-24"></i>
                      </div>
                      <h6 className="mb-0">Attendance</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/classes" className="card border-0 border-bottom border-dark border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-dark rounded mb-2 mx-auto">
                        <i className="ti ti-clipboard-text fs-24"></i>
                      </div>
                      <h6 className="mb-0">Classes</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/fees-collection" className="card border-0 border-bottom border-info border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-info rounded mb-2 mx-auto">
                        <i className="ti ti-currency-dollar fs-24"></i>
                      </div>
                      <h6 className="mb-0">Fees</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/transport/routes" className="card border-0 border-bottom border-secondary border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-secondary rounded mb-2 mx-auto">
                        <i className="ti ti-bus fs-24"></i>
                      </div>
                      <h6 className="mb-0">Transport</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/hostel/rooms" className="card border-0 border-bottom border-warning border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-warning rounded mb-2 mx-auto">
                        <i className="ti ti-building-community fs-24"></i>
                      </div>
                      <h6 className="mb-0">Hostel</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/principal/fees-report" className="card border-0 border-bottom border-danger border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-danger rounded mb-2 mx-auto">
                        <i className="ti ti-report-analytics fs-24"></i>
                      </div>
                      <h6 className="mb-0">Reports</h6>
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
