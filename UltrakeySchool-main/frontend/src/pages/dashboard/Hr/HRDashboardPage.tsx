/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { toast } from 'react-toastify'
import { apiClient } from '../../../api/client'
import { useAuth } from '../../../store/authStore'
import InstitutionDetailsCard from '../../../components/dashboard/InstitutionDetailsCard'

const HRDashboard: React.FC = () => {
  const { user, institutionData } = useAuth();
  const [activeSection, setActiveSection] = useState('overview')
  const [leaveModal, setLeaveModal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeFilterDept, setEmployeeFilterDept] = useState('All')
  const [recruitmentSearch, setRecruitmentSearch] = useState('')

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/hrm/dashboard')
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('HR Dashboard data loaded successfully')
      }
    } catch (err: any) {
      console.error('Error fetching HR dashboard:', err)
      setError(err.message || 'Failed to load HR dashboard data')
      toast.error('Failed to load HR dashboard data')
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
  const quickActions = dashboardData?.quickActions || []
  const hrOverviewStats = dashboardData?.hrOverviewStats || []
  const headcountTrend = dashboardData?.headcountTrend || []
  const departmentWiseEmployees = dashboardData?.departmentWiseEmployees || []
  const leaveRequests = dashboardData?.leaveRequests || []
  const upcomingInterviews = dashboardData?.upcomingInterviews || []
  const newJoiners = dashboardData?.newJoiners || []

  const recruitmentList = dashboardData?.recruitmentList || []
  const employeesList = dashboardData?.employeesList || []
  const payrollList = dashboardData?.payrollList || []
  const attendanceStats = dashboardData?.attendanceStats || {}
  const attendanceCheckIns = dashboardData?.attendanceCheckIns || []
  const reviewList = dashboardData?.reviewList || []
  const trainingList = dashboardData?.trainingList || []
  const complianceData = dashboardData?.complianceData || {}
  const welfarePrograms = dashboardData?.welfarePrograms || []
  const analyticsData = dashboardData?.analyticsData || {}

  const navSections = [
    { id: 'overview',     label: 'Overview',     icon: 'ti ti-layout-dashboard' },
    { id: 'recruitment',  label: 'Recruitment',  icon: 'ti ti-user-plus'        },
    { id: 'employees',    label: 'Employees',    icon: 'ti ti-users'            },
    { id: 'payroll',      label: 'Payroll',      icon: 'ti ti-currency-rupee'  },
    { id: 'attendance',   label: 'Attendance',   icon: 'ti ti-calendar-check'   },
    { id: 'performance',  label: 'Performance',  icon: 'ti ti-chart-line'       },
    { id: 'training',     label: 'Training',     icon: 'ti ti-school'           },
    { id: 'compliance',   label: 'Compliance',   icon: 'ti ti-shield-check'     },
    { id: 'welfare',      label: 'Welfare',      icon: 'ti ti-heart'            },
    { id: 'inventory',    label: 'Inventory',    icon: 'ti ti-package'          },
    { id: 'analytics',    label: 'Analytics',    icon: 'ti ti-chart-bar'        },
  ]

  return (
    <>
      <InstitutionDetailsCard 
        institution={institutionData || user?.institutionData}
        userRole={user?.role}
      />
      {/* ── PAGE HEADER ── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">HR Management Dashboard</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Human Resources</li>
          </ol></nav>
        </div>
        {/* Quick Action Buttons */}
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          {quickActions.map((q: any) => (
            <Link key={q.label} to={q.to} className={`btn ${q.bg} text-white d-flex align-items-center`} style={{ fontSize: 13 }}>
              <i className={`${q.icon} me-1`} />{q.label}
            </Link>
          ))}
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

      {/* ══════════════════════════════════════════════════════════════════════
          ① HR OVERVIEW SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <>
          {/* Overview Summary Cards */}
          <div className="row">
            {hrOverviewStats.map((stat: any) => (
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

          {/* Headcount Trend + Department Distribution */}
          <div className="row mt-2">
            <div className="col-xxl-8 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Employee Headcount Trend</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-1" />This Year</a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['This Year','Last Year','Last 6 Months'].map((o: any) => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={headcountTrend}>
                      <defs>
                        <linearGradient id="colorTeaching" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNonTeaching" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="teaching" name="Teaching Staff" stroke="#6366f1" fillOpacity={1} fill="url(#colorTeaching)" />
                      <Area type="monotone" dataKey="nonTeaching" name="Non-Teaching Staff" stroke="#10b981" fillOpacity={1} fill="url(#colorNonTeaching)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Department-wise Distribution</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={departmentWiseEmployees.slice(0,6)} layout="vertical" barSize={18}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="teaching" name="Teaching" fill="#6366f1" stackId="a" radius={[0,0,0,0]} />
                      <Bar dataKey="nonTeaching" name="Non-Teaching" fill="#10b981" stackId="a" radius={[0,6,6,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="row">
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Pending Leave Requests</h4>
                  <span className="badge bg-warning">{leaveRequests.filter((l: any) => l.status === 'Pending').length} Pending</span>
                </div>
                <div className="card-body">
                  {leaveRequests.filter((l: any) => l.status === 'Pending').slice(0,3).map((lr: any, i: number) => (
                    <div key={i} className={`border rounded p-3 ${i < 2 ? 'mb-3' : 'mb-0'}`}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center overflow-hidden">
                          <span className="avatar avatar-sm flex-shrink-0 me-2"><img src={lr.avatar} alt="p" className="rounded-circle" /></span>
                          <div className="overflow-hidden">
                            <h6 className="mb-0 text-truncate" style={{ fontSize: 13 }}>{lr.employee}</h6>
                            <small className="text-muted">{lr.type} Leave</small>
                          </div>
                        </div>
                        <span className={`badge ${lr.cls2}`}>{lr.days} days</span>
                      </div>
                      <p className="mb-2 text-muted" style={{ fontSize: 12 }}>{lr.from} to {lr.to}</p>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success flex-fill" onClick={() => setLeaveModal(lr)}>✓ Approve</button>
                        <button className="btn btn-sm btn-danger flex-fill">✗ Reject</button>
                      </div>
                    </div>
                  ))}
                  <Link to="/hr/leave/requests" className="btn btn-light btn-sm w-100 mt-3">View All Requests</Link>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Upcoming Interviews</h4>
                  <Link to="/hr/recruitment/interviews" className="fw-medium">View All</Link>
                </div>
                <div className="card-body">
                  {upcomingInterviews.slice(0,3).map((int: any, i: number) => (
                    <div key={i} className={`d-flex align-items-start ${i < 2 ? 'mb-3' : 'mb-0'}`}>
                      <span className="avatar avatar-sm flex-shrink-0 me-2"><img src={int.avatar} alt="p" className="rounded-circle" /></span>
                      <div className="overflow-hidden flex-fill">
                        <h6 className="mb-0 text-truncate" style={{ fontSize: 13 }}>{int.candidate}</h6>
                        <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{int.position}</p>
                        <small className="text-primary fw-semibold">{int.date}</small>
                      </div>
                      <span className={`badge ${int.cls2} flex-shrink-0`}>{int.status}</span>
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm w-100 mt-3">
                    <i className="ti ti-calendar-plus me-1" />Schedule Interview
                  </button>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">New Joiners Onboarding</h4>
                  <span className="badge bg-info">{newJoiners.length} Active</span>
                </div>
                <div className="card-body">
                  {newJoiners.slice(0,3).map((nj: any, i: number) => (
                    <div key={i} className={`d-flex align-items-start ${i < 2 ? 'mb-3' : 'mb-0'}`}>
                      <span className="avatar avatar-sm flex-shrink-0 me-2"><img src={nj.avatar} alt="p" className="rounded-circle" /></span>
                      <div className="overflow-hidden flex-fill">
                        <h6 className="mb-0 text-truncate" style={{ fontSize: 13 }}>{nj.name}</h6>
                        <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{nj.position}</p>
                        <small className="text-muted">Joined: {nj.joinDate}</small>
                      </div>
                      <span className={`badge ${nj.cls2} flex-shrink-0`}>{nj.status}</span>
                    </div>
                  ))}
                  <Link to="/hr/employees/onboarding" className="btn btn-light btn-sm w-100 mt-3">View All</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title"><i className="ti ti-alert-triangle me-2 text-danger" />HR Critical Alerts</h4>
                  <span className="badge bg-danger">5 Urgent</span>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {[
                      { type: 'danger',  icon: 'ti ti-briefcase',       title: 'Critical Positions Open',     desc: '5 critical teaching positions vacant for 30+ days'         },
                      { type: 'warning', icon: 'ti ti-file-alert',      title: 'Documents Pending',           desc: '32 employees have pending document submissions'            },
                      { type: 'danger',  icon: 'ti ti-certificate-off', title: 'Expired Certificates',        desc: '8 employees have expired medical/teaching certificates'    },
                      { type: 'warning', icon: 'ti ti-users-minus',     title: 'Upcoming Retirements',        desc: '4 senior faculty members retiring within 6 months'         },
                      { type: 'info',    icon: 'ti ti-calendar-check',  title: 'Reviews Overdue',             desc: '12 performance reviews are overdue by more than 2 weeks'   },
                    ].map((a: any, i: number) => (
                      <div key={i} className="col-xxl col-md-6">
                        <div className={`alert alert-${a.type} d-flex align-items-start mb-0`} role="alert">
                          <i className={`${a.icon} fs-18 me-2 flex-shrink-0 mt-1`} />
                          <div className="flex-fill">
                            <div className="fw-semibold mb-1">{a.title}</div>
                            <div style={{ fontSize: 12 }}>{a.desc}</div>
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

      {/* Additional sections would continue here with similar patterns */}
      {/* For brevity, showing structure for other sections */}

      {/* ══════════════════════════════════════════════════════════════════════
          ② RECRUITMENT SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'recruitment' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Recruitment Metrics */}
          <div className="col-md-4 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted mb-1" style={{ fontSize: 13 }}>Active Job Openings</h6>
                    <h3>{recruitmentList.length}</h3>
                  </div>
                  <span className="avatar avatar-lg bg-primary-transparent"><i className="ti ti-briefcase text-primary fs-24" /></span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted mb-1" style={{ fontSize: 13 }}>Total Applications</h6>
                    <h3>{recruitmentList.reduce((acc: number, r: any) => acc + (r.applicantsCount || 0), 0)}</h3>
                  </div>
                  <span className="avatar avatar-lg bg-success-transparent"><i className="ti ti-user-plus text-success fs-24" /></span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted mb-1" style={{ fontSize: 13 }}>Avg. Applicants / Post</h6>
                    <h3>{recruitmentList.length > 0 ? (recruitmentList.reduce((acc: number, r: any) => acc + (r.applicantsCount || 0), 0) / recruitmentList.length).toFixed(1) : 0}</h3>
                  </div>
                  <span className="avatar avatar-lg bg-info-transparent"><i className="ti ti-chart-line text-info fs-24" /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Postings Table */}
          <div className="col-md-12 mt-2">
            <div className="card border-0 shadow-sm">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h4 className="card-title">Institution Recruitment Listings</h4>
                <div className="d-flex gap-2">
                  <div className="input-group input-group-sm" style={{ width: 220 }}>
                    <span className="input-group-text bg-white border-end-0"><i className="ti ti-search text-muted" /></span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search jobs..."
                      value={recruitmentSearch}
                      onChange={e => setRecruitmentSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Job Title</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Type</th>
                        <th>Monthly Salary</th>
                        <th>Applicants</th>
                        <th>Status</th>
                        <th>Posted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recruitmentList.filter((r: any) => r.title?.toLowerCase().includes(recruitmentSearch.toLowerCase())).map((r: any) => (
                        <tr key={r.id}>
                          <td className="fw-semibold text-dark">{r.title}</td>
                          <td className="text-capitalize">{r.department}</td>
                          <td>{r.designation}</td>
                          <td>
                            <span className="badge bg-secondary-transparent text-secondary text-capitalize">{r.type}</span>
                          </td>
                          <td className="fw-bold text-success">₹{(r.salary || 0).toLocaleString()}</td>
                          <td>
                            <span className="badge bg-info-transparent text-info fw-bold">{r.applicantsCount} Applied</span>
                          </td>
                          <td>
                            <span className={`badge ${r.status === 'published' ? 'bg-success-transparent text-success' : 'bg-warning-transparent text-warning'} text-capitalize`}>
                              {r.status}
                            </span>
                          </td>
                          <td>{new Date(r.postedDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {recruitmentList.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-4">No job postings found for this institution.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ③ EMPLOYEES SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'employees' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Employee Directory Filter Toolbar */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="input-group input-group-sm" style={{ width: 250 }}>
                    <span className="input-group-text bg-white border-end-0"><i className="ti ti-search text-muted" /></span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by name, email..."
                      value={employeeSearch}
                      onChange={e => setEmployeeSearch(e.target.value)}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted fw-semibold">Department:</small>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 160 }}
                      value={employeeFilterDept}
                      onChange={e => setEmployeeFilterDept(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      {Array.from(new Set(employeesList.map((e: any) => e.department))).map((dept: any) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <h6 className="text-muted mb-0">{employeesList.length} Active Employees</h6>
              </div>
            </div>
          </div>

          {/* Employees Roster Table */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Phone</th>
                        <th>Date Joined</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesList
                        .filter((e: any) => {
                          const matchSearch = e.name?.toLowerCase().includes(employeeSearch.toLowerCase()) || e.email?.toLowerCase().includes(employeeSearch.toLowerCase());
                          const matchDept = employeeFilterDept === 'All' || e.department === employeeFilterDept;
                          return matchSearch && matchDept;
                        })
                        .map((e: any) => (
                          <tr key={e.id}>
                            <td className="fw-bold text-primary">#{e.employeeId}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-sm me-2 bg-light rounded-circle text-dark fw-bold d-flex justify-content-center align-items-center">
                                  {e.name?.charAt(0)}
                                </span>
                                <div>
                                  <h6 className="mb-0 text-dark" style={{ fontSize: 13 }}>{e.name}</h6>
                                  <small className="text-muted">{e.email}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-capitalize">{e.department}</td>
                            <td>{e.designation}</td>
                            <td>{e.phone}</td>
                            <td>{new Date(e.joiningDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${e.status === 'active' ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'} text-capitalize`}>
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {employeesList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">No employees registered under this institution.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ④ PAYROLL SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'payroll' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Payroll Stats */}
          <div className="col-md-6 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-header pb-0 border-0"><h4 className="card-title">Payroll Costs breakdown</h4></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={payrollList}>
                    <XAxis dataKey="employeeName" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="basicSalary" name="Basic Pay" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netSalary" name="Net Payout" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-md-6 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-header border-0 pb-0"><h4 className="card-title">Salary Outgo Summary</h4></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted mb-1" style={{ fontSize: 12 }}>Total Net Payout</h6>
                      <h4 className="text-success mb-0">₹{payrollList.reduce((acc: number, p: any) => acc + (p.netSalary || 0), 0).toLocaleString()}</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted mb-1" style={{ fontSize: 12 }}>Total Transactions</h6>
                      <h4 className="text-primary mb-0">{payrollList.length} Pay slips</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted mb-1" style={{ fontSize: 12 }}>Settled Slips</h6>
                      <h4 className="text-info mb-0">{payrollList.filter((p: any) => p.status === 'Paid').length} Paid</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted mb-1" style={{ fontSize: 12 }}>Processing Slips</h6>
                      <h4 className="text-warning mb-0">{payrollList.filter((p: any) => p.status !== 'Paid').length} Pending</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary List */}
          <div className="col-md-12 mt-2">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-bottom-0"><h4 className="card-title">Monthly Payroll Runs</h4></div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Basic Salary</th>
                        <th>Net Salary</th>
                        <th>Payment Month</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollList.map((p: any) => (
                        <tr key={p.id}>
                          <td className="fw-semibold text-dark">{p.employeeName}</td>
                          <td className="text-capitalize">{p.department}</td>
                          <td>₹{(p.basicSalary || 0).toLocaleString()}</td>
                          <td className="fw-bold text-success">₹{(p.netSalary || 0).toLocaleString()}</td>
                          <td>{p.month}</td>
                          <td>
                            <span className={`badge ${
                              p.status === 'Paid' ? 'bg-success-transparent text-success' :
                              p.status === 'Processing' ? 'bg-warning-transparent text-warning' :
                              'bg-danger-transparent text-danger'
                            }`}>
                              {p.status}
                            </span>
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑤ ATTENDANCE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'attendance' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Stats Bar */}
          <div className="col-md-12 mb-3">
            <div className="row g-3">
              {[
                { label: 'Attendance Rate', value: `${attendanceStats?.attendanceRate || 0}%`, color: 'bg-primary-transparent text-primary', icon: 'ti ti-checkbox' },
                { label: 'Present Today', value: attendanceStats?.present || 0, color: 'bg-success-transparent text-success', icon: 'ti ti-user-check' },
                { label: 'Late Submissions', value: attendanceStats?.late || 0, color: 'bg-warning-transparent text-warning', icon: 'ti ti-clock' },
                { label: 'Absent Today', value: attendanceStats?.absent || 0, color: 'bg-danger-transparent text-danger', icon: 'ti ti-user-minus' },
                { label: 'Approved Leave', value: attendanceStats?.onLeave || 0, color: 'bg-info-transparent text-info', icon: 'ti ti-calendar' },
              ].map((s, idx) => (
                <div key={idx} className="col">
                  <div className="card border-0 shadow-sm mb-0">
                    <div className="card-body p-3 d-flex align-items-center">
                      <span className={`avatar avatar-md me-2 ${s.color}`}><i className={s.icon} /></span>
                      <div>
                        <small className="text-muted d-block">{s.label}</small>
                        <h4 className="mb-0">{s.value}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily roster logs */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-bottom-0"><h4 className="card-title">Today's Check-in Feed</h4></div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Shift Roster</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceCheckIns.map((att: any, idx: number) => (
                        <tr key={idx}>
                          <td className="fw-semibold text-dark">{att.employeeName}</td>
                          <td>09:00 AM - 05:00 PM</td>
                          <td>{att.checkIn}</td>
                          <td>{att.checkOut}</td>
                          <td>
                            <span className={`badge ${att.status === 'present' ? 'bg-success-transparent text-success' : 'bg-warning-transparent text-warning'} text-capitalize`}>
                              {att.status}
                            </span>
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑥ PERFORMANCE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'performance' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Reviews list */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-bottom-0 d-flex align-items-center justify-content-between">
                <h4 className="card-title">Employee Performance Audits</h4>
                <span className="badge bg-primary">{reviewList.length} Total Cycles</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Assigned Reviewer</th>
                        <th>Period</th>
                        <th>Overall Rating</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewList.map((r: any) => (
                        <tr key={r.id}>
                          <td className="fw-semibold text-dark">{r.employeeName}</td>
                          <td>{r.reviewerName}</td>
                          <td>{r.reviewPeriod}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <i key={i} className={`ti ti-star-filled fs-12 ${i < r.rating ? 'text-warning' : 'text-muted'}`} />
                              ))}
                              <small className="ms-1 fw-bold">({r.rating}.0)</small>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              r.status === 'reviewed' || r.status === 'acknowledged' ? 'bg-success-transparent text-success' :
                              r.status === 'submitted' ? 'bg-primary-transparent text-primary' : 'bg-warning-transparent text-warning'
                            } text-capitalize`}>
                              {r.status}
                            </span>
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑦ TRAINING SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'training' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Active programs */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-bottom-0"><h4 className="card-title">Professional Training & Growth Programs</h4></div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Course Title</th>
                        <th>Category</th>
                        <th>Delivery Type</th>
                        <th>Schedule Dates</th>
                        <th>Staff Enrolled</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingList.map((t: any) => (
                        <tr key={t.id}>
                          <td className="fw-semibold text-dark">{t.title}</td>
                          <td className="text-capitalize">
                            <span className={`badge ${
                              t.category === 'technical' ? 'bg-primary-transparent text-primary' :
                              t.category === 'soft-skills' ? 'bg-purple-transparent text-purple' :
                              'bg-warning-transparent text-warning'
                            }`}>
                              {t.category}
                            </span>
                          </td>
                          <td className="text-capitalize">{t.type}</td>
                          <td>{t.schedule}</td>
                          <td>
                            <span className="badge bg-info-transparent text-info fw-bold">{t.enrolledCount} Staff</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              t.status === 'active' ? 'bg-success-transparent text-success' :
                              t.status === 'completed' ? 'bg-secondary-transparent text-secondary' :
                              'bg-warning-transparent text-warning'
                            } text-capitalize`}>
                              {t.status}
                            </span>
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑧ COMPLIANCE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'compliance' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Stats card */}
          <div className="col-md-4 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-body text-center d-flex flex-column align-items-center justify-content-center">
                <div className="progress-ring-wrapper position-relative mb-2">
                  <h3 className="mb-0 text-success">{complianceData?.complianceScore || 0}%</h3>
                </div>
                <h6>Compliance Health Index</h6>
                <small className="text-muted">Mandatory Document Audits completed</small>
              </div>
            </div>
          </div>

          <div className="col-md-8 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-header border-0 pb-0"><h4 className="card-title">Document Audit Status</h4></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="border rounded p-3 text-center">
                      <h5 className="text-success mb-1">{complianceData?.mandatorySubmitted || 0}</h5>
                      <small className="text-muted">Verified & Verified</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3 text-center">
                      <h5 className="text-warning mb-1">{complianceData?.mandatoryPending || 0}</h5>
                      <small className="text-muted">Pending Verification</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3 text-center">
                      <h5 className="text-danger mb-1">{complianceData?.mandatoryMissing || 0}</h5>
                      <small className="text-muted">Missing Documents</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="col-md-12 mt-2">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-bottom-0"><h4 className="card-title">Recent Document Submissions</h4></div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Document Class</th>
                        <th>Status</th>
                        <th>Date Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceData?.recentSubmissions?.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td className="fw-semibold text-dark">{s.employeeName}</td>
                          <td>{s.documentType}</td>
                          <td>
                            <span className={`badge ${s.status === 'verified' ? 'bg-success-transparent text-success' : 'bg-warning-transparent text-warning'} text-capitalize`}>
                              {s.status}
                            </span>
                          </td>
                          <td>{new Date(s.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑨ WELFARE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'welfare' && (
        <div className="row animate__animated animate__fadeIn">
          {welfarePrograms.map((w: any) => (
            <div key={w.id} className="col-md-4 d-flex">
              <div className="card flex-fill border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-primary-transparent text-primary text-capitalize">{w.type}</span>
                    <span className="badge bg-success">{w.status}</span>
                  </div>
                  <h5 className="card-title text-dark">{w.title}</h5>
                  <p className="card-text text-muted mb-2" style={{ fontSize: 13 }}>
                    <i className="ti ti-users me-1" /><strong>Eligible Cover:</strong> {w.coverage}
                  </p>
                  {w.provider && (
                    <p className="card-text text-muted mb-0" style={{ fontSize: 13 }}>
                      <i className="ti ti-shield-check me-1" /><strong>Provider:</strong> {w.provider}
                    </p>
                  )}
                  {w.budget && (
                    <p className="card-text text-muted mb-0" style={{ fontSize: 13 }}>
                      <i className="ti ti-currency-rupee me-1" /><strong>Welfare Budget:</strong> ₹{w.budget.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑩ INVENTORY SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'inventory' && (
        <div className="row animate__animated animate__fadeIn">
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title">Inventory Management</h4>
                <Link to="/hr/inventory" className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1" />Add Item
                </Link>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover table-center mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <i className="ti ti-package fs-1 text-muted mb-3"></i>
                          <p className="text-muted">Inventory management is available in the dedicated Inventory page</p>
                          <Link to="/hr/inventory" className="btn btn-primary btn-sm">
                            Go to Inventory Page
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ⑪ ANALYTICS SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'analytics' && (
        <div className="row animate__animated animate__fadeIn">
          {/* Demographic Breakdown */}
          <div className="col-md-6 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-header pb-0 border-0"><h4 className="card-title">Employee Age Distribution</h4></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analyticsData?.ageDistribution || []}>
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-md-6 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-header border-0 pb-0"><h4 className="card-title">Demographic Key Metrics</h4></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted mb-1" style={{ fontSize: 12 }}>Institution Attrition Rate</h6>
                      <h4 className="text-danger mb-0">{analyticsData?.attritionRate || 0}%</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted mb-1" style={{ fontSize: 12 }}>Avg. Recruitment Cost</h6>
                      <h4 className="text-primary mb-0">₹{(analyticsData?.recruitmentCost || 0).toLocaleString()}</h4>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="border rounded p-3">
                      <h6 className="text-muted mb-2 text-center" style={{ fontSize: 12 }}>Gender Diversity ratio</h6>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <small className="fw-semibold">Female ({analyticsData?.genderRatio?.female || 0}%)</small>
                        <small className="fw-semibold">Male ({analyticsData?.genderRatio?.male || 0}%)</small>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div className="progress-bar bg-pink" style={{ width: `${analyticsData?.genderRatio?.female || 50}%` }} />
                        <div className="progress-bar bg-primary" style={{ width: `${analyticsData?.genderRatio?.male || 50}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Approval Modal */}
      {leaveModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Approve Leave Request</h5>
                <button type="button" className="btn-close" onClick={() => setLeaveModal(null)} />
              </div>
              <div className="modal-body">
                <p><strong>Employee:</strong> {leaveModal.employee}</p>
                <p><strong>Type:</strong> <span className={`badge ${leaveModal.cls2}`}>{leaveModal.type}</span></p>
                <p><strong>Days:</strong> {leaveModal.days}</p>
                <p><strong>Dates:</strong> {leaveModal.from} to {leaveModal.to}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={() => setLeaveModal(null)}>Reject</button>
                <button type="button" className="btn btn-secondary" onClick={() => setLeaveModal(null)}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={() => setLeaveModal(null)}>✓ Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HRDashboard
