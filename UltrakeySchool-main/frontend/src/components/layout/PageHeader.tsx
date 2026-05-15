import { useLocation, Link } from 'react-router-dom';
import { SIDEBAR_MENUS } from '../../config/sidebar-menus';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title?: string;
  showBreadcrumbs?: boolean;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  showBreadcrumbs = true, 
  actions 
}) => {
  const location = useLocation();
  
  const getPageTitle = (path: string): string => {
    if (title) return title;
    
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';
    
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (lastSegment === pathSegments[0]) {
      const titleMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'main': 'Main Dashboard',
        'analytics': 'Analytics',
        'finance': 'Finance',
        'subscription': 'Subscription',
        'profile': 'Profile',
        'settings': 'Settings',
        'notifications': 'Notifications',
        'security': 'Security',
        'hostel': 'Hostel Management',
        'rooms': 'Rooms',
        'fees': 'Fees',
        'payments': 'Payment History',
        'users': 'User Directory',
        'students': 'Students',
        'teachers': 'Teachers',
        'parents': 'Parents',
        'classes': 'Classes',
        'sections': 'Sections',
        'subjects': 'Subjects',
        'attendance': 'Attendance',
        'exams': 'Examinations',
        'results': 'Results',
        'library': 'Library',
        'sports': 'Sports',
        'transport': 'Transport',
        'hrm': 'HRM',
        'staffs': 'Staffs',
        'departments': 'Departments',
        'designations': 'Designations',
        'leaves': 'Leaves',
        'payroll': 'Payroll',
        'holidays': 'Holidays',
        'approvals': 'Approvals',
        'expenses': 'Expenses',
        'income': 'Income',
        'invoices': 'Invoices',
        'transactions': 'Transactions',
        'reports': 'Reports',
        'notice-board': 'Notice Board',
        'events': 'Events',
        'roles': 'Roles & Permissions',
        'branches': 'Branches',
        'tickets': 'Support Tickets',
        'modules': 'Module Activation',
        'profile-settings': 'Profile Settings',
        'school-settings': 'School Settings',
        'create-credentials': 'Create Credentials',
        'pending-requests': 'Pending Requests',
        'performance': 'Performance',
        'commissions': 'Commissions',
        'institutions': 'Institutions',
        'add-institution': 'Add Institution',
        'calendar': 'Calendar',
        'chat': 'Chat',
        'email': 'Email',
        'notes': 'Notes',
        'todo': 'Todo',
        'file-manager': 'File Manager',
        'call': 'Call'
      };
      return titleMap[lastSegment] || formatTitle(lastSegment);
    }
    
    return formatTitle(lastSegment);
  };

  const formatTitle = (text: string): string => {
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    segments.forEach((segment, index) => {
      const pathSoFar = '/' + segments.slice(0, index + 1).join('/');
      const titleMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'institution': 'Institution',
        'institute-admin': 'Institute Admin',
        'admin': 'Admin',
        'main': 'Main',
        'analytics': 'Analytics',
        'finance': 'Finance',
        'subscription': 'Subscription',
        'hostel': 'Hostel',
        'rooms': 'Rooms',
        'fees': 'Fees',
        'payments': 'Payments',
        'students': 'Students',
        'teachers': 'Teachers',
        'parents': 'Parents',
        'classes': 'Classes',
        'sections': 'Sections',
        'subjects': 'Subjects',
        'attendance': 'Attendance',
        'exams': 'Exams',
        'results': 'Results',
        'library': 'Library',
        'sports': 'Sports',
        'transport': 'Transport',
        'hrm': 'HRM',
        'staffs': 'Staffs',
        'departments': 'Departments',
        'designations': 'Designations',
        'leaves': 'Leaves',
        'payroll': 'Payroll',
        'holidays': 'Holidays',
        'approvals': 'Approvals',
        'expenses': 'Expenses',
        'income': 'Income',
        'invoices': 'Invoices',
        'transactions': 'Transactions',
        'notice-board': 'Notice Board',
        'events': 'Events',
        'roles': 'Roles',
        'branches': 'Branches',
        'tickets': 'Tickets',
        'modules': 'Modules',
        'settings': 'Settings',
        'profile': 'Profile',
        'security': 'Security',
        'notifications': 'Notifications',
        'create-credentials': 'Create Credentials',
        'pending-requests': 'Pending Requests',
        'performance': 'Performance',
        'commissions': 'Commissions',
        'institutions': 'Institutions',
        'add-institution': 'Add Institution',
        'profile-settings': 'Profile Settings',
        'school-settings': 'School Settings',
        'users': 'Users',
        'calendar': 'Calendar',
        'chat': 'Chat',
        'email': 'Email',
        'notes': 'Notes',
        'todo': 'Todo',
        'file-manager': 'File Manager',
        'call': 'Call',
        'academic': 'Academic',
        'collection': 'Collection',
        'groups': 'Groups',
        'types': 'Types',
        'masters': 'Masters',
        'assignment': 'Assignment',
        'collect': 'Collect',
        'members': 'Members',
        'books': 'Books',
        'issue': 'Issue',
        'return': 'Return',
        'room-types': 'Room Types',
        'reports': 'Reports',
        'routes': 'Routes',
        'vehicles': 'Vehicles',
        'drivers': 'Drivers',
        'pickup-points': 'Pickup Points',
        'assign': 'Assign Vehicle',
        'schedule': 'Schedule',
        'grades': 'Grades',
        'overview': 'Overview',
        'teaching': 'Teaching',
        'student': 'Student',
        'staff': 'Staff'
      };
      
      const label = titleMap[segment] || formatTitle(segment);
      breadcrumbs.push({ label, path: index < segments.length - 1 ? pathSoFar : undefined });
    });
    
    return breadcrumbs;
  };

  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="page-header" style={{ marginBottom: '1.5rem' }}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h3 className="page-title" style={{ marginBottom: '0.25rem', fontWeight: 600, color: '#1e293b' }}>
            {pageTitle}
          </h3>
          {showBreadcrumbs && breadcrumbs.length > 1 && (
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: '0.875rem' }}>
                {breadcrumbs.map((crumb, index) => (
                  <li 
                    key={index} 
                    className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                  >
                    {crumb.path ? (
                      <Link to={crumb.path} style={{ color: '#6366f1', textDecoration: 'none' }}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span style={{ color: '#64748b' }}>{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
