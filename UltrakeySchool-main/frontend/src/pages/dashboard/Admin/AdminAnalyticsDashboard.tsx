/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import adminAnalyticsService from '../../../services/adminAnalyticsService'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import TopStatCard from '../../../components/dashboard/TopStatCard'

const AdminAnalyticsDashboard = () => {
  const [activeSection, setActiveSection] = useState('admissions')
  const [reminderSent, setReminderSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const period = 'month' // Fixed period for now

  // State for all analytics data
  const [admissionsData, setAdmissionsData] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [feesData, setFeesData] = useState<any>(null)
  const [staffData, setStaffData] = useState<any>(null)
  const [complaintsData, setComplaintsData] = useState<any>(null)

  // Fetch all analytics data on component mount
  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all analytics data from backend
      const response = await adminAnalyticsService.getAdminAnalytics(period)

      if (response.success && response.data) {
        setAdmissionsData(response.data.admissions)
        setAttendanceData(response.data.attendance)
        setFeesData(response.data.fees)
        setStaffData(response.data.staff)
        setComplaintsData(response.data.complaints)
        toast.success('Analytics data loaded successfully')
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Failed to load analytics data')
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminders = async () => {
    try {
      const response = await adminAnalyticsService.sendFeeReminders()
      if (response.success) {
        setReminderSent(true)
        toast.success(response.message || 'Fee reminders sent successfully')
        // Refresh fees data
        const feesResponse = await adminAnalyticsService.getFeesAnalytics(period)
        if (feesResponse.success) {
          setFeesData(feesResponse.data)
        }
      }
    } catch (err: any) {
      console.error('Error sending reminders:', err)
      toast.error('Failed to send fee reminders')
    }
  }

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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchAnalyticsData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  // Use backend data or fallback to static data for display
  const topStats = admissionsData && attendanceData && feesData && complaintsData ? [
    {
      label: 'New Admissions (Month)',
      value: admissionsData.newAdmissions?.toString() || '0',
      delta: `+${admissionsData.admissionGrowth || 0}%`,
      deltaTone: 'bg-success',
      icon: '/assets/img/icons/student.svg',
      active: `${admissionsData.approvedAdmissions || 0} Approved`,
      inactive: `${admissionsData.pendingAdmissions || 0} Pending`,
      avatarTone: 'bg-success-transparent'
    },
    {
      label: "Today's Attendance",
      value: `${attendanceData.studentAttendance?.percentage || 0}%`,
      delta: '+1.2% vs avg',
      deltaTone: 'bg-primary',
      icon: '/assets/img/icons/technology-05.svg',
      active: `${attendanceData.studentAttendance?.present || 0} Present`,
      inactive: `${attendanceData.studentAttendance?.absent || 0} Absent`,
      avatarTone: 'bg-primary-transparent'
    },
    {
      label: 'Pending Fee Reminders',
      value: feesData.overdueStudents?.length?.toString() || '0',
      delta: '60+ Days',
      deltaTone: 'bg-danger',
      icon: '/assets/img/icons/technology-06.svg',
      active: 'Overdue',
      inactive: `$${feesData.pendingAmount || 0}K Due`,
      avatarTone: 'bg-danger-transparent'
    },
    {
      label: 'Open Complaints',
      value: complaintsData.openComplaints?.toString() || '0',
      delta: `${complaintsData.urgentComplaints || 0} Urgent`,
      deltaTone: 'bg-secondary',
      icon: '/assets/img/icons/review.svg',
      active: 'Open',
      inactive: `${complaintsData.resolvedComplaints || 0} Resolved`,
      avatarTone: 'bg-secondary-transparent'
    },
  ] : [
    { label: 'New Admissions (Month)', value: '64',    delta: '+8.1%',       deltaTone: 'bg-success',   icon: '/assets/img/icons/student.svg',       active: '46 Approved',  inactive: '18 Pending',  avatarTone: 'bg-success-transparent'  },
    { label: "Today's Attendance",     value: '94.2%', delta: '+1.2% vs avg',deltaTone: 'bg-primary',   icon: '/assets/img/icons/technology-05.svg', active: '3,442 Present',inactive: '212 Absent',  avatarTone: 'bg-primary-transparent'  },
    { label: 'Pending Fee Reminders',  value: '124',   delta: '60+ Days',    deltaTone: 'bg-danger',    icon: '/assets/img/icons/technology-06.svg', active: 'Overdue',      inactive: '$32K Due',    avatarTone: 'bg-danger-transparent'   },
    { label: 'Open Complaints',        value: '7',     delta: '3 Urgent',    deltaTone: 'bg-secondary', icon: '/assets/img/icons/review.svg',        active: 'Open',         inactive: '33 Resolved', avatarTone: 'bg-secondary-transparent' },
  ]

  // Transform backend data for all sections - using empty arrays as fallbacks
  const admissionKPIs = admissionsData?.kpis || []
  const admissionsYearData = admissionsData?.yearlyData || []
  const admissionTrend = admissionsData?.monthlyTrend || []
  const gradeStrength = admissionsData?.gradeStrength || []
  const GRADE_COLORS = ['#6366f1','#10b981','#f59e0b','#06b6d4','#ef4444','#8b5cf6','#ec4899','#14b8a6']
  const classStrengthBar = admissionsData?.classStrength || []
  const dropoutData = admissionsData?.dropoutData || []
  const seatOccupancy = admissionsData?.seatOccupancy || []
  const recentApplications = admissionsData?.recentApplications || []

  const attendanceKPIs = attendanceData?.kpis || []
  const monthlyAttTrend = attendanceData?.monthlyTrend || []
  const weeklyPresentAbsent = attendanceData?.weeklyData || []
  const classWiseAtt = attendanceData?.classWise || []
  const attPct = attendanceData?.percentages || []
  const frequentAbsentees = attendanceData?.frequentAbsentees || []

  const feeKPIs = feesData?.kpis || []
  const monthlyFeeCollectionTrend = feesData?.monthlyTrend || []
  const paymentMode = feesData?.paymentModes || []
  const overdueStudents = feesData?.overdueStudents || []

  const staffKPIs = staffData?.kpis || []
  const staffAttByDept = staffData?.attendanceByDept || []
  const perfRating = staffData?.performanceRating || []
  const vacancies = staffData?.vacancies || []
  const leaveRequests = staffData?.leaveRequests || []

  const complaintKPIs = complaintsData?.kpis || []
  const complaintsTrend = complaintsData?.trend || []
  const resolutionRate = complaintsData?.resolutionRate || []
  const complaintsList = complaintsData?.recentComplaints || []

  const sections = [
    { id: 'admissions', label: '① Admissions Overview'  },
    { id: 'attendance', label: '② Attendance Analytics' },
    { id: 'fees',       label: '③ Fees Overview'        },
    { id: 'staff',      label: '④ Staff Operations'     },
    { id: 'complaints', label: '⑤ Complaints'           },
  ]

  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Admin Analytics Dashboard</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Admin Analytics</li>
          </ol></nav>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <a href="#" className="bg-white dropdown-toggle btn btn-light" data-bs-toggle="dropdown">
              <i className="ti ti-calendar me-2" />This Month
            </a>
            <ul className="dropdown-menu mt-2 p-3">
              {['Today','This Week','This Month','This Year'].map((o: any) => (
                <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
              ))}
            </ul>
          </div>
          <Link to="/reports/admin" className="btn btn-success">
            <i className="ti ti-download me-2" />Export Report
          </Link>
        </div>
      </div>

      {/* ── TOP STAT CARDS ──────────────────────────────────────────── */}
      <div className="row mb-4">
        {topStats.map((stat: any) => <TopStatCard key={stat.label} {...stat} />)}
      </div>

      {/* ── SECTION TABS ────────────────────────────────────────────── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="list-tab">
            <ul className="nav">
              {sections.map((s: any) => (
                <li key={s.id}>
                  <a href="#"
                    className={activeSection === s.id ? 'active' : ''}
                    onClick={e => { e.preventDefault(); setActiveSection(s.id) }}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ① ADMISSIONS OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'admissions' && (
        <>
          {/* Admission KPI Cards */}
          <div className="row mb-4">
            {admissionKPIs.map((stat: any) => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Admissions vs Last Year Bar + Grade-wise Pie */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Admissions vs Last Year</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />Last 6 Years
                    </a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['Last 3 Years','Last 6 Years','All Time'].map((o: any) => (
                        <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={admissionsYearData} barSize={22} barGap={4}>
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="current"  name="This Year" fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="lastYear" name="Last Year" fill="#e0e7ff" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Grade-wise Student Strength</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={gradeStrength} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value">
                        {gradeStrength.map((_: any, i: number) => <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Class Strength vs Capacity */}
          <div className="row">
            <div className="col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Class-wise Strength vs Capacity</h4>
                  <Link to="/admissions/new" className="btn btn-sm btn-primary">
                    <i className="ti ti-plus me-1" />Add New Admission
                  </Link>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={classStrengthBar} barSize={22} barGap={4}>
                      <XAxis dataKey="cls" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="students" name="Enrolled"  fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="capacity" name="Capacity"  fill="#e0e7ff" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Growth Trend Line */}
          <div className="row">
            <div className="col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Admission Growth Trend (Monthly)</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={admissionTrend}>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="v" name="Admissions" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* New vs Renewal + Dropout + Seat Occupancy + Recent Applications */}
          <div className="row">
            <div className="col-xxl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">New vs Renewal Students</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[{ name:'New Students', value: 37 },{ name:'Renewals', value: 63 }]}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        <Cell fill="#6366f1" /><Cell fill="#e0e7ff" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Dropout Rate by Class</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {dropoutData.map((d: any) => (
                      <li key={d.grade} className="list-group-item">
                        <div className="row align-items-center">
                          <div className="col-sm-4"><p className="text-dark mb-0">{d.grade}</p></div>
                          <div className="col-sm-6"><div className="progress progress-xs"><div className={`progress-bar ${d.bar} rounded`} style={{ width: `${d.rate * 20}%` }} /></div></div>
                          <div className="col-sm-2 text-end"><span className="badge badge-soft-danger">{d.rate}%</span></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Seat Occupancy by Class</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {seatOccupancy.map((s: any) => (
                      <li key={s.grade} className="list-group-item">
                        <div className="row align-items-center">
                          <div className="col-sm-5"><p className="text-dark mb-0">{s.grade}</p></div>
                          <div className="col-sm-5"><div className="progress progress-xs"><div className={`progress-bar ${s.bar} rounded`} style={{ width: s.pct }} /></div></div>
                          <div className="col-sm-2 text-end"><small className="text-dark fw-semibold">{s.pct}</small></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="alert alert-info d-flex align-items-center mt-3 mb-0" role="alert">
                    <i className="ti ti-info-square-rounded me-2 fs-14" />
                    <div className="fs-12">School-wide seat occupancy target: 95%</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recent Applications</h4>
                  <Link to="/admissions/new" className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />New</Link>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {recentApplications.map((a: any, i: number) => (
                      <li key={i} className="list-group-item d-flex align-items-center justify-content-between gap-2">
                        <div className="overflow-hidden">
                          <p className="text-dark mb-0 text-truncate">{a.name}</p>
                          <small className="text-muted">{a.cls} · {a.date}</small>
                        </div>
                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          <span className={`badge ${a.cls2}`}>{a.status}</span>
                          {a.status === 'Pending' && (
                            <button className="btn btn-sm btn-success px-1 py-0">✓</button>
                          )}
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

      {/* ══════════════════════════════════════════════════════════════
          ② ATTENDANCE ANALYTICS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'attendance' && (
        <>
          {/* Attendance KPI Cards */}
          <div className="row mb-4">
            {attendanceKPIs.map((stat: any) => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Monthly Trend Line + This Week Stacked Bar */}
          <div className="row">
            <div className="col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Monthly Attendance Trend – Students & Staff</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />This Year
                    </a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['This Year','Last Year'].map((o: any) => (
                        <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyAttTrend}>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80,100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="students" name="Students" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                      <Line type="monotone" dataKey="staff"    name="Staff"    stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">This Week – Present vs Absent</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weeklyPresentAbsent} barSize={28} barGap={4}>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="present" name="Present" fill="#6366f1" stackId="a" />
                      <Bar dataKey="absent"  name="Absent"  fill="#ef4444" stackId="a" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Class-wise % + Overall Summary + Frequent Absentees */}
          <div className="row">
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Class-wise Attendance %</h4>
                  <Link to="/attendance/report" className="btn btn-sm btn-primary">
                    <i className="ti ti-download me-1" />Export
                  </Link>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {classWiseAtt.map((c: any) => (
                      <li key={c.cls} className="list-group-item">
                        <div className="row align-items-center">
                          <div className="col-sm-5"><p className="text-dark mb-0">{c.cls}</p></div>
                          <div className="col-sm-5"><div className="progress progress-xs"><div className={`progress-bar ${c.bar} rounded`} style={{ width: `${c.pct}%` }} /></div></div>
                          <div className="col-sm-2 text-end">
                            <small className={`fw-semibold ${c.pct < 85 ? 'text-danger' : c.pct < 90 ? 'text-warning' : 'text-success'}`}>{c.pct}%</small>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Average Attendance %</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {attPct.map((a: any) => (
                      <li key={a.lbl} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <p className="text-dark mb-0" style={{ fontSize: 12 }}>{a.lbl}</p>
                          <span className="fw-semibold text-dark">{a.pct}</span>
                        </div>
                        <div className="progress progress-xs">
                          <div className={`progress-bar ${a.bar} rounded`} style={{ width: a.w }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="alert alert-success d-flex align-items-center mt-3 mb-0" role="alert">
                    <i className="ti ti-info-square-rounded me-2 fs-14" />
                    <div className="fs-12">School-wide attendance above 90% target ✓</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Frequent Absentees (At Risk)</h4>
                  <span className="badge bg-danger">{frequentAbsentees.length} Students</span>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {frequentAbsentees.map((s: any, i: number) => (
                      <li key={i} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div>
                            <span className="fw-semibold text-dark" style={{ fontSize: 13 }}>{s.name}</span>
                            <small className="text-muted ms-1">({s.cls})</small>
                          </div>
                          <span className="text-danger fw-semibold">{s.absences} absent</span>
                        </div>
                        <div className="row align-items-center">
                          <div className="col-sm-10"><div className="progress progress-xs"><div className={`progress-bar ${s.bar} rounded`} style={{ width: s.pct }} /></div></div>
                          <div className="col-sm-2 text-end"><small className="text-muted">{s.pct}</small></div>
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

      {/* ══════════════════════════════════════════════════════════════
          ③ FEES OVERVIEW (Admin: view + reminders only)
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'fees' && (
        <>
          <div className="row mb-4">
            {feeKPIs.map((stat: any) => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Collection vs Pending Area Chart + Payment Mode Pie */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Monthly Collection vs Pending Trend</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />Last 9 Months
                    </a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['Last 6 Months','Last 9 Months','This Year'].map((o: any) => (
                        <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={monthlyFeeCollectionTrend}>
                      <defs>
                        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="penGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v || 0)/1000}k`} />
                      <Tooltip formatter={(v, n) => [`$${(v || 0).toLocaleString()}`, n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2.5} fill="url(#colGrad)" dot={false} />
                      <Area type="monotone" dataKey="pending"   name="Pending"   stroke="#ef4444" strokeWidth={2}   fill="url(#penGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Payment Mode Distribution</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={paymentMode} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                        {paymentMode.map((_: any, i: number) => <Cell key={i} fill={GRADE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="row g-2 mt-1">
                    {paymentMode.map((p: any, i: number) => (
                      <div key={p.name} className="col-6">
                        <div className="border rounded p-2 text-center">
                          <div className="fw-semibold" style={{ color: GRADE_COLORS[i], fontSize: 15 }}>{p.value}%</div>
                          <small className="text-muted">{p.name}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Students List + Send Reminders */}
          <div className="row">
            <div className="col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Overdue Fee Students</h4>
                  <button
                    className={`btn ${reminderSent ? 'btn-success' : 'btn-primary'}`}
                    onClick={handleSendReminders}
                    disabled={reminderSent}
                  >
                    <i className="ti ti-send me-1" />
                    {reminderSent ? 'Reminders Sent ✓' : 'Send Fee Reminders'}
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Class</th>
                          <th>Outstanding Amount</th>
                          <th>Days Overdue</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueStudents.map((student: any, i: number) => (
                          <tr key={i}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="fw-semibold">{student.name}</span>
                              </div>
                            </td>
                            <td>{student.cls}</td>
                            <td className="text-danger fw-semibold">${student.amount}</td>
                            <td>
                              <span className={`badge ${student.cls2}`}>{student.days}</span>
                            </td>
                            <td>
                              <span className="badge bg-danger">Overdue</span>
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

      {/* ══════════════════════════════════════════════════════════════
          ④ STAFF OPERATIONS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'staff' && (
        <>
          <div className="row mb-4">
            {staffKPIs.map((stat: any) => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Staff Attendance by Department + Performance Rating */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Staff Attendance by Department</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={staffAttByDept} barSize={24} barGap={4}>
                      <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="att" fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Performance Rating Distribution</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {perfRating.map((r: any) => (
                      <li key={r.label} className="list-group-item">
                        <div className="row align-items-center">
                          <div className="col-sm-5"><p className="text-dark mb-0">{r.label}</p></div>
                          <div className="col-sm-5"><div className="progress progress-xs"><div className={`progress-bar ${r.bar} rounded`} style={{ width: r.w }} /></div></div>
                          <div className="col-sm-2 text-end"><small className="fw-semibold">{r.pct}</small></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Vacancies + Leave Requests */}
          <div className="row">
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Current Vacancies</h4>
                  <span className="badge bg-warning">{vacancies.length} Open</span>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {vacancies.map((v: any, i: number) => (
                      <li key={i} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div>
                            <span className="fw-semibold text-dark">{v.pos}</span>
                            <small className="text-muted ms-1">({v.dept})</small>
                          </div>
                          <span className={`badge ${v.cls}`}>{v.since}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Pending Leave Requests</h4>
                  <span className="badge bg-danger">{leaveRequests.length} Pending</span>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {leaveRequests.map((l: any, i: number) => (
                      <li key={i} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar avatar-sm bg-primary text-white rounded-circle">
                              <img src={l.avatar} alt={l.name} className="avatar-img" />
                            </div>
                            <div>
                              <span className="fw-semibold text-dark" style={{ fontSize: 13 }}>{l.name}</span>
                              <small className="text-muted d-block">{l.role}</small>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className={`badge ${l.cls} me-1`}>{l.type}</span>
                            <small className="text-muted d-block">{l.days}</small>
                          </div>
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

      {/* ══════════════════════════════════════════════════════════════
          ⑤ COMPLAINTS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'complaints' && (
        <>
          <div className="row mb-4">
            {complaintKPIs.map((stat: any) => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Complaints Trend + Resolution Rate */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Complaints Trend (Monthly)</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />This Year
                    </a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['This Year','Last Year'].map((o: any) => (
                        <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={complaintsTrend} barSize={24} barGap={4}>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="raised"   name="Raised"   fill="#ef4444" radius={[6,6,0,0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Resolution Rate by Category</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {resolutionRate.map((r: any) => (
                      <li key={r.lbl} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-semibold" style={{ fontSize: 13 }}>{r.lbl}</span>
                          <span className="text-dark fw-semibold">{r.pct}</span>
                        </div>
                        <div className="progress progress-xs">
                          <div className={`progress-bar ${r.bar} rounded`} style={{ width: r.w }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Complaints List */}
          <div className="row">
            <div className="col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recent Complaints</h4>
                  <Link to="/complaints" className="btn btn-sm btn-primary">
                    <i className="ti ti-eye me-1" />View All
                  </Link>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {complaintsList.map((c: any) => (
                      <li key={c.id} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary">{c.id}</span>
                            <div>
                              <span className="fw-semibold text-dark" style={{ fontSize: 13 }}>{c.from}</span>
                              <small className="text-muted d-block">{c.issue}</small>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className={`badge ${c.cls2} me-1`}>{c.status}</span>
                            <small className="text-muted d-block">{c.date}</small>
                          </div>
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
    </>
  );
};

export default AdminAnalyticsDashboard
