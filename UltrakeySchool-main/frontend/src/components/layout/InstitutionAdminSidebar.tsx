import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import '../../styles/sidebar.css'

interface InstitutionAdminSidebarProps {
  isCollapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

const B = '/institution'

const sections = [
  {
    key: 'main', title: 'MAIN',
    items: [
      { to: `${B}`, label: 'Main Dashboard', icon: 'ti ti-layout-dashboard', end: true },
      { to: `${B}/analytics`, label: 'Analytics', icon: 'ti ti-chart-bar' },
      { to: `${B}/finance`, label: 'Finance', icon: 'ti ti-currency-dollar' },
      { to: `${B}/overview/teaching`, label: 'Teaching Overview', icon: 'ti ti-school' },
      { to: `${B}/overview/students`, label: 'Student Overview', icon: 'ti ti-users' },
      { to: `${B}/overview/parents`, label: 'Parent Overview', icon: 'ti ti-user-heart' },
    ]
  },
  {
    key: 'user-management', title: 'USER MANAGEMENT',
    items: [
      { to: `${B}/create-credentials`, label: 'Create User Credentials', icon: 'ti ti-user-plus' },
      { to: `${B}/users`, label: 'User Directory', icon: 'ti ti-address-book' },
    ]
  },
  {
    key: 'academic', title: 'ACADEMIC',
    items: [
      { to: `${B}/academic/classes`, label: 'Classes', icon: 'ti ti-building-community' },
      { to: `${B}/academic/sections`, label: 'Sections', icon: 'ti ti-layout-rows' },
      { to: `${B}/academic/subjects`, label: 'Subjects', icon: 'ti ti-book' },
      { to: `${B}/academic/syllabus`, label: 'Syllabus', icon: 'ti ti-notebook' },
      { to: `${B}/academic/classrooms`, label: 'Classroom', icon: 'ti ti-door' },
      { to: `${B}/academic/class-routine`, label: 'Class Routine', icon: 'ti ti-calendar-time' },
      { to: `${B}/academic/homework`, label: 'Homework', icon: 'ti ti-pencil' },
    ]
  },
  {
    key: 'peoples', title: 'PEOPLES',
    items: [
      { to: `${B}/students`, label: 'Student List', icon: 'ti ti-users' },
      { to: `${B}/students/add`, label: 'Add Student', icon: 'ti ti-user-plus' },
      { to: `${B}/students/promotion`, label: 'Promotion', icon: 'ti ti-arrow-up-circle' },
      { to: `${B}/students/timetable`, label: 'Timetable', icon: 'ti ti-calendar' },
      { to: `${B}/students/leaves`, label: 'Leaves', icon: 'ti ti-calendar-off' },
      { to: `${B}/students/fees`, label: 'Fees', icon: 'ti ti-receipt' },
      { to: `${B}/students/results`, label: 'Results', icon: 'ti ti-certificate' },
      { to: `${B}/students/library`, label: 'Library', icon: 'ti ti-books' },
      { to: `${B}/teachers`, label: 'Teacher List', icon: 'ti ti-chalkboard' },
      { to: `${B}/teachers/routine`, label: 'Teacher Routine', icon: 'ti ti-calendar-event' },
      { to: `${B}/teachers/leaves`, label: 'Leaves', icon: 'ti ti-calendar-minus' },
      { to: `${B}/teachers/salary`, label: 'Salary', icon: 'ti ti-cash' },
      { to: `${B}/teachers/library`, label: 'Library', icon: 'ti ti-book-2' },
      { to: `${B}/parents`, label: 'Parent List', icon: 'ti ti-user-circle' },
      { to: `${B}/parents/details`, label: 'Parent Details', icon: 'ti ti-id-badge' },
      { to: `${B}/guardians`, label: 'Guardians', icon: 'ti ti-shield-person' },
    ]
  },
  {
    key: 'management', title: 'MANAGEMENT',
    items: [
      { to: `${B}/fees/collection`, label: 'Fees Collection', icon: 'ti ti-coin' },
      { to: `${B}/fees/groups`, label: 'Fee Groups', icon: 'ti ti-stack' },
      { to: `${B}/fees/types`, label: 'Fee Types', icon: 'ti ti-tag' },
      { to: `${B}/fees/masters`, label: 'Fee Masters', icon: 'ti ti-file-invoice' },
      { to: `${B}/fees/assignment`, label: 'Fee Assignment', icon: 'ti ti-clipboard-list' },
      { to: `${B}/fees/collect`, label: 'Collect Fees', icon: 'ti ti-credit-card' },
      { to: `${B}/library/members`, label: 'Members', icon: 'ti ti-users' },
      { to: `${B}/library/books`, label: 'Books', icon: 'ti ti-books' },
      { to: `${B}/library/issue`, label: 'Issue Book', icon: 'ti ti-book-upload' },
      { to: `${B}/library/return`, label: 'Return Book', icon: 'ti ti-book-download' },
      { to: `${B}/sports`, label: 'Sports', icon: 'ti ti-ball-football' },
    ]
  },
  {
    key: 'hostel', title: 'HOSTEL',
    items: [
      { to: `${B}/hostel/rooms`, label: 'Rooms', icon: 'ti ti-door' },
      { to: `${B}/hostel/room-types`, label: 'Room Types', icon: 'ti ti-layout-grid' },
      { to: `${B}/hostel/reports`, label: 'Reports', icon: 'ti ti-report' },
    ]
  },
  {
    key: 'transport', title: 'TRANSPORT',
    items: [
      { to: `${B}/transport/routes`, label: 'Routes', icon: 'ti ti-route' },
      { to: `${B}/transport/pickup-points`, label: 'Pickup Points', icon: 'ti ti-map-pin' },
      { to: `${B}/transport/vehicles`, label: 'Vehicles', icon: 'ti ti-bus' },
      { to: `${B}/transport/drivers`, label: 'Drivers', icon: 'ti ti-steering-wheel' },
      { to: `${B}/transport/assign`, label: 'Assign Vehicle', icon: 'ti ti-transfer' },
      { to: `${B}/transport/reports`, label: 'Reports', icon: 'ti ti-report' },
    ]
  },
    {
    key: 'attendance', title: 'ATTENDANCE',
    items: [
      { to: `${B}/attendance/students`, label: 'Student Attendance', icon: 'ti ti-user-check' },
      { to: `${B}/attendance/staff`, label: 'Staff Attendance', icon: 'ti ti-clipboard-check' },
    ]
  },
  {
    key: 'examinations', title: 'EXAMINATIONS',
    items: [
      { to: `${B}/exams`, label: 'Exam', icon: 'ti ti-file-text' },
      { to: `${B}/exams/schedule`, label: 'Schedule', icon: 'ti ti-calendar-event' },
      { to: `${B}/exams/grades`, label: 'Grades', icon: 'ti ti-award' },
      { to: `${B}/exams/attendance`, label: 'Exam Attendance', icon: 'ti ti-user-check' },
      { to: `${B}/exams/results`, label: 'Results', icon: 'ti ti-certificate' },
    ]
  },
  {
    key: 'hrm', title: 'HRM',
    items: [
      { to: `${B}/hrm/staffs`, label: 'Staffs', icon: 'ti ti-users' },
      { to: `${B}/hrm/departments`, label: 'Departments', icon: 'ti ti-building-skyscraper' },
      { to: `${B}/hrm/designations`, label: 'Designations', icon: 'ti ti-id-badge-2' },
      { to: `${B}/hrm/leaves`, label: 'Leaves', icon: 'ti ti-calendar-off' },
      { to: `${B}/hrm/approvals`, label: 'Approvals', icon: 'ti ti-check' },
      { to: `${B}/hrm/holidays`, label: 'Holidays', icon: 'ti ti-beach' },
      { to: `${B}/hrm/payroll`, label: 'Payroll', icon: 'ti ti-cash' },
    ]
  },
  {
    key: 'finance', title: 'FINANCE & ACCOUNTS',
    items: [
      { to: `${B}/accounts/expenses`, label: 'Expenses', icon: 'ti ti-trending-down' },
      { to: `${B}/accounts/expense-categories`, label: 'Expense Categories', icon: 'ti ti-category' },
      { to: `${B}/accounts/income`, label: 'Income', icon: 'ti ti-trending-up' },
      { to: `${B}/accounts/invoices`, label: 'Invoices', icon: 'ti ti-file-invoice' },
      { to: `${B}/accounts/transactions`, label: 'Transactions', icon: 'ti ti-arrows-exchange' },
    ]
  },
  {
    key: 'announcements', title: 'ANNOUNCEMENTS',
    items: [
      { to: `${B}/notice-board`, label: 'Notice Board', icon: 'ti ti-speakerphone' },
      { to: `${B}/events`, label: 'Events', icon: 'ti ti-calendar-event' },
    ]
  },
  {
    key: 'reports', title: 'REPORTS',
    items: [
      { to: `${B}/reports/attendance`, label: 'Attendance Report', icon: 'ti ti-report' },
      { to: `${B}/reports/class`, label: 'Class Report', icon: 'ti ti-file-analytics' },
      { to: `${B}/reports/student`, label: 'Student Report', icon: 'ti ti-user-search' },
      { to: `${B}/reports/grade`, label: 'Grade Report', icon: 'ti ti-chart-bar' },
      { to: `${B}/reports/leave`, label: 'Leave Report', icon: 'ti ti-calendar-stats' },
      { to: `${B}/reports/fees`, label: 'Fees Report', icon: 'ti ti-report-money' },
    ]
  },
  {
    key: 'user-mgmt', title: 'USER MANAGEMENT',
    items: [
      { to: `${B}/branches`, label: 'Branches', icon: 'ti ti-git-branch' },
      { to: `${B}/all-users`, label: 'Users', icon: 'ti ti-users' },
      { to: `${B}/roles`, label: 'Roles & Permissions', icon: 'ti ti-lock' },
      { to: `${B}/delete-requests`, label: 'Delete Account Requests', icon: 'ti ti-user-minus' },
    ]
  },
  {
    key: 'support', title: 'SUPPORT',
    items: [
      { to: `${B}/support/tickets`, label: 'Support Tickets', icon: 'ti ti-ticket' },
    ]
  },
  {
    key: 'applications', title: 'APPLICATIONS',
    items: [
      { to: `${B}/apps/calendar`, label: 'Calendar', icon: 'ti ti-calendar' },
      { to: `${B}/apps/call`, label: 'Call', icon: 'ti ti-phone' },
      { to: `${B}/apps/chat`, label: 'Chat', icon: 'ti ti-message' },
      { to: `${B}/apps/email`, label: 'Email', icon: 'ti ti-mail' },
      { to: `${B}/apps/file-manager`, label: 'File Manager', icon: 'ti ti-folder' },
      { to: `${B}/apps/notes`, label: 'Notes', icon: 'ti ti-notes' },
      { to: `${B}/apps/todo`, label: 'Todo', icon: 'ti ti-checklist' },
    ]
  },
  {
    key: 'settings', title: 'SETTINGS',
    items: [
      { to: `${B}/settings/modules`, label: 'Module Activation', icon: 'ti ti-puzzle' },
      { to: `${B}/settings/profile`, label: 'Profile', icon: 'ti ti-user' },
      { to: `${B}/settings/security`, label: 'Security', icon: 'ti ti-shield' },
      { to: `${B}/settings/notifications`, label: 'Notifications', icon: 'ti ti-bell' },
      { to: `${B}/settings/company`, label: 'Company Info', icon: 'ti ti-building' },
      { to: `${B}/settings/localization`, label: 'Localization', icon: 'ti ti-world' },
      { to: `${B}/settings/email`, label: 'Email Config', icon: 'ti ti-mail-cog' },
      { to: `${B}/settings/sms`, label: 'SMS Config', icon: 'ti ti-message-cog' },
      { to: `${B}/settings/payment`, label: 'Payment Gateway', icon: 'ti ti-credit-card' },
      { to: `${B}/settings/tax`, label: 'Tax Settings', icon: 'ti ti-receipt-tax' },
      { to: `${B}/settings/school`, label: 'School Settings', icon: 'ti ti-school' },
      { to: `${B}/settings/storage`, label: 'Storage Settings', icon: 'ti ti-database' },
    ]
  },
]

const InstitutionAdminSidebar: React.FC<InstitutionAdminSidebarProps> = ({
  isCollapsed = false,
  setCollapsed,
  isMobileOpen = false,
  setIsMobileOpen
}) => {
  const allKeys = sections.map(s => s.key)
  const [expandedSections, setExpandedSections] = useState<string[]>(allKeys)
  const [isMobileView, setIsMobileView] = useState(false)

  React.useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleSection = (key: string) => {
    setExpandedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const toggleSidebar = () => {
    if (isMobileView && setIsMobileOpen) setIsMobileOpen(!isMobileOpen)
    else if (setCollapsed) setCollapsed(!isCollapsed)
  }

  return (
    <>
      {isMobileView && isMobileOpen && (
        <div
          onClick={toggleSidebar}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      <div
        className={`sidebar modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isCollapsed ? '80px' : '280px',
          backgroundColor: '#ffffff',
          transition: isMobileView
            ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'
            : 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 1000,
          boxShadow: '2px 0 10px rgba(0,0,0,0.08)',
          borderRight: '1px solid #e2e8f0',
          transform: isMobileView
            ? isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'
            : 'translateX(0)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: isCollapsed ? '1rem' : '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}>
          {!isCollapsed && (
            <div className="d-flex align-items-center">
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                backgroundColor: '#6366f1', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', marginRight: 10, flexShrink: 0,
              }}>
                <i className="ti ti-building-bank" style={{ fontSize: '1.1rem' }}></i>
              </div>
              <div>
                <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>
                  Institution Admin
                </div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Management Portal</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            style={{
              background: 'transparent', border: 'none', color: '#64748b',
              fontSize: '1.1rem', cursor: 'pointer', padding: '0.4rem',
              borderRadius: '0.375rem', transition: 'all 0.2s',
              width: isCollapsed ? '100%' : 'auto',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#1e293b' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <i className={`ti ${isCollapsed ? 'ti-menu-2' : 'ti-arrow-left'}`}></i>
          </button>
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem' }}>
          {sections.map(section => (
            <div key={section.key} style={{ marginBottom: '0.5rem' }}>
              {!isCollapsed && (
                <div
                  onClick={() => toggleSection(section.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.35rem 0.75rem', color: '#94a3b8', fontSize: '0.7rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: 'pointer', borderRadius: '0.375rem', marginBottom: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <span>{section.title}</span>
                  <i className={`ti ti-chevron-${expandedSections.includes(section.key) ? 'up' : 'down'}`}
                    style={{ fontSize: '0.7rem' }}></i>
                </div>
              )}

              <div style={{ display: isCollapsed || expandedSections.includes(section.key) ? 'block' : 'none' }}>
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center',
                      padding: isCollapsed ? '0.65rem' : '0.55rem 0.75rem',
                      margin: '0.15rem 0', borderRadius: '0.5rem',
                      color: isActive ? '#6366f1' : '#374151',
                      textDecoration: 'none', fontSize: '0.825rem',
                      backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                      transition: 'all 0.15s', position: 'relative',
                      fontWeight: isActive ? 600 : 400,
                    })}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      if (!el.classList.contains('active')) {
                        el.style.backgroundColor = '#f1f5f9'
                        el.style.color = '#1e293b'
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      if (!el.classList.contains('active')) {
                        el.style.backgroundColor = 'transparent'
                        el.style.color = '#374151'
                      }
                    }}
                    title={isCollapsed ? item.label : ''}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div style={{
                            position: 'absolute', left: 0, top: '50%',
                            transform: 'translateY(-50%)', width: 3, height: '70%',
                            backgroundColor: '#6366f1', borderRadius: '0 2px 2px 0',
                          }} />
                        )}
                        <i className={item.icon} style={{
                          fontSize: isCollapsed ? '1.2rem' : '1rem',
                          width: isCollapsed ? 'auto' : '1.25rem',
                          flexShrink: 0,
                        }}></i>
                        {!isCollapsed && (
                          <span style={{ marginLeft: '0.6rem' }}>{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
          borderTop: '1px solid #e2e8f0', flexShrink: 0,
        }}>
          {!isCollapsed && (
            <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Institution Management Portal</small>
          )}
        </div>
      </div>
    </>
  )
}

export default InstitutionAdminSidebar
