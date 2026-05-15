/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { toast } from 'react-toastify'
import { apiClient } from '../../../api/client'

const HRDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [leaveModal, setLeaveModal] = useState<any>(null)
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
      
      const response = await apiClient.get('/hr/dashboard')
      
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

  const navSections = [
    { id: 'overview',     label: 'Overview',     icon: 'ti ti-layout-dashboard' },
    { id: 'recruitment',  label: 'Recruitment',  icon: 'ti ti-user-plus'        },
    { id: 'employees',    label: 'Employees',    icon: 'ti ti-users'            },
    { id: 'payroll',      label: 'Payroll',      icon: 'ti ti-currency-dollar'  },
    { id: 'attendance',   label: 'Attendance',   icon: 'ti ti-calendar-check'   },
    { id: 'performance',  label: 'Performance',  icon: 'ti ti-chart-line'       },
    { id: 'training',     label: 'Training',     icon: 'ti ti-school'           },
    { id: 'compliance',   label: 'Compliance',   icon: 'ti ti-shield-check'     },
    { id: 'welfare',      label: 'Welfare',      icon: 'ti ti-heart'            },
    { id: 'analytics',    label: 'Analytics',    icon: 'ti ti-chart-bar'        },
  ]

  return (
    <>
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

      {activeSection === 'recruitment' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Recruitment section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {activeSection === 'employees' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Employees section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {activeSection === 'payroll' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Payroll section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {activeSection === 'attendance' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Attendance section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

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

      {activeSection === 'training' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Training section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {activeSection === 'compliance' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Compliance section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {activeSection === 'welfare' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Welfare section data will be displayed here from backend
            </div>
          </div>
        </div>
      )}

      {activeSection === 'analytics' && (
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              Analytics section data will be displayed here from backend
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
