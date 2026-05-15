/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiClient } from '../../../api/client'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type StudentQuery = {
  student: string
  rollNo: string
  class: string
  subject: string
  query: string
  time: string
  priority: string
  cls: string
  avatar: string
  status: string
}

type Student = {
  rollNo: string
  name: string
  class: string
  gender: string
  dob: string
  phone: string
  email: string
  avgScore: number
  attendance: number
  status: string
  avatar: string
  parent: string
  parentPhone: string
}

const FacultyDashboardComplete = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedQuery, setSelectedQuery] = useState<StudentQuery | null>(null)
  const [queryResponseModal, setQueryResponseModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentDetailModal, setStudentDetailModal] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState('15 Feb 2026')
  const [markAttendanceModal, setMarkAttendanceModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [leaveApplyModal, setLeaveApplyModal] = useState(false)
  
  // Backend integration state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Fetch teacher dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/dashboard/teacher')
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('Dashboard loaded successfully')
      }
    } catch (err: any) {
      console.error('Error fetching dashboard:', err)
      setError(err.message || 'Failed to load dashboard data')
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Transform backend data for UI - using fallback data only when dashboardData is null
  const facultyProfile = dashboardData?.teacher || {
    name: 'Faculty Member',
    avatar: '/assets/img/teachers/teacher-default.jpg',
    designation: 'Teacher',
    department: 'Department',
    employeeId: 'EMP000',
    experience: '0 years',
    qualification: 'N/A'
  }

  const academicGroups = dashboardData?.academicGroups || []

  const dashboardKPIs = dashboardData?.quickStats ? [
    { label: 'Students in Class', value: dashboardData.quickStats.studentsInClass || 0, delta: '+0%', icon: '/assets/img/icons/students.svg', avatarTone: 'avatar-primary', deltaTone: 'badge-soft-success', sub: 'Total enrolled' },
    { label: 'Present Today', value: dashboardData.quickStats.presentToday || 0, delta: '+0%', icon: '/assets/img/icons/attendance.svg', avatarTone: 'avatar-success', deltaTone: 'badge-soft-success', sub: 'In class today' },
    { label: 'Pending Tasks', value: dashboardData.quickStats.pendingTasks || 0, delta: '0', icon: '/assets/img/icons/tasks.svg', avatarTone: 'avatar-warning', deltaTone: 'badge-soft-warning', sub: 'To complete' },
    { label: 'Unread Messages', value: dashboardData.quickStats.unreadMessages || 0, delta: '0', icon: '/assets/img/icons/messages.svg', avatarTone: 'avatar-info', deltaTone: 'badge-soft-info', sub: 'New messages' }
  ] : []

  const todaySchedule = dashboardData?.todaySchedule || []
  const classPerformance = dashboardData?.classStats?.performance || []
  const syllabusProgress = dashboardData?.syllabusProgress || []
  const attendanceTrend = dashboardData?.attendanceTrend || []
  const pendingEvaluations = dashboardData?.pendingTasks?.evaluations || []
  const recentResults = dashboardData?.recentResults || []
  const topPerformers = dashboardData?.topPerformers || []
  const atRiskStudents = dashboardData?.atRiskStudents || []
  const studentQueries = dashboardData?.studentQueries || []
  const assignments = dashboardData?.assignments || []
  const allStudents = dashboardData?.students || []
  const todayAttendance = dashboardData?.todayAttendance || { date: new Date().toLocaleDateString(), classes: [] }
  const attendanceDefaulters = dashboardData?.attendanceDefaulters || []
  const leaveApplications = dashboardData?.leaveApplications || []
  const weeklyTimetable = dashboardData?.weeklyTimetable || []
  const workloadSummary = dashboardData?.workloadSummary || {}
  const researchActivities = dashboardData?.researchActivities || []
  const ongoingProjects = dashboardData?.ongoingProjects || []
  const conferences = dashboardData?.conferences || []
  const hodResponsibilities = dashboardData?.hodResponsibilities || []
  const facultyUnderHOD = dashboardData?.facultyUnderHOD || []
  const departmentBudget = dashboardData?.departmentBudget || {}
  const facultyMeetings = dashboardData?.facultyMeetings || []
  const facultyAttendance = dashboardData?.facultyAttendance || {}
  const leaveHistory = dashboardData?.leaveHistory || []
  const leaveBalance = dashboardData?.leaveBalance || {}
  const upcomingEvents = dashboardData?.upcomingEvents || []
  const collegeNotices = dashboardData?.collegeNotices || []
  const performanceDistribution = dashboardData?.performanceDistribution || []
  const teachingFeedback = dashboardData?.teachingFeedback || {}
  const salaryInfo = dashboardData?.salaryInfo || {}

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <i className="ti ti-alert-circle me-2" />
        {error}
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchDashboardData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  const navSections = [
    { id: 'overview',      label: 'Overview',         icon: 'ti ti-layout-dashboard' },
    { id: 'classes',       label: 'My Classes',       icon: 'ti ti-school'           },
    { id: 'syllabus',      label: 'Syllabus',         icon: 'ti ti-book'             },
    { id: 'assessments',   label: 'Assessments',      icon: 'ti ti-clipboard-check'  },
    { id: 'students',      label: 'Students',         icon: 'ti ti-users'            },
    { id: 'attendance',    label: 'Attendance',       icon: 'ti ti-calendar-check'   },
    { id: 'timetable',     label: 'Timetable',        icon: 'ti ti-calendar'         },
    { id: 'research',      label: 'Research',         icon: 'ti ti-certificate'      },
    { id: 'hod',           label: 'HOD Duties',       icon: 'ti ti-briefcase'        },
    { id: 'profile',       label: 'My Profile',       icon: 'ti ti-user'             },
  ]

  return (
    <>
      {/* ── PAGE HEADER ── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Faculty Dashboard</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Faculty</li>
          </ol></nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button 
            className="btn btn-primary d-flex align-items-center" 
            style={{ fontSize: 13 }}
            onClick={() => setMarkAttendanceModal(true)}
          >
            <i className="ti ti-calendar-check me-1" />Mark Attendance
          </button>
          <Link to="/assignments/create" className="btn btn-success d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-file-plus me-1" />Create Assignment
          </Link>
          <Link to="/results/upload" className="btn btn-warning d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-upload me-1" />Upload Results
          </Link>
        </div>
      </div>

      {/* ── WELCOME BANNER WITH FACULTY PROFILE ── */}
      <div className="row">
        <div className="col-md-12">
          <div className="card bg-dark mb-4">
            <div className="overlay-img">
              <img src="/assets/img/bg/shape-04.webp" alt="shape" className="img-fluid shape-01" />
              <img src="/assets/img/bg/shape-01.webp" alt="shape" className="img-fluid shape-02" />
              <img src="/assets/img/bg/shape-02.webp" alt="shape" className="img-fluid shape-03" />
              <img src="/assets/img/bg/shape-03.webp" alt="shape" className="img-fluid shape-04" />
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center mb-3 mb-sm-0">
                  <div className="avatar avatar-xxl border border-3 border-white me-3 flex-shrink-0">
                    <img src={facultyProfile.avatar} alt="Faculty" className="rounded-circle" />
                  </div>
                  <div>
                    <h2 className="text-white mb-1">Welcome, {facultyProfile.name}</h2>
                    <p className="text-white mb-1"><i className="ti ti-briefcase me-2" />{facultyProfile.designation}</p>
                    <p className="text-light mb-0"><i className="ti ti-school me-2" />{facultyProfile.department}</p>
                  </div>
                </div>
                <div className="text-end">
                  <div className="d-flex gap-2 mb-2 flex-wrap justify-content-end">
                    <span className="badge bg-primary-transparent text-white">{facultyProfile.employeeId}</span>
                    <span className="badge bg-success-transparent text-white">{facultyProfile.experience}</span>
                    <span className="badge bg-info-transparent text-white">{facultyProfile.qualification}</span>
                  </div>
                  <Link to="/profile/edit" className="btn btn-light btn-sm">
                    <i className="ti ti-edit me-1" />Edit Profile
                  </Link>
                </div>
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
                {navSections.map(s => (
                  <li key={s.id} className="nav-item">
                    <a
                      href="#"
                      className={`nav-link d-flex align-items-center ${activeSection === s.id ? 'active bg-primary text-white' : 'text-dark'}`}
                      style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8 }}
                      onClick={e => { e.preventDefault(); setActiveSection(s.id) }}
                    >
                      <i className={`${s.icon} me-1`} />{s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {activeSection === 'overview' && (
        <>
          {/* Dashboard KPI Cards */}
          <div className="row">
            {dashboardKPIs.map(stat => (
              <div key={stat.label} className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
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

          {/* Today's Schedule + Student Queries */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title"><i className="ti ti-calendar-time me-2" />Today's Schedule</h4>
                  <div className="d-flex gap-2">
                    <span className="badge bg-success">3 Completed</span>
                    <span className="badge bg-warning">3 Upcoming</span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Subject/Activity</th>
                          <th>Class</th>
                          <th>Room</th>
                          <th>Topic</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaySchedule.map((s: any, i: number) => (
                          <tr key={i}>
                            <td><small className="fw-semibold text-muted">{s.time}</small></td>
                            <td className="fw-semibold" style={{ fontSize: 13 }}>{s.subject}</td>
                            <td>{s.class}</td>
                            <td><small>{s.room}</small></td>
                            <td style={{ fontSize: 13 }}>{s.topic}</td>
                            <td><span className="badge badge-soft-info">{s.type}</span></td>
                            <td><span className={`badge ${s.cls}`}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Student Queries</h4>
                  <span className="badge bg-danger">{studentQueries.filter((q: any) => q.priority === 'urgent').length} Urgent</span>
                </div>
                <div className="card-body">
                  {studentQueries.slice(0, 5).map((q: any, i: number) => (
                    <div key={i} className={`border rounded p-3 ${i < 4 ? 'mb-3' : 'mb-0'}`}>
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="d-flex align-items-center overflow-hidden me-2">
                          <span className="avatar avatar-sm flex-shrink-0 me-2">
                            <img src={q.avatar} alt="student" className="rounded-circle" />
                          </span>
                          <div className="overflow-hidden">
                            <h6 className="mb-0 text-truncate" style={{ fontSize: 13 }}>{q.student}</h6>
                            <small className="text-muted">{q.class} • {q.subject}</small>
                          </div>
                        </div>
                        <span className={`badge ${q.cls} flex-shrink-0`}>{q.priority}</span>
                      </div>
                      <p className="mb-2 text-muted" style={{ fontSize: 12 }}>{q.query}</p>
                      <div className="d-flex align-items-center justify-content-between">
                        <small className="text-muted"><i className="ti ti-clock me-1" />{q.time}</small>
                        <button 
                          className="btn btn-sm btn-primary px-2 py-1"
                          onClick={() => { setSelectedQuery(q); setQueryResponseModal(true) }}
                        >
                          Respond
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Class Performance + Attendance Trend */}
          <div className="row">
            <div className="col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Class Performance Overview</h4>
                  <Link to="/classes/performance" className="btn btn-sm btn-primary">Detailed Analysis</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Strength</th>
                          <th>Avg Score</th>
                          <th>Toppers</th>
                          <th>At Risk</th>
                          <th>Attendance</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classPerformance.map((c: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-semibold">{c.class}</td>
                            <td>{c.strength}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold">{c.avgScore}%</span>
                                <div className="progress progress-xs" style={{ width: 60 }}>
                                  <div
                                    className={`progress-bar ${c.avgScore >= 80 ? 'bg-success' : c.avgScore >= 70 ? 'bg-primary' : 'bg-warning'}`}
                                    style={{ width: `${c.avgScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td><span className="badge badge-soft-success">{c.toppers}</span></td>
                            <td><span className={`badge ${c.atRisk > 10 ? 'badge-soft-danger' : 'badge-soft-warning'}`}>{c.atRisk}</span></td>
                            <td>{c.attendance}%</td>
                            <td>
                              <i className={`ti ${c.trend === 'up' ? 'ti-trending-up text-success' : c.trend === 'down' ? 'ti-trending-down text-danger' : 'ti-minus text-muted'} fs-18`} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">6-Month Attendance Trend</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={attendanceTrend}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 95]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="I Year MPC-A" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="I Year MPC-B" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="II Year MPC-A" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers + At Risk Students */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Top Performing Students</h4>
                  <Link to="/students/toppers" className="btn btn-sm btn-success">Recognition Program</Link>
                </div>
                <div className="card-body">
                  {topPerformers.map((s: any, i: number) => (
                    <div key={i} className={`d-flex align-items-center justify-content-between ${i < topPerformers.length - 1 ? 'mb-3' : 'mb-0'}`}>
                      <div className="d-flex align-items-center overflow-hidden me-2">
                        <span className={`badge ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-light text-dark' : 'bg-danger'} me-2 flex-shrink-0`}>#{s.rank}</span>
                        <span className="avatar avatar-md flex-shrink-0 me-2">
                          <img src={s.avatar} alt="student" className="rounded-circle" />
                        </span>
                        <div className="overflow-hidden">
                          <h6 className="mb-0 text-truncate">{s.name}</h6>
                          <small className="text-muted">{s.class} • {s.subjects}</small>
                        </div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="badge badge-soft-success fw-semibold">{s.score}%</div>
                        <div><i className={`ti ti-trending-${s.trend === 'up' ? 'up text-success' : 'down text-danger'} fs-16`} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Students Requiring Attention</h4>
                  <span className="badge bg-danger">{atRiskStudents.length} At Risk</span>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Class</th>
                          <th>Score</th>
                          <th>Weak Areas</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atRiskStudents.map((s: any, i: number) => (
                          <tr key={i}>
                            <td style={{ fontSize: 13 }}>{s.name}</td>
                            <td>{s.class}</td>
                            <td><span className={`badge ${s.cls}`}>{s.avgScore}%</span></td>
                            <td><small className="text-muted">{s.weakSubjects}</small></td>
                            <td>
                              <button className="btn btn-sm btn-warning px-2 py-1">Plan Support</button>
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

          {/* Upcoming Events + Notices */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Upcoming Events & Activities</h4>
                  <Link to="/events" className="btn btn-sm btn-light">View All</Link>
                </div>
                <div className="card-body">
                  {upcomingEvents.slice(0, 5).map((e: any, i: number) => (
                    <div key={i} className={`border-start border-3 ${e.cls.includes('danger') ? 'border-danger' : e.cls.includes('warning') ? 'border-warning' : e.cls.includes('success') ? 'border-success' : 'border-primary'} shadow-sm p-3 ${i < 4 ? 'mb-3' : 'mb-0'}`}>
                      <div className="d-flex align-items-center mb-2">
                        <span className={`avatar p-1 me-2 ${e.cls.replace('badge-soft', 'bg').replace('-transparent', '')}-transparent flex-shrink-0`}>
                          <i className={`${e.icon} fs-20`} />
                        </span>
                        <div className="flex-fill">
                          <h6 className="mb-1">{e.event}</h6>
                          <div className="d-flex align-items-center flex-wrap gap-2">
                            <small className="text-muted"><i className="ti ti-calendar me-1" />{e.date}</small>
                            <small className="text-muted"><i className="ti ti-clock me-1" />{e.time}</small>
                            <span className={`badge ${e.cls}`}>{e.status}</span>
                          </div>
                        </div>
                      </div>
                      <small className="text-muted d-block"><i className="ti ti-building me-1" />{e.department}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">College Notices & Announcements</h4>
                  <Link to="/notices" className="btn btn-sm btn-light">View All</Link>
                </div>
                <div className="card-body">
                  {collegeNotices.map((n: any, i: number) => (
                    <div key={i} className={`d-flex align-items-start ${i < collegeNotices.length - 1 ? 'mb-4' : 'mb-0'}`}>
                      <span className={`avatar avatar-md ${n.bg} rounded-circle me-2 flex-shrink-0`}>
                        <i className={`${n.icon} fs-16`} />
                      </span>
                      <div className="overflow-hidden flex-fill">
                        <h6 className="mb-1 text-truncate">{n.title}</h6>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted"><i className="ti ti-calendar me-1" />{n.date}</small>
                          <span className="badge badge-soft-primary">{n.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ② MY CLASSES - ALREADY IN PREVIOUS FILE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'classes' && (
        <>
          {/* Class Selection Filter */}
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <label className="mb-0 fw-semibold">Filter by Class:</label>
                      <select 
                        className="form-select form-select-sm" 
                        style={{ width: 200 }}
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                      >
                        <option value="all">All Classes</option>
                        <option value="I Year MPC-A">I Year MPC-A</option>
                        <option value="I Year MPC-B">I Year MPC-B</option>
                        <option value="II Year MPC-A">II Year MPC-A</option>
                      </select>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted">View:</span>
                      <div className="btn-group" role="group">
                        <button 
                          type="button" 
                          className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-light'}`}
                          onClick={() => setViewMode('grid')}
                        >
                          <i className="ti ti-layout-grid" />
                        </button>
                        <button 
                          type="button" 
                          className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-light'}`}
                          onClick={() => setViewMode('list')}
                        >
                          <i className="ti ti-list" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Class Cards */}
          <div className="row">
            {classPerformance.filter((c: any) => selectedClass === 'all' || c.class === selectedClass).map((cls: any, i: number) => (
              <div key={i} className="col-xl-4 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="mb-0">{cls.class}</h5>
                    <span className="badge bg-primary">{cls.strength} Students</span>
                  </div>
                  <div className="card-body">
                    {/* Performance Metrics */}
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <div className="text-center border rounded p-2">
                          <h4 className="mb-0 text-primary">{cls.avgScore}%</h4>
                          <small className="text-muted">Avg Score</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center border rounded p-2">
                          <h4 className="mb-0 text-success">{cls.toppers}</h4>
                          <small className="text-muted">Toppers</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center border rounded p-2">
                          <h4 className="mb-0 text-danger">{cls.atRisk}</h4>
                          <small className="text-muted">At Risk</small>
                        </div>
                      </div>
                    </div>

                    {/* Subject Performance */}
                    <div className="border-top pt-3 mb-3">
                      <h6 className="mb-2">Subject Performance</h6>
                      {cls.subjects.map((sub: any, idx: number) => (
                        <div key={idx} className="mb-2">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <small className="fw-semibold">{sub.split(':')[0]}</small>
                            <small className="text-muted">{sub.split(':')[1]}</small>
                          </div>
                          <div className="progress progress-xs">
                            <div 
                              className={`progress-bar ${parseInt(sub.split(':')[1]) >= 75 ? 'bg-success' : 'bg-warning'}`}
                              style={{ width: sub.split(':')[1] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Attendance */}
                    <div className="border-top pt-3 mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-semibold">Attendance Rate</span>
                        <span className={`badge ${cls.attendance >= 90 ? 'badge-soft-success' : cls.attendance >= 85 ? 'badge-soft-warning' : 'badge-soft-danger'}`}>
                          {cls.attendance}%
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-2">
                      <Link to={`/classes/${cls.class}/details`} className="btn btn-sm btn-primary flex-fill">View Details</Link>
                      <Link to={`/classes/${cls.class}/attendance`} className="btn btn-sm btn-success flex-fill">Attendance</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Exam Results */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recent Exam Results</h4>
                  <Link to="/results/all" className="btn btn-sm btn-primary">View All Results</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Exam</th>
                          <th>Class</th>
                          <th>Date</th>
                          <th>Avg Score</th>
                          <th>Highest</th>
                          <th>Lowest</th>
                          <th>Pass Rate</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentResults.map((r: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-semibold" style={{ fontSize: 13 }}>{r.exam}</td>
                            <td>{r.class}</td>
                            <td><small className="text-muted">{r.date}</small></td>
                            <td className="fw-semibold">{r.avgScore}%</td>
                            <td><span className="text-success">{r.highest}</span></td>
                            <td><span className="text-danger">{r.lowest}</span></td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span>{r.passRate}%</span>
                                <div className="progress progress-xs" style={{ width: 60 }}>
                                  <div 
                                    className={`progress-bar ${r.passRate >= 90 ? 'bg-success' : r.passRate >= 80 ? 'bg-primary' : 'bg-warning'}`}
                                    style={{ width: `${r.passRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td><span className={`badge ${r.cls}`}>{r.avgScore >= 80 ? 'Excellent' : r.avgScore >= 70 ? 'Good' : 'Fair'}</span></td>
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
          ③ SYLLABUS MANAGEMENT - ALREADY IN PREVIOUS FILE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'syllabus' && (
        <>
          {/* Overall Progress */}
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="card bg-primary-transparent border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="mb-2">Overall Syllabus Completion</h5>
                      <h2 className="mb-0 text-primary">78.5%</h2>
                      <small className="text-muted">Across all subjects • On track for semester completion</small>
                    </div>
                    <div className="text-center" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: 78.5 }, { value: 21.5 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            <Cell fill="#6366f1" />
                            <Cell fill="#e5e7eb" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise Syllabus Progress */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Subject-wise Syllabus Progress</h4>
                  <div className="d-flex gap-2">
                    <Link to="/syllabus/plan" className="btn btn-sm btn-primary">Update Plan</Link>
                    <Link to="/syllabus/report" className="btn btn-sm btn-success">Generate Report</Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Subject & Year</th>
                          <th>Total Units</th>
                          <th>Completed</th>
                          <th>Progress</th>
                          <th>Status</th>
                          <th>Next Topic</th>
                          <th>Due Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syllabusProgress.map((s: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-semibold" style={{ fontSize: 13 }}>{s.subject}</td>
                            <td>{s.total}</td>
                            <td className="fw-semibold">{s.completed}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress progress-xs" style={{ width: 100 }}>
                                  <div 
                                    className={`progress-bar ${s.onTrack ? 'bg-success' : 'bg-warning'}`}
                                    style={{ width: `${s.percentage}%` }}
                                  />
                                </div>
                                <span className="fw-semibold">{s.percentage}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${s.onTrack ? 'badge-soft-success' : 'badge-soft-warning'}`}>
                                {s.onTrack ? 'On Track' : 'Needs Attention'}
                              </span>
                            </td>
                            <td style={{ fontSize: 13 }}>{s.nextTopic}</td>
                            <td><small className="text-muted">{s.dueDate}</small></td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link to={`/syllabus/${s.subject}`} className="btn btn-sm btn-light px-2 py-1">View</Link>
                                <button className="btn btn-sm btn-primary px-2 py-1">Update</button>
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

          {/* Lesson Plan Calendar View */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Upcoming Lesson Plan (This Week)</h4>
                  <Link to="/syllabus/calendar" className="btn btn-sm btn-light">Full Calendar View</Link>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {[
                      { day: 'Monday', topic: 'Integration - Advanced Techniques', class: 'I Year MPC-A', subject: 'Mathematics', duration: '60 min' },
                      { day: 'Tuesday', topic: 'Quantum Mechanics - Wave Functions', class: 'I Year MPC-B', subject: 'Physics', duration: '60 min' },
                      { day: 'Wednesday', topic: 'Eigenvalues & Eigenvectors', class: 'II Year MPC-A', subject: 'Mathematics', duration: '60 min' },
                      { day: 'Thursday', topic: 'Semiconductor Physics - Diodes', class: 'II Year MPC-A', subject: 'Physics', duration: '60 min' },
                      { day: 'Friday', topic: 'Revision & Problem Solving', class: 'I Year MPC-A', subject: 'Mathematics', duration: '60 min' },
                    ].map((lesson, i: number) => (
                      <div key={i} className="col-md-4">
                        <div className="card border-start border-3 border-primary mb-0">
                          <div className="card-body p-3">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-primary">{lesson.day}</span>
                              <small className="text-muted"><i className="ti ti-clock me-1" />{lesson.duration}</small>
                            </div>
                            <h6 className="mb-2">{lesson.topic}</h6>
                            <div className="d-flex align-items-center justify-content-between">
                              <small className="text-muted">{lesson.class}</small>
                              <span className="badge badge-soft-info">{lesson.subject}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ④ ASSESSMENTS & EVALUATIONS - ALREADY IN PREVIOUS FILE (adding completion)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'assessments' && (
        <>
          {/* Pending Evaluations Summary */}
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <i className="ti ti-alert-triangle fs-20 me-2" />
                <div className="flex-fill">
                  <strong>Attention Required:</strong> You have {pendingEvaluations.filter((p: any) => p.priority === 'high').length} high-priority evaluations pending. 
                  Please complete them before the deadline to maintain student progress tracking.
                </div>
              </div>
            </div>
          </div>

          {/* Pending Evaluations Table */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Pending Evaluations & Grading</h4>
                  <div className="d-flex gap-2">
                    <span className="badge bg-danger">{pendingEvaluations.filter((p: any) => p.priority === 'high').length} High Priority</span>
                    <Link to="/evaluations/bulk" className="btn btn-sm btn-success">Bulk Upload Marks</Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Submissions</th>
                          <th>Progress</th>
                          <th>Due Date</th>
                          <th>Priority</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingEvaluations.map((e: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-semibold" style={{ fontSize: 13 }}>{e.type}</td>
                            <td>{e.class}</td>
                            <td>{e.subject}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold">{e.submitted}/{e.total}</span>
                                <span className={`badge ${e.pending > 10 ? 'badge-soft-danger' : 'badge-soft-warning'}`}>
                                  {e.pending} pending
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="progress progress-xs" style={{ width: 100 }}>
                                <div 
                                  className={`progress-bar ${(e.submitted/e.total*100) >= 90 ? 'bg-success' : (e.submitted/e.total*100) >= 70 ? 'bg-primary' : 'bg-warning'}`}
                                  style={{ width: `${(e.submitted/e.total*100)}%` }}
                                />
                              </div>
                            </td>
                            <td>
                              <small className={`fw-semibold ${e.dueDate === 'Today' ? 'text-danger' : e.dueDate === 'Tomorrow' ? 'text-warning' : 'text-muted'}`}>
                                {e.dueDate}
                              </small>
                            </td>
                            <td><span className={`badge ${e.cls}`}>{e.priority}</span></td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link to={`/evaluations/${e.type}/${e.class}`} className="btn btn-sm btn-primary px-2 py-1">Evaluate</Link>
                                <button className="btn btn-sm btn-light px-2 py-1">View</button>
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

          {/* Active Assignments */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Active Assignments & Homework</h4>
                  <Link to="/assignments/create" className="btn btn-sm btn-primary">
                    <i className="ti ti-plus me-1" />Create New Assignment
                  </Link>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {assignments.map((a: any, i: number) => (
                      <div key={i} className="col-xl-6">
                        <div className="card border-0 shadow-sm mb-0">
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between mb-3">
                              <div className="flex-fill me-2">
                                <h6 className="mb-1">{a.title}</h6>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <small className="text-muted">{a.class}</small>
                                  <span className="badge badge-soft-primary">{a.subject}</span>
                                  <span className={`badge ${a.cls}`}>{a.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="border-top pt-3">
                              <div className="row g-2 mb-3">
                                <div className="col-4">
                                  <small className="text-muted d-block">Assigned</small>
                                  <span className="fw-semibold">{a.assignedDate}</span>
                                </div>
                                <div className="col-4">
                                  <small className="text-muted d-block">Due Date</small>
                                  <span className="fw-semibold text-danger">{a.dueDate}</span>
                                </div>
                                <div className="col-4">
                                  <small className="text-muted d-block">Submitted</small>
                                  <span className="fw-semibold">{a.submitted}/{a.total}</span>
                                </div>
                              </div>
                              <div className="progress progress-xs mb-2">
                                <div 
                                  className={`progress-bar ${(a.submitted/a.total*100) >= 90 ? 'bg-success' : 'bg-warning'}`}
                                  style={{ width: `${(a.submitted/a.total*100)}%` }}
                                />
                              </div>
                              <div className="d-flex gap-2">
                                <Link to={`/assignments/${i}/submissions`} className="btn btn-sm btn-primary flex-fill">View Submissions</Link>
                                <button className="btn btn-sm btn-light flex-fill">Edit</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="row">
            <div className="col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Student Performance Distribution</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={performanceDistribution} barSize={40}>
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(v, n) => [n === 'count' ? `${v} students` : `${v}%`, n === 'count' ? 'Students' : 'Percentage']}
                        contentStyle={{ borderRadius: 10, fontSize: 12 }}
                      />
                      <Bar dataKey="count" name="Students" radius={[6,6,0,0]}>
                        {performanceDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Performance Summary</h4></div>
                <div className="card-body">
                  {performanceDistribution.map((p: any, i: number) => (
                    <div key={i} className={`d-flex align-items-center justify-content-between ${i < performanceDistribution.length - 1 ? 'mb-3' : 'mb-0'}`}>
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-2" 
                          style={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: p.color 
                          }}
                        />
                        <span className="fw-semibold">{p.range}%</span>
                      </div>
                      <div className="text-end">
                        <div className="fw-semibold">{p.count} students</div>
                        <small className="text-muted">{p.percentage}% of total</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TO BE CONTINUED IN NEXT PART: STUDENTS, ATTENDANCE, TIMETABLE, RESEARCH, HOD, PROFILE SECTIONS */}
    
{activeSection === 'students' && (
  <>
    {/* Student List Header with Filters */}
    <div className="row mb-3">
      <div className="col-md-12">
        <div className="card">
          <div className="card-body p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Search students..." 
                  style={{ width: 200 }}
                />
                <select className="form-select form-select-sm" style={{ width: 150 }}>
                  <option>All Classes</option>
                  <option>I Year MPC-A</option>
                  <option>I Year MPC-B</option>
                  <option>II Year MPC-A</option>
                </select>
                <select className="form-select form-select-sm" style={{ width: 150 }}>
                  <option>All Status</option>
                  <option>Top Performers</option>
                  <option>At Risk</option>
                  <option>Low Attendance</option>
                </select>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-primary"><i className="ti ti-download me-1" />Export List</button>
                <Link to="/students/all" className="btn btn-sm btn-light">View All Students</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Student List Table */}
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">All Students Under My Classes</h4>
            <span className="badge bg-primary">{allStudents.length} Students</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Avg Score</th>
                    <th>Attendance</th>
                    <th>Contact</th>
                    <th>Parent</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((s: any, i: number) => (
                    <tr key={i}>
                      <td><span className="badge badge-soft-secondary">{s.rollNo}</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm me-2">
                            <img src={s.avatar} alt="student" className="rounded-circle" />
                          </span>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: 13 }}>{s.name}</h6>
                            <small className="text-muted">{s.gender === 'M' ? 'Male' : 'Female'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{s.class}</td>
                      <td>
                        <span className={`fw-semibold ${s.avgScore >= 90 ? 'text-success' : s.avgScore >= 75 ? 'text-primary' : s.avgScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                          {s.avgScore}%
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress progress-xs" style={{ width: 50 }}>
                            <div 
                              className={`progress-bar ${s.attendance >= 90 ? 'bg-success' : s.attendance >= 80 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${s.attendance}%` }}
                            />
                          </div>
                          <small>{s.attendance}%</small>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{s.phone}</small>
                      </td>
                      <td>
                        <div>
                          <small className="fw-semibold d-block">{s.parent}</small>
                          <small className="text-muted">{s.parentPhone}</small>
                        </div>
                      </td>
                      <td><span className="badge badge-soft-success">Active</span></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-light px-2 py-1"
                            onClick={() => { setSelectedStudent(s); setStudentDetailModal(true) }}
                          >
                            View
                          </button>
                          <Link to={`/students/${s.rollNo}/report`} className="btn btn-sm btn-primary px-2 py-1">Report</Link>
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

    {/* Student Performance Analytics */}
    <div className="row">
      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header"><h4 className="card-title">Student Mentoring & Counseling</h4></div>
          <div className="card-body">
            <div className="alert alert-info d-flex align-items-center mb-3" role="alert">
              <i className="ti ti-info-circle fs-18 me-2" />
              <small>You are assigned as mentor for {classPerformance[0].strength} students in {classPerformance[0].class}</small>
            </div>
            {[
              { name: 'Priya Sharma',   rollNo: 'MPC-A-015', lastSession: '10 Feb 2026', nextSession: '17 Feb 2026', issue: 'Career guidance needed',        status: 'scheduled', cls: 'badge-soft-info' },
              { name: 'Rajesh M.',      rollNo: 'MPC-B-045', lastSession: '08 Feb 2026', nextSession: 'Not scheduled', issue: 'Academic performance issues', status: 'urgent',    cls: 'badge-soft-danger' },
              { name: 'Vikram R.',      rollNo: 'MPC-A-052', lastSession: '12 Feb 2026', nextSession: '19 Feb 2026', issue: 'Subject doubt clearing',      status: 'scheduled', cls: 'badge-soft-info' },
            ].map((m: any, i: number) => (
              <div key={i} className={`border rounded p-3 ${i < 2 ? 'mb-3' : 'mb-0'}`}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <h6 className="mb-1">{m.name}</h6>
                    <small className="text-muted">{m.rollNo}</small>
                  </div>
                  <span className={`badge ${m.cls}`}>{m.status}</span>
                </div>
                <p className="mb-2 text-muted" style={{ fontSize: 12 }}><strong>Issue:</strong> {m.issue}</p>
                <div className="d-flex align-items-center justify-content-between">
                  <small className="text-muted">Last: {m.lastSession}</small>
                  <small className="fw-semibold">Next: {m.nextSession}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header"><h4 className="card-title">Parent Communication Log</h4></div>
          <div className="card-body">
            {[
              { parent: 'Mrs. Sharma',  student: 'Priya - MPC-A-015',  date: '12 Feb 2026', type: 'Phone Call',   topic: 'Discussed performance improvement',       cls: 'badge-soft-success' },
              { parent: 'Mr. Mohan',    student: 'Rajesh - MPC-B-045', date: '10 Feb 2026', type: 'Meeting',      topic: 'Attendance and performance concerns',     cls: 'badge-soft-warning' },
              { parent: 'Mr. Raghav',   student: 'Vikram - MPC-A-052', date: '08 Feb 2026', type: 'Email',        topic: 'Subject selection for next semester',     cls: 'badge-soft-info' },
              { parent: 'Mrs. Kumar',   student: 'Priya - MPC-A-015',  date: '05 Feb 2026', type: 'SMS',          topic: 'Reminder for parent-teacher meet',        cls: 'badge-soft-secondary' },
            ].map((p: any, i: number) => (
              <div key={i} className={`d-flex align-items-start justify-content-between ${i < 3 ? 'mb-3 pb-3 border-bottom' : 'mb-0'}`}>
                <div className="flex-fill">
                  <h6 className="mb-1" style={{ fontSize: 13 }}>{p.parent}</h6>
                  <small className="text-muted d-block mb-1">{p.student}</small>
                  <p className="mb-1" style={{ fontSize: 12 }}>{p.topic}</p>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${p.cls}`}>{p.type}</span>
                    <small className="text-muted">{p.date}</small>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-top pt-3 mt-3">
              <button className="btn btn-sm btn-primary w-100"><i className="ti ti-phone me-1" />Log New Communication</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
)}


{activeSection === 'attendance' && (
  <>
    {/* Today's Attendance Summary */}
    <div className="row mb-3">
      <div className="col-md-12">
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h5 className="mb-2">Attendance for {attendanceDate}</h5>
                <div className="d-flex gap-3">
                  <div><small className="text-muted">Total Classes:</small> <strong>{todayAttendance.classes.length}</strong></div>
                  <div><small className="text-muted">Total Students:</small> <strong>{todayAttendance.classes.reduce((sum: any, c: any) => sum + c.total, 0)}</strong></div>
                  <div><small className="text-muted">Present:</small> <strong className="text-success">{todayAttendance.classes.reduce((sum: any, c: any) => sum + c.present, 0)}</strong></div>
                  <div><small className="text-muted">Absent:</small> <strong className="text-danger">{todayAttendance.classes.reduce((sum: any, c: any) => sum + c.absent, 0)}</strong></div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <input type="date" className="form-control form-control-sm" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                <button className="btn btn-primary" onClick={() => setMarkAttendanceModal(true)}>
                  <i className="ti ti-calendar-check me-1" />Mark Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Class-wise Attendance Today */}
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header"><h4 className="card-title">Today's Attendance Summary</h4></div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Leave</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.classes.map((c: any, i: number) => (
                    <tr key={i}>
                      <td className="fw-semibold">{c.class}</td>
                      <td>{c.total}</td>
                      <td><span className="text-success fw-semibold">{c.present}</span></td>
                      <td><span className="text-danger fw-semibold">{c.absent}</span></td>
                      <td><span className="text-warning">{c.late}</span></td>
                      <td>{c.leave}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress progress-xs" style={{ width: 60 }}>
                            <div 
                              className={`progress-bar ${c.percentage >= 90 ? 'bg-success' : c.percentage >= 80 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${c.percentage}%` }}
                            />
                          </div>
                          <span className="fw-semibold">{c.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.percentage >= 90 ? 'badge-soft-success' : c.percentage >= 80 ? 'badge-soft-warning' : 'badge-soft-danger'}`}>
                          {c.percentage >= 90 ? 'Excellent' : c.percentage >= 80 ? 'Good' : 'Poor'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-primary px-2 py-1">Edit</button>
                          <Link to={`/attendance/${c.class}/report`} className="btn btn-sm btn-light px-2 py-1">Report</Link>
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

    {/* Attendance Defaulters + Leave Applications */}
    <div className="row">
      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Attendance Defaulters (Below 75%)</h4>
            <span className="badge bg-danger">{attendanceDefaulters.length} Students</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Class</th>
                    <th>Attendance</th>
                    <th>Days Absent</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceDefaulters.map((d: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontSize: 13 }}>{d.name}</td>
                      <td><span className="badge badge-soft-secondary">{d.rollNo}</span></td>
                      <td>{d.class}</td>
                      <td><span className={`badge ${d.cls}`}>{d.percentage}%</span></td>
                      <td>
                        <div>
                          <span className="fw-semibold text-danger">{d.daysAbsent}</span>
                          {d.consecutiveAbsent > 0 && <small className="text-muted d-block">({d.consecutiveAbsent} consecutive)</small>}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-warning px-2 py-1"><i className="ti ti-phone" /></button>
                          <Link to={`/students/${d.rollNo}`} className="btn btn-sm btn-light px-2 py-1">View</Link>
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

      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Pending Leave Applications</h4>
            <span className="badge bg-warning">{leaveApplications.filter((l: any) => l.status === 'pending').length} Pending</span>
          </div>
          <div className="card-body">
            {leaveApplications.map((l: any, i: number) => (
              <div key={i} className={`border rounded p-3 ${i < leaveApplications.length - 1 ? 'mb-3' : 'mb-0'}`}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <h6 className="mb-1">{l.student}</h6>
                    <small className="text-muted">{l.rollNo} • {l.class}</small>
                  </div>
                  <span className={`badge ${l.cls}`}>{l.status}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block mb-1"><strong>Type:</strong> {l.type} Leave</small>
                  <small className="text-muted d-block mb-1"><strong>Dates:</strong> {l.dates} ({l.days} day{l.days > 1 ? 's' : ''})</small>
                  <small className="text-muted d-block"><strong>Reason:</strong> {l.reason}</small>
                </div>
                {l.status === 'pending' && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-success flex-fill">Approve</button>
                    <button className="btn btn-sm btn-danger flex-fill">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Attendance Trend Chart */}
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header"><h4 className="card-title">Attendance Trend - Last 7 Months</h4></div>
          <div className="card-body pb-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="colorMPCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMPCB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMPC2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 95]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="I Year MPC-A" stroke="#6366f1" fillOpacity={1} fill="url(#colorMPCA)" strokeWidth={2} />
                <Area type="monotone" dataKey="I Year MPC-B" stroke="#10b981" fillOpacity={1} fill="url(#colorMPCB)" strokeWidth={2} />
                <Area type="monotone" dataKey="II Year MPC-A" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMPC2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  </>
)}


{activeSection === 'timetable' && (
  <>
    {/* Workload Summary Cards */}
    <div className="row mb-3">
      <div className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-primary-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{workloadSummary.totalPeriods}</h2>
            <p className="mb-0">Total Periods/Week</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-success-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{workloadSummary.lectures}</h2>
            <p className="mb-0">Lecture Hours</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-warning-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{workloadSummary.practicals}</h2>
            <p className="mb-0">Lab/Practical Hours</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-info-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{workloadSummary.tutorials}</h2>
            <p className="mb-0">Tutorial Hours</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-danger-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{workloadSummary.freePeriods}</h2>
            <p className="mb-0">Free Periods</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-secondary-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{workloadSummary.hoursPerWeek}</h2>
            <p className="mb-0">Total Hours/Week</p>
          </div>
        </div>
      </div>
    </div>

    {/* Weekly Timetable */}
    <div className="row mb-3">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Weekly Timetable</h4>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-primary"><i className="ti ti-download me-1" />Download PDF</button>
              <button className="btn btn-sm btn-success"><i className="ti ti-printer me-1" />Print</button>
            </div>
          </div>
          <div className="card-body">
            <div className="d-flex gap-2 mb-3 overflow-auto">
              {weeklyTimetable.map((day: any) => (
                <button
                  key={day.day}
                  className={`btn btn-sm ${selectedDay === day.day ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => setSelectedDay(day.day)}
                >
                  {day.day}
                </button>
              ))}
            </div>
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyTimetable.find((d: any) => d.day === selectedDay)?.periods.map((p: any, i: number) => (
                    <tr key={i} className={p.type === 'Free' ? 'bg-light' : ''}>
                      <td><small className="fw-semibold">{p.time}</small></td>
                      <td className={`fw-semibold ${p.type === 'Free' ? 'text-muted' : ''}`}>{p.subject}</td>
                      <td>{p.class}</td>
                      <td><small>{p.room}</small></td>
                      <td>
                        <span className={`badge ${
                          p.type === 'Lecture' ? 'badge-soft-primary' : 
                          p.type === 'Lab' ? 'badge-soft-success' : 
                          p.type === 'Tutorial' ? 'badge-soft-warning' : 
                          p.type === 'Meeting' ? 'badge-soft-info' :
                          'badge-soft-secondary'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{p.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Extra Activities & Office Hours */}
    <div className="row">
      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header"><h4 className="card-title">Extra Activities & Responsibilities</h4></div>
          <div className="card-body">
            {workloadSummary.extraActivities.map((activity: any, i: number) => (
              <div key={i} className={`d-flex align-items-center justify-content-between p-3 border rounded ${i < workloadSummary.extraActivities.length - 1 ? 'mb-2' : 'mb-0'}`}>
                <div className="d-flex align-items-center">
                  <i className="ti ti-check-circle text-success fs-20 me-2" />
                  <span className="fw-semibold">{activity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header"><h4 className="card-title">Office Hours & Consultation</h4></div>
          <div className="card-body">
            <div className="border rounded p-3 mb-3 bg-light">
              <div className="d-flex align-items-center mb-2">
                <i className="ti ti-clock text-primary fs-20 me-2" />
                <h6 className="mb-0">Scheduled Office Hours</h6>
              </div>
              <p className="mb-0 fw-semibold">{facultyProfile.officeHours}</p>
            </div>
            <h6 className="mb-3">Upcoming Consultations</h6>
            {[
              { student: 'Aarav Patel',   date: '16 Feb, 2:00 PM', topic: 'Project discussion' },
              { student: 'Priya Sharma',  date: '17 Feb, 3:00 PM', topic: 'Career guidance' },
              { student: 'Rohan Verma',   date: '18 Feb, 2:30 PM', topic: 'Doubt clearing' },
            ].map((c: any, i: number) => (
              <div key={i} className={`d-flex align-items-start justify-content-between ${i < 2 ? 'mb-3 pb-3 border-bottom' : 'mb-0'}`}>
                <div>
                  <h6 className="mb-1" style={{ fontSize: 13 }}>{c.student}</h6>
                  <small className="text-muted">{c.topic}</small>
                </div>
                <small className="fw-semibold text-primary">{c.date}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
)}


{activeSection === 'research' && (
  <>
    {/* Research Overview */}
    <div className="row mb-3">
      <div className="col-xxl-3 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-primary-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{researchActivities.filter((r: any) => r.status === 'Published').length}</h2>
            <p className="mb-0">Published Papers</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-warning-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{researchActivities.filter((r: any) => r.status === 'Under Review').length}</h2>
            <p className="mb-0">Under Review</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-success-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{ongoingProjects.length}</h2>
            <p className="mb-0">Active Projects</p>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-sm-6 d-flex">
        <div className="card flex-fill border-0 bg-info-transparent">
          <div className="card-body text-center">
            <h2 className="mb-0">{researchActivities.reduce((sum: any, r: any) => sum + r.citations, 0)}</h2>
            <p className="mb-0">Total Citations</p>
          </div>
        </div>
      </div>
    </div>

    {/* Publications List */}
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Research Publications</h4>
            <button className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />Add Publication</button>
          </div>
          <div className="card-body">
            {researchActivities.map((r: any, i: number) => (
              <div key={i} className={`border rounded p-3 ${i < researchActivities.length - 1 ? 'mb-3' : 'mb-0'}`}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div className="flex-fill me-2">
                    <h6 className="mb-2">{r.title}</h6>
                    <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                      <small className="text-muted"><strong>Journal:</strong> {r.journal}</small>
                      <small className="text-muted"><strong>Date:</strong> {r.date}</small>
                      <span className={`badge ${r.cls}`}>{r.status}</span>
                    </div>
                  </div>
                </div>
                <p className="mb-2 text-muted" style={{ fontSize: 12 }}><strong>Abstract:</strong> {r.abstract}</p>
                <div className="row g-2 mb-2">
                  <div className="col-md-3">
                    <small className="text-muted d-block">Co-Authors</small>
                    <span className="fw-semibold" style={{ fontSize: 12 }}>{r.coAuthors}</span>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">Impact Factor</small>
                    <span className="fw-semibold text-primary">{r.impactFactor}</span>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">Citations</small>
                    <span className="fw-semibold text-success">{r.citations}</span>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">DOI</small>
                    <span className="fw-semibold" style={{ fontSize: 12 }}>{r.doi}</span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light">View Full Paper</button>
                  <button className="btn btn-sm btn-primary">Edit</button>
                  <button className="btn btn-sm btn-success">Share</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Ongoing Projects + Conferences */}
    <div className="row">
      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Ongoing Research Projects</h4>
            <button className="btn btn-sm btn-success"><i className="ti ti-plus me-1" />New Project</button>
          </div>
          <div className="card-body">
            {ongoingProjects.map((p: any, i: number) => (
              <div key={i} className={`border rounded p-3 ${i < ongoingProjects.length - 1 ? 'mb-3' : 'mb-0'}`}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <h6 className="mb-0">{p.title}</h6>
                  <span className={`badge ${p.cls}`}>{p.status}</span>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Funding</small>
                    <span className="fw-semibold">{p.fundingAgency}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Budget</small>
                    <span className="fw-semibold text-success">{p.budget}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Duration</small>
                    <span style={{ fontSize: 12 }}>{p.duration}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Role</small>
                    <span className="fw-semibold text-primary">{p.role}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <small className="text-muted">Progress</small>
                    <small className="fw-semibold">{p.progress}%</small>
                  </div>
                  <div className="progress progress-xs">
                    <div 
                      className={`progress-bar ${p.progress >= 70 ? 'bg-success' : p.progress >= 40 ? 'bg-primary' : 'bg-warning'}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
                <small className="text-muted"><strong>Team:</strong> {p.team.join(', ')}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Conferences & Workshops</h4>
            <Link to="/conferences/all" className="btn btn-sm btn-light">View All</Link>
          </div>
          <div className="card-body">
            {conferences.map((c: any, i: number) => (
              <div key={i} className={`border-start border-3 ${c.cls.includes('success') ? 'border-success' : c.cls.includes('primary') ? 'border-primary' : 'border-info'} shadow-sm p-3 ${i < conferences.length - 1 ? 'mb-3' : 'mb-0'}`}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <h6 className="mb-1">{c.name}</h6>
                  <span className={`badge ${c.cls}`}>{c.status}</span>
                </div>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <small className="text-muted"><i className="ti ti-map-pin me-1" />{c.location}</small>
                  <small className="text-muted"><i className="ti ti-calendar me-1" />{c.date}</small>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="badge badge-soft-primary">{c.type}</span>
                  {c.paper !== '-' && <small className="text-muted">Paper: {c.paper}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
)}

{/* TO BE CONTINUED: HOD SECTION AND PROFILE SECTION IN NEXT MESSAGE */}


{activeSection === 'hod' && (
  <>
    {/* HOD Responsibilities Overview */}
    <div className="row mb-3">
      <div className="col-md-12">
        <div className="alert alert-primary d-flex align-items-center" role="alert">
          <i className="ti ti-briefcase fs-20 me-2" />
          <div>
            <strong>Head of Department - MPC Group</strong>
            <p className="mb-0">Managing {academicGroups[0].faculty} faculty members and {academicGroups[0].students} students across {classPerformance.length} classes</p>
          </div>
        </div>
      </div>
    </div>

    {/* HOD Task Cards */}
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Pending Responsibilities & Tasks</h4>
            <div className="d-flex gap-2">
              <span className="badge bg-danger">{hodResponsibilities.filter((h: any) => h.priority === 'High' && h.status !== 'Completed').length} High Priority</span>
              <button className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />Add Task</button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Task</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Progress</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hodResponsibilities.map((h: any, i: number) => (
                    <tr key={i}>
                      <td><span className="badge badge-soft-secondary">{h.id}</span></td>
                      <td>
                        <div>
                          <h6 className="mb-1" style={{ fontSize: 13 }}>{h.task}</h6>
                          <small className="text-muted">{h.description}</small>
                        </div>
                      </td>
                      <td><small className={`fw-semibold ${h.priority === 'High' ? 'text-danger' : 'text-muted'}`}>{h.dueDate}</small></td>
                      <td>
                        <span className={`badge ${
                          h.priority === 'High' ? 'badge-soft-danger' : 
                          h.priority === 'Medium' ? 'badge-soft-warning' : 
                          'badge-soft-info'
                        }`}>
                          {h.priority}
                        </span>
                      </td>
                      <td><span className={`badge ${h.cls}`}>{h.status}</span></td>
                      <td style={{ fontSize: 12 }}>{h.assignedTo}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress progress-xs" style={{ width: 80 }}>
                            <div 
                              className={`progress-bar ${h.progress >= 70 ? 'bg-success' : h.progress >= 40 ? 'bg-primary' : 'bg-warning'}`}
                              style={{ width: `${h.progress}%` }}
                            />
                          </div>
                          <small>{h.progress}%</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-primary px-2 py-1">Update</button>
                          <button className="btn btn-sm btn-light px-2 py-1">View</button>
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

    {/* Faculty Management + Department Budget */}
    <div className="row">
      <div className="col-xl-7 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Faculty Under MPC Department</h4>
            <Link to="/faculty/manage" className="btn btn-sm btn-primary">Manage Faculty</Link>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Designation</th>
                    <th>Subject</th>
                    <th>Experience</th>
                    <th>Performance</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyUnderHOD.map((f: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm me-2">
                            <img src={f.avatar} alt="faculty" className="rounded-circle" />
                          </span>
                          <span className="fw-semibold" style={{ fontSize: 13 }}>{f.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{f.designation}</td>
                      <td style={{ fontSize: 12 }}>{f.subject}</td>
                      <td>{f.experience}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress progress-xs" style={{ width: 60 }}>
                            <div 
                              className={`progress-bar ${f.performance >= 90 ? 'bg-success' : f.performance >= 80 ? 'bg-primary' : 'bg-warning'}`}
                              style={{ width: `${f.performance}%` }}
                            />
                          </div>
                          <small>{f.performance}%</small>
                        </div>
                      </td>
                      <td><span className={`badge ${f.cls}`}>{f.performance >= 90 ? 'Excellent' : f.performance >= 80 ? 'Good' : 'Average'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-5 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Department Budget</h4>
            <Link to="/budget/manage" className="btn btn-sm btn-success">Manage Budget</Link>
          </div>
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-4 text-center">
                <h6 className="mb-1 text-primary">{departmentBudget.totalAllocated}</h6>
                <small className="text-muted">Allocated</small>
              </div>
              <div className="col-4 text-center">
                <h6 className="mb-1 text-success">{departmentBudget.spent}</h6>
                <small className="text-muted">Spent</small>
              </div>
              <div className="col-4 text-center">
                <h6 className="mb-1 text-warning">{departmentBudget.remaining}</h6>
                <small className="text-muted">Remaining</small>
              </div>
            </div>
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <small className="text-muted">Budget Utilization</small>
                <small className="fw-semibold">{departmentBudget.utilization}%</small>
              </div>
              <div className="progress">
                <div className="progress-bar bg-primary" style={{ width: `${departmentBudget.utilization}%` }} />
              </div>
            </div>
            <h6 className="mb-2">Category-wise Breakdown</h6>
            {departmentBudget.breakdown.map((b: any, i: number) => (
              <div key={i} className={`${i < departmentBudget.breakdown.length - 1 ? 'mb-2' : 'mb-0'}`}>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <small className="fw-semibold">{b.category}</small>
                  <small className="text-muted">₹{b.spent.toLocaleString()} / ₹{b.allocated.toLocaleString()}</small>
                </div>
                <div className="progress progress-xs">
                  <div 
                    className={`progress-bar ${b.percentage >= 80 ? 'bg-danger' : b.percentage >= 60 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Faculty Meeting Minutes */}
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Recent Faculty Meetings</h4>
            <button className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />Schedule Meeting</button>
          </div>
          <div className="card-body">
            {facultyMeetings.map((m: any, i: number) => (
              <div key={i} className={`border rounded p-3 ${i < facultyMeetings.length - 1 ? 'mb-3' : 'mb-0'}`}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div className="flex-fill">
                    <h6 className="mb-1">{m.topic}</h6>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <small className="text-muted"><i className="ti ti-calendar me-1" />{m.date}</small>
                      <small className="text-muted"><i className="ti ti-users me-1" />{m.attendees} attendees</small>
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block mb-1"><strong>Decisions:</strong> {m.decisions}</small>
                  <small className="text-muted d-block"><strong>Notes:</strong> {m.notes}</small>
                </div>
                <button className="btn btn-sm btn-light"><i className="ti ti-file-text me-1" />View Minutes ({m.minutesFile})</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
)}


{activeSection === 'profile' && (
  <>
    {/* Profile Information */}
    <div className="row">
      <div className="col-xl-4 d-flex">
        <div className="card flex-fill">
          <div className="card-header"><h4 className="card-title">Profile Information</h4></div>
          <div className="card-body text-center">
            <div className="avatar avatar-xxl mx-auto mb-3">
              <img src={facultyProfile.avatar} alt="Faculty" className="rounded-circle" />
            </div>
            <h5 className="mb-1">{facultyProfile.name}</h5>
            <p className="text-muted mb-3">{facultyProfile.designation}</p>
            <div className="d-flex gap-2 justify-content-center mb-3">
              <span className="badge bg-primary">{facultyProfile.employeeId}</span>
              <span className="badge bg-success">{facultyProfile.experience}</span>
            </div>
            <div className="text-start">
              <div className="mb-2">
                <small className="text-muted d-block">Email</small>
                <span className="fw-semibold">{facultyProfile.email}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">Phone</small>
                <span className="fw-semibold">{facultyProfile.phone}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">Join Date</small>
                <span className="fw-semibold">{facultyProfile.joinDate}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">Qualification</small>
                <span className="fw-semibold">{facultyProfile.qualification}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">Specialization</small>
                <span style={{ fontSize: 12 }}>{facultyProfile.specialization}</span>
              </div>
            </div>
            <div className="border-top pt-3 mt-3">
              <Link to="/profile/edit" className="btn btn-primary w-100 mb-2"><i className="ti ti-edit me-1" />Edit Profile</Link>
              <button className="btn btn-light w-100"><i className="ti ti-key me-1" />Change Password</button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-8 d-flex flex-column">
        {/* Classes & Subjects */}
        <div className="card mb-3">
          <div className="card-header"><h4 className="card-title">Classes & Subjects Assigned</h4></div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <h6 className="mb-2">Classes</h6>
                <div className="d-flex flex-wrap gap-2">
                  {facultyProfile.classes.map((cls: any, i: number) => (
                    <span key={i} className="badge bg-primary-transparent text-primary">{cls}</span>
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="mb-2">Subjects</h6>
                <div className="d-flex flex-wrap gap-2">
                  {facultyProfile.subjects.map((sub: any, i: number) => (
                    <span key={i} className="badge bg-success-transparent text-success">{sub}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card mb-3">
          <div className="card-header"><h4 className="card-title">Achievements & Awards</h4></div>
          <div className="card-body">
            {facultyProfile.achievements.map((a: any, i: number) => (
              <div key={i} className={`d-flex align-items-center ${i < facultyProfile.achievements.length - 1 ? 'mb-2' : 'mb-0'}`}>
                <i className="ti ti-award text-warning fs-20 me-2" />
                <span className="fw-semibold">{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Attendance & Leave */}
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">My Attendance & Leave</h4>
            <button className="btn btn-sm btn-warning" onClick={() => setLeaveApplyModal(true)}>
              <i className="ti ti-calendar-plus me-1" />Apply Leave
            </button>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-4 text-center">
                <div className="border rounded p-2">
                  <h5 className="mb-0 text-success">{facultyAttendance.thisMonth.percentage}%</h5>
                  <small className="text-muted">This Month</small>
                </div>
              </div>
              <div className="col-4 text-center">
                <div className="border rounded p-2">
                  <h5 className="mb-0 text-primary">{facultyAttendance.yearToDate.percentage}%</h5>
                  <small className="text-muted">Year to Date</small>
                </div>
              </div>
              <div className="col-4 text-center">
                <div className="border rounded p-2">
                  <h5 className="mb-0 text-warning">{facultyAttendance.yearToDate.leave}</h5>
                  <small className="text-muted">Leaves Taken</small>
                </div>
              </div>
            </div>
            <h6 className="mb-2">Leave Balance</h6>
            <div className="row g-2 mb-3">
              {leaveBalance && Object.keys(leaveBalance).length > 0 ? Object.entries(leaveBalance).map(([type, data]: [string, any], i: number) => (
                <div key={i} className="col-6">
                  <div className="border rounded p-2">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <small className="fw-semibold text-capitalize">{type}</small>
                      <small className="text-muted">{data?.remaining || 0}/{data?.total || 0}</small>
                    </div>
                    <div className="progress progress-xs">
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${data?.total ? (data.remaining/data.total)*100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : <div className="col-12"><p className="text-muted text-center">No leave balance data</p></div>}
            </div>
            <h6 className="mb-2">Recent Leave History</h6>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.slice(0, 3).map((l: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12 }}>{l.type}</td>
                      <td><small>{l.dates}</small></td>
                      <td>{l.days}</td>
                      <td><span className={`badge ${l.cls}`}>{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Teaching Feedback + Salary Info */}
    <div className="row">
      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header"><h4 className="card-title">Teaching Feedback & Ratings</h4></div>
          <div className="card-body">
            <div className="text-center mb-3 p-3 bg-light rounded">
              <h2 className="mb-1 text-primary">{teachingFeedback?.overall || 0}/5.0</h2>
              <p className="mb-0">Overall Rating</p>
              <small className="text-muted">{teachingFeedback?.totalResponses || 0} student responses</small>
            </div>
            <h6 className="mb-2">Category-wise Ratings</h6>
            {teachingFeedback?.categories && teachingFeedback.categories.length > 0 ? teachingFeedback.categories.map((c: any, i: number) => (
              <div key={i} className={`${i < teachingFeedback.categories.length - 1 ? 'mb-2' : 'mb-0'}`}>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <small className="fw-semibold">{c.category}</small>
                  <small className="text-muted">{c.rating}/5.0</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="progress progress-xs flex-fill">
                    <div 
                      className={`progress-bar ${c.rating >= 4.5 ? 'bg-success' : c.rating >= 4 ? 'bg-primary' : 'bg-warning'}`}
                      style={{ width: `${(c.rating/5)*100}%` }}
                    />
                  </div>
                  <div>
                    {Array(5).fill(0).map((_, idx: number) => (
                      <i key={idx} className={`ti ti-star${idx < Math.floor(c.rating) ? '-filled' : ''} ${idx < Math.floor(c.rating) ? 'text-warning' : 'text-muted'}`} style={{ fontSize: 12 }} />
                    ))}
                  </div>
                </div>
              </div>
            )) : <p className="text-muted text-center">No feedback data</p>}
            <div className="border-top pt-3 mt-3">
              <h6 className="mb-2">Recent Comments</h6>
              {teachingFeedback?.recentComments && teachingFeedback.recentComments.length > 0 ? teachingFeedback.recentComments.slice(0, 2).map((c: any, i: number) => (
                <div key={i} className={`${i < 1 ? 'mb-2 pb-2 border-bottom' : 'mb-0'}`}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <small className="fw-semibold">{c.class}</small>
                    <small className="text-muted">{c.date}</small>
                  </div>
                  <p className="mb-0" style={{ fontSize: 12 }}>"{c.comment}"</p>
                </div>
              )) : <p className="text-muted text-center">No comments</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h4 className="card-title">Salary & Payroll</h4>
            <button className="btn btn-sm btn-light">View Payslips</button>
          </div>
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="border rounded p-2 text-center">
                  <h6 className="mb-0 text-success">{salaryInfo?.netSalary || 'N/A'}</h6>
                  <small className="text-muted">Net Salary</small>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded p-2 text-center">
                  <h6 className="mb-0 text-primary">{salaryInfo?.grossSalary || 'N/A'}</h6>
                  <small className="text-muted">Gross Salary</small>
                </div>
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <h6 className="mb-2">Earnings</h6>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <small className="text-muted">Basic Pay</small>
                  <small className="fw-semibold">{salaryInfo?.basicPay || 'N/A'}</small>
                </div>
                {salaryInfo?.allowances && Object.keys(salaryInfo.allowances).length > 0 ? Object.entries(salaryInfo.allowances).map(([key, value]: [string, any], i: number) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-1">
                    <small className="text-muted text-uppercase">{key}</small>
                    <small className="fw-semibold">{value}</small>
                  </div>
                )) : null}
              </div>
              <div className="col-6">
                <h6 className="mb-2">Deductions</h6>
                {salaryInfo?.deductions && Object.keys(salaryInfo.deductions).length > 0 ? Object.entries(salaryInfo.deductions).map(([key, value]: [string, any], i: number) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-1">
                    <small className="text-muted text-uppercase">{key}</small>
                    <small className="fw-semibold text-danger">{value}</small>
                  </div>
                )) : null}
              </div>
            </div>
            <div className="border-top pt-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <small className="text-muted">Last Paid</small>
                <small className="fw-semibold">{salaryInfo?.lastPaid || 'N/A'}</small>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <small className="text-muted">Payment Mode</small>
                <small className="fw-semibold">{salaryInfo?.paymentMode || 'N/A'} ({salaryInfo?.bankDetails || 'N/A'})</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
)}

{/* ══════════════════════════════════════════════════════════════════════
    MODALS
══════════════════════════════════════════════════════════════════════ */}

{/* Student Query Response Modal */}
{queryResponseModal && selectedQuery && (
  <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
    <div className="modal-dialog modal-dialog-centered modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Respond to Student Query</h5>
          <button type="button" className="btn-close" onClick={() => { setQueryResponseModal(false); setSelectedQuery(null) }} />
        </div>
        <div className="modal-body">
          <div className="border-bottom pb-3 mb-3">
            <div className="d-flex align-items-center mb-2">
              <span className="avatar avatar-md me-2">
                <img src={selectedQuery.avatar} alt="student" className="rounded-circle" />
              </span>
              <div>
                <h6 className="mb-0">{selectedQuery.student}</h6>
                <small className="text-muted">{selectedQuery.rollNo} • {selectedQuery.class} • {selectedQuery.subject}</small>
              </div>
            </div>
            <div className="bg-light p-3 rounded">
              <p className="mb-0"><strong>Query:</strong> {selectedQuery.query}</p>
              <small className="text-muted"><i className="ti ti-clock me-1" />{selectedQuery.time}</small>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Your Response</label>
            <textarea 
              className="form-control" 
              rows={6} 
              placeholder="Type your detailed response here..."
            />
          </div>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label">Attach Reference Material (optional)</label>
              <input type="file" className="form-control" multiple />
            </div>
            <div className="col-md-6">
              <label className="form-label">Schedule Follow-up (optional)</label>
              <input type="datetime-local" className="form-control" />
            </div>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="markResolved" />
            <label className="form-check-label" htmlFor="markResolved">
              Mark this query as resolved after sending response
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { setQueryResponseModal(false); setSelectedQuery(null) }}>
            Cancel
          </button>
          <button type="button" className="btn btn-success" onClick={() => { setQueryResponseModal(false); setSelectedQuery(null) }}>
            <i className="ti ti-send me-1" />Send Response
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Student Detail Modal */}
{studentDetailModal && selectedStudent && (
  <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
    <div className="modal-dialog modal-dialog-centered modal-xl">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Student Details - {selectedStudent.name}</h5>
          <button type="button" className="btn-close" onClick={() => { setStudentDetailModal(false); setSelectedStudent(null) }} />
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-4">
              <div className="text-center mb-3">
                <div className="avatar avatar-xxl mx-auto mb-2">
                  <img src={selectedStudent.avatar} alt="student" className="rounded-circle" />
                </div>
                <h6>{selectedStudent.name}</h6>
                <span className="badge bg-primary">{selectedStudent.rollNo}</span>
              </div>
              <div className="border rounded p-3">
                <h6 className="mb-3">Basic Information</h6>
                <div className="mb-2">
                  <small className="text-muted d-block">Class</small>
                  <span className="fw-semibold">{selectedStudent.class}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Date of Birth</small>
                  <span>{selectedStudent.dob}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Gender</small>
                  <span>{selectedStudent.gender === 'M' ? 'Male' : 'Female'}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Phone</small>
                  <span>{selectedStudent.phone}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Email</small>
                  <span style={{ fontSize: 12 }}>{selectedStudent.email}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Parent</small>
                  <span className="fw-semibold">{selectedStudent.parent}</span>
                  <br />
                  <small>{selectedStudent.parentPhone}</small>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="row g-3 mb-3">
                <div className="col-4">
                  <div className="border rounded p-3 text-center">
                    <h4 className="mb-0 text-primary">{selectedStudent.avgScore}%</h4>
                    <small className="text-muted">Average Score</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border rounded p-3 text-center">
                    <h4 className="mb-0 text-success">{selectedStudent.attendance}%</h4>
                    <small className="text-muted">Attendance</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border rounded p-3 text-center">
                    <h4 className="mb-0 text-warning">Active</h4>
                    <small className="text-muted">Status</small>
                  </div>
                </div>
              </div>
              <h6 className="mb-2">Academic Performance</h6>
              <div className="border rounded p-3 mb-3">
                <p className="mb-2"><strong>Strong Areas:</strong> Mathematics, Physics</p>
                <p className="mb-0"><strong>Areas for Improvement:</strong> Chemistry lab work</p>
              </div>
              <h6 className="mb-2">Recent Activity</h6>
              <div className="border rounded p-3">
                <ul className="mb-0" style={{ fontSize: 13 }}>
                  <li className="mb-1">Submitted Assignment: Calculus Problem Set - 10 Feb 2026</li>
                  <li className="mb-1">Attended Extra Class: Mathematics - 08 Feb 2026</li>
                  <li className="mb-1">Query Raised: Integration doubts - 07 Feb 2026</li>
                  <li className="mb-0">Counseling Session: Career guidance - 05 Feb 2026</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-light" onClick={() => { setStudentDetailModal(false); setSelectedStudent(null) }}>
            Close
          </button>
          <Link to={`/students/${selectedStudent.rollNo}/report`} className="btn btn-primary">
            View Full Report
          </Link>
        </div>
      </div>
    </div>
  </div>
)}

{/* Mark Attendance Modal */}
{markAttendanceModal && (
  <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
    <div className="modal-dialog modal-dialog-centered modal-xl">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Mark Attendance</h5>
          <button type="button" className="btn-close" onClick={() => setMarkAttendanceModal(false)} />
        </div>
        <div className="modal-body">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" defaultValue="2026-02-15" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Class</label>
              <select className="form-select">
                <option>I Year MPC-A</option>
                <option>I Year MPC-B</option>
                <option>II Year MPC-A</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Subject/Period</label>
              <select className="form-select">
                <option>Mathematics - Period 1</option>
                <option>Physics - Period 2</option>
                <option>Tutorial - Period 3</option>
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Student List</h6>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-success">Mark All Present</button>
              <button className="btn btn-sm btn-danger">Mark All Absent</button>
            </div>
          </div>
          <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="table table-sm">
              <thead className="sticky-top bg-white">
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Leave</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.slice(0, 10).map((s: any, i: number) => (
                  <tr key={i}>
                    <td><span className="badge badge-soft-secondary">{s.rollNo}</span></td>
                    <td>{s.name}</td>
                    <td><input type="radio" name={`att-${i}`} defaultChecked /></td>
                    <td><input type="radio" name={`att-${i}`} /></td>
                    <td><input type="radio" name={`att-${i}`} /></td>
                    <td><input type="radio" name={`att-${i}`} /></td>
                    <td><input type="text" className="form-control form-control-sm" placeholder="Optional" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setMarkAttendanceModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-success" onClick={() => setMarkAttendanceModal(false)}>
            <i className="ti ti-check me-1" />Save Attendance
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Apply Leave Modal */}
{leaveApplyModal && (
  <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Apply for Leave</h5>
          <button type="button" className="btn-close" onClick={() => setLeaveApplyModal(false)} />
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Leave Type</label>
            <select className="form-select">
              <option>Casual Leave</option>
              <option>Medical Leave</option>
              <option>Earned Leave</option>
              <option>Academic Leave</option>
            </select>
          </div>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label">From Date</label>
              <input type="date" className="form-control" />
            </div>
            <div className="col-6">
              <label className="form-label">To Date</label>
              <input type="date" className="form-control" />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Reason for Leave</label>
            <textarea className="form-control" rows={4} placeholder="Please provide reason for leave..."></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label">Substitute Faculty (optional)</label>
            <select className="form-select">
              <option>Select substitute...</option>
              <option>Dr. Priya Nair</option>
              <option>Prof. Suresh Reddy</option>
              <option>Mr. Vikram Singh</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Attach Document (if medical leave)</label>
            <input type="file" className="form-control" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setLeaveApplyModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setLeaveApplyModal(false)}>
            <i className="ti ti-send me-1" />Submit Application
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </>
  )
}

export default FacultyDashboardComplete
