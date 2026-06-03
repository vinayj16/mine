import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import apiClient from '../../api/client';
import InactivityMonitor from '../common/InactivityMonitor';
import Avatar from '../common/Avatar';

import { getImageUrl } from '../../utils/imageUtils';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  sender?: {
    name: string;
    photo?: string;
  };
}

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggle, setDarkMode } = useThemeStore();
  const [isMobileMenuOpen, setMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isAddNewOpen, setAddNewOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [academicYear, setAcademicYear] = useState('2025 / 2026');
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const notificationRef = useRef<HTMLDivElement>(null);
  const addNewRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isMobileView = viewportWidth < 1024;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (addNewRef.current && !addNewRef.current.contains(event.target as Node)) {
        setAddNewOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen, isAddNewOpen, isProfileOpen]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { limit: 10 }
      });

      if (response.data.success && response.data.data) {
        const notificationsData = response.data.data.notifications || response.data.data;
        setNotifications(notificationsData);
        const unread = notificationsData.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setNotificationOpen(false);
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMobileToggle = () => {
    setMobileSidebarOpen((prev) => !prev);
    // Connect to parent layout's sidebar toggle
    toggleSidebar?.();
  };

  const handleFullScreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  };

  const handleLogout = () => {
    toast.info('Logged out successfully', { autoClose: 2000 });
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 500);
  };

  const getProfilePath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role === 'superadmin') return '/super-admin/profile';
    if (role === 'principal') return '/dashboard/principal/profile';
    if (role === 'admin' || role === 'institutionadmin' || role === 'institution_admin' || role === 'institutionowner') return '/dashboard/admin/profile';
    if (role.includes('hostel') || role.includes('warden')) return '/dashboard/hostel/profile';
    if (role.includes('teacher')) return '/dashboard/teacher/profile';
    if (role.includes('student')) return '/dashboard/student/profile';
    if (role.includes('parent')) return '/dashboard/parent/profile';
    if (role.includes('librarian')) return '/dashboard/library/profile';
    if (role.includes('accountant')) return '/dashboard/accountant/profile';
    if (role.includes('hr')) return '/dashboard/hr/profile';
    if (role.includes('transport')) return '/dashboard/transport/profile';
    if (role.includes('agent')) return '/agent/profile';
    if (role.includes('staff')) return '/dashboard/staff/profile';
    return '/settings/profile';
  };

  const getSettingsPath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role === 'superadmin') return '/super-admin/settings';
    if (role === 'principal') return '/dashboard/principal/notifications';
    if (role === 'admin' || role === 'institutionadmin' || role === 'institution_admin' || role === 'institutionowner') return '/dashboard/admin/settings';
    if (role.includes('hostel') || role.includes('warden')) return '/dashboard/hostel/profile';
    if (role.includes('teacher')) return '/dashboard/teacher/profile';
    if (role.includes('student')) return '/settings/profile';
    if (role.includes('parent')) return '/dashboard/parent/settings';
    if (role.includes('agent')) return '/agent/settings';
    if (role.includes('staff')) return '/dashboard/staff/settings';
    return '/settings';
  };

  const profilePath = getProfilePath();
  const settingsPath = getSettingsPath();

  const getNotificationsPath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role === 'superadmin') return '/super-admin/settings';
    if (role.includes('hostel') || role.includes('warden')) return '/dashboard/hostel/settings';
    if (role.includes('agent')) return '/agent/settings';
    return '/settings/notifications';
  };

  const getChatPath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role.includes('accountant')) return '/accountant/applications/chat';
    if (role.includes('agent')) return '/agent/applications/chat';
    return '/dashboard/applications/chat';
  };

  const chatPath = getChatPath();
  const notificationsPath = getNotificationsPath();

  const handleAddNew = (type: string) => {
    setAddNewOpen(false);
    switch (type) {
      case 'students':
        navigate('/students/add');
        break;
      case 'teachers':
        navigate('/teachers/add');
        break;
      case 'staffs':
        navigate('/dashboard/hr/staffs');
        break;
      case 'invoice':
        navigate('/accounts/invoices');
        break;
      default:
        break;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const academicYears = [
    '2025 / 2026',
    '2024 / 2025',
    '2023 / 2024',
    '2022 / 2023',
  ];

  return (
    <>
      <InactivityMonitor />
      <div className="header">
        {/* Brand logo + name */}
        <div className="header-left d-flex align-items-center" style={{ paddingLeft: '10px', flexShrink: 0, background: 'transparent' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <rect width="32" height="32" rx="8" fill={isDarkMode ? '#4f46e5' : '#6366f1'}/>
            <path d="M8 22V12L16 7L24 12V22H20V16L16 13L12 16V22H8Z" fill="white"/>
          </svg>
          <span className="d-none d-md-inline-block ms-2 fw-bold" style={{ color: isDarkMode ? '#e4e4e7' : '#1e293b', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
            Ultrakey<span style={{ color: isDarkMode ? '#818cf8' : '#6366f1' }}>Edu</span>
          </span>
        </div>

        <button type="button" className="mobile_btn" id="mobile_btn" aria-label="Open sidebar" onClick={handleMobileToggle}>
          <span className="bar-icon">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="header-user">
          <div className="nav user-menu align-items-center">
            {/* Sidebar Toggle Button */}
            <div className="pe-1 sidebar-toggle-header">
              <button
                type="button"
                className={`btn ${isDarkMode ? 'btn-outline-light bg-dark text-white border-secondary' : 'btn-outline-secondary bg-white'} btn-icon`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleSidebar?.();
                }}
                title="Toggle Sidebar"
                aria-label="Toggle sidebar"
              >
                <i className="ti ti-menu-2" />
              </button>
            </div>
            <div className="nav-item nav-search-inputs me-auto">
              <div className="top-nav-search">
                <form action="#" className="dropdown">
                  <div className="searchinputs">
                    <input type="text" placeholder="Search students, teachers, invoices..." />
                    <div className="search-addon">
                      <button type="submit">
                        <i className="bx bx-search" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="dropdown me-2">
              <a
                href="javascript:void(0);"
                className="btn btn-outline-light fw-normal bg-white d-flex align-items-center p-2"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="ti ti-calendar-due me-1" />
                Academic Year : {academicYear}
              </a>
              <ul className="dropdown-menu dropdown-menu-right">
                {academicYears.map((year) => (
                  <li key={year}>
                    <a
                      href="javascript:void(0);"
                      className={`dropdown-item d-flex align-items-center ${academicYear === year ? 'active' : ''}`}
                      onClick={() => setAcademicYear(year)}
                    >
                      Academic Year : {year}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pe-1">
              <div className="dropdown" ref={addNewRef}>
                <div className={`dropdown-menu dropdown-menu-right border shadow-sm dropdown-md ${isAddNewOpen ? 'show' : ''}`} style={{ display: isAddNewOpen ? 'block' : 'none' }}>
                  <div className="p-3 pb-0">
                    <div className="row gx-2">
                      <div className="col-6">
                        <a href="javascript:void(0);" className="d-block bg-primary-transparent rounded p-2 text-center mb-3 class-hover" onClick={() => handleAddNew('students')}>
                          <div className="avatar avatar-lg mb-2">
                            <span className="d-inline-flex align-items-center justify-content-center w-100 h-100 bg-primary rounded-circle">
                              <i className="ti ti-school" />
                            </span>
                          </div>
                          <p className="text-dark">Students</p>
                        </a>
                      </div>
                      <div className="col-6">
                        <a href="javascript:void(0);" className="d-block bg-success-transparent rounded p-2 text-center mb-3 class-hover" onClick={() => handleAddNew('teachers')}>
                          <div className="avatar avatar-lg mb-2">
                            <span className="d-inline-flex align-items-center justify-content-center w-100 h-100 bg-success rounded-circle">
                              <i className="ti ti-users" />
                            </span>
                          </div>
                          <p className="text-dark">Teachers</p>
                        </a>
                      </div>
                      <div className="col-6">
                        <a href="javascript:void(0);" className="d-block bg-warning-transparent rounded p-2 text-center mb-3 class-hover" onClick={() => handleAddNew('staffs')}>
                          <div className="avatar avatar-lg rounded-circle mb-2">
                            <span className="d-inline-flex align-items-center justify-content-center w-100 h-100 bg-warning rounded-circle">
                              <i className="ti ti-users-group" />
                            </span>
                          </div>
                          <p className="text-dark">Staffs</p>
                        </a>
                      </div>
                      <div className="col-6">
                        <a href="javascript:void(0);" className="d-block bg-info-transparent rounded p-2 text-center mb-3 class-hover" onClick={() => handleAddNew('invoice')}>
                          <div className="avatar avatar-lg mb-2">
                            <span className="d-inline-flex align-items-center justify-content-center w-100 h-100 bg-info rounded-circle">
                              <i className="ti ti-license" />
                            </span>
                          </div>
                          <p className="text-dark">Invoice</p>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pe-1">
              <button
                type="button"
                id="dark-mode-toggle"
                className="dark-mode-toggle btn btn-outline-light bg-white btn-icon me-1"
                onClick={(e) => {
                  e.preventDefault();
                  toggle();
                }}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <i className={`ti ${isDarkMode ? 'ti-brightness-up' : 'ti-moon'}`} />
              </button>
            </div>

            <div className="dropdown me-2" id="notification_item" ref={notificationRef}>
              <button
                className="btn btn-outline-light bg-white btn-icon position-relative"
                type="button"
                aria-expanded={isNotificationOpen}
                onClick={() => {
                  setNotificationOpen((prev) => !prev);
                  setProfileOpen(false);
                  setAddNewOpen(false);
                }}
              >
                <i className="ti ti-bell" />
                {unreadCount > 0 && <span className="notification-status-dot" />}
              </button>
              <div
                className={`dropdown-menu dropdown-menu-end notification-dropdown p-4 shadow ${isNotificationOpen ? 'show' : ''}`}
                style={{ display: isNotificationOpen ? 'block' : 'none' }}
              >
                <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                  <h4 className="notification-title mb-0">Notifications ({unreadCount})</h4>
                  {unreadCount > 0 && (
                    <button className="btn btn-link p-0" onClick={markAllAsRead}>Mark all as read</button>
                  )}
                </div>
                <div className="noti-content">
                  {notifications.length === 0 ? (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0">No notifications</p>
                    </div>
                  ) : (
                        <div className="d-flex flex-column gap-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification._id}
                          className={`card border ${!notification.read ? 'bg-light border-primary' : ''} mb-0 notification-card`}
                          style={{ cursor: notification.actionUrl ? 'pointer' : 'default' }}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="card-body p-3">
                            <div className="d-flex align-items-start gap-2">
                              <span className="avatar avatar-md flex-shrink-0">
                                {notification.sender?.photo ? (
                                  <img src={getImageUrl(notification.sender.photo)} alt="Profile" className="rounded-circle" />
                                ) : (
                                  <span className={`avatar-title rounded-circle ${notification.read ? 'bg-secondary' : 'bg-primary'}`}>
                                    {notification.sender?.name?.charAt(0) || 'N'}
                                  </span>
                                )}
                              </span>
                              <div className="flex-grow-1 min-w-0">
                                <div className="d-flex justify-content-between align-items-start">
                                  <h6 className={`mb-1 text-truncate ${!notification.read ? 'fw-bold' : ''}`}>
                                    {notification.title}
                                  </h6>
                                  {!notification.read && (
                                    <span className="badge bg-primary rounded-pill" style={{ width: 8, height: 8, padding: 0 }} />
                                  )}
                                </div>
                                <p className="text-muted small mb-1">{notification.message}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">{formatTimeAgo(notification.createdAt)}</small>
                                  {!notification.read && (
                                    <button
                                      className="btn btn-sm btn-outline-primary py-0 px-2"
                                      onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                                    >
                                      <i className="ti ti-check me-1"></i>Mark Read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="d-flex pt-2 justify-content-center">
                  <button
                    className="btn btn-sm btn-link text-muted"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNotificationOpen(false);
                    }}
                  >
                    <i className="ti ti-chevron-up me-1"></i>Close
                  </button>
                </div>
              </div>
            </div>

            <div className="pe-1">
              <a
                href="javascript:void(0);"
                className="btn btn-outline-light bg-white btn-icon position-relative me-1"
                onClick={() => navigate(chatPath)}
              >
                <i className="ti ti-brand-hipchat" />
                <span className="chat-status-dot" />
              </a>
            </div>

            <div className="pe-1">
              <a
                href="javascript:void(0);"
                className="btn btn-outline-light bg-white btn-icon me-1"
                id="btnFullscreen"
                onClick={handleFullScreenToggle}
              >
                <i className="ti ti-maximize" />
              </a>
            </div>

            <div className="dropdown ms-1" ref={profileRef}>
              <a
                href="javascript:void(0);"
                className="dropdown-toggle d-flex align-items-center"
                data-bs-toggle="dropdown"
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setNotificationOpen(false);
                  setAddNewOpen(false);
                }}
              >
                <Avatar
                  name={user?.name || 'Profile'}
                  src={user?.avatar || user?.photo || user?.profilePhoto || null}
                  size={40}
                  variant="rounded"
                />
              </a>

              <div className={`dropdown-menu dropdown-menu-end p-0 mobile-more-menu ${isProfileOpen ? 'show' : ''}`} style={{ display: isProfileOpen ? 'block' : 'none' }}>
                <div className="d-block">
                  <div className="d-flex align-items-center px-2 py-3">
                    <Avatar
                      name={user?.name || 'Profile'}
                      src={user?.avatar || user?.photo || null}
                      size={40}
                      variant="circle"
                    />
                    <div>
                      <h6 className="mb-0">{user?.name || 'User'}</h6>
                      <p className="text-primary mb-0">{user?.role || 'Administrator'}</p>
                    </div>
                  </div>

                  <hr className="m-0" />

                  <div className="p-2 d-flex align-items-center justify-content-between mobile-more-row">
                    <div className="d-flex align-items-center gap-2">
                      <span className="mobile-more-icon">
                        <i className={isDarkMode ? 'ti ti-moon' : 'ti ti-brightness-up'} />
                      </span>
                      <div className="d-flex flex-column lh-1">
                        <span className="mobile-more-title">Dark mode</span>
                        <small className="text-muted">{isDarkMode ? 'On' : 'Off'}</small>
                      </div>
                    </div>
                    <div
                      className="form-check form-switch m-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={isDarkMode}
                        onChange={(e) => {
                          e.stopPropagation();
                          setDarkMode(e.target.checked);
                        }}
                        aria-label="Toggle dark mode"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(profilePath);
                    }}
                  >
                    <span className="mobile-more-icon">
                      <i className="ti ti-user-circle" />
                    </span>
                    My Profile
                  </button>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(settingsPath);
                    }}
                  >
                    <span className="mobile-more-icon">
                      <i className="ti ti-settings" />
                    </span>
                    Settings
                  </button>
                  <hr className="m-0" />
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item text-danger"
                    onClick={handleLogout}
                  >
                    <span className="mobile-more-icon mobile-more-icon-danger">
                      <i className="ti ti-login" />
                    </span>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobileView && (
        <div className="dropdown mobile-user-menu" data-bs-autoclose="outside">
          <button
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            type="button"
            aria-label="More options"
            style={{
              position: 'fixed',
              top: '15px',
              right: '15px',
              zIndex: 1000,
              background: 'transparent',
              border: 'none',
              color: '#1A6FA8',
              fontSize: '20px',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <i className="fa fa-ellipsis-v" />
          </button>
          <div className="dropdown-menu dropdown-menu-end p-0 mobile-more-menu">
            <div className="d-block">
              <div className="d-flex align-items-center px-2 py-3">
                <Avatar
                  name={user?.name || 'Profile'}
                  src={user?.avatar || user?.photo || null}
                  size={40}
                  variant="circle"
                />
                <div>
                  <h6 className="mb-0">{user?.name || 'User'}</h6>
                  <p className="text-primary mb-0">{user?.role || 'Administrator'}</p>
                </div>
              </div>
              <hr className="m-0" />

              <div className="p-2 d-flex align-items-center justify-content-between mobile-more-row">
                <div className="d-flex align-items-center gap-2">
                  <span className="mobile-more-icon">
                    <i className={isDarkMode ? 'ti ti-moon' : 'ti ti-brightness-up'} />
                  </span>
                  <div className="d-flex flex-column lh-1">
                    <span className="mobile-more-title">Dark mode</span>
                    <small className="text-muted">{isDarkMode ? 'On' : 'Off'}</small>
                  </div>
                </div>
                <div
                  className="form-check form-switch m-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={isDarkMode}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDarkMode(e.target.checked);
                    }}
                    aria-label="Toggle dark mode"
                  />
                </div>
              </div>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item"
                onClick={() => navigate(notificationsPath)}
              >
                <span className="mobile-more-icon">
                  <i className="ti ti-bell" />
                </span>
                Notifications
              </button>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item"
                onClick={() => navigate(chatPath)}
              >
                <span className="mobile-more-icon">
                  <i className="ti ti-brand-hipchat" />
                </span>
                Chat
              </button>
              <hr className="m-0" />
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item"
                onClick={() => navigate(profilePath)}
              >
                <span className="mobile-more-icon">
                  <i className="ti ti-user-circle" />
                </span>
                My Profile
              </button>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item"
                onClick={() => navigate(settingsPath)}
              >
                <span className="mobile-more-icon">
                  <i className="ti ti-settings" />
                </span>
                Settings
              </button>
              <hr className="m-0" />
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 p-2 mobile-more-item text-danger"
                onClick={handleLogout}
              >
                <span className="mobile-more-icon mobile-more-icon-danger">
                  <i className="ti ti-login" />
                </span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
