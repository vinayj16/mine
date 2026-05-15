import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import InstitutionHeader from '../../../components/common/InstitutionHeader';

interface Child {
  id: string;
  name: string;
  class?: string;
  section?: string;
  avatar?: string;
  attendance: number;
  grades: number;
  rank: number;
  totalStudents: number;
}

interface DashboardData {
  parent: {
    id: string;
    childrenCount: number;
  };
  children: Child[];
  feeStatus: any;
  upcomingEvents: any[];
  messages: any[];
  notifications: any[];
  ptmSlots: any[];
}

const ParentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/dashboard/parent');

      if (response.data.success) {
        setDashboardData(response.data.data);
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

  const { parent, children, feeStatus, upcomingEvents, messages, notifications, ptmSlots } = dashboardData;

  return (
    <div>
      <InstitutionHeader showFullDetails={false} />
      
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Parent Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Parent</li>
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
        </div>
      </div>

      {/* CHILDREN OVERVIEW */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">My Children ({parent.childrenCount})</h5>
            </div>
            <div className="card-body">
              {children && children.length > 0 ? (
                <div className="row g-3">
                  {children.map((child) => (
                    <div key={child.id} className="col-xl-4 col-md-6">
                      <div className="card border">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            {child.avatar ? (
                              <img
                                src={child.avatar}
                                className="avatar avatar-lg rounded me-3"
                                alt={child.name}
                              />
                            ) : (
                              <div className="avatar avatar-lg rounded me-3 bg-light d-flex align-items-center justify-content-center">
                                <i className="ti ti-user fs-20 text-muted"></i>
                              </div>
                            )}
                            <div>
                              <h5 className="mb-1">{child.name}</h5>
                              <p className="text-muted mb-0">
                                Class: {child.class || 'N/A'} {child.section ? `, ${child.section}` : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="row g-2">
                            <div className="col-6">
                              <div className="border rounded p-2 text-center">
                                <h6 className="text-success mb-1">{child.attendance}%</h6>
                                <small className="text-muted">Attendance</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="border rounded p-2 text-center">
                                <h6 className="text-primary mb-1">{child.grades}%</h6>
                                <small className="text-muted">Avg Grade</small>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="border rounded p-2 text-center">
                                <h6 className="text-warning mb-1">
                                  Rank {child.rank} / {child.totalStudents}
                                </h6>
                                <small className="text-muted">Class Rank</small>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <Link to={`/student/${child.id}`} className="btn btn-sm btn-outline-primary w-100">
                              <i className="ti ti-eye me-1"></i>View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-users-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No children found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FEE STATUS */}
      {feeStatus && (
        <div className="row mb-4">
          <div className="col-xl-4 col-sm-6">
            <div className="card animate-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="overflow-hidden">
                    <h6 className="text-muted mb-2">Total Fees</h6>
                    <h3 className="mb-0">{formatCurrency(feeStatus.total || 0)}</h3>
                  </div>
                  <div className="avatar avatar-lg bg-primary-transparent flex-shrink-0">
                    <i className="ti ti-currency-dollar fs-24"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-sm-6">
            <div className="card animate-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="overflow-hidden">
                    <h6 className="text-muted mb-2">Paid</h6>
                    <h3 className="mb-0 text-success">{formatCurrency(feeStatus.paid || 0)}</h3>
                  </div>
                  <div className="avatar avatar-lg bg-success-transparent flex-shrink-0">
                    <i className="ti ti-check fs-24"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-sm-6">
            <div className="card animate-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="overflow-hidden">
                    <h6 className="text-muted mb-2">Pending</h6>
                    <h3 className="mb-0 text-danger">{formatCurrency(feeStatus.pending || 0)}</h3>
                  </div>
                  <div className="avatar avatar-lg bg-danger-transparent flex-shrink-0">
                    <i className="ti ti-alert-circle fs-24"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT ROW */}
      <div className="row">
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

        {/* PTM SLOTS */}
        <div className="col-xxl-6 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Upcoming PTM Slots</h5>
              <Link to="/ptm" className="btn btn-sm btn-outline-primary">Book Slot</Link>
            </div>
            <div className="card-body">
              {ptmSlots && ptmSlots.length > 0 ? (
                <div className="list-group list-group-flush">
                  {ptmSlots.map((slot: any) => (
                    <div key={slot.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">Meeting with {slot.teacher}</h6>
                          <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            {slot.time}
                          </small>
                        </div>
                        <span className="badge badge-soft-success">
                          {formatDate(slot.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-calendar-time fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No upcoming PTM slots</p>
                  <Link to="/ptm" className="btn btn-sm btn-primary mt-2">
                    Book a Slot
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="row">
        {/* RECENT MESSAGES */}
        <div className="col-xxl-6 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recent Messages</h5>
              <Link to="/messages" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {messages && messages.length > 0 ? (
                <div className="list-group list-group-flush">
                  {messages.map((message: any, index: number) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className="avatar avatar-md bg-primary-transparent rounded me-2 flex-shrink-0">
                          <i className="ti ti-message fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{message.subject || message.title}</h6>
                          <p className="text-muted mb-1 small">{message.preview || message.message}</p>
                          <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            {formatDate(message.timestamp || message.createdAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-message-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No recent messages</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="col-xxl-6 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Notifications</h5>
              <Link to="/notifications" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {notifications && notifications.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notifications.map((notification: any) => (
                    <div key={notification.id} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className="avatar avatar-md bg-warning-transparent rounded me-2 flex-shrink-0">
                          <i className="ti ti-bell fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{notification.title}</h6>
                          <p className="text-muted mb-1 small">{notification.message}</p>
                          <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            {formatDate(notification.timestamp)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-bell-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  <Link to="/fees/pay" className="card border-0 border-bottom border-primary border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-primary rounded mb-2 mx-auto">
                        <i className="ti ti-currency-dollar fs-24"></i>
                      </div>
                      <h6 className="mb-0">Pay Fees</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/attendance" className="card border-0 border-bottom border-success border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-success rounded mb-2 mx-auto">
                        <i className="ti ti-calendar-check fs-24"></i>
                      </div>
                      <h6 className="mb-0">Attendance</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/results" className="card border-0 border-bottom border-warning border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-warning rounded mb-2 mx-auto">
                        <i className="ti ti-report-analytics fs-24"></i>
                      </div>
                      <h6 className="mb-0">Results</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/timetable" className="card border-0 border-bottom border-dark border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-dark rounded mb-2 mx-auto">
                        <i className="ti ti-calendar fs-24"></i>
                      </div>
                      <h6 className="mb-0">Timetable</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/leave/apply" className="card border-0 border-bottom border-info border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-info rounded mb-2 mx-auto">
                        <i className="ti ti-calendar-event fs-24"></i>
                      </div>
                      <h6 className="mb-0">Apply Leave</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/ptm" className="card border-0 border-bottom border-danger border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-danger rounded mb-2 mx-auto">
                        <i className="ti ti-users fs-24"></i>
                      </div>
                      <h6 className="mb-0">Book PTM</h6>
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

export default ParentDashboardPage;
