import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';

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

interface Module {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

const availableModules: Module[] = [
  { id: 'attendance', name: 'Attendance', icon: 'ti ti-calendar-check', description: 'Track your attendance', enabled: true },
  { id: 'assignments', name: 'Assignments', icon: 'ti ti-book', description: 'View and submit assignments', enabled: true },
  { id: 'examination', name: 'Examination', icon: 'ti ti-file-text', description: 'Check exam schedules and results', enabled: true },
  { id: 'library', name: 'Library', icon: 'ti ti-books', description: 'Access digital library resources', enabled: true },
  { id: 'transport', name: 'Transport', icon: 'ti ti-car', description: 'View transport routes and schedules', enabled: false },
  { id: 'hostel', name: 'Hostel', icon: 'ti ti-building', description: 'Hostel information and facilities', enabled: false },
  { id: 'finance', name: 'Finance', icon: 'ti ti-currency-dollar', description: 'Fee payment and financial records', enabled: true },
  { id: 'hr', name: 'HR', icon: 'ti ti-users', description: 'HR services and information', enabled: false },
  { id: 'inventory', name: 'Inventory', icon: 'ti ti-package', description: 'School inventory management', enabled: false },
];

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>(availableModules.filter(m => m.enabled).map(m => m.id));
  const [fees, setFees] = useState<any[]>([]);

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleModuleSelection = () => {
    const enabledModules = availableModules.filter(m => m.enabled);
    const allSelected = enabledModules.every(m => selectedModules.includes(m.id));
    
    if (allSelected) {
      setSelectedModules([]);
    } else {
      setSelectedModules(enabledModules.map(m => m.id));
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/student-dashboard');

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

  const fetchFees = async () => {
    try {
      const response = await apiClient.get('/api/v1/fees');
      if (response.data.success) {
        setFees(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching fees:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchFees();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
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

  // Module Selection UI
  const ModuleSelection = () => (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title">Module Selection</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={handleModuleSelection}
          >
            <i className="ti ti-checks me-1"></i>
            {selectedModules.length === availableModules.filter(m => m.enabled).length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {availableModules.filter(m => m.enabled).map(module => (
            <div key={module.id} className="col-md-6 col-lg-4">
              <div 
                className={`card border-2 ${selectedModules.includes(module.id) ? 'border-primary' : 'border-light'} cursor-pointer`}
                onClick={() => handleModuleToggle(module.id)}
              >
                <div className="card-body text-center">
                  <div className={`avatar avatar-lg ${selectedModules.includes(module.id) ? 'bg-primary' : 'bg-light'} rounded mb-2 mx-auto`}>
                    <i className={`${module.icon} ${selectedModules.includes(module.id) ? '' : 'text-muted'} fs-24`}></i>
                  </div>
                  <h6 className={`mb-2 ${selectedModules.includes(module.id) ? 'text-primary' : 'text-muted'}`}>{module.name}</h6>
                  <p className="text-muted small mb-0">{module.description}</p>
                  <div className={`form-check ${selectedModules.includes(module.id) ? 'form-check-primary' : ''}`}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedModules.includes(module.id)}
                      onChange={() => handleModuleToggle(module.id)}
                    />
                    <label className="form-check-label">
                      Select this module
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
      <ModuleSelection />
      
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
          <div className="card flex-fill animate-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden">
                  <h6 className="text-muted mb-2">Attendance</h6>
                  <h3 className="mb-0">{quickStats.attendance}%</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent flex-shrink-0">
                  <i className="ti ti-calendar-check fs-24"></i>
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
                  <h6 className="text-muted mb-2">Pending Assignments</h6>
                  <h3 className="mb-0">{quickStats.pendingAssignments}</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent flex-shrink-0">
                  <i className="ti ti-book fs-24"></i>
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
                  <h6 className="text-muted mb-2">Fee Status</h6>
                  <h3 className="mb-0 text-capitalize">{quickStats.feeStatus}</h3>
                </div>
                <div className="avatar avatar-lg bg-success-transparent flex-shrink-0">
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
                  <h6 className="text-muted mb-2">Unread Messages</h6>
                  <h3 className="mb-0">{quickStats.unreadMessages}</h3>
                </div>
                <div className="avatar avatar-lg bg-danger-transparent flex-shrink-0">
                  <i className="ti ti-message fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                {student.avatar ? (
                  <img
                    src={student.avatar}
                    className="avatar avatar-xxl rounded me-3"
                    alt={student.name}
                  />
                ) : (
                  <div className="avatar avatar-xxl rounded me-3 bg-light d-flex align-items-center justify-content-center">
                    <i className="ti ti-user fs-24 text-muted"></i>
                  </div>
                )}
                <div>
                  <h4 className="mb-1">{student.name}</h4>
                  <p className="text-muted mb-1">
                    Class: {student.class || 'N/A'} {student.section ? `, ${student.section}` : ''}
                  </p>
                  {student.rollNumber && (
                    <p className="text-muted mb-0">Roll No: {student.rollNumber}</p>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2">
                <Link to="/student/profile" className="btn btn-primary flex-fill">
                  <i className="ti ti-user me-1"></i>View Profile
                </Link>
                <Link to="/student/edit" className="btn btn-outline-primary flex-fill">
                  <i className="ti ti-edit me-1"></i>Edit
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h5 className="card-title mb-0">Today&apos;s Schedule</h5>
            </div>
            <div className="card-body">
              {todaySchedule && todaySchedule.length > 0 ? (
                <div className="list-group list-group-flush">
                  {todaySchedule.slice(0, 5).map((schedule: any, index: number) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{schedule.subject || schedule.title}</h6>
                          <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            {schedule.startTime} - {schedule.endTime}
                          </small>
                        </div>
                        {schedule.teacher && (
                          <small className="text-muted">{schedule.teacher}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-calendar-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Pending Assignments</h5>
              <Link to="/homework" className="btn btn-sm btn-primary">View All</Link>
            </div>
            <div className="card-body">
              {pendingAssignments && pendingAssignments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {pendingAssignments.slice(0, 5).map((assignment: any) => (
                    <div key={assignment.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{assignment.title}</h6>
                          <small className="text-muted">{assignment.subject}</small>
                        </div>
                        <span className="badge badge-soft-warning">
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-clipboard-check fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No pending assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recent Notifications</h5>
              <Link to="/notifications" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {notifications && notifications.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notifications.map((notification: any) => (
                    <div key={notification.id} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className="avatar avatar-md bg-primary-transparent rounded me-2 flex-shrink-0">
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

        <div className="col-xxl-6 d-flex">
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

      <div className="row">
        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">My Fees</h5>
              <Link to="/fees" className="btn btn-sm btn-primary">View All</Link>
            </div>
            <div className="card-body">
              {fees && fees.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Fee Type</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.slice(0, 5).map((fee: any) => (
                        <tr key={fee._id}>
                          <td>{fee.feeType}</td>
                          <td>₹{fee.amount}</td>
                          <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              fee.status === 'paid' ? 'bg-success' : 
                              fee.status === 'pending' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {fee.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-currency-dollar-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No fees assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xxl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/collect-fees" className="card border-0 border-bottom border-primary border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-primary rounded mb-2 mx-auto">
                        <i className="ti ti-report-money fs-24"></i>
                      </div>
                      <h6 className="mb-0">Pay Fees</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/exam-results" className="card border-0 border-bottom border-success border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-success rounded mb-2 mx-auto">
                        <i className="ti ti-hexagonal-prism-plus fs-24"></i>
                      </div>
                      <h6 className="mb-0">Exam Result</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/class-time-table" className="card border-0 border-bottom border-warning border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-warning rounded mb-2 mx-auto">
                        <i className="ti ti-calendar fs-24"></i>
                      </div>
                      <h6 className="mb-0">Calendar</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/student-attendance" className="card border-0 border-bottom border-dark border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-dark rounded mb-2 mx-auto">
                        <i className="ti ti-calendar-share fs-24"></i>
                      </div>
                      <h6 className="mb-0">Attendance</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/homework" className="card border-0 border-bottom border-info border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-info rounded mb-2 mx-auto">
                        <i className="ti ti-book-2 fs-24"></i>
                      </div>
                      <h6 className="mb-0">Homework</h6>
                    </div>
                  </Link>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <Link to="/library" className="card border-0 border-bottom border-danger border-2 animate-card">
                    <div className="card-body text-center">
                      <div className="avatar avatar-lg bg-danger rounded mb-2 mx-auto">
                        <i className="ti ti-books fs-24"></i>
                      </div>
                      <h6 className="mb-0">Library</h6>
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

export default StudentDashboard;
