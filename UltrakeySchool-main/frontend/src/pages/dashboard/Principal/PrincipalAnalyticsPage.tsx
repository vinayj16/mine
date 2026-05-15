import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import apiClient from '../../../api/client'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface OverviewStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  activeStudents: number
  attendanceToday: { present: number; absent: number; percentage: number }
  pendingFees: number
  recentAdmissions: number
  totalStaff?: number
}

interface AttendanceTrend {
  month: string
  present: number
  absent: number
  percentage: number
}

interface FeeStats {
  collected: number
  pending: number
  collectionRate: number
  monthlyData?: Array<{ month: string; collected: number; pending: number }>
}

interface ExamStats {
  totalExams: number
  upcoming: number
  completed: number
  avgScore?: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const PrincipalAnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([])
  const [feeStats, setFeeStats] = useState<FeeStats | null>(null)
  const [examStats, setExamStats] = useState<ExamStats | null>(null)
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.allSettled([
        fetchOverview(),
        fetchAnalyticsSummary(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchOverview = async () => {
    try {
      const res = await apiClient.get('/dashboard/admin')
      if (res.data?.success) {
        const d = res.data.data
        const ov = d.overview || d
        setOverview({
          totalStudents: ov.totalStudents || 0,
          totalTeachers: ov.totalTeachers || 0,
          totalClasses: ov.totalClasses || 0,
          activeStudents: ov.activeStudents || 0,
          attendanceToday: {
            present: ov.attendanceToday?.present || 0,
            absent: ov.attendanceToday?.absent || 0,
            percentage: Number(ov.attendanceToday?.percentage) || 0,
          },
          pendingFees: ov.pendingFees || 0,
          recentAdmissions: ov.recentAdmissions || 0,
          totalStaff: ov.totalStaff || 0,
        })
        if (d.feeStats) setFeeStats(d.feeStats)
        if (d.examStats) setExamStats(d.examStats)
        if (Array.isArray(d.attendanceTrend)) setAttendanceTrend(d.attendanceTrend)
      }
    } catch (e) {
      console.error('fetchOverview error', e)
    }
  }

  const fetchAnalyticsSummary = async () => {
    try {
      const res = await apiClient.get('/analytics/summary')
      if (res.data?.success) setAnalyticsSummary(res.data.data)
    } catch (e) {
      console.error('fetchAnalyticsSummary error', e)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const attendancePieData = overview ? [
    { name: 'Present', value: overview.attendanceToday.present, fill: '#10b981' },
    { name: 'Absent', value: overview.attendanceToday.absent, fill: '#ef4444' },
  ] : []

  const statCards = [
    { label: 'Total Students', value: overview?.totalStudents ?? 0, sub: `${overview?.activeStudents ?? 0} active`, icon: 'ti ti-users', color: 'primary', link: '/dashboard/principal/students' },
    { label: 'Total Teachers', value: overview?.totalTeachers ?? 0, sub: 'Teaching staff', icon: 'ti ti-user-check', color: 'success', link: '/dashboard/principal/teachers' },
    { label: 'Total Classes', value: overview?.totalClasses ?? 0, sub: 'Active classes', icon: 'ti ti-school', color: 'warning', link: '/dashboard/principal/classes' },
    { label: 'Attendance Today', value: `${overview?.attendanceToday.percentage ?? 0}%`, sub: `${overview?.attendanceToday.present ?? 0} present`, icon: 'ti ti-calendar-check', color: 'info', link: '/dashboard/principal/attendance/student' },
    { label: 'Pending Fees', value: overview?.pendingFees ?? 0, sub: 'Requires action', icon: 'ti ti-receipt', color: 'danger', link: '/dashboard/principal/fees-collection' },
    { label: 'New Admissions', value: overview?.recentAdmissions ?? 0, sub: 'Last 7 days', icon: 'ti ti-user-plus', color: 'purple', link: '/dashboard/principal/students/add' },
    { label: 'Fees Collected', value: fmt(feeStats?.collected ?? 0), sub: 'This month', icon: 'ti ti-cash', color: 'teal', link: '/dashboard/principal/fees-collection' },
    { label: 'Collection Rate', value: `${feeStats?.collectionRate ?? 0}%`, sub: 'Overall', icon: 'ti ti-chart-pie', color: 'indigo', link: '/dashboard/principal/fees-report' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
        <div>
          <h3 className="page-title mb-1">School Analytics</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/dashboard/principal">Dashboard</Link></li>
            <li className="breadcrumb-item active">Analytics</li>
          </ol></nav>
        </div>
        <button className="btn btn-outline-primary btn-sm mt-2 mt-md-0" onClick={fetchAll}>
          <i className="ti ti-refresh me-1" />Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div key={i} className="col-xl-3 col-sm-6 d-flex">
            <Link to={s.link} className="card flex-fill animate-card text-decoration-none">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>{s.label}</p>
                    <h3 className="mb-0 text-dark">{s.value}</h3>
                    <small className="text-muted">{s.sub}</small>
                  </div>
                  <div className={`avatar avatar-lg bg-${s.color}-transparent flex-shrink-0`}>
                    <i className={`${s.icon} fs-24`}></i>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="row g-3 mb-4">
        {/* Attendance Trend */}
        <div className="col-xl-8 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Attendance Trend</h5>
              <Link to="/dashboard/principal/attendance/student" className="btn btn-sm btn-outline-primary">View Details</Link>
            </div>
            <div className="card-body">
              {attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={attendanceTrend}>
                    <defs>
                      <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="absent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#present)" name="Present" />
                    <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#absent)" name="Absent" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: 260 }}>
                  <i className="ti ti-chart-area fs-1 text-muted mb-2"></i>
                  <p className="text-muted mb-0">Attendance trend data will appear here</p>
                  <small className="text-muted">Data loads from the attendance module</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Attendance Pie */}
        <div className="col-xl-4 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h5 className="card-title mb-0">Today's Attendance</h5>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              {(overview?.attendanceToday.present ?? 0) + (overview?.attendanceToday.absent ?? 0) > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex gap-3 mt-2">
                    <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                      Present: {overview?.attendanceToday.present}
                    </span>
                    <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                      Absent: {overview?.attendanceToday.absent}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="ti ti-calendar-stats fs-1 text-muted mb-2"></i>
                  <p className="text-muted mb-0">No attendance data for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row g-3 mb-4">
        {/* Fee Collection */}
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Fee Collection</h5>
              <Link to="/dashboard/principal/fees-collection" className="btn btn-sm btn-outline-primary">Manage</Link>
            </div>
            <div className="card-body">
              {feeStats?.monthlyData && feeStats.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={feeStats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? fmt(v) : String(v)} />
                    <Legend />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-success mb-1">{fmt(feeStats?.collected ?? 0)}</h4>
                      <small className="text-muted">Collected</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-danger mb-1">{fmt(feeStats?.pending ?? 0)}</h4>
                      <small className="text-muted">Pending</small>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="border rounded p-3 text-center">
                      <h4 className="text-primary mb-1">{feeStats?.collectionRate ?? 0}%</h4>
                      <small className="text-muted">Collection Rate</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fees Pie + Exam Stats */}
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Exam Overview</h5>
              <Link to="/dashboard/principal/exams" className="btn btn-sm btn-outline-primary">View Exams</Link>
            </div>
            <div className="card-body">
              {examStats ? (
                <div className="row g-3">
                  {[
                    { label: 'Total Exams', value: examStats.totalExams, color: 'primary', icon: 'ti ti-file-text' },
                    { label: 'Upcoming', value: examStats.upcoming, color: 'warning', icon: 'ti ti-calendar-event' },
                    { label: 'Completed', value: examStats.completed, color: 'success', icon: 'ti ti-circle-check' },
                    { label: 'Avg Score', value: examStats.avgScore ? `${examStats.avgScore}%` : 'N/A', color: 'info', icon: 'ti ti-award' },
                  ].map((e, i) => (
                    <div key={i} className="col-6">
                      <div className={`border border-${e.color} rounded p-3 text-center`}>
                        <i className={`${e.icon} fs-24 text-${e.color} mb-1 d-block`}></i>
                        <h4 className={`text-${e.color} mb-1`}>{e.value}</h4>
                        <small className="text-muted">{e.label}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
                  <i className="ti ti-file-text fs-1 text-muted mb-2"></i>
                  <p className="text-muted mb-1">No exam data available</p>
                  <Link to="/dashboard/principal/exams" className="btn btn-sm btn-primary mt-2">
                    <i className="ti ti-plus me-1" />Create Exam
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary from API */}
      {analyticsSummary && (
        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Platform Summary</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {Object.entries(analyticsSummary).slice(0, 8).map(([key, val]: [string, any], i) => (
                    typeof val === 'number' && (
                      <div key={i} className="col-xl-3 col-sm-6">
                        <div className="border rounded p-3 text-center">
                          <h4 className="mb-1" style={{ color: COLORS[i % COLORS.length] }}>{val}</h4>
                          <small className="text-muted text-capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</small>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Quick Navigation</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {[
              { label: 'Student Report', to: '/dashboard/principal/students', icon: 'ti ti-users', color: 'primary' },
              { label: 'Attendance Report', to: '/dashboard/principal/attendance/student', icon: 'ti ti-calendar-check', color: 'success' },
              { label: 'Fee Report', to: '/dashboard/principal/fees-report', icon: 'ti ti-report-money', color: 'warning' },
              { label: 'Exam Results', to: '/dashboard/principal/exams/results', icon: 'ti ti-certificate', color: 'info' },
              { label: 'Teacher List', to: '/dashboard/principal/teachers', icon: 'ti ti-user-check', color: 'purple' },
              { label: 'Notice Board', to: '/dashboard/principal/notice-board', icon: 'ti ti-speakerphone', color: 'danger' },
            ].map((item, i) => (
              <div key={i} className="col-xl-2 col-md-3 col-sm-4 col-6">
                <Link to={item.to} className={`card border-0 border-bottom border-${item.color} border-2 animate-card text-decoration-none`}>
                  <div className="card-body text-center py-3">
                    <div className={`avatar avatar-md bg-${item.color} rounded mb-2 mx-auto`}>
                      <i className={`${item.icon} fs-18 text-white`}></i>
                    </div>
                    <p className="mb-0 text-dark" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{item.label}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrincipalAnalyticsPage
