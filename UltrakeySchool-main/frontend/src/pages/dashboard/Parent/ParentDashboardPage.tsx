import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import { useAuth } from '../../../store/authStore';
import InstitutionDetailsCard from '../../../components/dashboard/InstitutionDetailsCard';

interface Child {
  id: string;
  name: string;
  class?: string;
  classId?: string;
  section?: string;
  sectionId?: string;
  avatar?: string;
  relationship?: string;
  attendance: string;
  fees: { total: number; paid: number; pending: number };
  todayTimetable: any[];
}

interface DashboardData {
  parent: { id: string; childrenCount: number };
  children: Child[];
  feeStatus: { total: number; paid: number; pending: number };
  upcomingEvents: any[];
  notices: any[];
  notifications: any[];
  ptmSlots: any[];
}

const RELATIONSHIP_BADGES: Record<string, { label: string; color: string }> = {
  father: { label: 'Father', color: 'primary' },
  mother: { label: 'Mother', color: 'danger' },
  guardian: { label: 'Guardian', color: 'secondary' },
  grandparent: { label: 'Grandparent', color: 'info' },
  sibling: { label: 'Sibling', color: 'warning' },
  other: { label: 'Other', color: 'dark' },
};

const ParentDashboardPage = () => {
  const { user, institutionData, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is still authenticated before making the call
      if (!isAuthenticated) {
        setError('Your session has expired. Please login again.');
        setLoading(false);
        return;
      }

      const response = await apiClient.get('/dashboard/parent');

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
      
      // If 401 unauthorized, session might have expired
      if (status === 401) {
        setError('Your session has expired. Please login again to continue.');
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated]);

  const handleRefresh = () => fetchDashboardData();

  const markNotifAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setDashboardData(prev => prev ? {
        ...prev,
        notifications: prev.notifications.map((n: any) =>
          n.id === id || n._id === id ? { ...n, read: true } : n
        )
      } : prev);
    } catch { /* ignore */ }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0
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
          <i className="ti ti-alert-circle me-2 fs-4"></i>            <div>
            <h5 className="alert-heading">Error Loading Dashboard</h5>
            <p className="mb-0">{error}</p>
          </div>
          <div className="d-flex gap-2 ms-3">
            <button className="btn btn-outline-danger" onClick={fetchDashboardData}>
              <i className="ti ti-refresh me-1"></i>Retry
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/login', { replace: true })}>
              <i className="ti ti-login me-1"></i>Re-login
            </button>
          </div>
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

  const { parent, children, feeStatus, upcomingEvents, notices, notifications, ptmSlots } = dashboardData;

  return (
    <div>
      <InstitutionDetailsCard institution={institutionData || user?.institutionData} userRole={user?.role} />

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
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={handleRefresh} title="Refresh">
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
                  {children.map((child) => {
                    const relBadge = RELATIONSHIP_BADGES[child.relationship || ''] || RELATIONSHIP_BADGES.guardian;
                    const fees = child.fees || { total: 0, paid: 0, pending: 0 };
                    return (
                      <div key={child.id} className="col-xl-4 col-md-6">
                        <div className="card border h-100">
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex align-items-center mb-3">
                              <div className="avatar avatar-lg rounded me-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                                <i className="ti ti-user fs-20 text-muted"></i>
                              </div>
                              <div className="min-w-0">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <h5 className="mb-0 text-truncate">{child.name}</h5>
                                  <span className={`badge bg-${relBadge.color} badge-sm`}>{relBadge.label}</span>
                                </div>
                                <p className="text-muted mb-0 small">
                                  Class: {child.class || 'N/A'} {child.section ? `, Sec ${child.section}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-4">
                                <div className="border rounded p-1 text-center">
                                  <small className="text-success d-block fw-bold">{child.attendance}%</small>
                                  <small className="text-muted">Attend</small>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="border rounded p-1 text-center">
                                  {fees.pending > 0 ? (
                                    <small className="text-danger d-block fw-bold">{formatCurrency(fees.pending)}</small>
                                  ) : (
                                    <small className="text-success d-block fw-bold">
                                      <i className="ti ti-circle-check"></i>
                                    </small>
                                  )}
                                  <small className="text-muted">Due</small>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="border rounded p-1 text-center">
                                  <small className="text-primary d-block fw-bold">{formatCurrency(fees.paid)}</small>
                                  <small className="text-muted">Paid</small>
                                </div>
                              </div>
                            </div>

                            {child.todayTimetable && child.todayTimetable.length > 0 && (
                              <div className="border rounded p-2 mb-2 bg-light" style={{ fontSize: '0.75rem' }}>
                                <small className="fw-bold text-muted d-block mb-1">
                                  <i className="ti ti-calendar me-1"></i>Today's Schedule
                                </small>
                                {child.todayTimetable.slice(0, 3).map((tt: any, i: number) => (
                                  <div key={i} className="d-flex justify-content-between small">
                                    <span>{tt.subjectId?.name || `Period ${i + 1}`}</span>
                                    <span className="text-muted">{tt.startTime || ''} - {tt.endTime || ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-auto d-flex flex-wrap gap-1">
                              <Link to={`/dashboard/parent/child/${child.id}`} className="btn btn-sm btn-outline-primary flex-fill" title="Profile">
                                <i className="ti ti-user"></i> Profile
                              </Link>
                              <Link to={`/dashboard/parent/child/${child.id}/timetable`} className="btn btn-sm btn-outline-info flex-fill" title="Timetable">
                                <i className="ti ti-calendar"></i> Today
                              </Link>
                              <Link to={`/dashboard/parent/child/${child.id}/fees`} className="btn btn-sm btn-outline-success flex-fill" title="Fees">
                                <i className="ti ti-coin"></i> Fees
                              </Link>
                              <Link to={`/dashboard/parent/child/${child.id}/attendance`} className="btn btn-sm btn-outline-secondary flex-fill" title="Attendance">
                                <i className="ti ti-checklist"></i> Attend
                              </Link>
                              <Link to={`/dashboard/parent/child/${child.id}/results`} className="btn btn-sm btn-outline-warning flex-fill" title="Results">
                                <i className="ti ti-report"></i> Results
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-users-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No children linked to your account</p>
                  <p className="text-muted small">Contact the school administration to link your children.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FEE STATUS SUMMARY */}
      {feeStatus && (
        <div className="row mb-4">
          <div className="col-xl-4 col-sm-6">
            <div className="card animate-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted mb-2">Total Fees</h6>
                    <h3 className="mb-0">{formatCurrency(feeStatus.total || 0)}</h3>
                  </div>
                  <div className="avatar avatar-lg bg-primary-transparent flex-shrink-0">
                    <i className="ti ti-currency-rupee fs-24"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4 col-sm-6">
            <div className="card animate-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
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
                  <div>
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
                        <div>
                          <h6 className="mb-1">{event.title}</h6>
                          <small className="text-muted text-capitalize">{event.type}</small>
                        </div>
                        <span className="badge badge-soft-info">{formatDate(event.date)}</span>
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
                        <div>
                          <h6 className="mb-1">Meeting with {slot.teacher}</h6>
                          <small className="text-muted"><i className="ti ti-clock me-1"></i>{slot.time}</small>
                        </div>
                        <span className="badge badge-soft-success">{formatDate(slot.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-calendar-time fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No upcoming PTM slots</p>
                  <Link to="/ptm" className="btn btn-sm btn-primary mt-2">Book a Slot</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* THIRD ROW - Notice Board + Notifications */}
      <div className="row">
        <div className="col-xxl-6 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Notice Board</h5>
              <Link to="/notice-board" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {notices && notices.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notices.map((notice: any) => (
                    <div key={notice._id} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className="avatar avatar-md bg-danger-transparent rounded me-2 flex-shrink-0">
                          <i className="ti ti-bell-ringing fs-16 text-danger"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{notice.title}</h6>
                          <p className="text-muted mb-0 small text-truncate">{notice.description}</p>
                          <small className="text-muted mt-1 d-block">
                            <i className="ti ti-calendar me-1"></i>{formatDate(notice.noticeDate)}
                            {notice.priority === 'urgent' && <span className="badge bg-danger ms-2">Urgent</span>}
                            {notice.priority === 'high' && <span className="badge bg-warning text-dark ms-2">High</span>}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-bell-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No notices available</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-xxl-6 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Notifications</h5>
            </div>
            <div className="card-body">
              {notifications && notifications.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {notifications.slice(0, 5).map((notification: any) => {
                    const notifId = notification.id || notification._id;
                    const isUnread = notification.read === false;
                    return (
                      <div key={notifId} className={`card border mb-0 ${isUnread ? 'bg-light border-primary' : ''}`}>
                        <div className="card-body p-3">
                          <div className="d-flex align-items-start gap-2">
                            <span className={`avatar avatar-md flex-shrink-0 rounded ${isUnread ? 'bg-primary-transparent' : 'bg-secondary-transparent'} d-flex align-items-center justify-content-center`} style={{ width: 36, height: 36 }}>
                              <i className={`ti ti-bell ${isUnread ? 'text-primary' : 'text-muted'}`}></i>
                            </span>
                            <div className="flex-grow-1 min-w-0">
                              <div className="d-flex justify-content-between align-items-start">
                                <h6 className={`mb-1 small ${isUnread ? 'fw-bold' : ''}`}>{notification.title}</h6>
                                {isUnread && <span className="badge bg-primary rounded-pill" style={{ width: 6, height: 6, padding: 0, minWidth: 6 }} />}
                              </div>
                              <p className="text-muted mb-1 small">{notification.message}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted"><i className="ti ti-clock me-1"></i>{formatDate(notification.timestamp || notification.createdAt)}</small>
                                {isUnread && (
                                  <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => markNotifAsRead(notifId)}>
                                    <i className="ti ti-check me-1"></i>Read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* PER-CHILD FEE BREAKDOWN */}
      {children && children.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Per-Child Fee Breakdown</h5>
              </div>
              <div className="card-body p-0 py-3">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Child Name</th>
                        <th>Relation</th>
                        <th>Class</th>
                        <th>Total Fees</th>
                        <th>Paid</th>
                        <th>Pending</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map((child) => {
                        const fees = child.fees || { total: 0, paid: 0, pending: 0 };
                        const relBadge = RELATIONSHIP_BADGES[child.relationship || ''] || RELATIONSHIP_BADGES.guardian;
                        const allPaid = fees.pending <= 0 && fees.total > 0;
                        return (
                          <tr key={child.id}>
                            <td className="fw-medium">{child.name}</td>
                            <td><span className={`badge bg-${relBadge.color}`}>{relBadge.label}</span></td>
                            <td>{child.class || 'N/A'}</td>
                            <td>{formatCurrency(fees.total)}</td>
                            <td className="text-success">{formatCurrency(fees.paid)}</td>
                            <td className={fees.pending > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(fees.pending)}</td>
                            <td>
                              {fees.total === 0 ? (
                                <span className="badge bg-secondary">No Fees</span>
                              ) : allPaid ? (
                                <span className="badge bg-success">Clear</span>
                              ) : (
                                <span className="badge bg-warning text-dark">Due</span>
                              )}
                            </td>
                            <td>
                              <Link to={`/dashboard/parent/child/${child.id}/fees`} className="btn btn-sm btn-outline-primary">
                                <i className="ti ti-coin me-1"></i>Pay
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
