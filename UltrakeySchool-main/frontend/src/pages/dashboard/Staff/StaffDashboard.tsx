import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../../../api/client'
import { useAuth } from '../../../store/authStore'
import { useInstitutionData } from '../../../hooks/useInstitutionData';

const StaffDashboard = () => {
  const { user } = useAuth()
  const { institutionData, staffData, loading, error, isFetching, fetchInstitutionData } = useInstitutionData();
  const [dashboardData, setDashboardData] = useState<any>(null)

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/dashboard')
      
      if (response.data.success) {
        const dashboardData = response.data.data;
        setDashboardData(dashboardData);
        
        // Log real data structure for debugging
        console.log('Real staff dashboard data from DB:', dashboardData);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard data'
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    fetchInstitutionData();
    fetchDashboardData();
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    return timeString
  }

  if (loading && !isFetching) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Initializing...</span>
          </div>
          <p className="mt-3 text-muted">Initializing dashboard...</p>
        </div>
      </div>
    )
  }

  if (loading && isFetching) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard data...</p>
        </div>
      </div>
    )
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
            onClick={() => {
              fetchDashboardData();
              fetchInstitutionData();
            }}
          >
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      </div>
    )
  }

  const { staff, teacher, quickStats, todaySchedule, classStats, messages } = dashboardData || {}

  return (
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Staff Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Staff Portal</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button 
            className="btn btn-success"
            onClick={() => {
              // Mark attendance functionality
              toast.info('Marking attendance...');
              // Navigate to attendance page or open modal
              window.location.href = '/staff/attendance';
            }}
          >
            <i className="ti ti-clock me-1" />Mark Attendance
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              // Quick task creation
              toast.info('Opening task manager...');
              window.location.href = '/staff/tasks';
            }}
          >
            <i className="ti ti-plus me-1" />Quick Task
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => {
              // Apply leave functionality
              toast.info('Opening leave application...');
              window.location.href = '/staff/leave';
            }}
          >
            <i className="ti ti-calendar-off me-1" />Apply Leave
          </button>
          <Link to="/staff/profile" className="btn btn-info text-white">
            <i className="ti ti-user me-1" />My Profile
          </Link>
        </div>
      </div>

      {/* WELCOME SECTION WITH INSTITUTION INFO */}
      {institutionData && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-gradient-primary text-white">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h4 className="mb-2">
                      {institutionData && staffData ? 
                        `Welcome back, ${staffData.name}! 👋 You are part of ${institutionData.name}` 
                        : 'Welcome back! 👋'
                      }
                    </h4>
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <img 
                          src={institutionData.logo || "/assets/img/logo.png"} 
                          alt={institutionData.name}
                          style={{ height: '40px', width: 'auto' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/assets/img/logo.png";
                          }}
                        />
                      </div>
                      <div>
                        <h5 className="mb-1">{institutionData?.name || 'Your Institution'}</h5>
                        <p className="mb-0 opacity-75">
                          <i className="ti ti-map-pin me-1"></i>
                          {institutionData?.address || 'Address not available'}
                        </p>
                        <p className="mb-0 opacity-75">
                          <i className="ti ti-phone me-1"></i>
                          {institutionData?.phone || 'Phone not available'}
                        </p>
                        <p className="mb-0 opacity-75">
                          <i className="ti ti-mail me-1"></i>
                          {institutionData?.email || 'Email not available'}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="text-center">
                        <small className="d-block opacity-75">Your Role</small>
                        <strong className="d-block">{staffData?.role || user?.role || 'staff'}</strong>
                      </div>
                      <div className="text-center">
                        <small className="d-block opacity-75">Department</small>
                        <strong className="d-block">{staff?.department || 'General'}</strong>
                      </div>
                      <div className="text-center">
                        <small className="d-block opacity-75">Employee ID</small>
                        <strong className="d-block">{staff?.employeeId || user?.id?.slice(-6) || 'N/A'}</strong>
                      </div>
                      <div className="text-center">
                        <small className="d-block opacity-75">Status</small>
                        <strong className="d-block">
                          <span className="badge bg-success text-white">Active</span>
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <div className="d-flex flex-column align-items-end h-100">
                      <div className="mb-2">
                        <span className="badge bg-light text-dark me-2">
                          <i className="ti ti-building me-1"></i>
                          {institutionData?.type || 'Educational Institution'}
                        </span>
                        <span className="badge bg-light text-dark">
                          <i className="ti ti-id me-1"></i>
                          {institutionData?.code || institutionData?.schoolCode || 'N/A'}
                        </span>
                      </div>
                      <div className="mt-auto">
                        <small className="opacity-75">
                          Last login: {new Date().toLocaleString()}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE & QUICK INFO */}
      <div className="row mb-4">
        {/* Profile Card */}
        <div className="col-xl-4 col-lg-6 d-flex">
          <div className="card flex-fill border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <span className="avatar avatar-xl flex-shrink-0 me-3">
                  {teacher?.avatar ? (
                    <img src={teacher.avatar} alt="profile" className="rounded-circle" />
                  ) : (
                    <div className="avatar avatar-xl rounded-circle bg-primary">
                      <span className="avatar-title rounded-circle">
                        {staff?.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                </span>
                <div className="overflow-hidden flex-fill">
                  <h5 className="mb-1">{staff?.name || user?.name || 'Staff Member'}</h5>
                  <p className="text-primary mb-1" style={{ fontSize: 13 }}>
                    {staff?.designation || teacher?.subject || 'Staff'}
                  </p>
                  <small className="text-muted">
                    ID: {staff?.employeeId || staff?.id?.slice(-6) || 'N/A'} | {staff?.department || 'General'}
                  </small>
                </div>
              </div>
              <div className="border-top pt-3">
                <div className="row g-2">
                  <div className="col-6">
                    <small className="text-muted d-block">Role</small>
                    <p className="mb-0 fw-semibold" style={{ fontSize: 13 }}>
                      {user?.role || 'staff'}
                    </p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Email</small>
                    <p className="mb-0 fw-semibold" style={{ fontSize: 13 }}>
                      {user?.email || 'N/A'}
                    </p>
                  </div>
                  <div className="col-12 mt-2">
                    <small className="text-muted d-block">Status</small>
                    <p className="mb-0 fw-semibold" style={{ fontSize: 13 }}>
                      <span className="badge bg-success">Active</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="col-xl-4 col-lg-6 d-flex">
          <div className="card flex-fill border-0 shadow-sm">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">My Attendance</h5>
              <span className="badge bg-success">
                {quickStats?.presentToday || 0} Present Today
              </span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-center p-2 bg-success-transparent rounded">
                    <h3 className="mb-0 text-success">{quickStats?.presentToday || 0}</h3>
                    <small className="text-muted">Present Days</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-2 bg-warning-transparent rounded">
                    <h3 className="mb-0 text-warning">{quickStats?.pendingLeaves || 0}</h3>
                    <small className="text-muted">Pending Leaves</small>
                  </div>
                </div>
                <div className="col-12">
                  <div className="text-center p-2 bg-info-transparent rounded">
                    <h3 className="mb-0 text-info">{quickStats?.workingDays || 0}</h3>
                    <small className="text-muted">Working Days</small>
                  </div>
                </div>
              </div>
              <div className="border-top pt-3 mt-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <small className="text-muted">Messages</small>
                  <span className="fw-semibold">{quickStats?.unreadMessages || 0}</span>
                </div>
                <div className="progress progress-xs">
                  <div className="progress-bar bg-primary rounded" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Summary - REMOVED FOR STAFF */}
        <div className="col-xl-4 col-lg-12 d-flex">
          <div className="card flex-fill border-0 shadow-sm">
            <div className="card-header"><h5 className="card-title mb-0">Quick Actions</h5></div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                <button 
                  className="btn btn-sm btn-success flex-fill"
                  onClick={() => {
                    toast.info('Navigating to attendance...');
                    window.location.href = '/staff/attendance';
                  }}
                >
                  <i className="ti ti-clock me-1" />Mark Attendance
                </button>
                <button 
                  className="btn btn-sm btn-primary flex-fill"
                  onClick={() => {
                    toast.info('Opening task manager...');
                    window.location.href = '/staff/tasks';
                  }}
                >
                  <i className="ti ti-list me-1" />My Tasks
                </button>
                <button 
                  className="btn btn-sm btn-warning flex-fill"
                  onClick={() => {
                    toast.info('Opening leave application...');
                    window.location.href = '/staff/leave';
                  }}
                >
                  <i className="ti ti-calendar-off me-1" />Apply Leave
                </button>
                <Link to="/staff/profile" className="btn btn-sm btn-info text-white flex-fill">
                  <i className="ti ti-user me-1" />View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="row mb-4">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{quickStats?.studentsInClass || 0}</h2>
                <p className="mb-0">Students in Class</p>
                <small className="text-muted">Total enrolled</small>
              </div>
              <div className="avatar avatar-xl bg-primary-transparent rounded d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ti ti-users fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{quickStats?.presentToday || 0}</h2>
                <p className="mb-0">Present Today</p>
                <small className="text-muted">Attendance</small>
              </div>
              <div className="avatar avatar-xl bg-success-transparent rounded d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ti ti-calendar-check fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{quickStats?.workingDays || 0}</h2>
                <p className="mb-0">Working Days</p>
                <small className="text-muted">This month</small>
              </div>
              <div className="avatar avatar-xl bg-info-transparent rounded d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ti ti-calendar-time fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill animate-card border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{quickStats?.unreadMessages || 0}</h2>
                <p className="mb-0">Unread Messages</p>
                <small className="text-muted">Notifications</small>
              </div>
              <div className="avatar avatar-xl bg-danger-transparent rounded d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ti ti-message fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT ROW */}
      <div className="row">
        {/* TODAY'S SCHEDULE */}
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
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </small>
                        </div>
                        {schedule.class && (
                          <span className="badge badge-soft-primary">{schedule.class}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-calendar-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No schedule for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CLASS STATISTICS */}
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h5 className="card-title mb-0">Class Statistics</h5>
            </div>
            <div className="card-body">
              {classStats ? (
                <div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Total Students</span>
                    <strong>{classStats.totalStudents || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Present Today</span>
                    <strong className="text-success">{classStats.presentToday || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Absent Today</span>
                    <strong className="text-danger">{classStats.absentToday || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Attendance Rate</span>
                    <strong>{classStats.attendanceRate || 0}%</strong>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="ti ti-chart-bar-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No class statistics available</p>
                  <small className="text-muted">You are not assigned as a class teacher</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PENDING TASKS - REMOVED FOR STAFF */}
        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Staff Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted d-block">Department</small>
                  <p className="mb-0 fw-semibold">{staff?.department || 'General'}</p>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block">Designation</small>
                  <p className="mb-0 fw-semibold">{staff?.designation || 'Staff'}</p>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block">Employee ID</small>
                  <p className="mb-0 fw-semibold">{staff?.employeeId || staff?.id?.slice(-6) || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block">Status</small>
                  <p className="mb-0 fw-semibold">
                    <span className="badge bg-success">Active</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TASKS SECTION */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">My Tasks</h5>
              <Link to="/staff/tasks" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="text-center p-3 bg-primary-transparent rounded">
                    <h3 className="mb-0 text-primary">{quickStats?.pendingTasks || 12}</h3>
                    <small className="text-muted">Pending</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-success-transparent rounded">
                    <h3 className="mb-0 text-success">{quickStats?.completedTasks || 48}</h3>
                    <small className="text-muted">Completed</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="mb-3">Quick Actions</h6>
                    <div className="d-grid gap-2" style={{gridTemplateColumns: '1fr 1fr'}}>
                      <button className="btn btn-sm btn-primary w-100">
                        <i className="ti ti-plus me-1"></i>Create Task
                      </button>
                      <button className="btn btn-sm btn-info w-100">
                        <i className="ti ti-list me-1"></i>View All Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMMUNICATION SECTION */}
      <div className="row">
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">School Announcements</h5>
              <Link to="/notice-board" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {messages && messages.length > 0 ? (
                <div className="list-group list-group-flush">
                  {messages.slice(0, 3).map((message: any, index: number) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className="avatar avatar-md bg-primary-transparent rounded me-3 flex-shrink-0">
                          <i className="ti ti-bell fs-14"></i>
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
                <div className="text-center py-4">
                  <i className="ti ti-bell-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No announcements</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent Notifications</h5>
              <Link to="/notifications" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item px-0">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-md bg-success-transparent rounded me-3 flex-shrink-0">
                      <i className="ti ti-message-check fs-14"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">New circular: Mid-term exam schedule</h6>
                      <p className="text-muted mb-1 small">Mid-term examinations will start from next week</p>
                      <small className="text-muted">
                        <i className="ti ti-clock me-1"></i>
                        Today 10:30 AM
                      </small>
                    </div>
                  </div>
                </div>
                <div className="list-group-item px-0">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-md bg-warning-transparent rounded me-3 flex-shrink-0">
                      <i className="ti ti-users fs-14"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Staff meeting scheduled</h6>
                      <p className="text-muted mb-1 small">Annual day preparation committee meeting</p>
                      <small className="text-muted">
                        <i className="ti ti-clock me-1"></i>
                        Tomorrow 3 PM
                      </small>
                    </div>
                  </div>
                </div>
                <div className="list-group-item px-0">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-md bg-info-transparent rounded me-3 flex-shrink-0">
                      <i className="ti ti-calendar-event fs-14"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Reminder: Submit monthly report</h6>
                      <p className="text-muted mb-1 small">Please submit your monthly attendance report by end of day</p>
                      <small className="text-muted">
                        <i className="ti ti-clock me-1"></i>
                        3 hrs ago
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REPORTS SECTION */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Reports & Analytics</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="text-center p-3 bg-info-transparent rounded">
                    <h3 className="mb-0 text-info">95.8%</h3>
                    <small className="text-muted">My Attendance</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-success-transparent rounded">
                    <h3 className="mb-0 text-success">22</h3>
                    <small className="text-muted">Present Days</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-warning-transparent rounded">
                    <h3 className="mb-0 text-warning">1</h3>
                    <small className="text-muted">Absent Days</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-primary-transparent rounded">
                    <h3 className="mb-0 text-primary">165</h3>
                    <small className="text-muted">Work Hours</small>
                  </div>
                </div>
              </div>
              <div className="border-top pt-3 mt-3">
                <h6 className="mb-3">Quick Links</h6>
                <div className="d-grid gap-2" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr'}}>
                  <Link to="/staff/attendance-report" className="btn btn-sm btn-outline-primary">
                    <i className="ti ti-file me-1"></i>Attendance Report
                  </Link>
                  <Link to="/staff/reports" className="btn btn-sm btn-outline-success">
                    <i className="ti ti-chart-bar me-1"></i>Performance Report
                  </Link>
                  <Link to="/staff/leave-history" className="btn btn-sm btn-outline-warning">
                    <i className="ti ti-calendar-off me-1"></i>Leave History
                  </Link>
                  <Link to="/staff/documents" className="btn btn-sm btn-outline-info">
                    <i className="ti ti-files me-1"></i>My Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StaffDashboard
