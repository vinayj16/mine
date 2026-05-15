import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { toast } from 'react-toastify'
import { apiClient } from '../../../api/client'
import TopStatCard from '../../../components/dashboard/TopStatCard'

// Type definitions for API data
interface TopStat {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
  sub?: string
}

interface AdmissionKPI {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface AdmissionYearData {
  year: string
  current: number
  lastYear: number
}

interface AdmissionTrend {
  m: string
  v: number
}

interface GradeStrength {
  name: string
  value: number
}

interface DropoutData {
  grade: string
  rate: number
  bar: string
}

interface SeatOccupancy {
  grade: string
  pct: string
  bar: string
}

interface BoardExam {
  year: string
  school: number
  stateAvg: number
}

interface TopClass {
  name: string
  score: string
  pct: number
  bar: string
}

interface SubjectPerf {
  subject: string
  avgScore: number
  passRate: number
}

interface PerfTrend {
  m: string
  pass: number
}

interface AttPct {
  lbl: string
  pct: string
  bar: string
  w: string
}

interface StaffKPI {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface StaffAttByDept {
  dept: string
  att: number
}

interface StaffTurnover {
  year: string
  joined: number
  left: number
}

interface PerfRating {
  label: string
  pct: string
  w: string
  bar: string
}

interface Vacancy {
  dept: string
  pos: string
  since: string
  cls: string
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const InstituteAnalyticsDashboardPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('admissions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/analytics/institute-admin/dashboard')
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('Institute Analytics Dashboard loaded successfully')
      }
    } catch (err: any) {
      console.error('Error fetching institute analytics dashboard:', err)
      setError(err.message || 'Failed to load analytics data')
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchDashboardData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  // Transform backend data for UI - using empty arrays/objects as fallbacks
  const topStats: TopStat[] = dashboardData?.topStats || []
  const admissionKPIs: AdmissionKPI[] = dashboardData?.admissionKPIs || []
  const admissionsYearData: AdmissionYearData[] = dashboardData?.admissionsYearData || []
  const gradeStrength: GradeStrength[] = dashboardData?.gradeStrength || []
  const admissionTrend: AdmissionTrend[] = dashboardData?.admissionTrend || []
  const dropoutData: DropoutData[] = dashboardData?.dropoutData || []
  const seatOccupancy: SeatOccupancy[] = dashboardData?.seatOccupancy || []
  const boardExams: BoardExam[] = dashboardData?.boardExams || []
  const topClasses: TopClass[] = dashboardData?.topClasses || []
  const subjectPerf: SubjectPerf[] = dashboardData?.subjectPerf || []
  const perfTrend: PerfTrend[] = dashboardData?.perfTrend || []
  const attPct: AttPct[] = dashboardData?.attPct || []
  const staffKPIs: StaffKPI[] = dashboardData?.staffKPIs || []
  const staffAttByDept: StaffAttByDept[] = dashboardData?.staffAttByDept || []
  const staffTurnover: StaffTurnover[] = dashboardData?.staffTurnover || []
  const perfRating: PerfRating[] = dashboardData?.perfRating || []
  const vacancies: Vacancy[] = dashboardData?.vacancies || []

  const GRADE_COLORS = ['#6366f1','#10b981','#f59e0b','#06b6d4','#ef4444','#8b5cf6','#ec4899','#14b8a6']

  const sections = [
    { id: 'admissions', label: '② Admissions Overview'    },
    { id: 'academic',   label: '④ Academic Performance'   },
    { id: 'staff',      label: '⑤ Staff Overview'         },
  ]

  return (
    <>
      {/* ── PAGE HEADER ── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Institute Analytics Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/institution">Institute Admin</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Analytics</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <Link to="/reports/export" className="btn btn-primary d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-download me-1" />Export Report
          </Link>
          <Link to="/reports" className="btn btn-light d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-report me-1" />View All Reports
          </Link>
        </div>
      </div>

      {/* ── TOP STATISTICS ── */}
      <div className="row mb-3">
        {topStats.map((stat: TopStat) => (
          <div key={stat.label} className="col-xxl-3 col-xl-4 col-sm-6 d-flex">
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

      {/* ── SECTION NAV TABS ── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              <ul className="nav nav-pills flex-wrap gap-1">
                {sections.map((s: { id: string; label: string }) => (
                  <li key={s.id} className="nav-item">
                    <a
                      href="#"
                      className={`nav-link d-flex align-items-center ${activeSection === s.id ? 'active bg-primary text-white' : 'text-dark'}`}
                      style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8 }}
                      onClick={e => { e.preventDefault(); setActiveSection(s.id) }}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ① ADMISSIONS SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'admissions' && (
        <>
          {/* Admission KPI Cards */}
          <div className="row mb-4">
            {admissionKPIs.map((stat: AdmissionKPI) => (<TopStatCard key={stat.label} {...stat} />))}
          </div>

          {/* Admissions vs Last Year Bar + Grade-wise Pie */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Admissions vs Last Year</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />Last 6 Years</a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['Last 3 Years','Last 6 Years','All Time'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
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
                        {gradeStrength.map((_, i) => <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
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

          {/* New vs Renewal + Dropout + Seat Occupancy */}
          <div className="row">
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">New vs Renewal Students</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[{ name:'New Students', value: 37 },{ name:'Renewals', value: 63 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        <Cell fill="#6366f1" /><Cell fill="#e0e7ff" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Dropout Rate by Grade</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {dropoutData.map(d => (
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
            <div className="col-xxl-4 col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Seat Occupancy by Grade</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {seatOccupancy.map(s => (
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
          </div>
        </>
      )}

      {/* ══════════ ④ ACADEMIC PERFORMANCE ══════════ */}
      {activeSection === 'academic' && (
        <>
          {/* Pass % + Attendance % KPI row */}
          <div className="row mb-4">
            {[
              { label: 'Overall Pass %',         value: '91.4%', delta: '+2.1%',   deltaTone: 'bg-success', icon: '/assets/img/icons/subject.svg', active: 'This Year', inactive: 'Last Year', avatarTone: 'bg-success-transparent' },
              { label: 'Student Attendance %',   value: '94.2%', delta: '+0.8%',   deltaTone: 'bg-primary', icon: '/assets/img/icons/student.svg', active: 'This Term', inactive: 'Last Term', avatarTone: 'bg-primary-transparent' },
              { label: 'Teacher Attendance %',   value: '96.8%', delta: '+0.4%',   deltaTone: 'bg-info',    icon: '/assets/img/icons/teacher.svg', active: 'This Term', inactive: 'Last Term', avatarTone: 'bg-info-transparent'    },
              { label: 'Board Exam School Avg',  value: '91%',   delta: 'vs 76% State', deltaTone: 'bg-warning', icon: '/assets/img/icons/subject.svg', active: 'School Avg', inactive: 'State Avg', avatarTone: 'bg-warning-transparent' },
            ].map(s => <TopStatCard key={s.label} {...s} />)}
          </div>

          {/* Board Exam Comparison + Top Classes */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Board Exam Results – School vs State Average</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={boardExams} barSize={30} barGap={4}>
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[60,100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v,n) => [`${v}%`,n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="school"   name="Our School"    fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="stateAvg" name="State Average" fill="#e0e7ff" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Top Performing Classes</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {topClasses.map((c: TopClass, i: number) => (
                      <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="overflow-hidden me-2">
                          <p className="text-dark mb-1">{c.name}</p>
                          <div className="progress progress-xs flex-grow-1">
                            <div className={`progress-bar ${c.bar} rounded`} style={{ width: `${c.pct}%` }} />
                          </div>
                        </div>
                        <span className="badge bg-success flex-shrink-0">{c.score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise Performance + Performance Trend + Attendance % */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Subject-wise Performance</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-school-bell me-2" />Class X</a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['Class VIII','Class IX','Class X','Class XII'].map(c => <li key={c}><a href="#" className="dropdown-item rounded-1">{c}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={subjectPerf} barSize={18} barGap={4}>
                      <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v,n) => [`${v}%`,n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="avgScore" name="Avg Score %" fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="passRate"  name="Pass %"     fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-3 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Performance Trend</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={perfTrend}>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[75,95]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={v => [`${v}%`,'Pass %']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="pass" name="Pass %" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-3 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Average Attendance %</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {attPct.map((a: AttPct) => (
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
                    <div className="fs-12">School-wide attendance above 90% target this term.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════ ⑤ STAFF OVERVIEW ══════════ */}
      {activeSection === 'staff' && (
        <>
          {/* Staff KPI Cards */}
          <div className="row mb-4">
            {staffKPIs.map((stat: StaffKPI) => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Staff Attendance by Dept (horizontal bar) + Turnover */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Staff Attendance by Department</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={staffAttByDept} barSize={28} layout="vertical">
                      <XAxis type="number" domain={[80,100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip formatter={v => [`${v}%`,'Attendance']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="att" name="Attendance %" fill="#6366f1" radius={[0,6,6,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Staff Turnover – Joined vs Left</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={staffTurnover} barSize={22} barGap={4}>
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="joined" name="Joined" fill="#10b981" radius={[6,6,0,0]} />
                      <Bar dataKey="left"   name="Left"   fill="#ef4444" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Rating + Open Vacancies */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Performance Rating Summary</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {perfRating.map((r: PerfRating) => (
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
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Open Vacancies</h4></div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr><th>Department</th><th>Position</th><th>Open Since</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {vacancies.map((v: Vacancy) => (
                          <tr key={v.pos}>
                            <td>{v.dept}</td>
                            <td>{v.pos}</td>
                            <td>{v.since}</td>
                            <td><span className={`badge ${v.cls}`}>Open</span></td>
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
    </>
  )
}

export default InstituteAnalyticsDashboardPage
