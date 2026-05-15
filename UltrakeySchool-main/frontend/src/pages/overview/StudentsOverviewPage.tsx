import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

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
}

interface StudentKPI {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface StudentGrowth {
  year: string
  current: number
  lastYear: number
}

interface EnrollmentTrend {
  m: string
  v: number
}

interface GradeDistribution {
  grade: string
  students: number
  pct: string
  bar: string
}

interface AttendanceRate {
  lbl: string
  pct: string
  bar: string
  w: string
}


const StudentsOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/analytics/student-overview')
      
      console.log('Student Overview API Response:', response.data)
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('Student Overview loaded successfully')
      } else {
        console.error('API response structure:', response.data)
        setError('Invalid API response structure')
      }
    } catch (err: any) {
      console.error('Error fetching student overview:', err)
      setError(err.message || 'Failed to load student data')
      toast.error('Failed to load student data')
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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchStudentData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  // Transform backend data for UI - using empty arrays/objects as fallbacks
  const topStats: TopStat[] = dashboardData?.topStats || []
  const studentKPIs: StudentKPI[] = dashboardData?.studentKPIs || []
  const enrollmentData: StudentGrowth[] = dashboardData?.enrollmentData || []
  const enrollmentTrend: EnrollmentTrend[] = dashboardData?.enrollmentTrend || []
  const gradeDistribution: GradeDistribution[] = dashboardData?.gradeDistribution || []
  const attendanceRates: AttendanceRate[] = dashboardData?.attendanceRates || []

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ef4444']

  return (
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Overview</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/institution">Institute Admin</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Student Overview</li>
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

      {/* TOP STATISTICS */}
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
                    <h6 className="mb-1 text-truncate">{stat.label}</h6>
                    <h3 className="mb-0">{stat.value}</h3>
                    <p className="mb-0 text-muted">{stat.delta}</p>
                    <div className="d-flex align-items-center">
                      <small className="text-muted">{stat.active}</small>
                      <span className="mx-2">•</span>
                      <small className="text-muted">{stat.inactive}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* STUDENT KPIS */}
      <div className="row mb-4">
        {studentKPIs.map((kpi: StudentKPI) => (
          <div key={kpi.label} className="col-xl-3 col-lg-4 col-md-6 d-flex">
            <div className="card flex-fill animate-card border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className={`avatar avatar-xl ${kpi.avatarTone} me-2 p-1 flex-shrink-0`}>
                    <i className={`${kpi.icon} fs-20`}></i>
                  </div>
                  <div className="overflow-hidden flex-fill">
                    <h6 className="mb-1 text-truncate">{kpi.label}</h6>
                    <h3 className="mb-0">{kpi.value}</h3>
                    <p className="mb-0 text-muted">{kpi.delta}</p>
                    <div className="d-flex align-items-center">
                      <small className="text-muted">{kpi.active}</small>
                      <span className="mx-2">•</span>
                      <small className="text-muted">{kpi.inactive}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ENROLLMENT DATA */}
      <div className="row">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Enrollment Growth</h4>
              <div className="dropdown">
                <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                  <i className="ti ti-calendar me-2" />Last 6 Years
                </a>
                <ul className="dropdown-menu mt-2 p-3">
                  <li><a href="#" className="dropdown-item rounded-1">Last 6 Years</a></li>
                  <li><a href="#" className="dropdown-item rounded-1">Last 6 Months</a></li>
                </ul>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={enrollmentData} barSize={30} barGap={4}>
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="current" name="Current Year" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="lastYear" name="Last Year" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ENROLLMENT TREND */}
      <div className="row">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Admission Growth Trend (Monthly)</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={enrollmentTrend} barSize={20} barGap={4}>
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="v" name="New Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* GRADE DISTRIBUTION */}
      <div className="row">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Grade-wise Student Strength</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="students">
                   </Pie>
                   <Pie>
                     {gradeDistribution.map((_entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ATTENDANCE RATES */}
      <div className="row">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Attendance Rates by Grade</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceRates} barSize={40} barGap={4}>
                  <XAxis dataKey="lbl" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="pct" name="Attendance Rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="w" name="Attendance % (Weighted)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT MANAGEMENT SECTION */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Student Management</h4>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <i className="ti ti-user-graduate fs-48 text-muted mb-3 d-block" />
                <h5 className="text-muted">Student Management Dashboard</h5>
                <p className="text-muted">Comprehensive student management features will be available here.</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => fetchStudentData()}
                  >
                    <i className="ti ti-refresh me-1"></i>Refresh Data
                  </button>
                  <button className="btn btn-primary">
                    <i className="ti ti-user-plus me-1"></i>Add Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StudentsOverviewPage
