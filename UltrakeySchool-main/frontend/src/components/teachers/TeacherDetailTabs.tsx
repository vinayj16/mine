import { Link } from 'react-router-dom'

type TeacherTabKey = 'details' | 'routine' | 'leaves' | 'salary' | 'library'

type TeacherDetailTabsProps = {
  active: TeacherTabKey
}

const TeacherDetailTabs = ({ active }: TeacherDetailTabsProps) => {
  const tabs: { key: TeacherTabKey; label: string; icon: string; to: string }[] = [
    { key: 'details', label: 'Teacher Details', icon: 'ti ti-school', to: '/teacher-details' },
    { key: 'routine', label: 'Routine', icon: 'ti ti-table-options', to: '/routine-teachers' },
    { key: 'leaves', label: 'Leave & Attendance', icon: 'ti ti-calendar-due', to: '/teacher-leaves' },
    { key: 'salary', label: 'Salary', icon: 'ti ti-report-money', to: '/teacher-salary' },
    { key: 'library', label: 'Library', icon: 'ti ti-bookmark-edit', to: '/teacher-library' },
  ]

  return (
    <ul className="nav nav-tabs nav-tabs-bottom mb-4">
      {tabs.map((tab) => (
        <li key={tab.key}>
          <Link to={tab.to} className={`nav-link ${active === tab.key ? 'active' : ''}`}>
            <i className={`${tab.icon} me-2`} />
            {tab.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default TeacherDetailTabs