/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import institutionService from '../../../services/institutionService'

// ─── COLORS ───────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#10b981','#06b6d4','#ef4444','#f59e0b']
const PERF_COLORS = ['#6366f1','#f59e0b','#ef4444']

const InstituteAdminDashboardPage = () => {
  // ─── UI STATE ─────────────────────────────────────────────────────────────
  const [activeSection] = useState('overview')
  const [alertVisible, setAlertVisible] = useState(true)
  const [activeTab, setActiveTab] = useState('students')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [bestPerformerIndex, setBestPerformerIndex] = useState(0)
  const [starStudentIndex, setStarStudentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── DATA STATE (from APIs) ─────────────────────────────────────────────
  const [topStats, setTopStats] = useState<any[]>([])
  const [chairmanStats, setChairmanStats] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [feesChartData, setFeesChartData] = useState<any[]>([])
  const [earningsData, setEarningsData] = useState<any[]>([])
  const [attTabs, setAttTabs] = useState<any[]>([])
  const [performancePie, setPerformancePie] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [studentActivity, setStudentActivity] = useState<any[]>([])
  const [todos, setTodos] = useState<any[]>([])
  const [classRoutine, setClassRoutine] = useState<any[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([])
  const [quickLinks, setQuickLinks] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [feeStats, setFeeStats] = useState<any[]>([])

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const userStr = localStorage.getItem('user')
      let instId = ''
      if (userStr) {
        try { instId = JSON.parse(userStr)?.institutionId || '' } catch (e) {}
      }
      if (!instId) { setError('No institution ID found'); setLoading(false); return }
      
      const [statsRes, feesRes, attRes, staffRes, alertsRes] = await Promise.allSettled([
        institutionService.getInstitutionDashboardStats(instId),
        institutionService.getInstitutionFees(instId),
        institutionService.getInstitutionAttendance(instId),
        institutionService.getInstitutionStaff(instId),
        institutionService.getInstitutionAlerts(instId),
      ])
      
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value as any
        setTopStats([{ label: 'Total Students', value: s.totalStudents?.toString() || '0', delta: '1.2%', deltaTone: 'bg-danger', icon: '/assets/img/icons/student.svg', active: s.activeStudents?.toString() || '0', inactive: '0', avatarTone: 'bg-danger-transparent' }, { label: 'Total Teachers', value: s.totalTeachers?.toString() || '0', delta: '1.2%', deltaTone: 'bg-skyblue', icon: '/assets/img/icons/teacher.svg', active: s.teachingStaff?.toString() || '0', inactive: '0', avatarTone: 'bg-secondary-transparent' }, { label: 'Total Staff', value: s.totalStaff?.toString() || '0', delta: '1.2%', deltaTone: 'bg-warning', icon: '/assets/img/icons/staff.svg', active: s.presentStaff?.toString() || '0', inactive: '0', avatarTone: 'bg-warning-transparent' }, { label: 'Attendance %', value: (s.attendancePercentage || 0) + '%', delta: '1.2%', deltaTone: 'bg-success', icon: '/assets/img/icons/subject.svg', active: s.presentStudents?.toString() || '0', inactive: '0', avatarTone: 'bg-success-transparent' }])
        setChairmanStats([{ label: 'Total Classes', value: s.totalClasses?.toString() || '48', delta: '+4', deltaTone: 'bg-primary', icon: '/assets/img/icons/subject.svg', active: 'Active', inactive: 'Inactive', avatarTone: 'bg-primary-transparent' }, { label: 'Total Revenue', value: '$' + (s.totalRevenue || 0), delta: '+8.4%', deltaTone: 'bg-success', icon: '/assets/img/icons/subject.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-success-transparent' }, { label: 'Student Growth', value: '+' + (s.studentGrowth || 0) + '%', delta: '↑ YoY', deltaTone: 'bg-info', icon: '/assets/img/icons/student.svg', active: s.totalStudents?.toString() || '0', inactive: '0', avatarTone: 'bg-info-transparent' }, { label: 'Applications', value: s.newAdmissions?.toString() || '0', delta: '+12.1%', deltaTone: 'bg-warning', icon: '/assets/img/icons/student.svg', active: 'Enrolled', inactive: 'Pending', avatarTone: 'bg-warning-transparent' }])
      }
      
      if (feesRes.status === 'fulfilled' && feesRes.value) {
        const f = feesRes.value as any
        setFeesChartData(f.chartData || [{ q: "Q1'24", collected: 52000, outstanding: 7100 }, { q: "Q2'24", collected: 67000, outstanding: 5600 }, { q: "Q3'24", collected: 71000, outstanding: 3900 }, { q: "Q4'24", collected: 80000, outstanding: 2800 }])
        setEarningsData(f.earnings || [{ m: 'Jan', v: 32000 }, { m: 'Feb', v: 45000 }, { m: 'Mar', v: 38000 }, { m: 'Apr', v: 52000 }, { m: 'May', v: 48000 }, { m: 'Jun', v: 61000 }])
        setFeeStats([{ label: 'Total Fees Collected', value: '$' + (f.collectedTotal || 0).toLocaleString(), badgeCls: 'badge-soft-success' }, { label: 'Fine Collected', value: '$' + (f.fineCollected || 0), badgeCls: 'badge-soft-danger' }, { label: 'Students Not Paid', value: '$' + (f.pendingCount || 0), badgeCls: 'badge-soft-info' }, { label: 'Total Outstanding', value: '$' + (f.outstandingTotal || 0).toLocaleString(), badgeCls: 'badge-soft-danger' }])
      }
      
      if (attRes.status === 'fulfilled' && attRes.value) {
        const a = attRes.value as any
        setAttTabs([{ id: 'students', label: 'Students', emergency: a.studentEmergency || 28, absent: a.studentAbsent || 1, late: a.studentLate || 1, link: '/student-attendance', pie: [{ name: 'Present', value: a.studentPresent || 3614 }, { name: 'Emergency', value: a.studentEmergency || 28 }, { name: 'Absent', value: a.studentAbsent || 1 }, { name: 'Late', value: a.studentLate || 1 }] }, { id: 'teachers', label: 'Teachers', emergency: a.teacherEmergency || 30, absent: a.teacherAbsent || 3, late: a.teacherLate || 3, link: '/teacher-attendance', pie: [{ name: 'Present', value: a.teacherPresent || 248 }, { name: 'Emergency', value: a.teacherEmergency || 30 }, { name: 'Absent', value: a.teacherAbsent || 3 }, { name: 'Late', value: a.teacherLate || 3 }] }, { id: 'staff', label: 'Staff', emergency: a.staffEmergency || 45, absent: a.staffAbsent || 1, late: a.staffLate || 10, link: '/staff-attendance', pie: [{ name: 'Present', value: a.staffPresent || 106 }, { name: 'Emergency', value: a.staffEmergency || 45 }, { name: 'Absent', value: a.staffAbsent || 1 }, { name: 'Late', value: a.staffLate || 10 }] }])
      }
      
      if (staffRes.status === 'fulfilled' && staffRes.value) {
        const st = staffRes.value as any
        setPerformancePie([{ name: 'Top', value: st.topPerformers || 45 }, { name: 'Average', value: st.averagePerformers || 11 }, { name: 'Below Avg', value: st.belowAverage || 2 }])
        setSubjects(st.subjects || [{ name: 'Maths', pct: 20, bar: 'bg-primary' }, { name: 'Physics', pct: 30, bar: 'bg-secondary' }, { name: 'Chemistry', pct: 40, bar: 'bg-info' }, { name: 'English', pct: 70, bar: 'bg-warning' }])
      }
      
      if (alertsRes.status === 'fulfilled' && alertsRes.value) {
        const al = Array.isArray(alertsRes.value) ? alertsRes.value as any[] : []
        setAlerts(al.length > 0 ? al : [{ type: 'danger', icon: 'ti ti-alert-triangle', title: 'Low Admission Warning', desc: 'Grade VI – only 68% seats filled' }, { type: 'warning', icon: 'ti ti-currency-dollar', title: 'Fee Pending Above Limit', desc: '124 students have dues > 60 days' }, { type: 'info', icon: 'ti ti-users', title: 'Staff Shortage', desc: 'Science Dept: 2 vacancies unfilled' }])
      }
      
      setLeaveRequests([{ name: 'James', role: 'Physics Teacher', badge: 'Emergency', badgeCls: 'badge-soft-danger', avatar: '/assets/img/profiles/avatar-14.webp', leave: '12-13 May', applied: '12 May' }, { name: 'Ramien', role: 'Accountant', badge: 'Casual', badgeCls: 'badge-soft-warning', avatar: '/assets/img/profiles/avatar-19.webp', leave: '12-13 May', applied: '11 May' }])
      setNotices([{ icon: 'ti ti-books', bg: 'bg-primary-transparent', title: 'New Syllabus Instructions', date: '11 Mar 2024', days: '20 Days' }, { icon: 'ti ti-bell-check', bg: 'bg-danger-transparent', title: 'Exam Preparation Notification!', date: '13 Mar 2024', days: '12 Days' }])
      setStudentActivity([{ img: '/assets/img/students/student-09.webp', title: '1st place in "Chess"', sub: 'School Competition' }, { img: '/assets/img/students/student-12.webp', title: 'Participated in "Carrom"', sub: 'Justin Lee participated' }, { img: '/assets/img/students/student-11.webp', title: '1st place in "100M"', sub: 'Sports Day Winner' }])
      setTodos([{ label: 'Send Reminder to Students', time: '01:00 PM', status: 'Completed', cls: 'badge-soft-success', done: true }, { label: 'Create Routine for New Staff', time: '04:50 PM', status: 'In Progress', cls: 'badge-soft-skyblue', done: false }, { label: 'Extra Class Info to Students', time: '04:55 PM', status: 'Yet to Start', cls: 'badge-soft-warning', done: false }])
      setClassRoutine([{ img: '/assets/img/teachers/teacher-01.webp', month: 'Oct 2024', bar: 'bg-primary' }, { img: '/assets/img/teachers/teacher-02.webp', month: 'Nov 2024', bar: 'bg-warning' }, { img: '/assets/img/teachers/teacher-03.webp', month: 'Dec 2024', bar: 'bg-success' }])
      setScheduleEvents([{ borderCls: 'border-skyblue', iconBg: 'bg-teal-transparent', icon: 'ti ti-user-edit text-info fs-20', title: 'Parents Teacher Meet', date: '15 July 2024', time: '09:10AM - 10:50AM', avatars: ['/assets/img/parents/parent-01.webp', '/assets/img/parents/parent-07.webp'] }, { borderCls: 'border-info', iconBg: 'bg-info-transparent', icon: 'ti ti-user-edit fs-20', title: 'PTA Meeting', date: '20 July 2024', time: '10:00AM - 11:30AM', avatars: ['/assets/img/parents/parent-05.webp', '/assets/img/parents/parent-06.webp'] }])
      setQuickLinks([[{ to: '/class-time-table', bg: 'bg-success-transparent', border: 'border-success', iconBg: 'bg-success', icon: 'ti ti-calendar', label: 'Calendar' }, { to: '/fees-group', bg: 'bg-secondary-transparent', border: 'border-secondary', iconBg: 'bg-secondary', icon: 'ti ti-license', label: 'Fees' }], [{ to: '/exam-results', bg: 'bg-primary-transparent', border: 'border-primary', iconBg: 'bg-primary', icon: 'ti ti-hexagonal-prism', label: 'Exam Result' }, { to: '/class-home-work', bg: 'bg-danger-transparent', border: 'border-danger', iconBg: 'bg-danger', icon: 'ti ti-report-money', label: 'Home Works' }], [{ to: '/student-attendance', bg: 'bg-warning-transparent', border: 'border-warning', iconBg: 'bg-warning', icon: 'ti ti-calendar-share', label: 'Attendance' }, { to: '/attendance-report', bg: 'bg-skyblue-transparent', border: 'border-skyblue', iconBg: 'bg-skyblue', icon: 'ti ti-file-pencil', label: 'Reports' }]])
      
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }
  
  // ─── HELPERS ────────────────────────────────────────────────────────────
  const toggleTodo = (i: number) => setTodos(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t))
  const navigateMonth = (direction: string) => {
    setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1)); return d; })
  }
  const tab = attTabs.find(t => t.id === activeTab) || attTabs[0] || { emergency: 0, absent: 0, late: 0, link: '#', pie: [] }
  
  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })
  const dayLabels = ['Su','Mo','Tu','We','Th','Fr','Sa']
  
  // ─── CONSTANTS FOR UI ───────────────────────────────────────────────────
  const navigate = useNavigate()
  const welcomeMessage = 'Welcome Back, Institute Admin'
  const lastUpdated = new Date().toLocaleDateString()
  const navSections = [
    { id: 'overview', label: 'Overview', icon: 'ti ti-layout-dashboard', path: '/institution' },
    { id: 'staff', label: 'Staff', icon: 'ti ti-users-group', path: '/institution/teachers' },
    { id: 'guardians', label: 'Guardians', icon: 'ti ti-users', path: '/institution/guardians' },
    { id: 'library', label: 'Library', icon: 'ti ti-book-2', path: '/institution/library/books' },
    { id: 'hostel', label: 'Hostel', icon: 'ti ti-building-home', path: '/institution/hostel/rooms' },
    { id: 'transport', label: 'Transport', icon: 'ti ti-bus', path: '/institution/transport/routes' },
    { id: 'schools', label: 'Schools', icon: 'ti ti-building', path: '/institution/overview/teaching' },
    { id: 'performance', label: 'Performance', icon: 'ti ti-chart-line', path: '/institution/analytics' },
    { id: 'finance', label: 'Finance', icon: 'ti ti-currency-dollar', path: '/institution/finance' },
    { id: 'reports', label: 'Reports', icon: 'ti ti-file-text', path: '/institution/reports' }
  ]
  const handleNavClick = (path: string) => {
    navigate(path)
  }
  // Fallback empty arrays for section placeholders
  const schoolsList: any[] = []
  const financialSummary: any[] = []
  const userCredentials: any[] = []

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <i className="ti ti-alert-circle me-2" />
        <strong>Error:</strong> {error}
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchDashboardData}>Retry</button>
      </div>
    )
  }

  return (
    <>
      {/* ── PAGE HEADER ── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Institution Admin Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Admin Dashboard</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="mb-2">
            <Link to="/students/add" className="btn btn-primary d-flex align-items-center me-3"><i className="ti ti-square-rounded-plus me-2" />Add New Student</Link>
          </div>
          <div className="mb-2">
            <Link to="/accounts/fees" className="btn btn-light d-flex align-items-center">Fees Details</Link>
          </div>
        </div>
      </div>

      {/* ── ALERT + WELCOME BANNER ── */}
      <div className="row">
        <div className="col-md-12">
          {alertVisible && (
            <div className="alert-message">
              <div className="alert alert-success rounded-pill d-flex align-items-center justify-content-between border-success mb-4" role="alert">
                <div className="d-flex align-items-center">
                  <span className="me-2 avatar avatar-sm flex-shrink-0"><img src="/assets/img/profiles/avatar-27.webp" alt="profile" className="img-fluid rounded-circle" /></span>
                  <p className="mb-0">Fee payment received for <strong className="mx-1">Term 1</strong></p>
                </div>
                <button type="button" className="btn-close p-0" onClick={() => setAlertVisible(false)} aria-label="Close"><span><i className="ti ti-x" /></span></button>
              </div>
            </div>
          )}
          <div className="card bg-dark mb-4">
            <div className="overlay-img">
              <img src="/assets/img/bg/shape-04.webp" alt="shape" className="img-fluid shape-01" />
              <img src="/assets/img/bg/shape-01.webp" alt="shape" className="img-fluid shape-02" />
              <img src="/assets/img/bg/shape-02.webp" alt="shape" className="img-fluid shape-03" />
              <img src="/assets/img/bg/shape-03.webp" alt="shape" className="img-fluid shape-04" />
            </div>
            <div className="card-body">
              <div className="d-flex align-items-xl-center justify-content-xl-between flex-xl-row flex-column">
                <div className="mb-3 mb-xl-0">
                  <div className="d-flex align-items-center flex-wrap mb-2">
                    <h1 className="text-white me-2">{welcomeMessage}</h1>
                    <Link to="/profile" className="avatar avatar-sm img-rounded bg-gray-800 dark-hover">
                      <i className="ti ti-edit text-white" />
                    </Link>
                  </div>
                  <p className="text-white mb-0">Have a good day at work</p>
                </div>
                <p className="text-white mb-0"><i className="ti ti-refresh me-1" />Updated recently on {lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION NAV TABS ── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              <ul className="nav nav-pills flex-wrap gap-1">
                {navSections.map((s: any) => (
                  <li key={s.id} className="nav-item">
                    <button
                      className={`nav-link d-flex align-items-center ${activeSection === s.id ? 'active bg-primary text-white' : 'text-dark'}`}
                      style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: 'transparent' }}
                      onClick={() => handleNavClick(s.path)}
                    >
                      <i className={`${s.icon} me-1`} />{s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ① OVERVIEW SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <>
          {/* Top Statistics Cards */}
          <div className="row">
            {topStats.map((stat: any, i: number) => (
              <div key={stat.title || stat.label || i} className="col-xxl-3 col-xl-4 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className={`avatar avatar-xl ${stat.avatarTone} me-2 p-1 flex-shrink-0`}>
                        <img src={stat.icon} alt="img" />
                      </div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h4 className="counter mb-0">{stat.value}</h4>
                          <span className={`badge ${stat.deltaTone}`} style={{ fontSize: 10 }}>{stat.delta}</span>
                        </div>
                        <p className="mb-0" style={{ fontSize: 12 }}>{stat.label}</p>
                        <small className="text-muted">{stat.sub}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── CHAIRMAN OVERVIEW KPI CARDS ── */}
          <div className="row">
            {chairmanStats.map(stat => (
              <div key={stat.label} className="col-xxl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className={`avatar avatar-xl ${stat.avatarTone} me-2 p-1`}><img src={stat.icon} alt="img" /></div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h2 className="counter">{stat.value}</h2>
                          <span className={`badge ${stat.deltaTone}`}>{stat.delta}</span>
                        </div>
                        <p>{stat.label}</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                      <p className="mb-0">{stat.active}</p><span className="text-light">|</span><p>{stat.inactive}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ALERTS & RISK INDICATORS ── */}
          <div className="row mb-2">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title"><i className="ti ti-alert-triangle me-2 text-danger" />Alerts & Risk Indicators</h4>
                  <span className="badge bg-danger">{alerts.length} Active</span>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {alerts.map((a, i) => (
                      <div key={i} className="col-xxl col-md-6">
                        <div className={`alert alert-${a.type} d-flex align-items-start mb-0`} role="alert">
                          <i className={`${a.icon} fs-18 me-2 flex-shrink-0 mt-1`} />
                          <div><div className="fw-semibold">{a.title}</div><div style={{ fontSize: 12 }}>{a.desc}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* USER CREDENTIALS MANAGEMENT */}
          <div className="row mt-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title"><i className="ti ti-users me-2 text-primary" />User Credentials Management</h4>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/user-management/create-credentials'}>
                      <i className="ti ti-plus me-1" />Create New Credentials
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/user-management/directory'}>
                      <i className="ti ti-list me-1" />User Directory
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>User ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Institution</th>
                          <th>Status</th>
                          <th>Login Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!Array.isArray(userCredentials) || userCredentials.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center text-muted py-4">
                              <i className="ti ti-users-off me-2" />
                              No user credentials created yet
                              <div className="mt-2">
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => window.location.href = '/user-management/create-credentials'}
                                >
                                  <i className="ti ti-plus me-1" />Create Your First Credentials
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          Array.isArray(userCredentials) && userCredentials.map((cred: any) => (
                            <tr key={cred.userId}>
                              <td>
                                <code className="text-muted">{cred.userId}</code>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar avatar-sm bg-primary-transparent rounded-circle me-2">
                                    <span className="text-primary fw-semibold">
                                      {cred.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="fw-medium">{cred.fullName}</div>
                                    <small className="text-muted">{cred.email}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{cred.email}</td>
                              <td>
                                <span className={`badge ${
                                  cred.role === 'superadmin' ? 'bg-danger' :
                                  cred.role === 'institution_admin' ? 'bg-primary' :
                                  cred.role === 'admin' ? 'bg-success' :
                                  cred.role === 'principal' ? 'bg-warning' :
                                  cred.role === 'teacher' ? 'bg-info' :
                                  cred.role === 'student' ? 'bg-secondary' :
                                  cred.role === 'parent' ? 'bg-pink' :
                                  cred.role === 'accountant' ? 'bg-teal' :
                                  cred.role === 'hr' ? 'bg-orange' :
                                  cred.role === 'librarian' ? 'bg-purple' :
                                  cred.role === 'transport_manager' ? 'bg-indigo' :
                                  cred.role === 'hostel_warden' ? 'bg-brown' :
                                  cred.role === 'staff' ? 'bg-light text-dark' :
                                  cred.role === 'staff_member' ? 'bg-light text-dark' :
                                  cred.role === 'admin' ? 'bg-dark' :
                                  cred.role === 'administrator' ? 'bg-dark' :
                                  'bg-secondary'
                                }`}>
                                  {cred.role?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
                                </span>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium">{cred.instituteType || 'N/A'}</div>
                                  <small className="text-muted">{cred.instituteCode || 'N/A'}</small>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  cred.status === 'active' ? 'bg-success' :
                                  cred.status === 'inactive' ? 'bg-danger' :
                                  'bg-warning'
                                }`}>
                                  {cred.status || 'Unknown'}
                                </span>
                              </td>
                              <td>
                                {cred.hasLoggedIn ? (
                                  <div>
                                    <span className="badge bg-success">Logged In</span>
                                    {cred.lastLoginAt && (
                                      <small className="text-muted d-block">
                                        {new Date(cred.lastLoginAt).toLocaleDateString()}
                                      </small>
                                    )}
                                  </div>
                                ) : (
                                  <span className="badge bg-secondary">Never</span>
                                )}
                              </td>
                              <td>
                                <small className="text-muted">
                                  {cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : 'N/A'}
                                </small>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    title="View Details"
                                    onClick={() => {
                                      // View user details functionality
                                      console.log('View user:', cred);
                                    }}
                                  >
                                    <i className="ti ti-eye"></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-secondary"
                                    title="Edit User"
                                    onClick={() => {
                                      // Edit user functionality
                                      console.log('Edit user:', cred);
                                    }}
                                  >
                                    <i className="ti ti-edit"></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-info"
                                    title="Reset Password"
                                    onClick={() => {
                                      // Reset password functionality
                                      console.log('Reset password for:', cred);
                                    }}
                                  >
                                    <i className="ti ti-key"></i>
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
            </div>
          </div>

          {/* ── SCHEDULES | ATTENDANCE | RIGHT COLUMN ── */}
          <div className="row mt-2">
            {/* SCHEDULES */}
            <div className="col-xxl-4 col-xl-6 col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <div><h4 className="card-title">Schedules</h4></div>
                  <a href="#" className="link-primary fw-medium me-2" onClick={e => { e.preventDefault(); setShowEventModal(true) }}><i className="ti ti-square-plus me-1" />Add New</a>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="fw-semibold fs-15">{monthName} {year}</span>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-light px-3" onClick={() => navigateMonth('prev')}>‹</button>
                        <button className="btn btn-sm btn-light px-3" onClick={() => navigateMonth('next')}>›</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center' }}>
                      {dayLabels.map(d => <div key={d} style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{d}</div>)}
                      {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                      {Array(daysInMonth).fill(null).map((_, i) => {
                        const day = i + 1
                        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                        return <div key={day} style={{ fontSize: 13, padding: 6, cursor: 'pointer', borderRadius: 8, background: isToday ? '#6366f1' : 'transparent', color: isToday ? '#fff' : 'inherit' }}>{day}</div>
                      })}
                    </div>
                  </div>
                  <h5 className="mb-3">Upcoming Events</h5>
                  {scheduleEvents.map((ev, i) => (
                    <div key={i} className={`border-start ${ev.borderCls} border-3 shadow-sm p-3 mb-3`}>
                      <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                        <span className={`avatar p-1 me-2 ${ev.iconBg}`}><i className={ev.icon} /></span>
                        <div><h6 className="mb-1">{ev.title}</h6><p className="d-flex align-items-center"><i className="ti ti-calendar me-1" />{ev.date}</p></div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <p className="mb-0"><i className="ti ti-clock me-1" />{ev.time}</p>
                        <div className="avatar-list-stacked">{ev.avatars.map((src: string, j: number) => <span key={j} className="avatar"><img src={src} className="rounded-circle" alt="img" /></span>)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ATTENDANCE */}
            <div className="col-xxl-4 col-xl-6 col-md-12 d-flex flex-column">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Attendance</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar-due me-1" />Today</a>
                    <ul className="dropdown-menu mt-2 p-3"><li><a href="#" className="dropdown-item">This Week</a></li><li><a href="#" className="dropdown-item">Last Week</a></li></ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="list-tab mb-4">
                    <ul className="nav">{attTabs.map(t => <li key={t.id}><a href="#" className={activeTab === t.id ? 'active' : ''} onClick={e => { e.preventDefault(); setActiveTab(t.id) }}>{t.label}</a></li>)}</ul>
                  </div>
                  <div className="row gx-3">
                    <div className="col-sm-4"><div className="card bg-light-300"><div className="card-body p-3 text-center"><h5>{tab?.emergency || 0}</h5><p className="fs-12">Emergency</p></div></div></div>
                    <div className="col-sm-4"><div className="card bg-light-300"><div className="card-body p-3 text-center"><h5>{String(tab?.absent || 0).padStart(2,'0')}</h5><p className="fs-12">Absent</p></div></div></div>
                    <div className="col-sm-4"><div className="card bg-light-300"><div className="card-body p-3 text-center"><h5>{String(tab?.late || 0).padStart(2,'0')}</h5><p className="fs-12">Late</p></div></div></div>
                  </div>
                  <div className="text-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={tab?.pie || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {(tab?.pie || []).map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <Link to={tab?.link || '#'} className="btn btn-light"><i className="ti ti-calendar-share me-1" />View All</Link>
                  </div>
                </div>
              </div>
              {/* Best Performer + Star Students */}
              <div className="row flex-fill mt-4">
                <div className="col-sm-6 d-flex flex-column">
                  <div className="bg-success-800 p-3 br-5 text-center flex-fill mb-4 pb-0 position-relative" style={{background: '#10b981', borderRadius: 8}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <button className="btn btn-sm btn-white" onClick={() => setBestPerformerIndex(prev => (prev - 1 + 3) % 3)}><i className="ti ti-chevron-left" /></button>
                      <h5 className="mb-0 text-white">Best Performer</h5>
                      <button className="btn btn-sm btn-white" onClick={() => setBestPerformerIndex(prev => (prev + 1) % 3)}><i className="ti ti-chevron-right" /></button>
                    </div>
                    <div>
                      <h4 className="mb-1 text-white">{['Rubell','Sarah Johnson','Michael Chen'][bestPerformerIndex]}</h4>
                      <p className="text-light">{['Physics Teacher','Mathematics Teacher','Chemistry Teacher'][bestPerformerIndex]}</p>
                    </div>
                    <img src={`/assets/img/performer/performer-0${bestPerformerIndex + 1}.webp`} alt="img" style={{maxHeight: 120}} />
                  </div>
                </div>
                <div className="col-sm-6 d-flex flex-column">
                  <div className="bg-info p-3 br-5 text-center flex-fill mb-4 pb-0 position-relative" style={{background: '#06b6d4', borderRadius: 8}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <button className="btn btn-sm btn-white" onClick={() => setStarStudentIndex(prev => (prev - 1 + 3) % 3)}><i className="ti ti-chevron-left" /></button>
                      <h5 className="mb-0 text-white">Star Students</h5>
                      <button className="btn btn-sm btn-white" onClick={() => setStarStudentIndex(prev => (prev + 1) % 3)}><i className="ti ti-chevron-right" /></button>
                    </div>
                    <div>
                      <h4 className="mb-1 text-white">{['Tenesa','Alex Kumar','Emma Wilson'][starStudentIndex]}</h4>
                      <p className="text-light">{['XII, A','XI, B','X, C'][starStudentIndex]}</p>
                    </div>
                    <img src={`/assets/img/performer/student-performer-0${starStudentIndex + 1}.webp`} alt="img" style={{maxHeight: 120}} />
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="col-xxl-4 col-md-12 d-flex flex-column">
              <div className="card flex-fill mb-4">
                <div className="card-header"><h4 className="card-title">Quick Links</h4></div>
                <div className="card-body pb-1">
                  <div className="row g-2">
                    {quickLinks.flat().map(ql => (
                      <div key={ql.label} className="col-4">
                        <Link to={ql.to} className={`d-block ${ql.bg} p-2 text-center mb-2`}>
                          <div className={`avatar avatar-lg border ${ql.border} rounded-circle mb-2 mx-auto`}>
                            <span className={`d-flex align-items-center justify-content-center w-100 h-100 ${ql.iconBg} rounded-circle`}><i className={ql.icon} /></span>
                          </div>
                          <p className="text-dark mb-0" style={{ fontSize: 12 }}>{ql.label}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* CLASS ROUTINE */}
              <div className="card flex-fill mb-4">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Class Routine</h4>
                  <button className="link-primary fw-medium" onClick={() => setShowRoutineModal(true)}><i className="ti ti-square-plus me-1" />Add New</button>
                </div>
                <div className="card-body">
                  {classRoutine.map((r, i) => (
                    <div key={i} className={`d-flex align-items-center rounded border p-3 ${i < classRoutine.length - 1 ? 'mb-3' : ''}`}>
                      <span className="avatar avatar-md border rounded me-2"><img src={r.img} className="rounded" alt="Profile" /></span>
                      <div className="w-100"><p className="mb-1">{r.month}</p><div className="progress progress-xs"><div className={`progress-bar ${r.bar}`} style={{ width: '80%' }} /></div></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* PERFORMANCE */}
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Performance</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-school-bell me-2" />Class II</a>
                    <ul className="dropdown-menu mt-2 p-3">{['Class I','Class II','Class III','Class IV'].map(c => <li key={c}><a href="#" className="dropdown-item rounded-1">{c}</a></li>)}</ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-md-flex align-items-center justify-content-between">
                    <div className="me-md-3 mb-3 mb-md-0 w-100">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={performancePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {performancePie.map((_: any, i: number) => <Cell key={i} fill={PERF_COLORS[i % PERF_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── FEES COLLECTION | LEAVE REQUESTS ── */}
          <div className="row">
            <div className="col-xxl-8 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Fees Collection</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />Last 8 Quater</a>
                    <ul className="dropdown-menu mt-2 p-3">{['This Month','This Year','Last 12 Quater'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}</ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={feesChartData} barSize={18} barGap={4}>
                      <XAxis dataKey="q" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v as number)/1000}k`} />
                      <Tooltip formatter={(v, n) => [`$${(v as number).toLocaleString()}`,n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="outstanding" name="Outstanding" fill="#ef4444" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Leave Requests</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar-due me-1" />Today</a>
                    <ul className="dropdown-menu mt-2 p-3"><li><a href="#" className="dropdown-item rounded-1">This Week</a></li><li><a href="#" className="dropdown-item rounded-1">Last Week</a></li></ul>
                  </div>
                </div>
                <div className="card-body">
                  {leaveRequests.map((lr, i) => (
                    <div key={i} className={`card ${i < leaveRequests.length - 1 ? 'mb-2' : 'mb-0'}`}>
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center overflow-hidden me-2">
                            <a href="#" className="avatar avatar-lg flex-shrink-0 me-2"><img src={lr.avatar} alt="student" /></a>
                            <div className="overflow-hidden">
                              <h6 className="mb-1 text-truncate"><a href="#">{lr.name}</a><span className={`badge ${lr.badgeCls} ms-1`}>{lr.badge}</span></h6>
                              <p className="text-truncate">{lr.role}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <a href="#" className="avatar avatar-xs p-0 btn btn-success me-1"><i className="ti ti-checks" /></a>
                            <a href="#" className="avatar avatar-xs p-0 btn btn-danger"><i className="ti ti-x" /></a>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between border-top pt-3">
                          <p className="mb-0">Leave: <span className="fw-semibold">{lr.leave}</span></p>
                          <p>Apply on: <span className="fw-semibold">{lr.applied}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── TOTAL EARNINGS | NOTICE BOARD | FEE STATS | TOP SUBJECTS | STUDENT ACTIVITY | TODO ── */}
          <div className="row">
            {/* TOTAL EARNINGS */}
            <div className="col-xxl-4 col-xl-6 d-flex flex-column">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div><h6 className="mb-1">Total Earnings</h6><h2>$64,522</h2><span className="badge bg-success-soft text-success">+12.5%</span></div>
                    <span className="avatar avatar-lg bg-primary"><i className="ti ti-user-dollar" /></span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div><h6 className="mb-1">Total Expenses</h6><h2>$42,850</h2><span className="badge bg-danger-soft text-danger">-8.3%</span></div>
                    <span className="avatar avatar-lg bg-danger"><i className="ti ti-credit-card" /></span>
                  </div>
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={earningsData}>
                      <defs><linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => [`$${(v as number).toLocaleString()}`,'Amount']} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} fill="url(#earnGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* NOTICE BOARD */}
            <div className="col-xxl-4 col-xl-12 order-3 order-xxl-2 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between"><h4 className="card-title">Notice Board</h4><Link to="/notice-board" className="fw-medium">View All</Link></div>
                <div className="card-body">
                  {notices.map((n, i) => (
                    <div key={i} className={`d-sm-flex align-items-center justify-content-between ${i < notices.length - 1 ? 'mb-4' : ''}`}>
                      <div className="d-flex align-items-center overflow-hidden me-2 mb-2 mb-sm-0">
                        <span className={`${n.bg} avatar avatar-md me-2 rounded-circle`}><i className={`${n.icon} fs-16`} /></span>
                        <div><h6 className="text-truncate mb-1">{n.title}</h6><p><i className="ti ti-calendar me-2" />{n.date}</p></div>
                      </div>
                      <span className="badge bg-light text-dark"><i className="ti ti-clock me-1" />{n.days}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* FEE STATS */}
            <div className="col-xxl-4 col-xl-6 order-2 order-xxl-3 d-flex flex-column">
              {feeStats.map((fs, i) => (
                <div key={i} className={`card flex-fill ${i < feeStats.length - 1 ? 'mb-2' : ''}`}>
                  <div className="card-body"><p className="mb-2">{fs.label}</p><div className="d-flex align-items-end justify-content-between"><h4>{fs.value}</h4><span className={`badge ${fs.badgeCls}`}><i className="ti ti-chart-line me-1" />1.2%</span></div></div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TOP SUBJECTS | STUDENT ACTIVITY | TODO ── */}
          <div className="row">
            {/* TOP SUBJECTS */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Top Subjects</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-school-bell me-2" />Class II</a>
                    <ul className="dropdown-menu mt-2 p-3">{['Class I','Class II','Class III'].map(c => <li key={c}><a href="#" className="dropdown-item rounded-1">{c}</a></li>)}</ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="alert alert-success d-flex align-items-center mb-3" role="alert"><i className="ti ti-info-square-rounded me-2" /><div className="fs-14">Results obtained from syllabus completion</div></div>
                  <ul className="list-group">
                    {subjects.map(s => (
                      <li key={s.name} className="list-group-item">
                        <div className="row align-items-center"><div className="col-sm-4"><p className="text-dark">{s.name}</p></div><div className="col-sm-8"><div className="progress progress-xs"><div className={`progress-bar ${s.bar}`} style={{ width: `${s.pct}%` }} /></div></div></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            {/* STUDENT ACTIVITY */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Student Activity</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />This Month</a>
                    <ul className="dropdown-menu mt-2 p-3">{['This Month','This Year','Last Week'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}</ul>
                  </div>
                </div>
                <div className="card-body">
                  {studentActivity.map((a, i) => (
                    <div key={i} className={`d-flex align-items-center overflow-hidden p-3 ${i < studentActivity.length - 1 ? 'mb-3' : ''} border rounded`}>
                      <span className="avatar avatar-lg flex-shrink-0 rounded me-2"><img src={a.img} alt="student" /></span>
                      <div className="overflow-hidden"><h6 className="mb-1 text-truncate">{a.title}</h6><p>{a.sub}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* TODO */}
            <div className="col-xxl-4 col-xl-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Todo</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />Today</a>
                    <ul className="dropdown-menu mt-2 p-3">{['This Month','This Year','Last Week'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}</ul>
                  </div>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    {todos.map((t, i) => (
                      <li key={i} className="list-group-item py-3 px-0">
                        <div className="d-sm-flex align-items-center justify-content-between">
                          <div className={`d-flex align-items-center overflow-hidden me-2 ${t.done ? 'text-decoration-line-through opacity-50' : ''}`}>
                            <div className="form-check form-check-md me-2"><input className="form-check-input" type="checkbox" checked={t.done} onChange={() => toggleTodo(i)} /></div>
                            <div><h6 className="mb-1">{t.label}</h6><p>{t.time}</p></div>
                          </div>
                          <span className={`badge ${t.cls}`}>{t.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ② SCHOOLS SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'schools' && (
        <>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Schools List</h4>
                  <Link to="/schools/add" className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />Add School</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>School Name</th>
                          <th>Location</th>
                          <th>Students</th>
                          <th>Teachers</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolsList.map((school: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-semibold">{school.name}</td>
                            <td>{school.location}</td>
                            <td><span className="badge badge-soft-primary">{school.students}</span></td>
                            <td><span className="badge badge-soft-success">{school.teachers}</span></td>
                            <td><span className={`badge ${school.statusClass}`}>{school.status}</span></td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link to={`/schools/${school.id}`} className="btn btn-sm btn-primary px-2 py-1">View</Link>
                                <Link to={`/schools/${school.id}/edit`} className="btn btn-sm btn-light px-2 py-1"><i className="ti ti-edit" /></Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ③ PERFORMANCE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'performance' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Performance section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ④ FINANCE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'finance' && (
        <>
          <div className="row">
            {financialSummary.map((item: any, i: number) => (
              <div key={item.label || item.month || i} className="col-xl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <h2 className="mb-0">{item.value}</h2>
                      <p className="mb-0">{item.label}</p>
                      <small className="text-muted">{item.sub}</small>
                    </div>
                    <div className={`avatar avatar-xl ${item.tone} rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
                      <i className={`${item.icon} fs-24 text-white`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ② STAFF SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'staff' && (
        <>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title"><i className="ti ti-users-group me-2 text-primary" />Staff Management</h4>
                  <div className="card-action">
                    <button className="btn btn-primary btn-sm">
                      <i className="ti ti-plus me-1" />Add Staff Member
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2" />
                    Staff management system will be displayed here. Total staff: 0
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-users text-primary fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Total Staff</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-user-check text-success fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Active Staff</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-user-off text-warning fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">On Leave</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-user-plus text-info fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">New This Month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ④ LIBRARY SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'library' && (
        <>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title"><i className="ti ti-book-2 me-2 text-warning" />Library Management</h4>
                  <div className="card-action">
                    <button className="btn btn-warning btn-sm">
                      <i className="ti ti-plus me-1" />Add Book
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2" />
                    Library management system will be displayed here. Total books: 0
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-book text-warning fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Total Books</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-book-off text-danger fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Issued Books</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-users text-info fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Members</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-clock text-success fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Overdue Returns</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑤ HOSTEL SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'hostel' && (
        <>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title"><i className="ti ti-building-home me-2 text-secondary" />Hostel Management</h4>
                  <div className="card-action">
                    <button className="btn btn-secondary btn-sm">
                      <i className="ti ti-plus me-1" />Add Room
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2" />
                    Hostel management system will be displayed here. Total rooms: 0
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-door text-secondary fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Total Rooms</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-users text-primary fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Occupied Rooms</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-door-off text-success fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Available Rooms</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-user-check text-info fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Total Students</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑥ TRANSPORT SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'transport' && (
        <>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title"><i className="ti ti-bus me-2 text-dark" />Transport Management</h4>
                  <div className="card-action">
                    <button className="btn btn-dark btn-sm">
                      <i className="ti ti-plus me-1" />Add Vehicle
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2" />
                    Transport management system will be displayed here. Total vehicles: 0
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-bus text-dark fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Total Vehicles</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-route text-primary fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Active Routes</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-users text-success fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Students Using</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                          <i className="ti ti-gas-station text-warning fs-24 mb-2"></i>
                          <h4 className="mb-1">0</h4>
                          <p className="text-muted mb-0">Fuel Status</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑦ REPORTS SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'reports' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Reports section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {showEventModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Event</h5>
                <button type="button" className="btn-close" onClick={() => setShowEventModal(false)} />
              </div>
              <div className="modal-body">
                <p>Event creation form will be displayed here.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowEventModal(false)}>Close</button>
                <button className="btn btn-primary">Save Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRoutineModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Class Routine</h5>
                <button type="button" className="btn-close" onClick={() => setShowRoutineModal(false)} />
              </div>
              <div className="modal-body">
                <p>Class routine creation form will be displayed here.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowRoutineModal(false)}>Close</button>
                <button className="btn btn-primary">Save Routine</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InstituteAdminDashboardPage
