import { Link } from 'react-router-dom'

type StudentTabKey = 'details' | 'timetable' | 'leaves' | 'fees' | 'results' | 'library'

const StudentDetailTabs = ({ active }: { active: StudentTabKey }) => {
  const tabs: { key: StudentTabKey; label: string; icon: string; to: string }[] = [
    { key: 'details', label: 'Student Details', icon: 'ti ti-school', to: '/student-details' },
    { key: 'timetable', label: 'Time Table', icon: 'ti ti-table-options', to: '/student-time-table' },
    { key: 'leaves', label: 'Leave & Attendance', icon: 'ti ti-calendar-due', to: '/student-leaves' },
    { key: 'fees', label: 'Fees', icon: 'ti ti-report-money', to: '/student-fees' },
    { key: 'results', label: 'Exam & Results', icon: 'ti ti-bookmark-edit', to: '/student-result' },
    { key: 'library', label: 'Library', icon: 'ti ti-books', to: '/student-library' },
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

export default StudentDetailTabs

