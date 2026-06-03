import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import { useAuth } from '../../../store/authStore'
import InstitutionDetailsCard from '../../../components/dashboard/InstitutionDetailsCard'

import TodoWidget from '../../../components/dashboard/TodoWidget'
import NoticeBoardWidget from '../../../components/dashboard/NoticeBoardWidget'
import { getImageUrl } from '../../../utils/imageUtils'

interface DashboardData {
  student: {
    id: string;
    name: string;
    class?: string;
    section?: string;
    rollNumber?: string;
    avatar?: string;
  };
  quickStats: {
    attendance: number;
    pendingAssignments: number;
    feeStatus: string;
    unreadMessages: number;
  };
  todaySchedule: any[];
  pendingAssignments: any[];
  feeStatus: any;
  notifications: any[];
  upcomingEvents: any[];
}



const StudentDashboard = () => {
  const { user, institutionData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState('rzp_test_123456789');


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/dashboard/student');

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err: any) {
      // 401 errors are expected for non-student users - don't show toast
      if (err.response?.status === 401) {
        console.warn('[StudentDashboard] Unauthorized - not a student user');
        setError('Please log in as a student to view this dashboard.');
      } else {
        console.error('Error fetching dashboard data:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFees = async () => {
    try {
      const response = await apiClient.get('/fees/my');
      if (response.data.success) {
        setFees(response.data.data || []);
      }
    } catch (err: any) {
      // 401 is expected for non-student users - ignore silently
      if (err.response?.status !== 401) {
        console.error('Error fetching fees:', err);
      }
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchDashboardData(), fetchFees()]);
  };

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchPaymentConfig = async () => {
    try {
      const res = await apiClient.get('/fees/payment-config');
      if (res.data.success && res.data.data?.razorpayKey) {
        setRazorpayKey(res.data.data.razorpayKey);
      }
    } catch {
      // use default test key
    }
  };

  const handlePayFee = async (fee: any) => {
    if (fee.status === 'paid') return;
    setPayingFeeId(fee._id);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load payment gateway');
        return;
      }

      const payRes = await apiClient.post(`/fees/invoices/${fee._id}/pay`, {
        paymentMethod: 'online',
        amount: fee.remainingAmount || fee.amount
      });

      if (!payRes.data.success) {
        throw new Error(payRes.data.message || 'Payment initiation failed');
      }

      const { payment_id, razorpay_key } = payRes.data.data;
      const key = razorpay_key || razorpayKey;

      const options = {
        key,
        amount: Math.round((fee.remainingAmount || fee.amount) * 100),
        currency: 'INR',
        name: institutionData?.name || 'School Fees',
        description: `${fee.feeType || 'Fee'} payment`,
        order_id: payment_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await apiClient.post('/fees/payments/verify', {
              paymentId: payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            if (verifyRes.data.success) {
              toast.success('Payment successful!');
              fetchFees();
              fetchDashboardData();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: { color: '#3b82f6' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setPayingFeeId(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchFees();
    fetchPaymentConfig();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds for realtime updates

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    refreshData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
      <InstitutionDetailsCard 
        institution={institutionData || user?.institutionData} 
        userRole={user?.role}
      />
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

  const student = dashboardData?.student || {
    id: '',
    name: 'Loading...',
    class: '',
    section: '',
    rollNumber: '',
    avatar: ''
  };
  const quickStats = dashboardData?.quickStats || {
    attendance: 0,
    pendingAssignments: 0,
    feeStatus: 'Loading...',
    unreadMessages: 0
  };
  const todaySchedule = dashboardData?.todaySchedule || [];
  const pendingAssignments = dashboardData?.pendingAssignments || [];
  const notifications = dashboardData?.notifications || [];
  const upcomingEvents = dashboardData?.upcomingEvents || [];

  return (
    <div>
      <InstitutionDetailsCard 
        institution={institutionData || user?.institutionData} 
        userRole={user?.role}
      />
      
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Student Dashboard</li>
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

      <div className="row mb-4">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2 fw-semibold">Attendance</h6>
                  <h3 className="mb-0 fw-bold">{quickStats.attendance}%</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent flex-shrink-0 rounded-circle" style={{ width: '50px', height: '50px' }}>
                  <i className="ti ti-calendar-check fs-24 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2 fw-semibold">Pending Assignments</h6>
                  <h3 className="mb-0 fw-bold">{quickStats.pendingAssignments}</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent flex-shrink-0 rounded-circle" style={{ width: '50px', height: '50px' }}>
                  <i className="ti ti-book fs-24 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2 fw-semibold">Fee Status</h6>
                  <h3 className="mb-0 fw-bold text-capitalize">{quickStats.feeStatus}</h3>
                </div>
                <div className="avatar avatar-lg bg-success-transparent flex-shrink-0 rounded-circle" style={{ width: '50px', height: '50px' }}>
                  <i className="ti ti-currency-rupee fs-24 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2 fw-semibold">Unread Messages</h6>
                  <h3 className="mb-0 fw-bold">{quickStats.unreadMessages}</h3>
                </div>
                <div className="avatar avatar-lg bg-danger-transparent flex-shrink-0 rounded-circle" style={{ width: '50px', height: '50px' }}>
                  <i className="ti ti-message fs-24 text-danger"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                {student.avatar ? (
                  <img
                    src={getImageUrl(student.avatar)}
                    className="avatar avatar-xxl rounded-circle me-3"
                    alt={student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}
                    style={{ width: '80px', height: '80px' }}
                  />
                ) : (
                  <div className="avatar avatar-xxl rounded-circle me-3 bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <i className="ti ti-user fs-24 text-muted"></i>
                  </div>
                )}
                <div>
                  <h4 className="mb-1 fw-bold">{student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}</h4>
                  <p className="text-muted mb-1">
                    <i className="ti ti-building me-1"></i>
                    Class: {student.class || 'N/A'} {student.section ? `, ${student.section}` : ''}
                  </p>
                  {student.rollNumber && (
                    <p className="text-muted mb-0">
                      <i className="ti ti-hash me-1"></i>
                      Roll No: {student.rollNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2">
                <Link to="/dashboard/student/profile" className="btn btn-primary flex-fill rounded-pill">
                  <i className="ti ti-user me-1"></i>View Profile
                </Link>
                <Link to="/dashboard/student/profile" className="btn btn-outline-primary flex-fill rounded-pill">
                  <i className="ti ti-edit me-1"></i>Edit
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-header bg-white">
              <h5 className="card-title mb-0 fw-bold">Today&apos;s Schedule</h5>
            </div>
            <div className="card-body">
              {todaySchedule && todaySchedule.length > 0 ? (
                <div className="list-group list-group-flush">
                  {todaySchedule.slice(0, 5).map((schedule: any, index: number) => (
                    <div key={index} className="list-group-item px-0 border-0">
                      <div className="d-flex align-items-center p-2 rounded hover-bg-light" style={{ transition: 'background 0.2s' }}>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{schedule.subject || schedule.title}</h6>
                          <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            {schedule.startTime} - {schedule.endTime}
                          </small>
                        </div>
                        {schedule.teacher && (
                          <small className="text-muted fw-semibold">{schedule.teacher}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="avatar avatar-lg bg-light rounded-circle mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="ti ti-calendar-off fs-24 text-muted"></i>
                  </div>
                  <p className="text-muted mb-0">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-bold">Pending Assignments</h5>
              <Link to="/dashboard/student/homework" className="btn btn-sm btn-primary rounded-pill">View All</Link>
            </div>
            <div className="card-body">
              {pendingAssignments && pendingAssignments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {pendingAssignments.slice(0, 5).map((assignment: any) => (
                    <div key={assignment.id} className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between align-items-start p-2 rounded hover-bg-light" style={{ transition: 'background 0.2s' }}>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{assignment.title}</h6>
                          <small className="text-muted">{assignment.subject}</small>
                        </div>
                        <span className="badge bg-warning text-dark rounded-pill">
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="avatar avatar-lg bg-light rounded-circle mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="ti ti-clipboard-check fs-24 text-muted"></i>
                  </div>
                  <p className="text-muted mb-0">No pending assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-bold">Recent Notifications</h5>
              <Link to="/notifications" className="btn btn-sm btn-outline-primary rounded-pill">View All</Link>
            </div>
            <div className="card-body">
              {notifications && notifications.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notifications.map((notification: any) => (
                    <div key={notification.id} className="list-group-item px-0 border-0">
                      <div className="d-flex align-items-start p-2 rounded hover-bg-light" style={{ transition: 'background 0.2s' }}>
                        <div className="avatar avatar-md bg-primary rounded-circle me-3 flex-shrink-0" style={{ width: '45px', height: '45px' }}>
                          <i className="ti ti-bell fs-16 text-white"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{notification.title}</h6>
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
                <div className="text-center py-4">
                  <div className="avatar avatar-lg bg-light rounded-circle mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="ti ti-bell-off fs-24 text-muted"></i>
                  </div>
                  <p className="text-muted mb-0">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-bold">Upcoming Events</h5>
              <Link to="/events" className="btn btn-sm btn-outline-primary rounded-pill">View All</Link>
            </div>
            <div className="card-body">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="list-group list-group-flush">
                  {upcomingEvents.map((event: any) => (
                    <div key={event.id} className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between align-items-start p-2 rounded hover-bg-light" style={{ transition: 'background 0.2s' }}>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{event.title}</h6>
                          <small className="text-muted text-capitalize">{event.type}</small>
                        </div>
                        <span className="badge bg-info text-white rounded-pill">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="avatar avatar-lg bg-light rounded-circle mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="ti ti-calendar-event fs-24 text-muted"></i>
                  </div>
                  <p className="text-muted mb-0">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-xxl-6 d-flex">
          <TodoWidget limit={5} />
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-bold">My Fees</h5>
              <Link to="/dashboard/student/fees" className="btn btn-sm btn-primary rounded-pill">View All</Link>
            </div>
            <div className="card-body">
              {fees && fees.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th className="fw-semibold">Fee Type</th>
                        <th className="fw-semibold">Amount</th>
                        <th className="fw-semibold">Due Date</th>
                        <th className="fw-semibold">Status</th>
                        <th className="fw-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.slice(0, 5).map((fee: any) => (
                        <tr key={fee._id}>
                          <td className="text-capitalize fw-medium">{fee.feeType}</td>
                          <td className="fw-semibold">₹{fee.remainingAmount ?? fee.amount}</td>
                          <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge rounded-pill ${
                              fee.status === 'paid' ? 'bg-success' : 
                              fee.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                            }`}>
                              {fee.status}
                            </span>
                          </td>
                          <td>
                            {fee.status !== 'paid' && (
                              <button
                                className="btn btn-sm btn-primary rounded-pill"
                                disabled={payingFeeId === fee._id}
                                onClick={() => handlePayFee(fee)}
                                style={{ padding: '4px 12px' }}
                              >
                                {payingFeeId === fee._id ? '...' : 'Pay'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="avatar avatar-lg bg-light rounded-circle mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="ti ti-currency-rupee-off fs-24 text-muted"></i>
                  </div>
                  <p className="text-muted mb-0">No fees assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div className="card-header bg-white">
              <h5 className="card-title mb-0 fw-bold">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/student/fees" className="card border-0 h-100 transition-all" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '3px solid #0d6efd' }}>
                    <div className="card-body text-center p-3">
                      <div className="avatar avatar-lg bg-primary rounded-circle mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <i className="ti ti-report-money fs-24 text-white"></i>
                      </div>
                      <h6 className="mb-0 fw-semibold small">Pay Fees</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/student/results" className="card border-0 h-100 transition-all" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '3px solid #198754' }}>
                    <div className="card-body text-center p-3">
                      <div className="avatar avatar-lg bg-success rounded-circle mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <i className="ti ti-hexagonal-prism-plus fs-24 text-white"></i>
                      </div>
                      <h6 className="mb-0 fw-semibold small">Exam Result</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/student/timetable" className="card border-0 h-100 transition-all" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '3px solid #ffc107' }}>
                    <div className="card-body text-center p-3">
                      <div className="avatar avatar-lg bg-warning rounded-circle mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <i className="ti ti-calendar fs-24 text-white"></i>
                      </div>
                      <h6 className="mb-0 fw-semibold small">Calendar</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/student/attendance" className="card border-0 h-100 transition-all" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '3px solid #212529' }}>
                    <div className="card-body text-center p-3">
                      <div className="avatar avatar-lg bg-dark rounded-circle mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <i className="ti ti-calendar-share fs-24 text-white"></i>
                      </div>
                      <h6 className="mb-0 fw-semibold small">Attendance</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/student/homework" className="card border-0 h-100 transition-all" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '3px solid #0dcaf0' }}>
                    <div className="card-body text-center p-3">
                      <div className="avatar avatar-lg bg-info rounded-circle mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <i className="ti ti-book-2 fs-24 text-white"></i>
                      </div>
                      <h6 className="mb-0 fw-semibold small">Homework</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/dashboard/student/library" className="card border-0 h-100 transition-all" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '3px solid #dc3545' }}>
                    <div className="card-body text-center p-3">
                      <div className="avatar avatar-lg bg-danger rounded-circle mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <i className="ti ti-books fs-24 text-white"></i>
                      </div>
                      <h6 className="mb-0 fw-semibold small">Library</h6>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-xxl-12 d-flex">
          <NoticeBoardWidget limit={4} />
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
