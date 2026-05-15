import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface NotificationData {
  overview: {
    totalNotifications: number;
    unreadNotifications: number;
    sentToday: number;
    scheduledNotifications: number;
  };
  notifications: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    recipients: string;
    sentDate: string;
    status: 'sent' | 'scheduled' | 'draft';
    readCount: number;
    totalRecipients: number;
  }[];
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    inAppNotifications: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
    urgentAlerts: boolean;
  };
  notificationTypes: {
    type: string;
    enabled: boolean;
    recipients: string;
  }[];
}

const AdminNotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const fetchNotificationData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setNotificationData({
        overview: {
          totalNotifications: 0,
          unreadNotifications: 0,
          sentToday: 0,
          scheduledNotifications: 0
        },
        notifications: [],
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          inAppNotifications: true,
          dailyDigest: false,
          weeklyReport: true,
          urgentAlerts: true
        },
        notificationTypes: [
          { type: 'Academic Updates', enabled: true, recipients: 'All Users' },
          { type: 'Fee Reminders', enabled: true, recipients: 'Parents' },
          { type: 'Exam Schedules', enabled: true, recipients: 'Students & Teachers' },
          { type: 'Attendance Alerts', enabled: true, recipients: 'Parents' },
          { type: 'System Maintenance', enabled: true, recipients: 'All Users' },
          { type: 'Holiday Announcements', enabled: true, recipients: 'All Users' }
        ]
      });
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle notification sending logic
    console.log('Sending notification...');
  };

  const filteredNotifications = notificationData?.notifications.filter(notification => 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <h3 className="page-title mb-1">Notifications</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Settings</li>
              <li className="breadcrumb-item active">Notifications</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchNotificationData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-bell-plus me-2"></i>Send Notification
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
                  <h4 className="mb-1">{notificationData?.overview.totalNotifications}</h4>
                  <p className="mb-0">Total Notifications</p>
                  <small>All time</small>
                </div>
                <i className="ti ti-bell fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{notificationData?.overview.unreadNotifications}</h4>
                  <p className="mb-0">Unread</p>
                  <small>Awaiting read</small>
                </div>
                <i className="ti ti-bell-ringing fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{notificationData?.overview.sentToday}</h4>
                  <p className="mb-0">Sent Today</p>
                  <small>Today's notifications</small>
                </div>
                <i className="ti ti-send fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{notificationData?.overview.scheduledNotifications}</h4>
                  <p className="mb-0">Scheduled</p>
                  <small>Upcoming</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
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
              <h5 className="card-title">Notification Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'send' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('send')}
                >
                  <i className="ti ti-bell-plus me-2"></i>
                  Send Notification
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'history' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('history')}
                >
                  <i className="ti ti-history me-2"></i>
                  Notification History
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'settings' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('settings')}
                >
                  <i className="ti ti-settings me-2"></i>
                  Notification Settings
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'templates' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('templates')}
                >
                  <i className="ti ti-template me-2"></i>
                  Templates
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
                    <h5 className="card-title mb-0">Notification Types</h5>
                  </div>
                  <div className="card-body">
                    {notificationData?.notificationTypes.map((type, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="mb-1">{type.type}</h6>
                          <small className="text-muted">{type.recipients}</small>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={type.enabled}
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Recent Notifications</h5>
                  </div>
                  <div className="card-body">
                    {notificationData?.notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="d-flex align-items-start mb-3">
                        <div className={`avatar avatar-sm bg-${
                          notification.type === 'success' ? 'success' :
                          notification.type === 'warning' ? 'warning' :
                          notification.type === 'error' ? 'danger' : 'info'
                        } text-white rounded-circle me-2`}>
                          <i className="ti ti-bell"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{notification.title}</h6>
                          <p className="text-muted small mb-1">{notification.message}</p>
                          <small className="text-muted">{notification.sentDate}</small>
                        </div>
                      </div>
                    ))}
                    {notificationData?.notifications.length === 0 && (
                      <p className="text-muted text-center">No recent notifications</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Notification */}
          {selectedSection === 'send' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Send New Notification</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSendNotification}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Notification Type</label>
                        <select className="form-select" required>
                          <option value="">Select Type</option>
                          <option value="info">Information</option>
                          <option value="success">Success</option>
                          <option value="warning">Warning</option>
                          <option value="error">Error</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Recipients</label>
                        <select className="form-select" required>
                          <option value="">Select Recipients</option>
                          <option value="all">All Users</option>
                          <option value="students">Students</option>
                          <option value="teachers">Teachers</option>
                          <option value="parents">Parents</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Administrators</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input type="text" className="form-control" placeholder="Enter notification title" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={4} placeholder="Enter notification message" required></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Send Method</label>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="emailNotif" defaultChecked />
                          <label className="form-check-label" htmlFor="emailNotif">
                            Email Notification
                          </label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="pushNotif" defaultChecked />
                          <label className="form-check-label" htmlFor="pushNotif">
                            Push Notification
                          </label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="smsNotif" />
                          <label className="form-check-label" htmlFor="smsNotif">
                            SMS Notification
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Schedule</label>
                        <select className="form-select">
                          <option value="now">Send Now</option>
                          <option value="schedule">Schedule for Later</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Schedule Date & Time</label>
                        <input type="datetime-local" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-outline-primary">
                      <i className="ti ti-eye me-1"></i>Preview
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-send me-1"></i>Send Notification
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notification History */}
          {selectedSection === 'history' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Notification History</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search notifications..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-download me-1"></i>Export
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Type</th>
                        <th>Recipients</th>
                        <th>Sent Date</th>
                        <th>Status</th>
                        <th>Read Rate</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotifications.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted">
                            No notifications found. Send your first notification to see the history.
                          </td>
                        </tr>
                      ) : (
                        filteredNotifications.map((notification) => (
                          <tr key={notification.id}>
                            <td>{notification.title}</td>
                            <td>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                {notification.message}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                notification.type === 'success' ? 'success' :
                                notification.type === 'warning' ? 'warning' :
                                notification.type === 'error' ? 'danger' : 'info'
                              }`}>
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                              </span>
                            </td>
                            <td>{notification.recipients}</td>
                            <td>{notification.sentDate}</td>
                            <td>
                              <span className={`badge ${
                                notification.status === 'sent' ? 'bg-success' :
                                notification.status === 'scheduled' ? 'bg-warning' : 'bg-secondary'
                              }`}>
                                {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              {notification.totalRecipients > 0 ? 
                                `${Math.round((notification.readCount / notification.totalRecipients) * 100)}%` : 
                                'N/A'
                              }
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-info" title="Resend">
                                  <i className="ti ti-send"></i>
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

          {/* Notification Settings */}
          {selectedSection === 'settings' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Notification Settings</h5>
              </div>
              <div className="card-body">
                <h6 className="mb-3">Notification Channels</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-check form-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="emailNotifications"
                        checked={notificationData?.notificationSettings.emailNotifications}
                        onChange={() => {}}
                      />
                      <label className="form-check-label" htmlFor="emailNotifications">
                        Email Notifications
                      </label>
                      <small className="text-muted d-block">Receive notifications via email</small>
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="pushNotifications"
                        checked={notificationData?.notificationSettings.pushNotifications}
                        onChange={() => {}}
                      />
                      <label className="form-check-label" htmlFor="pushNotifications">
                        Push Notifications
                      </label>
                      <small className="text-muted d-block">Receive push notifications in browser/app</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="smsNotifications"
                        checked={notificationData?.notificationSettings.smsNotifications}
                        onChange={() => {}}
                      />
                      <label className="form-check-label" htmlFor="smsNotifications">
                        SMS Notifications
                      </label>
                      <small className="text-muted d-block">Receive notifications via SMS</small>
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="inAppNotifications"
                        checked={notificationData?.notificationSettings.inAppNotifications}
                        onChange={() => {}}
                      />
                      <label className="form-check-label" htmlFor="inAppNotifications">
                        In-App Notifications
                      </label>
                      <small className="text-muted d-block">Receive notifications within the application</small>
                    </div>
                  </div>
                </div>
                <hr />
                <h6 className="mb-3">Notification Preferences</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-check form-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="dailyDigest"
                        checked={notificationData?.notificationSettings.dailyDigest}
                        onChange={() => {}}
                      />
                      <label className="form-check-label" htmlFor="dailyDigest">
                        Daily Digest
                      </label>
                      <small className="text-muted d-block">Receive daily summary of notifications</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="weeklyReport"
                        checked={notificationData?.notificationSettings.weeklyReport}
                        onChange={() => {}}
                      />
                      <label className="form-check-label" htmlFor="weeklyReport">
                        Weekly Report
                      </label>
                      <small className="text-muted d-block">Receive weekly activity reports</small>
                    </div>
                  </div>
                </div>
                <div className="form-check form-switch mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="urgentAlerts"
                    checked={notificationData?.notificationSettings.urgentAlerts}
                    onChange={() => {}}
                  />
                  <label className="form-check-label" htmlFor="urgentAlerts">
                    Urgent Alerts Only
                  </label>
                  <small className="text-muted d-block">Only receive urgent and critical notifications</small>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-primary">
                    <i className="ti ti-device-floppy me-1"></i>Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          {selectedSection === 'templates' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Notification Templates</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Create Template
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-template fs-24 text-primary mb-2"></i>
                        <h6>Welcome Template</h6>
                        <p className="text-muted small">New user welcome message</p>
                        <button className="btn btn-primary btn-sm">Use Template</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar fs-24 text-success mb-2"></i>
                        <h6>Event Template</h6>
                        <p className="text-muted small">School events and holidays</p>
                        <button className="btn btn-success btn-sm">Use Template</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-triangle fs-24 text-warning mb-2"></i>
                        <h6>Alert Template</h6>
                        <p className="text-muted small">Urgent notifications</p>
                        <button className="btn btn-warning btn-sm">Use Template</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-info mb-2"></i>
                        <h6>Exam Template</h6>
                        <p className="text-muted small">Exam schedules and results</p>
                        <button className="btn btn-info btn-sm">Use Template</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-cash fs-24 text-danger mb-2"></i>
                        <h6>Fee Template</h6>
                        <p className="text-muted small">Fee payment reminders</p>
                        <button className="btn btn-danger btn-sm">Use Template</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-bell fs-24 text-secondary mb-2"></i>
                        <h6>General Template</h6>
                        <p className="text-muted small">General announcements</p>
                        <button className="btn btn-secondary btn-sm">Use Template</button>
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

export default AdminNotificationsPage;
