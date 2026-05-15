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

interface TeachingKPI {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface SubjectPerformance {
  subject: string
  avgScore: number
  passRate: number
  grade: string
  bar: string
}

interface ClassPerformance {
  name: string
  avgScore: number
  passRate: number
  pct: string
  bar: string
}

interface TeachingLoad {
  subject: string
  avgLoad: number
  maxLoad: number
  pct: string
}

const TeachersOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchTeachersData()
  }, [])

  const fetchTeachersData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/analytics/teachers-overview')
      
      console.log('Teachers Overview API Response:', response.data)
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('Teachers Overview loaded successfully')
      } else {
        console.error('API response structure:', response.data)
        setError('Invalid API response structure')
      }
    } catch (err: any) {
      console.error('Error fetching teachers overview:', err)
      setError(err.message || 'Failed to load teachers data')
      toast.error('Failed to load teachers data')
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
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchTeachersData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  // Transform backend data for UI - using empty arrays/objects as fallbacks
  const topStats: TopStat[] = dashboardData?.topStats || []
  const teachingKPIs: TeachingKPI[] = dashboardData?.teachingKPIs || []
  const subjectPerformance: SubjectPerformance[] = dashboardData?.subjectPerformance || []
  const classPerformance: ClassPerformance[] = dashboardData?.classPerformance || []
  const teachingLoad: TeachingLoad[] = dashboardData?.teachingLoad || []
  const teachersByDepartment = dashboardData?.teachersByDepartment || []

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ef4444']

  return (
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Teachers Overview</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/teachers">Teachers</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Teachers Overview</li>
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

      {/* TEACHING KPIS */}
      <div className="row mb-4">
        {teachingKPIs.map((kpi: TeachingKPI) => (
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

      {/* SUBJECT PERFORMANCE CHART */}
      <div className="row mb-4">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Subject Performance</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance} barSize={40} barGap={4}>
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgScore" name="Average Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* CLASS PERFORMANCE CHART */}
      <div className="row mb-4">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Class Performance</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformance} barSize={40} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgScore" name="Average Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* TEACHING LOAD CHART */}
      <div className="row mb-4">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Teaching Load</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teachingLoad} barSize={40} barGap={4}>
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgLoad" name="Average Load" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="maxLoad" name="Max Load" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* DEPARTMENTS DISTRIBUTION */}
      <div className="row">
        <div className="col-xl-4 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Departments Distribution</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                  <Pie
                    data={teachersByDepartment.map((dept: { department: any; count: any }, index: number) => ({
                      name: dept.department,
                      value: dept.count,
                      fill: COLORS[index % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value} teachers`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {teachersByDepartment.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TEACHERS */}
      <div className="row">
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Recent Teachers</h4>
            </div>
            <div className="card-body">
              {dashboardData?.recentTeachers?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Subject</th>
                        <th>Join Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentTeachers.map((teacher: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; email: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; department: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; subject: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; joinDate: string | number | Date; status: string }) => (
                        <tr key={teacher.id}>
                          <td>{teacher.name}</td>
                          <td>{teacher.email}</td>
                          <td>{teacher.department}</td>
                          <td>{teacher.subject}</td>
                          <td>{new Date(teacher.joinDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              teacher.status === 'active' ? 'bg-success' : 'bg-danger'
                            }`}>
                              {teacher.status === 'active' ? 'Active' : 
                                teacher.status === 'on_leave' ? 'On Leave' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="ti ti-chalkboard-off fs-24 mb-2"></i>
                  <p>No teacher data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TEACHER MANAGEMENT SECTION */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Teacher Management</h4>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <i className="ti ti-chalkboard-user fs-48 text-muted mb-3 d-block" />
                <h5 className="text-muted">Teacher Management Dashboard</h5>
                <p className="text-muted">Comprehensive teacher management features will be available here.</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => fetchTeachersData()}
                  >
                    <i className="ti ti-refresh me-1"></i>Refresh Data
                  </button>
                  <button className="btn btn-primary">
                    <i className="ti ti-user-plus me-1"></i>Add Teacher
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

export default TeachersOverviewPage
