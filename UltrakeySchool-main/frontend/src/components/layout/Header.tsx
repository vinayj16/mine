import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import apiClient from '../../api/client';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
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
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
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
    document.body.classList.toggle('mini-sidebar', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMobileSidebarOpen);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

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
      await apiClient.post('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleSidebarToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const handleMobileToggle = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const handleFullScreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfilePath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role.includes('hostel') || role.includes('warden')) {
      return '/dashboard/hostel/profile';
    }
    if (role.includes('teacher')) return '/dashboard/teacher/profile';
    if (role.includes('student')) return '/dashboard/student/profile';
    if (role.includes('parent')) return '/dashboard/parent/profile';
    if (role.includes('accountant')) return '/accountant/profile';
    if (role.includes('librarian')) return '/dashboard/librarian/profile';
    if (role.includes('transport')) return '/transport';
    if (role.includes('agent')) return '/agent/profile';
    return '/institution/settings/profile';
  };

  const getSettingsPath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role.includes('hostel') || role.includes('warden')) {
      return '/dashboard/hostel/settings';
    }
    if (role.includes('teacher')) return '/dashboard/teacher/settings';
    if (role.includes('student')) return '/dashboard/student/settings';
    if (role.includes('parent')) return '/dashboard/parent/settings';
    if (role.includes('accountant')) return '/accountant/settings';
    if (role.includes('librarian')) return '/dashboard/librarian/settings';
    if (role.includes('transport')) return '/institution/settings';
    if (role.includes('agent')) return '/agent/settings';
    return '/institution/settings';
  };

  const profilePath = getProfilePath();
  const settingsPath = getSettingsPath();

  const getChatPath = () => {
    const role = user?.role?.toLowerCase() || '';
    if (role.includes('accountant')) return '/accountant/applications/chat';
    if (role.includes('agent')) return '/agent/applications/chat';
    return '/dashboard/applications/chat';
  };

  const chatPath = getChatPath();

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
        navigate('/staffs/add');
        break;
      case 'invoice':
        navigate('/invoices/add');
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
      <div className="header">
        <div className="header-left active">
          <Link to="/" className="logo logo-normal">
            <img src="/assets/img/logo.png" alt="Ultrakey logo" />
          </Link>
          <Link to="/" className="logo-small">
            <img src={isDarkMode ? "/assets/img/Ultrakey_white_fav.png" : "/assets/img/Ultrakey_fav.png"} alt="Ultrakey logo small" />
          </Link>
          <Link to="/" className="dark-logo">
            <img src="/assets/img/logo_white.png" alt="Ultrakey logo dark" />
          </Link>
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
            <button type="button" className="btn btn-link p-0 me-2" id="toggle_btn1" aria-label="Toggle sidebar" onClick={handleSidebarToggle}>
              <i className="ti ti-menu-deep" />
            </button>
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
                <a
                  href="javascript:void(0);"
                  className="btn btn-outline-light bg-white btn-icon me-1"
                  data-bs-toggle="dropdown"
                  aria-expanded={isAddNewOpen}
                  onClick={() => {
                    setAddNewOpen((prev) => !prev);
                    setNotificationOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  <i className="ti ti-square-rounded-plus" />
                </a>
                <div className={`dropdown-menu dropdown-menu-right border shadow-sm dropdown-md ${isAddNewOpen ? 'show' : ''}`} style={{ display: isAddNewOpen ? 'block' : 'none' }}>
                  <div className="p-3 border-bottom">
                    <h5>Add New</h5>
                  </div>
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
                  setDarkMode(!isDarkMode);
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
                    <div className="d-flex flex-column">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification._id} className={`border-bottom mb-3 pb-3 ${!notification.read ? 'unread-notification' : ''}`}>
                          <div className="d-flex">
                            <span className="avatar avatar-lg me-2 flex-shrink-0">
                              {notification.sender?.photo ? (
                                <img src={notification.sender.photo} alt="Profile" />
                              ) : (
                                <span className="avatar-title rounded-circle bg-primary">
                                  {notification.sender?.name?.charAt(0) || 'N'}
                                </span>
                              )}
                            </span>
                            <div className="flex-grow-1">
                              <p className="mb-1">
                                <span className="text-dark fw-semibold">{notification.title}</span>
                                {' '}{notification.message}
                              </p>
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="d-flex pt-3">
                  <button
                    className="btn btn-light w-100 me-2"
                    onClick={() => setNotificationOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary w-100"
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    View All
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
                <span className="avatar avatar-md rounded">
                  {user?.photo ? (
                    <img src={user.photo} alt="Profile" className="img-fluid" />
                  ) : (
                    <span className="avatar-title rounded-circle bg-primary">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </span>
              </a>

              <div className={`dropdown-menu dropdown-menu-end p-0 mobile-more-menu ${isProfileOpen ? 'show' : ''}`} style={{ display: isProfileOpen ? 'block' : 'none' }}>
                <div className="d-block">
                  <div className="d-flex align-items-center px-2 py-3">
                    <span className="avatar avatar-md me-2 online avatar-rounded">
                      {user?.photo ? (
                        <img src={user.photo} alt="Profile" />
                      ) : (
                        <span className="avatar-title rounded-circle bg-primary">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </span>
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
                <span className="avatar avatar-md me-2 online avatar-rounded">
                  {user?.photo ? (
                    <img src={user.photo} alt="Profile" />
                  ) : (
                    <span className="avatar-title rounded-circle bg-primary">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </span>
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
                onClick={() => navigate('/notifications')}
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