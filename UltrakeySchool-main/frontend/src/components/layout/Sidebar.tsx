import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { canAccessRoute } from '../../utils/permissions'
import { useAuth } from '../../store/authStore'
import { getSidebarMenu } from '../../config/sidebar-menus'

type MenuItem = {
  label: string
  icon?: string
  to?: string
  children?: MenuItem[]
  header?: boolean
  id?: string
  badge?: string
}

interface SidebarProps {
  isSidebarCollapsed?: boolean
  isMobileSidebarOpen?: boolean
  onMobileClose?: () => void
}

const menu: MenuItem[] = [
  {
    label: 'Main',
    header: true,
  },
  {
    label: 'Dashboards',
    id: 'dashboards',
    icon: 'ti ti-layout-dashboard',
    children: [
      { label: 'Admin Dashboard', to: '/', icon: 'ti ti-layout-grid' },
      { label: 'Teacher Dashboard', to: '/teacher-dashboard' },
      { label: 'Student Dashboard', to: '/student-dashboard' },
      { label: 'Parent Dashboard', to: '/parent-dashboard' },
    ],
  },
  {
    label: 'Application',
    id: 'application',
    icon: 'ti ti-layout-list',
    children: [
      { label: 'Chat', to: '/chat' },
      { label: 'Call', to: '/call' },
      { label: 'Calendar', to: '/calendar' },
      { label: 'Email', to: '/email' },
      { label: 'To Do', to: '/todo' },
      { label: 'Notes', to: '/notes' },
      { label: 'File Manager', to: '/file-manager' },
    ],
  },
  {
    label: 'Layout',
    header: true,
  },
  {
    label: 'Layouts',
    id: 'layouts',
    icon: 'ti ti-layout-sidebar',
    children: [
      { label: 'Default', to: '/layout-default' },
      { label: 'Mini', to: '/layout-mini' },
      { label: 'RTL', to: '/layout-rtl' },
      { label: 'Box', to: '/layout-box' },
      { label: 'Dark', to: '/layout-dark' },
    ],
  },
  {
    label: 'Peoples',
    header: true,
  },
  {
    label: 'Students',
    id: 'students',
    icon: 'ti ti-school',
    children: [
      { label: 'All Students', to: '/student-grid' },
      { label: 'Student List', to: '/students' },
      { label: 'Student Details', to: '/student-details' },
      { label: 'Student Promotion', to: '/student-promotion' },
    ],
  },
  {
    label: 'Parents',
    id: 'parents',
    icon: 'ti ti-user-bolt',
    children: [
      { label: 'All Parents', to: '/parent-grid' },
      { label: 'Parent List', to: '/parents' },
    ],
  },
  {
    label: 'Guardians',
    id: 'guardians',
    icon: 'ti ti-user-shield',
    children: [
      { label: 'All Guardians', to: '/guardian-grid' },
      { label: 'Guardian List', to: '/guardians' },
    ],
  },
  {
    label: 'Teachers',
    id: 'teachers',
    icon: 'ti ti-users',
    children: [
      { label: 'All Teachers', to: '/teacher-grid' },
      { label: 'Teacher List', to: '/teachers' },
      { label: 'Teacher Details', to: '/teacher-details' },
      { label: 'Routine', to: '/routine-teachers' },
    ],
  },
  {
    label: 'Academic',
    header: true,
  },
  {
    label: 'Classes',
    id: 'classes',
    icon: 'ti ti-school-bell',
    children: [
      { label: 'All Classes', to: '/classes' },
      { label: 'Schedule', to: '/schedule-classes' },
    ],
  },
  { label: 'Class Room', icon: 'ti ti-building', to: '/class-room' },
  { label: 'Class Routine', icon: 'ti ti-bell-school', to: '/class-routine' },
  { label: 'Section', icon: 'ti ti-square-rotated-forbid-2', to: '/class-section' },
  { label: 'Subject', icon: 'ti ti-book', to: '/class-subject' },
  { label: 'Syllabus', icon: 'ti ti-book-upload', to: '/class-syllabus' },
  { label: 'Time Table', icon: 'ti ti-table', to: '/class-time-table' },
  { label: 'Home Work', icon: 'ti ti-license', to: '/class-home-work' },
  {
    label: 'Examinations',
    id: 'examinations',
    icon: 'ti ti-hexagonal-prism-plus',
    children: [
      { label: 'Exam', to: '/exam' },
      { label: 'Exam Schedule', to: '/exam-schedule' },
      { label: 'Grade', to: '/grade' },
      { label: 'Exam Attendance', to: '/exam-attendance' },
      { label: 'Exam Results', to: '/exam-results' },
    ],
  },
  { label: 'Reasons', icon: 'ti ti-lifebuoy', to: '/academic-reasons' },
  {
    label: 'Management',
    header: true,
  },
  {
    label: 'Fees Collection',
    id: 'fees-collection',
    icon: 'ti ti-report-money',
    children: [
      { label: 'Fees Group', to: '/fees-group' },
      { label: 'Fees Type', to: '/fees-type' },
      { label: 'Fees Master', to: '/fees-master' },
      { label: 'Fees Assign', to: '/fees-assign' },
      { label: 'Collect Fees', to: '/collect-fees' },
    ],
  },
  {
    label: 'Library',
    id: 'library',
    icon: 'ti ti-notebook',
    children: [
      { label: 'Library Members', to: '/library-members' },
      { label: 'Books', to: '/library-books' },
      { label: 'Issue Book', to: '/library-issue-book' },
      { label: 'Return', to: '/library-return' },
    ],
  },
  { label: 'Sports', icon: 'ti ti-run', to: '/sports' },
  { label: 'Players', icon: 'ti ti-play-football', to: '/players' },
  {
    label: 'Hostel',
    id: 'hostel',
    icon: 'ti ti-building-fortress',
    children: [
      { label: 'Hostel List', to: '/hostel-list' },
      { label: 'Hostel Rooms', to: '/hostel-rooms' },
      { label: 'Room Type', to: '/hostel-room-type' },
    ],
  },
{
    label: 'Transport',
    id: 'transport',
    icon: 'ti ti-bus',
    children: [
      { label: 'Dashboard', to: '/transport' },
      { label: 'Routes', to: '/transport/routes' },
      { label: 'Pickup Points', to: '/transport/pickup-points' },
      { label: 'Vehicle Drivers', to: '/transport/drivers' },
      { label: 'Vehicle', to: '/transport/vehicles' },
      { label: 'Assign Vehicle', to: '/transport/assign' },
      { label: 'Reports', to: '/transport/reports' },
    ],
  },
  {
    label: 'HRM',
    header: true,
  },
  { label: 'Staffs', icon: 'ti ti-users-group', to: '/staffs' },
  { label: 'Departments', icon: 'ti ti-layout-distribute-horizontal', to: '/departments' },
  { label: 'Designation', icon: 'ti ti-user-exclamation', to: '/designation' },
  {
    label: 'Attendance',
    id: 'hr-attendance',
    icon: 'ti ti-calendar-share',
    children: [
      { label: 'Student Attendance', to: '/student-attendance' },
      { label: 'Teacher Attendance', to: '/teacher-attendance' },
      { label: 'Staff Attendance', to: '/staff-attendance' },
    ],
  },
  {
    label: 'Leaves',
    id: 'hr-leaves',
    icon: 'ti ti-calendar-stats',
    children: [
      { label: 'List of leaves', to: '/list-leaves' },
      { label: 'Approve Request', to: '/approve-request' },
    ],
  },
  { label: 'Holidays', icon: 'ti ti-briefcase', to: '/holidays' },
  { label: 'Payroll', icon: 'ti ti-moneybag', to: '/payroll' },
  {
    label: 'Finance & Accounts',
    header: true,
  },
  {
    label: 'Accounts',
    id: 'accounts',
    icon: 'ti ti-swipe',
    children: [
      { label: 'Expenses', to: '/expenses' },
      { label: 'Expense Category', to: '/expenses-category' },
      { label: 'Income', to: '/accounts-income' },
      { label: 'Invoices', to: '/accounts-invoices' },
      { label: 'Invoice View', to: '/invoice' },
      { label: 'Transactions', to: '/accounts-transactions' },
    ],
  },
  {
    label: 'Announcements',
    header: true,
  },
  { label: 'Notice Board', icon: 'ti ti-clipboard-data', to: '/notice-board' },
  { label: 'Events', icon: 'ti ti-calendar-question', to: '/events' },
  {
    label: 'Reports',
    header: true,
  },
  { label: 'Attendance Report', icon: 'ti ti-calendar-due', to: '/attendance-report' },
  { label: 'Class Report', icon: 'ti ti-graph', to: '/class-report' },
  { label: 'Student Report', icon: 'ti ti-chart-infographic', to: '/student-report' },
  { label: 'Grade Report', icon: 'ti ti-calendar-x', to: '/grade-report' },
  { label: 'Leave Report', icon: 'ti ti-line', to: '/leave-report' },
  { label: 'Fees Report', icon: 'ti ti-mask', to: '/fees-report' },
  {
    label: 'User Management',
    header: true,
  },
  { label: 'Users', icon: 'ti ti-users-minus', to: '/users' },
  { label: 'Roles & Permissions', icon: 'ti ti-shield-plus', to: '/roles-permission' },
  { label: 'Delete Account Request', icon: 'ti ti-user-question', to: '/delete-account' },
  {
    label: 'Membership',
    header: true,
  },
  { label: 'Membership Plans', icon: 'ti ti-user-plus', to: '/membership-plans' },
  { label: 'Membership Addons', icon: 'ti ti-cone-plus', to: '/membership-addons' },
  { label: 'Transactions', icon: 'ti ti-file-power', to: '/membership-transactions' },
  {
    label: 'Content',
    header: true,
  },
  { label: 'Pages', icon: 'ti ti-page-break', to: '/pages' },
  {
    label: 'Blog',
    id: 'blog',
    icon: 'ti ti-brand-blogger',
    children: [
      { label: 'All Blogs', to: '/blog' },
      { label: 'Categories', to: '/blog-categories' },
      { label: 'Comments', to: '/blog-comments' },
      { label: 'Tags', to: '/blog-tags' },
    ],
  },
  {
    label: 'Location',
    id: 'location',
    icon: 'ti ti-map-pin-search',
    children: [
      { label: 'Countries', to: '/countries' },
      { label: 'States', to: '/states' },
      { label: 'Cities', to: '/cities' },
    ],
  },
  { label: 'Testimonials', icon: 'ti ti-quote', to: '/testimonials' },
  { label: 'FAQ', icon: 'ti ti-question-mark', to: '/faq' },
  {
    label: 'Support',
    header: true,
  },
  { label: 'Contact Messages', icon: 'ti ti-message', to: '/contact-messages' },
  { label: 'Tickets', icon: 'ti ti-ticket', to: '/tickets' },
  {
    label: 'Pages',
    header: true,
  },
  { label: 'Profile', icon: 'ti ti-user', to: '/profile' },
  {
    label: 'Authentication',
    id: 'authentication',
    icon: 'ti ti-lock-open',
    children: [
      {
        label: 'Login',
        id: 'login',
        children: [
          { label: 'Cover', to: '/login' },
          { label: 'Illustration', to: '/login-2' },
          { label: 'Basic', to: '/login-3' },
        ],
      },
      {
        label: 'Register',
        id: 'register',
        children: [
          { label: 'Cover', to: '/register' },
          { label: 'Illustration', to: '/register-2' },
          { label: 'Basic', to: '/register-3' },
        ],
      },
      {
        label: 'Forgot Password',
        id: 'forgot-password',
        children: [
          { label: 'Cover', to: '/forgot-password' },
          { label: 'Illustration', to: '/forgot-password-2' },
          { label: 'Basic', to: '/forgot-password-3' },
        ],
      },
      {
        label: 'Reset Password',
        id: 'reset-password',
        children: [
          { label: 'Cover', to: '/reset-password' },
          { label: 'Illustration', to: '/reset-password-2' },
          { label: 'Basic', to: '/reset-password-3' },
        ],
      },
      {
        label: 'Email Verification',
        id: 'email-verification',
        children: [
          { label: 'Cover', to: '/email-verification' },
          { label: 'Illustration', to: '/email-verification-2' },
          { label: 'Basic', to: '/email-verification-3' },
        ],
      },
      {
        label: '2 Step Verification',
        id: 'two-step-verification',
        children: [
          { label: 'Cover', to: '/two-step-verification' },
          { label: 'Illustration', to: '/two-step-verification-2' },
          { label: 'Basic', to: '/two-step-verification-3' },
        ],
      },
      {
        label: 'Lock Screen',
        id: 'lock-screen',
        children: [
          { label: 'Cover', to: '/lock-screen' },
        ],
      },
    ],
  },
  {
    label: 'Error Pages',
    id: 'error-pages',
    icon: 'ti ti-error-404',
    children: [
      { label: '404 Error', to: '/404-error' },
      { label: '500 Error', to: '/500-error' },
    ],
  },
  { label: 'Blank Page', icon: 'ti ti-brand-nuxt', to: '/blank-page' },
  { label: 'Coming Soon', icon: 'ti ti-file', to: '/coming-soon' },
  { label: 'Under Maintenance', icon: 'ti ti-moon-2', to: '/under-maintenance' },
  {
    label: 'Settings',
    header: true,
  },
  {
    label: 'General Settings',
    id: 'general-settings',
    icon: 'ti ti-shield-cog',
    children: [
      { label: 'Profile Settings', to: '/profile-settings' },
      { label: 'Security Settings', to: '/security-settings' },
      { label: 'Notifications Settings', to: '/notifications-settings' },
      { label: 'Connected Apps', to: '/connected-apps' },
    ],
  },
  {
    label: 'Website Settings',
    id: 'website-settings',
    icon: 'ti ti-device-laptop',
    children: [
      { label: 'Company Settings', to: '/company-settings' },
      { label: 'Localization', to: '/localization' },
      { label: 'Prefixes', to: '/prefixes' },
      { label: 'Preferences', to: '/preferences' },
      { label: 'Social Authentication', to: '/social-authentication' },
      { label: 'Language', to: '/language' },
    ],
  },
  {
    label: 'App Settings',
    id: 'app-settings',
    icon: 'ti ti-apps',
    children: [
      { label: 'Invoice Settings', to: '/invoice-settings' },
      { label: 'Custom Fields', to: '/custom-fields' },
    ],
  },
  {
    label: 'System Settings',
    id: 'system-settings',
    icon: 'ti ti-file-symlink',
    children: [
      { label: 'Email Settings', to: '/email-settings' },
      { label: 'Email Templates', to: '/email-templates' },
      { label: 'SMS Settings', to: '/sms-settings' },
      { label: 'GDPR Cookies', to: '/gdpr-cookies' },
    ],
  },
  {
    label: 'Financial Settings',
    id: 'financial-settings',
    icon: 'ti ti-zoom-money',
    children: [
      { label: 'Payment Gateways', to: '/payment-gateways' },
      { label: 'Tax Rates', to: '/tax-rates' },
    ],
  },
  {
    label: 'Academic Settings',
    id: 'academic-settings',
    icon: 'ti ti-calendar-repeat',
    children: [
      { label: 'School Settings', to: '/school-settings' },
      { label: 'Religion', to: '/religion' },
    ],
  },
  {
    label: 'Other Settings',
    id: 'other-settings',
    icon: 'ti ti-flag-cog',
    children: [
      { label: 'Storage', to: '/storage' },
      { label: 'Ban IP Address', to: '/ban-ip-address' },
    ],
  },
  {
    label: 'UI Interface',
    header: true,
  },
  {
    label: 'Base UI',
    id: 'base-ui',
    icon: 'ti ti-hierarchy-2',
    children: [
      { label: 'Alerts', to: '/ui-alerts' },
      { label: 'Accordion', to: '/ui-accordion' },
      { label: 'Avatar', to: '/ui-avatar' },
      { label: 'Badges', to: '/ui-badges' },
      { label: 'Border', to: '/ui-borders' },
      { label: 'Buttons', to: '/ui-buttons' },
      { label: 'Button Group', to: '/ui-buttons-group' },
      { label: 'Breadcrumb', to: '/ui-breadcrumb' },
      { label: 'Card', to: '/ui-cards' },
      { label: 'Carousel', to: '/ui-carousel' },
      { label: 'Colors', to: '/ui-colors' },
      { label: 'Dropdowns', to: '/ui-dropdowns' },
      { label: 'Grid', to: '/ui-grid' },
      { label: 'Images', to: '/ui-images' },
      { label: 'Lightbox', to: '/ui-lightbox' },
      { label: 'Media', to: '/ui-media' },
      { label: 'Modals', to: '/ui-modals' },
      { label: 'Offcanvas', to: '/ui-offcanvas' },
      { label: 'Pagination', to: '/ui-pagination' },
      { label: 'Popovers', to: '/ui-popovers' },
      { label: 'Progress', to: '/ui-progress' },
      { label: 'Placeholders', to: '/ui-placeholders' },
      { label: 'Spinner', to: '/ui-spinner' },
      { label: 'Sweet Alerts', to: '/ui-sweetalerts' },
      { label: 'Tabs', to: '/ui-nav-tabs' },
      { label: 'Toasts', to: '/ui-toasts' },
      { label: 'Tooltips', to: '/ui-tooltips' },
      { label: 'Typography', to: '/ui-typography' },
      { label: 'Video', to: '/ui-video' },
    ],
  },
  {
    label: 'Advanced UI',
    id: 'advanced-ui',
    icon: 'ti ti-hierarchy-3',
    children: [
      { label: 'Ribbon', to: '/ui-ribbon' },
      { label: 'Clipboard', to: '/ui-clipboard' },
      { label: 'Drag & Drop', to: '/ui-drag-drop' },
      { label: 'Range Slider', to: '/ui-rangeslider' },
      { label: 'Rating', to: '/ui-rating' },
      { label: 'Text Editor', to: '/ui-text-editor' },
      { label: 'Counter', to: '/ui-counter' },
      { label: 'Scrollbar', to: '/ui-scrollbar' },
      { label: 'Sticky Note', to: '/ui-stickynote' },
      { label: 'Timeline', to: '/ui-timeline' },
    ],
  },
  {
    label: 'Charts',
    id: 'charts',
    icon: 'ti ti-chart-line',
    children: [
      { label: 'Apex Charts', to: '/chart-apex' },
      { label: 'Chart C3', to: '/chart-c3' },
      { label: 'Chart Js', to: '/chart-js' },
      { label: 'Morris Charts', to: '/chart-morris' },
      { label: 'Flot Charts', to: '/chart-flot' },
      { label: 'Peity Charts', to: '/chart-peity' },
    ],
  },
  {
    label: 'Icons',
    id: 'icons',
    icon: 'ti ti-icons',
    children: [
      { label: 'Fontawesome Icons', to: '/icon-fontawesome' },
      { label: 'Feather Icons', to: '/icon-feather' },
      { label: 'Ionic Icons', to: '/icon-ionic' },
      { label: 'Material Icons', to: '/icon-material' },
      { label: 'Pe7 Icons', to: '/icon-pe7' },
      { label: 'Simpleline Icons', to: '/icon-simpleline' },
      { label: 'Themify Icons', to: '/icon-themify' },
      { label: 'Weather Icons', to: '/icon-weather' },
      { label: 'Typicon Icons', to: '/icon-typicon' },
      { label: 'Flag Icons', to: '/icon-flag' },
    ],
  },
  {
    label: 'Forms',
    id: 'forms',
    icon: 'ti ti-input-search',
    children: [
      {
        label: 'Form Elements',
        id: 'form-elements',
        children: [
          { label: 'Basic Inputs', to: '/form-basic-inputs' },
          { label: 'Checkbox & Radios', to: '/form-checkbox-radios' },
          { label: 'Input Groups', to: '/form-input-groups' },
          { label: 'Grid & Gutters', to: '/form-grid-gutters' },
          { label: 'Form Select', to: '/form-select' },
          { label: 'Input Masks', to: '/form-mask' },
          { label: 'File Uploads', to: '/form-fileupload' },
        ],
      },
      {
        label: 'Layouts',
        id: 'form-layouts',
        children: [
          { label: 'Horizontal Form', to: '/form-horizontal' },
          { label: 'Vertical Form', to: '/form-vertical' },
          { label: 'Floating Labels', to: '/form-floating-labels' },
        ],
      },
      { label: 'Form Validation', to: '/form-validation' },
      { label: 'Select2', to: '/form-select2' },
      { label: 'Form Wizard', to: '/form-wizard' },
    ],
  },
  {
    label: 'Tables',
    id: 'tables',
    icon: 'ti ti-table-plus',
    children: [
      { label: 'Basic Tables', to: '/tables-basic' },
      { label: 'Data Table', to: '/data-tables' },
    ],
  },
  {
    label: 'Help',
    header: true,
  },
  { label: 'Documentation', icon: 'ti ti-file-text', to: '/documentation' },
  { 
    label: 'Changelog', 
    icon: 'ti ti-exchange', 
    to: '/changelog',
    badge: 'v1.8.3'
  },
  {
    label: 'Multi Level',
    id: 'multi-level',
    icon: 'ti ti-menu-2',
    children: [
      { label: 'Multilevel 1', to: '/multilevel-1' },
      {
        label: 'Multilevel 2',
        id: 'multilevel-2',
        children: [
          { label: 'Multilevel 2.1', to: '/multilevel-2-1' },
          {
            label: 'Multilevel 2.2',
            id: 'multilevel-2-2',
            children: [
              { label: 'Multilevel 2.2.1', to: '/multilevel-2-2-1' },
              { label: 'Multilevel 2.2.2', to: '/multilevel-2-2-2' },
            ],
          },
        ],
      },
      { label: 'Multilevel 3', to: '/multilevel-3' },
    ],
  },
]

const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarCollapsed = false, 
  isMobileSidebarOpen = false, 
  onMobileClose 
}) => {
  const { user } = useAuth()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    dashboards: true,
  })

  // Get role-based menu
  const roleBasedMenu = getSidebarMenu(user?.role || '')

  // Render menu sections and items
  const renderRoleBasedMenu = () => {
    if (!roleBasedMenu || roleBasedMenu.length === 0) {
      return <ul>{menu.map((item) => renderMenuItem(item))}</ul>
    }

    return (
      <>
        {roleBasedMenu.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h6 className="sidebar-title">{section.title}</h6>
            <ul>
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => 
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    )
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close on mobile screens (less than 1024px)
      if (window.innerWidth < 1024 && isMobileSidebarOpen) {
        const sidebar = document.getElementById('sidebar')
        if (sidebar && !sidebar.contains(event.target as Node)) {
          onMobileClose?.()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileSidebarOpen, onMobileClose])

  const toggleMenu = (id?: string, shouldNavigate: boolean = false, path?: string) => {
    if (!id) return
    
    // Toggle only the clicked menu, keep others open
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
    
    // If it's a direct link and should navigate, handle the navigation
    if (shouldNavigate && path) {
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = path
    }
  }

  const renderSubItem = (item: MenuItem, level: number = 1, parentPath: string = ''): React.ReactNode | null => {
    if (item.children && item.children.length > 0) {
      const isLevelTwo = level === 2
      const hasId = !!item.id
      const isOpen = hasId ? openMenus[item.id!] : true
      const currentPath = item.to || ''
      const fullPath = parentPath ? `${parentPath}${currentPath}` : currentPath

      // Check if any child is active
      const isAnyChildActive = item.children.some(child => {
        const childPath = child.to || ''
        return window.location.pathname === childPath || 
               (childPath && window.location.pathname.startsWith(childPath))
      })

      // Determine if current item is active
      const isActive = window.location.pathname === fullPath || 
                      isAnyChildActive ||
                      (item.id && openMenus[item.id])

      return (
        <li className={`${isLevelTwo ? 'submenu submenu-two' : 'submenu'} ${isActive ? 'active' : ''}`} key={item.label}>
          <a
            href={item.to || '#'}
            style={!isLevelTwo && (isActive || isOpen) ? { background: '#F2F5FF' } : {}}
            onClick={(e) => {
              e.preventDefault()
              // For parent items with children, toggle the menu
              if (hasId && item.children?.length) {
                toggleMenu(item.id, !item.children.some(child => child.to === window.location.pathname), item.to)
              } 
              // For direct links without children, navigate
              else if (item.to) {
                window.location.href = item.to
              }
            }}
            className={`${hasId && isOpen ? (isLevelTwo ? 'subdrop' : 'subdrop') : ''} ${isActive ? 'active' : ''}`}
          >
            {item.icon && !isLevelTwo && <i className={item.icon} />}
            <span className="menu-title">{item.label}</span>
            <span className={isLevelTwo ? 'menu-arrow inside-submenu' : 'menu-arrow'}></span>
          </a>
          <ul style={hasId ? { display: isOpen ? 'block' : 'none' } : undefined}>
            {item.children.map((child) => renderSubItem(child, level + 1))}
          </ul>
        </li>
      )
    }

    if (!item.to) return null

    if (level > 1) {
      return (
        <li key={item.to}>
          <NavLink 
            to={item.to} 
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            onClick={() => {
              // Close mobile sidebar after navigation
              if (window.innerWidth < 1024 && onMobileClose) {
                onMobileClose()
              }
            }}
          >
            {item.label}
          </NavLink>
        </li>
      )
    }

    return (
      <li key={item.to}>
        <NavLink 
          to={item.to} 
          className={({ isActive }) => (isActive ? 'active' : undefined)}
          onClick={() => {
            // Close mobile sidebar after navigation
            if (window.innerWidth < 1024 && onMobileClose) {
              onMobileClose()
            }
          }}
        >
          {item.icon && <i className={item.icon} />}
          <span>{item.label}</span>
        </NavLink>
      </li>
    )
  }

  const renderMenuItem = (item: MenuItem) => {
    if (item.header) {
      return (
        <li key={item.label}>
          <h6 className="submenu-hdr">
            <span>{item.label}</span>
          </h6>
        </li>
      )
    }

    if (item.children && item.children.length > 0) {
      // filter children by permission
      const visibleChildren = item.children.filter((child) => {
        if (!child.to) return true
        return canAccessRoute(user, child.to as string)
      })
      if (visibleChildren.length === 0) return null
      return renderSubItem({ ...item, children: visibleChildren })
    }

    if (!item.to) return null

    // single item - check permission
    if (!canAccessRoute(user, item.to)) return null

    return renderSubItem(item)
  }

  return (
    <div 
      className={`sidebar ${isSidebarCollapsed ? 'mini-sidebar' : ''} ${isMobileSidebarOpen ? 'open' : ''}`} 
      id="sidebar"
      style={{
        ...(isMobileSidebarOpen && { marginLeft: '0' })
      }}
      onMouseEnter={() => {
        // Always expand on hover, regardless of collapsed state
        document.body.classList.add('expand-menu')
        // Open all menus temporarily on hover
        setOpenMenus((prev) => {
          const expandedState = Object.keys(prev).reduce((acc, key) => {
            acc[key] = true
            return acc
          }, {} as Record<string, boolean>)
          return expandedState
        })
      }}
      onMouseLeave={() => {
        // Always collapse when hover ends
        document.body.classList.remove('expand-menu')
        // Close all menus when hover ends, keep only dashboards open
        setOpenMenus({
          dashboards: true,
        })
      }}
    >
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu" className="sidebar-menu">
      
          
          {/* School Info Section */}
          <ul>
            <li>
              <a href="javascript:void(0);" 
                 className="d-flex align-items-center border bg-white rounded p-2 mb-4 sidebar-school-info"
                 style={{
                   display: isSidebarCollapsed && !document.body.classList.contains('expand-sidebar') ? 'none' : 'flex'
                 }}
              >
                <div className="d-flex align-items-center">
                  <img src="/assets/img/icons/global-img.svg" 
                       className="avatar avatar-md img-fluid rounded me-2" 
                       alt="Global Icon" 
                  />
                  <div>
                    <span className="text-dark fw-normal sidebar-school-text">Global International</span>
                  </div>
                </div>
              </a>
            </li>
          </ul>
          
          {renderRoleBasedMenu()}
        </div>
      </div>
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-overlay opened" 
          onClick={onMobileClose}
        />
      )}
    </div>
  )
}

export default Sidebar

