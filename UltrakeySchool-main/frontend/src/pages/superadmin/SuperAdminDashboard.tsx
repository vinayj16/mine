import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts'
import TopStatCard from '../../components/dashboard/TopStatCard'
import superAdminService, { type Institution, type ExpiryAlert, type OverduePayment } from '../../services/superAdminService'

// Add custom styles for hover effects
const customStyles = `
  .category-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }
  .category-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6 !important;
  }
  .hover-lift:hover {
    transform: translateY(-2px);
  }
`
// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6']

// ─── DYNAMIC TOP STATS ───────────────────────────────────────────────────────
const getTopStats = (institutions: Institution[], monthlyRev: number, totalStudents: number, expiringIn7: number, agentAnalytics?: any) => [
  { 
    label:'Total Institutions', 
    value:institutions.length.toString(),      
    delta:'+0%',  
    deltaTone:'bg-primary',  
    icon:'/assets/img/icons/student.svg',  
    active:`${institutions.filter(i => i.status === 'Active').length} Active`,    
    inactive:`${institutions.length - institutions.filter(i => i.status === 'Active').length} Inactive`, 
    avatarTone:'bg-primary-transparent'    
  },
  { 
    label:'Monthly Revenue',    
    value:`₹${monthlyRev.toLocaleString()}`, 
    delta:'+0%',   
    deltaTone:'bg-success', 
    icon:'/assets/img/icons/teacher.svg',  
    active:`₹${monthlyRev.toLocaleString()} Paid`,  
    inactive:`₹${Math.floor(monthlyRev * 0.25).toLocaleString()} Due`, 
    avatarTone:'bg-success-transparent' 
  },
  { 
    label:'Total Agents',        
    value:agentAnalytics?.totalAgents?.toString() || '0',   
    delta:'+0%',  
    deltaTone:'bg-info', 
    icon:'/assets/img/icons/staff.svg',    
    active:agentAnalytics ? `${agentAnalytics.globalAgents || 0} Global` : '0 Global', 
    inactive:agentAnalytics ? `${agentAnalytics.institutionSpecificAgents || 0} Institution` : '0 Institution', 
    avatarTone:'bg-info-transparent'   
  },
  { 
    label:'Total Students',        
    value:totalStudents.toLocaleString(),   
    delta:'+0%',  
    deltaTone:'bg-warning', 
    icon:'/assets/img/icons/staff.svg',    
    active:totalStudents > 0 ? Math.floor(totalStudents * 0.9).toLocaleString() + ' Active' : '0 Active', 
    inactive:Math.floor(totalStudents * 0.1).toLocaleString() + ' Idle', 
    avatarTone:'bg-warning-transparent'   
  },
  { 
    label:'Active Plans',       
    value:institutions.filter(i => i.status === 'Active').length.toString(),      
    delta:'+0%',   
    deltaTone:'bg-secondary', 
    icon:'/assets/img/icons/subject.svg',  
    active:`${institutions.filter(i => i.status === 'Active').length} Running`,   
    inactive:expiringIn7 + ' Expiring', 
    avatarTone:'bg-secondary-transparent'   
  },
]

// ─── DYNAMIC REVENUE DATA ─────────────────────────────────────────────────────
const getRevenueData = (analyticsData: any, institutions: Institution[]) => {
  return (analyticsData.revenue?.monthly || []).map((m: any, i: number) => ({
    month: m.month || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    revenue: m.revenue || 0,
    registrations: m.registrations || institutions.length / 12
  }))
}


// ─── HELPERS ─────────────────────────────────────────────────────────────────
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - new Date().getTime()) / 86400000)


// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
const quickActions = [
  { to:'/super-admin/institutions', label:'Manage Institutions', icon:'ti ti-building',     bg:'bg-warning-transparent',   iconBg:'bg-warning',   hoverCls:'warning-btn-hover'   },
  { to:'/super-admin/memberships',  label:'Membership Plans',    icon:'ti ti-crown',        bg:'bg-success-transparent',   iconBg:'bg-success',   hoverCls:'success-btn-hover'   },
  { to:'/super-admin/transactions', label:'Transactions',        icon:'ti ti-report-money', bg:'bg-danger-transparent',    iconBg:'bg-danger',    hoverCls:'danger-btn-hover'    },
  { to:'/super-admin/tickets',      label:'Support Tickets',     icon:'ti ti-ticket',       bg:'bg-secondary-transparent', iconBg:'bg-secondary', hoverCls:'secondary-btn-hover' },
]

// ─── QUICK LINKS ─────────────────────────────────────────────────────────────
const quickLinks = [
  { to:'/super-admin/institutions', label:'All Institutions', icon:'ti ti-building',      bg:'bg-success-transparent',   border:'border-success',   iconBg:'bg-success'   },
  { to:'/super-admin/institutions/schools', label:'Schools', icon:'ti ti-building-bank',         bg:'bg-primary-transparent',   border:'border-primary',    iconBg:'bg-primary'   },
  { to:'/super-admin/institutions/inter-colleges', label:'Inter Colleges',  icon:'ti ti-building',         bg:'bg-warning-transparent', border:'border-warning',   iconBg:'bg-warning'   },
  { to:'/super-admin/institutions/degree-colleges', label:'Degree Colleges', icon:'ti ti-building-factory-2', bg:'bg-info-transparent',    border:'border-info',      iconBg:'bg-info'      },
  { to:'/super-admin/institutions/engineering-colleges', label:'Engineering Colleges', icon:'ti ti-building-factory', bg:'bg-info-transparent',    border:'border-info',      iconBg:'bg-info'      },
  { to:'/super-admin/memberships',  label:'Memberships',  icon:'ti ti-crown',         bg:'bg-secondary-transparent', border:'border-secondary',  iconBg:'bg-secondary' },
  { to:'/super-admin/tickets',      label:'Support',      icon:'ti ti-ticket',        bg:'bg-danger-transparent',    border:'border-danger',     iconBg:'bg-danger'    },
  { to:'/super-admin/agents',      label:'Agents',       icon:'ti ti-user-star',   bg:'bg-info-transparent',     border:'border-info',      iconBg:'bg-info'      },
  { to:'/super-admin/alerts',       label:'Alerts',       icon:'ti ti-alert-triangle',bg:'bg-warning-transparent',   border:'border-warning',    iconBg:'bg-warning'   },
  { to:'/super-admin/reports',      label:'Reports',      icon:'ti ti-file-pencil',   bg:'bg-skyblue-transparent',   border:'border-skyblue',    iconBg:'bg-skyblue'   },
]

// ─── MONTH DROPDOWN COMPONENT ───────────────────────────────────────────────
const MonthDropdown = ({ onChange, currentMonth }: { onChange: (month: string) => void; currentMonth: string }) => (
  <div className="dropdown">
    <a href="#" className="bg-white dropdown-toggle border rounded px-2 py-1" style={{fontSize:12}} data-bs-toggle="dropdown">
      {currentMonth}
    </a>
    <ul className="dropdown-menu mt-2 p-2" style={{minWidth:130}}>
      {['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'].map((m,i) => (
        <li key={m}><button className="dropdown-item rounded-1" style={{fontSize:12}} onClick={() => onChange(m)}>{['January','February','March','April','May','June','July','August','September','October','November','December'][i]}</button></li>
      ))}
    </ul>
  </div>
)

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('2024-06')
  const [selectedYear,  setSelectedYear]  = useState('2024')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data from API
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [agentAnalytics, setAgentAnalytics] = useState<any>(null)
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [dashboardRes, institutionsRes, alertsRes, overdueRes, analyticsRes] = await Promise.all([
          superAdminService.getDashboardData(),
          superAdminService.getInstitutions(),
          superAdminService.getExpiryAlerts(),
          superAdminService.getOverduePayments(),
          superAdminService.getAnalyticsSummary()
        ])
        
        setDashboardData(dashboardRes || {})
        setInstitutions(institutionsRes || [])
        setExpiryAlerts(alertsRes || [])
        setOverduePayments(overdueRes || [])
        setAnalyticsData(analyticsRes || {})
        
        try {
          const agentRes = await superAdminService.getAgentAnalytics()
          setAgentAnalytics(agentRes || {})
        } catch (agentErr) {
          console.warn('Agent analytics not available:', agentErr)
          setAgentAnalytics({ totalAgents: 0, globalAgents: 0, institutionSpecificAgents: 0 })
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '80vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>Error:</strong> {error}
      </div>
    )
  }
  
  // Calculate derived data from API
  const totalStudents = (institutions || []).reduce((sum, inst) => sum + (inst.students || inst.currentUsers || 0), 0)
  const totalTeachers = Math.floor(totalStudents * 0.05)
  const totalStaff = Math.floor(totalStudents * 0.08)
  const totalParents = Math.floor(totalStudents * 1.8)
  const monthlyRev = (institutions || []).reduce((sum, inst) => sum + (inst._monthlyRevenue || 0), 0)
  const yearlyRev = monthlyRev * 12
  const schoolsOnly = (institutions || []).filter(s => s.type === 'School')
  const interColleges = (institutions || []).filter(s => s.type === 'Inter College')
  const degreeColleges = (institutions || []).filter(s => s.type === 'Degree College')
  const expiringIn7 = (expiryAlerts || []).filter(a => a.daysUntilExpiry <= 7).length
  
  // Get dynamic data
  const topStats = getTopStats(institutions, monthlyRev, totalStudents, expiringIn7, agentAnalytics)
  const revenueData = getRevenueData(analyticsData, institutions)
  const platformExpenses = analyticsData?.expenses || [
    { month:'Jan', infra:3200, support:1400, marketing:2100, operations:800 },
    { month:'Feb', infra:3400, support:1200, marketing:2300, operations:900 },
    { month:'Mar', infra:3100, support:1600, marketing:1900, operations:750 },
    { month:'Apr', infra:3600, support:1300, marketing:2500, operations:850 },
    { month:'May', infra:3800, support:1500, marketing:2200, operations:950 },
    { month:'Jun', infra:4000, support:1700, marketing:2600, operations:1000},
  ]
  const feeCollectionStats = [
    { label:'Total Fees Collected',  value:`₹${(monthlyRev * 12).toLocaleString()}`, badge:'badge-soft-success', pct:'+12.5%' },
    { label:'Overdue Amount',       value:`₹${(overduePayments || []).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}`, badge:'badge-soft-danger',  pct:'+2.1%' },
    { label:'Pending Payments',     value:`₹${Math.floor(monthlyRev * 0.1).toLocaleString()}`, badge:'badge-soft-info',    pct:'+0.8%' },
    { label:'Total Students',        value:totalStudents.toLocaleString(),      badge:'badge-soft-warning', pct:'+15.3%' },
    { label:'Total Teachers',        value:totalTeachers.toLocaleString(),      badge:'badge-soft-info',    pct:'+8.7%' },
  ]
  
  // Platform alerts from API or fallback
  const platformAlerts = (expiryAlerts || []).slice(0, 6).map(alert => ({
    title: `${alert.institutionName} - ${alert.plan} Plan`,
    date: `Expires in ${alert.daysUntilExpiry} days`,
    icon: alert.daysUntilExpiry <= 7 ? 'ti ti-alert-triangle' : 'ti ti-clock',
    bg: alert.daysUntilExpiry <= 7 ? 'bg-danger-transparent' : 'bg-warning-transparent',
    badge: alert.daysUntilExpiry <= 7 ? 'Critical' : 'Warning',
    badgeTone: alert.daysUntilExpiry <= 7 ? 'bg-danger text-white' : 'bg-warning text-dark'
  })) || [
    { title:'System Update Required',           date:'11 Mar 2024',    icon:'ti ti-books',          bg:'bg-primary-transparent', badge:'2 Days',   badgeTone:'bg-light text-dark'   },
    { title:'Springfield Elementary – Premium', date:'Expires: 7 Days',icon:'ti ti-alert-triangle', bg:'bg-danger-transparent', badge:'Critical', badgeTone:'bg-danger text-white' },
    { title:'Riverdale High School – Medium',   date:'Expires: 15 Days',icon:'ti ti-clock',         bg:'bg-warning-transparent', badge:'Warning',  badgeTone:'bg-warning text-dark' },
  ]
  
  // Recent transactions from analytics or fallback
  const transactions = (analyticsData?.recentTransactions || []).slice(0, 4) || [
    { id:'TXN001', schoolName:'Springfield Elementary', plan:'Premium', amount:199, date:'2024-06-01', status:'Completed' },
    { id:'TXN002', schoolName:'Riverdale High School',  plan:'Medium',  amount:79, date:'2024-06-02', status:'Completed' },
    { id:'TXN003', schoolName:'Oakwood Academy',        plan:'Basic',   amount:29, date:'2024-06-03', status:'Completed' },
    { id:'TXN004', schoolName:'Pine Grove School',      plan:'Medium',  amount:79, date:'2024-06-04', status:'Pending'   },
  ]

  return (
    <>
      <style>{customStyles}</style>
      
      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Super Admin Dashboard</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Super Admin Dashboard</li>
          </ol></nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="mb-2 me-2">
            <button className="btn btn-outline-primary d-flex align-items-center" onClick={() => {}} disabled={loading}>
              <i className={`ti ti-refresh me-2 ${loading ? 'fa-spin' : ''}`} />Refresh
            </button>
          </div>
          <div className="mb-2">
            <Link to="/super-admin/institutions/add" className="btn btn-primary d-flex align-items-center me-3">
              <i className="ti ti-square-rounded-plus me-2" />Add Institution
            </Link>
          </div>
          <div className="mb-2">
            <Link to="/super-admin/transactions" className="btn btn-light d-flex align-items-center">
              Revenue Details
            </Link>
          </div>
        </div>
      </div>

      {/* ── UPGRADE ALERT ─────────────────────────────────────────── */}
      <div className="row">
        <div className="col-md-12">
          <div className="alert-message">
            <div className="alert alert-success rounded-pill d-flex align-items-center justify-content-between border-success mb-4" role="alert">
              <div className="d-flex align-items-center">
                <span className="me-2 avatar avatar-sm flex-shrink-0">
                  <img src="/assets/img/profiles/avatar-27.webp" alt="Institution" className="img-fluid rounded-circle" />
                </span>
              </div>
              <button type="button" className="btn-close p-0" aria-label="Close">
                <span><i className="ti ti-x" /></span>
              </button>
            </div>
          </div>

          {/* ── WELCOME BANNER ── */}
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
                    <h1 className="text-white me-2">Welcome Back, Super Admin</h1>
                    <Link to="/profile" className="avatar avatar-sm img-rounded bg-gray-800 dark-hover">
                      <i className="ti ti-edit text-white" />
                    </Link>
                  </div>
                  <p className="text-white mb-0">Platform Overview – {institutions.length} Institutions Managed</p>
                </div>
                <p className="text-white mb-0">
                  <i className="ti ti-refresh me-1" />Updated recently on {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE MESSAGE ── */}
      {institutions.length === 0 && (
        <div className="alert alert-info border-info mb-4">
          <div className="d-flex align-items-center">
            <i className="ti ti-info-circle me-3 fs-4"></i>
            <div>
              <h5 className="alert-heading mb-1">No Institutions Found</h5>
              <p className="mb-2">The platform currently has no institutions registered. Get started by adding your first institution.</p>
              <Link to="/super-admin/institutions/add" className="btn btn-primary btn-sm me-2">
                <i className="ti ti-plus me-1"></i>Add First Institution
              </Link>
              <Link to="/super-admin/settings" className="btn btn-outline-secondary btn-sm">
                <i className="ti ti-settings me-1"></i>Platform Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP STAT CARDS ────────────────────────────────────────── */}
      <div className="row">
        {topStats.map(stat => <TopStatCard key={stat.label} {...stat} />)}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 1 – Institution Type Breakdown (3 tiles)
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">
              {[
          { label:'Schools',         list:schoolsOnly,    icon:'ti ti-school',   bg:'bg-primary-transparent',  iconBg:'bg-primary',  color:'text-primary'  },
          { label:'Inter Colleges',  list:interColleges,  icon:'ti ti-building', bg:'bg-warning-transparent',  iconBg:'bg-warning',  color:'text-warning'  },
          { label:'Degree Colleges', list:degreeColleges, icon:'ti ti-award',    bg:'bg-info-transparent',     iconBg:'bg-info',     color:'text-info'     },
          { label:'Engineering Colleges', list:institutions.filter(s => s.type === 'Engineering College'), icon:'ti ti-award',    bg:'bg-info-transparent',     iconBg:'bg-info',     color:'text-info'     },
        ].map(row => {
          const active   = row.list.filter((inst: Institution) => inst.status==='Active').length
          const students = row.list.reduce((s: number, inst: Institution) => s + (inst.analytics?.totalStudents || 0), 0)
          return (
            <div key={row.label} className="col-xl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <span className={`avatar avatar-lg ${row.bg} rounded me-2`}>
                        <i className={`${row.icon} fs-20`} />
                      </span>
                      <div>
                        <h4 className="mb-0">{row.list.length}</h4>
                        <p className="mb-0">Total {row.label}</p>
                      </div>
                    </div>
                    <span className={`avatar avatar-md ${row.iconBg} rounded-circle`}>
                      <i className={`${row.icon} text-white fs-18`} />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-top pt-3">
                    <div className="text-center">
                      <h6 className="text-success mb-1">{active}</h6>
                      <small className="text-muted">Active</small>
                    </div>
                    <div className="text-center">
                      <h6 className="text-danger mb-1">{row.list.length - active}</h6>
                      <small className="text-muted">Inactive</small>
                    </div>
                    <div className="text-center">
                      <h6 className={`${row.color} mb-1`}>{students.toLocaleString()}</h6>
                      <small className="text-muted">Students</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 2 – User Demographics + Branches & Operations
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">

        {/* User Demographics */}
        <div className="col-xxl-8 col-xl-7 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">User Demographics</h4>
              <Link to="/super-admin/users" className="fw-medium">View All</Link>
            </div>
            <div className="card-body">
              {institutions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-users text-muted fs-1 mb-3 d-block"></i>
                  <h5 className="text-muted">No User Data Available</h5>
                  <p className="text-muted">User demographics will appear once institutions are added to the platform.</p>
                  <Link to="/super-admin/institutions/add" className="btn btn-primary btn-sm">
                    <i className="ti ti-plus me-1"></i>Add Institution
                  </Link>
                </div>
              ) : (
                <div className="row g-3">
                  {[
                    { label:'Students', value:totalStudents.toLocaleString(), icon:'ti ti-school',       bg:'bg-primary-transparent',  bar:'bg-primary', pct:Math.min(100, Math.round((totalStudents / (institutions.length || 1)) * 65)) },
                    { label:'Teachers', value:totalTeachers.toLocaleString(), icon:'ti ti-chalkboard',   bg:'bg-success-transparent',  bar:'bg-success', pct:25 },
                    { label:'Staff',    value:totalStaff.toLocaleString(),    icon:'ti ti-briefcase',    bg:'bg-warning-transparent',  bar:'bg-warning', pct:10 },
                    { label:'Parents',  value:totalParents.toLocaleString(),  icon:'ti ti-users',        bg:'bg-info-transparent',     bar:'bg-info',    pct:45 },
                  ].map(u => (
                    <div key={u.label} className="col-md-3 col-6">
                      <div className="border rounded p-3 text-center">
                        <span className={`avatar avatar-md ${u.bg} rounded-circle mb-2 d-block mx-auto`}>
                          <i className={`${u.icon} fs-18`} />
                        </span>
                        <h4 className="fw-bold mb-1">{u.value}</h4>
                        <p className="text-muted mb-2" style={{fontSize:12}}>{u.label}</p>
                        <div className="progress progress-xs">
                          <div className={`progress-bar ${u.bar} rounded`} style={{width:`${u.pct}%`}} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── USER ROLE PIE CHART ── */}
              <div className="border-top mt-3 pt-3">
                <h5 className="mb-2">Platform User Distribution</h5>
                {institutions.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="ti ti-chart-pie text-muted fs-2 mb-2 d-block"></i>
                    <p className="text-muted mb-0">No data to display</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name:'Students', value:totalStudents },
                          { name:'Parents',  value:totalParents  },
                          { name:'Teachers', value:totalTeachers },
                          { name:'Staff',    value:totalStaff     },
                        ]}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value"
                      >
                        {[0,1,2,3].map(i => <Cell key={i} fill={C[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => (v?.toLocaleString() || '0').toString()} contentStyle={{borderRadius:8,fontSize:12}} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Institution Categories */}
        <div className="col-12 d-flex mt-4">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Institution Categories</h4>
              <Link to="/super-admin/institutions" className="fw-medium">Manage All</Link>
            </div>
            <div className="card-body">
              {institutions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-building-bank text-muted fs-1 mb-3 d-block"></i>
                  <h5 className="text-muted">No Institutions Available</h5>
                  <p className="text-muted">Institution categories will appear once institutions are added to the platform.</p>
                  <Link to="/super-admin/institutions/add" className="btn btn-primary btn-sm">
                    <i className="ti ti-plus me-1"></i>Add Institution
                  </Link>
                </div>
              ) : (
                <div className="row g-3">
                  {[
                    { 
                      label:'Schools', 
                      value:schoolsOnly.length, 
                      icon:'ti ti-building-bank', 
                      bg:'bg-primary-transparent',
                      color:'text-primary',
                      link:'/super-admin/institutions/schools',
                      description:'Primary & Secondary Education'
                    },
                    { 
                      label:'Inter Colleges', 
                      value:interColleges.length, 
                      icon:'ti ti-building', 
                      bg:'bg-warning-transparent',
                      color:'text-warning',
                      link:'/super-admin/institutions/inter-colleges',
                      description:'Higher Secondary Education'
                    },
                    { 
                      label:'Degree Colleges', 
                      value:degreeColleges.length, 
                      icon:'ti ti-building-factory-2', 
                      bg:'bg-success-transparent',
                      color:'text-success',
                      link:'/super-admin/institutions/degree-colleges',
                      description:'Undergraduate Programs'
                    },
                    { 
                      label:'Engineering Colleges', 
                      value:institutions.filter(s => s.type === 'Engineering College').length, 
                      icon:'ti ti-building-factory', 
                      bg:'bg-info-transparent',
                      color:'text-info',
                      link:'/super-admin/institutions/engineering-colleges',
                      description:'Engineering & Technology'
                    },
                  ].map(category => (
                    <div key={category.label} className="col-md-3 col-6">
                      <Link to={category.link} className="text-decoration-none">
                        <div className="border rounded p-3 h-100 category-card hover-lift">
                          <div className="d-flex align-items-center mb-2">
                            <span className={`avatar avatar-md ${category.bg} rounded-circle me-2`}>
                              <i className={`${category.icon} fs-18 ${category.color}`} />
                            </span>
                            <div className="flex-grow-1">
                              <h4 className={`fw-bold mb-0 ${category.color}`}>{category.value}</h4>
                              <p className="text-muted mb-0" style={{fontSize:12}}>{category.label}</p>
                            </div>
                          </div>
                          <p className="text-muted small mb-0">{category.description}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branches & Operations */}
        <div className="col-xxl-4 col-xl-5 d-flex flex-column">
          <div className="card flex-fill mb-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Platform Overview</h4>
              <Link to="/super-admin/institutions" className="fw-medium">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData?.totalInstitutions === undefined ? (
                <div className="text-center py-4">
                  <i className="ti ti-building-bank text-muted fs-2 mb-2 d-block"></i>
                  <h6 className="text-muted">Loading Data...</h6>
                </div>
              ) : (
                [
                  { label:'Total Institutions', value:dashboardData.totalInstitutions || 0, icon:'ti ti-building', bg:'bg-primary-transparent', color:'text-primary' },
                  { label:'Total Users', value:dashboardData.totalUsers || 0, icon:'ti ti-users', bg:'bg-success-transparent', color:'text-success' },
                  { label:'Active Users', value:dashboardData.totalActiveUsers || 0, icon:'ti ti-user-check', bg:'bg-info-transparent', color:'text-info' },
                  { label:'Inactive Users', value:dashboardData.totalInactiveUsers || 0, icon:'ti ti-user-off', bg:'bg-warning-transparent', color:'text-warning' },
                  { label:'Total Roles', value:dashboardData.roles?.length || 0, icon:'ti ti-shield', bg:'bg-skyblue-transparent', color:'text-skyblue' },
                ].map((op,i,arr) => (
                  <div key={op.label} className={`d-flex align-items-center justify-content-between ${i<arr.length-1?'mb-3':''}`}>
                    <div className="d-flex align-items-center">
                      <span className={`avatar avatar-md ${op.bg} rounded me-3`}>
                        <i className={`${op.icon} fs-16`} />
                      </span>
                      <p className="mb-0">{op.label}</p>
                    </div>
                    <h5 className={`mb-0 ${op.color}`}>{op.value}</h5>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card flex-fill mb-0">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Quick Links</h4>
            </div>
            <div className="card-body pb-1">
              <div className="row g-2">
                {quickLinks.map(ql => (
                  <div key={ql.label} className="col-6 col-md-4">
                    <Link to={ql.to} className={`d-block ${ql.bg} rounded p-2 text-center mb-2 class-hover`}>
                      <div className={`avatar avatar-md border p-1 ${ql.border} rounded-circle mb-1 mx-auto`}>
                        <span className={`d-inline-flex align-items-center justify-content-center w-100 h-100 ${ql.iconBg} rounded-circle`}>
                          <i className={`${ql.icon} text-white`} />
                        </span>
                      </div>
                      <p className="text-dark mb-0" style={{fontSize:11}}>{ql.label}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 3 – Revenue & Registrations Chart + Platform Stats
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">

        {/* Revenue & New Registrations Line Chart */}
        <div className="col-xxl-8 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Revenue & New Registrations</h4>
              <div className="dropdown">
                <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                  <i className="ti ti-calendar me-2" />Last 12 Months
                </a>
                <ul className="dropdown-menu mt-2 p-3">
                  {['This Month','This Year','Last 8 Quarter','Last 12 Quarter'].map(o => (
                    <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="card-body pb-0">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v: number)=>`$${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any, name: any) => name === 'Revenue' ? `$${(v?.toLocaleString() || '0').toString()}` : (v?.toLocaleString() || '0').toString()} contentStyle={{borderRadius:10,fontSize:12}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}} />
                  <Line yAxisId="left"  type="monotone" dataKey="revenue"       name="Revenue"           stroke={C[0]} strokeWidth={2.5} dot={{fill:C[0],r:3}} />
                  <Line yAxisId="right" type="monotone" dataKey="registrations" name="New Registrations"  stroke={C[1]} strokeWidth={2}   dot={{fill:C[1],r:3}} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Platform Earnings + Fee Stats */}
        <div className="col-xxl-4 col-xl-6 d-flex flex-column">

          {/* Platform Earnings */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <h6 className="mb-1">Platform Earnings</h6>
                  <h2>${monthlyRev.toLocaleString()}</h2>
                </div>
                <span className="avatar avatar-lg bg-primary rounded-circle">
                  <i className="ti ti-coin fs-20" />
                </span>
              </div>
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={revenueData.slice(-6)}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C[0]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C[0]} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke={C[0]} strokeWidth={2} fill="url(#earnGrad)" dot={false} />
                  <Tooltip formatter={(v: any) => `$${(v || 0).toString()}k`} contentStyle={{borderRadius:8,fontSize:11}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Collection Stats */}
          <div className="card flex-fill">
            <div className="card-header"><h4 className="card-title">Platform Stats</h4></div>
            <div className="card-body pb-1">
              {feeCollectionStats.map((f,i,arr) => (
                <div key={f.label} className={`d-flex align-items-center justify-content-between py-2 ${i<arr.length-1?'border-bottom':''}`}>
                  <p className="mb-0" style={{fontSize:13}}>{f.label}</p>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-0">{f.value}</h5>
                    <span className={`badge ${f.badge}`}>
                      <i className="ti ti-chart-line me-1" />{f.pct}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTION CARDS ────────────────────────────────────── */}
      <div className="row mt-4">
        {quickActions.map(qa => (
          <div key={qa.label} className="col-xl-3 col-md-6 d-flex">
            <Link to={qa.to} className={`card ${qa.bg} border border-5 border-white animate-card flex-fill`}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <span className={`avatar avatar-lg ${qa.iconBg} rounded flex-shrink-0 me-2`}>
                      <i className={`${qa.icon} fs-24`} />
                    </span>
                    <h6 className="fw-semibold text-default">{qa.label}</h6>
                  </div>
                  <span className={`btn btn-white ${qa.hoverCls} avatar avatar-sm p-0 flex-shrink-0 rounded-circle`}>
                    <i className="ti ti-chevron-right fs-14" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 4 – Subscription Pie + Plan Pie + New Signups Bar
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">

        {/* Subscription Status */}
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="card-title mb-3">Subscription Status</h4>
              <div className="d-flex gap-2 mb-3">
                <MonthDropdown onChange={setSelectedMonth} currentMonth={selectedMonth} />
                <div className="dropdown">
                  <a href="#" className="bg-white dropdown-toggle border rounded px-2 py-1" style={{fontSize:12}} data-bs-toggle="dropdown">{selectedYear}</a>
                  <ul className="dropdown-menu mt-2 p-2">
                    {['2024','2023'].map(y => <li key={y}><button className="dropdown-item rounded-1" style={{fontSize:12}} onClick={()=>setSelectedYear(y)}>{y}</button></li>)}
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                {[
                  {label:'Active',   value:dashboardData?.activeSubscriptions || 0, bg:'bg-success-transparent',color:'text-success'},
                  {label:'Suspended',value:dashboardData?.suspendedSubscriptions || 0, bg:'bg-warning-transparent',color:'text-warning'},
                  {label:'Expired',  value:dashboardData?.expiredSubscriptions || 0, bg:'bg-danger-transparent', color:'text-danger'},
                ].map(s => (
                  <div key={s.label} className="col-4 text-center">
                    <div className={`${s.bg} rounded p-2`}>
                      <h5 className={`${s.color} mb-0`}>{s.value}</h5>
                      <small className="text-muted">{s.label}</small>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name:'Active',    value:dashboardData?.activeSubscriptions || 0 },
                    { name:'Suspended', value:dashboardData?.suspendedSubscriptions || 0 },
                    { name:'Expired',   value:dashboardData?.expiredSubscriptions || 0 },
                  ]} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                    {[0,1,2].map(i => <Cell key={i} fill={C[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:8,fontSize:12}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="card-title mb-3">Plan Distribution</h4>
              <div className="mb-3">
                <MonthDropdown onChange={setSelectedMonth} currentMonth={selectedMonth} />
              </div>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                {[
                  {label:'Basic',  value:dashboardData?.basicPlans || 0, bg:'bg-info-transparent',   color:'text-info'   },
                  {label:'Medium', value:dashboardData?.mediumPlans || 0, bg:'bg-warning-transparent',color:'text-warning'},
                  {label:'Premium',value:dashboardData?.premiumPlans || 0, bg:'bg-success-transparent',color:'text-success'},
                ].map(p => (
                  <div key={p.label} className="col-4 text-center">
                    <div className={`${p.bg} rounded p-2`}>
                      <h5 className={`${p.color} mb-0`}>{p.value}</h5>
                      <small className="text-muted">{p.label}</small>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name:'Basic',   value:dashboardData?.basicPlans || 0 },
                    { name:'Medium',  value:dashboardData?.mediumPlans || 0 },
                    { name:'Premium', value:dashboardData?.premiumPlans || 0 },
                  ]} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                    {[0,1,2].map(i => <Cell key={i} fill={C[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${(v || 0).toString()} institutions`} contentStyle={{borderRadius:8,fontSize:12}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* New Institution Signups */}
        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <div className="mb-3">
                <h4 className="card-title mb-1">New Institution Signups</h4>
                <div className="d-flex gap-2">
                  <span className="badge bg-success">{dashboardData?.newInstitutions || 0} this month</span>
                  <span className="badge badge-soft-primary">+24% growth</span>
                </div>
              </div>
              <div className="mb-3">
                <MonthDropdown onChange={setSelectedMonth} currentMonth={selectedMonth} />
              </div>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                {[
                  {label:'Schools',        value:dashboardData?.newSchools || 0, bg:'bg-primary-transparent',color:'text-primary'},
                  {label:'Inter Colleges', value:dashboardData?.newInterColleges || 0, bg:'bg-warning-transparent',color:'text-warning'},
                  {label:'Degree Colleges',value:dashboardData?.newDegreeColleges || 0, bg:'bg-info-transparent',   color:'text-info'   },
                ].map(r => (
                  <div key={r.label} className="col-4 text-center">
                    <div className={`${r.bg} rounded p-2`}>
                      <h5 className={`${r.color} mb-0`}>{r.value}</h5>
                      <small className="text-muted" style={{fontSize:10}}>{r.label}</small>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name:'Schools',        value:dashboardData?.newSchools || 0 },
                  { name:'Inter Colleges', value:dashboardData?.newInterColleges || 0 },
                  { name:'Degree Colleges',value:dashboardData?.newDegreeColleges || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius:10,fontSize:12}} />
                  <Bar dataKey="value" name="New Signups" radius={[6,6,0,0]}>
                    {[0,1,2].map(i => <Cell key={i} fill={C[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 5 – Institutions with Users
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Institutions & Users</h4>
              <Link to="/super-admin/institutions" className="fw-medium">View All</Link>
            </div>
            <div className="card-body">
              {institutions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-building-bank text-muted fs-1 mb-3 d-block"></i>
                  <h5 className="text-muted">No Institutions Available</h5>
                  <p className="text-muted">Institutions and their users will appear here once data is available.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Institution</th>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Total Users</th>
                        <th>Active Users</th>
                        <th>Users by Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {institutions.map((inst) => (
                        <tr key={inst._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-md bg-primary-transparent rounded me-2">
                                <i className="ti ti-building text-primary" />
                              </span>
                              <div>
                                <h6 className="mb-0">{inst.name}</h6>
                                <small className="text-muted">{inst.code || inst.instituteCode || ''}</small>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-soft-info">{inst.instituteCode}</span></td>
                          <td>{inst.type}</td>
                          <td>{inst.currentUsers || 0}</td>
                          <td>{Math.floor((inst.currentUsers || 0) * 0.85)}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <span className="badge badge-soft-secondary" style={{fontSize: '10px'}}>
                                No role data
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-soft-${inst.status === 'active' || inst.status === 'Active' ? 'success' : inst.status === 'suspended' || inst.status === 'Suspended' ? 'warning' : 'danger'}`}>
                              {inst.status || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 6 – Platform Expenses
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">

        {/* Platform Expenses Stacked Bar */}
        <div className="col-xxl-8 col-xl-7 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Platform Expenses</h4>
              <div className="dropdown">
                <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                  <i className="ti ti-calendar me-2" />Last 6 Months
                </a>
                <ul className="dropdown-menu mt-2 p-3">
                  {['Last 6 Months','This Year','Last Year'].map(o => (
                    <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="card-body pb-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={platformExpenses} barSize={18} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v: number)=>`$${(v/1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: any) => `$${v?.toLocaleString() || '0'}`} contentStyle={{borderRadius:10,fontSize:12}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}} />
                  <Bar dataKey="infra"       name="Infrastructure" fill={C[0]} radius={[4,4,0,0]} />
                  <Bar dataKey="support"     name="Support"        fill={C[1]} radius={[4,4,0,0]} />
                  <Bar dataKey="marketing"   name="Marketing"      fill={C[2]} radius={[4,4,0,0]} />
                  <Bar dataKey="operations"  name="Operations"     fill={C[4]} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expense Breakdown Pie + Financial summary */}
        <div className="col-xxl-4 col-xl-5 d-flex flex-column">
          <div className="card flex-fill mb-3">
            <div className="card-header"><h4 className="card-title">Expense Breakdown</h4></div>
            <div className="card-body pb-0">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={[
                    { name:'Infrastructure', value:analyticsData?.summary?.expenses?.totalInfra || 0 },
                    { name:'Support',        value:analyticsData?.summary?.expenses?.totalSupport || 0 },
                    { name:'Marketing',      value:analyticsData?.summary?.expenses?.totalMarketing || 0 },
                    { name:'Operations',     value:analyticsData?.summary?.expenses?.totalOperations || 0 },
                  ]} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {[0,1,2,3].map(i => <Cell key={i} fill={C[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${v?.toLocaleString() || '0'}`} contentStyle={{borderRadius:8,fontSize:12}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div className="card flex-fill mb-0">
            <div className="card-header"><h4 className="card-title">Financial Snapshot</h4></div>
            <div className="card-body pb-1">
              {[
                { label:'Yearly Revenue',  value:`$${yearlyRev.toLocaleString()}`, badge:'badge-soft-success', delta:'+8%'      },
                { label:'Monthly Revenue', value:`$${monthlyRev.toLocaleString()}`,badge:'badge-soft-primary', delta:'+5%'      },
                { label:'Failed Payments', value:'3',                               badge:'badge-soft-danger',  delta:'Fix Now'  },
                { label:'Expiring (7d)',   value:`${expiringIn7}`,                  badge:'badge-soft-danger',  delta:'Critical' },
                { label:'Expiring (30d)',  value:'0',                 badge:'badge-soft-warning', delta:'Warning'  },
                { label:'Open Tickets',    value:'8',                               badge:'badge-soft-info',    delta:'Support'  },
              ].map((f,i,arr) => (
                <div key={f.label} className={`d-flex align-items-center justify-content-between py-2 ${i<arr.length-1?'border-bottom':''}`}>
                  <p className="mb-0" style={{fontSize:12}}>{f.label}</p>
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0">{f.value}</h6>
                    <span className={`badge ${f.badge}`}>{f.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 6 – Platform Alerts + Fee Collection Stats
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">

        {/* Platform Alerts */}
        <div className="col-xxl-5 col-xl-12 order-3 order-xxl-2 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Platform Alerts</h4>
              <Link to="/super-admin/alerts" className="fw-medium">View All</Link>
            </div>
            <div className="card-body">
              <div className="notice-widget">
                {platformAlerts.map((al,i) => (
                  <div key={i} className={`d-sm-flex align-items-center justify-content-between ${i<platformAlerts.length-1?'mb-4':'mb-0'}`}>
                    <div className="d-flex align-items-center overflow-hidden me-2 mb-2 mb-sm-0">
                      <span className={`${al.bg} avatar avatar-md me-2 rounded-circle flex-shrink-0`}>
                        <i className={`${al.icon} fs-16`} />
                      </span>
                      <div className="overflow-hidden">
                        <h6 className="text-truncate mb-1">{al.title}</h6>
                        <p><i className="ti ti-calendar me-2" />{al.date}</p>
                      </div>
                    </div>
                    <span className={`badge ${al.badgeTone}`}>{al.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fee Collection Stats */}
        <div className="col-xxl-3 col-xl-6 order-2 order-xxl-3 d-flex flex-column">
          {feeCollectionStats.map((f) => (
            <div key={f.label} className="card flex-fill mb-2">
              <div className="card-body">
                <p className="mb-2">{f.label}</p>
                <div className="d-flex align-items-end justify-content-between">
                  <h4>{f.value}</h4>
                  <span className={`badge ${f.badge}`}>
                    <i className="ti ti-chart-line me-1" />{f.pct}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

         {/* Yearly Revenue Donut */}
         <div className="col-xxl-4 col-xl-6 order-1 order-xxl-1 d-flex">
  <div className="card flex-fill">
    <div className="card-header">
      <h5 className="card-title mb-0">Top Institutions</h5>
    </div>
    <div className="card-body p-0">
      {loading ? (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      ) : institutions.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Code</th>
                <th>Type</th>
                <th>Total Users</th>
                <th>Active Users</th>
                <th>Users by Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst: any) => {
                const instType = typeof inst.type === 'string' ? inst.type : (inst.type?.name || inst.type?.type || 'N/A');
                const instCode = typeof inst.instituteCode === 'string' ? inst.instituteCode : (inst.instituteCode?.code || 'N/A');
                return (
                  <tr key={inst._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="avatar avatar-md bg-primary-transparent rounded me-2">
                          <i className="ti ti-building text-primary" />
                        </span>
                        <div>
                          <h6 className="mb-0">{inst.name || 'N/A'}</h6>
                          <small className="text-muted">{inst.code || ''}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-soft-info">{instCode}</span></td>
                    <td>{instType}</td>
                    <td>{inst.currentUsers || 0}</td>
                    <td>{Math.floor((inst.currentUsers || 0) * 0.85)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <span className="badge badge-soft-secondary" style={{fontSize: '10px'}}>
                          No role data
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-soft-${inst.status === 'active' || inst.status === 'Active' ? 'success' : inst.status === 'suspended' || inst.status === 'Suspended' ? 'warning' : 'danger'}`}>
                        {inst.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-4 text-muted">No institutions found</div>
      )}
    </div>
  </div>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="mb-1">Total Yearly Revenue</h6>
                  <h2>${yearlyRev.toLocaleString()}</h2>
                </div>
                <span className="avatar avatar-lg bg-success rounded-circle">
                  <i className="ti ti-trending-up fs-20" />
                </span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name:'Basic Plans',   value:dashboardData?.basicPlans * 29  * 12 },
                      { name:'Medium Plans',  value:dashboardData?.mediumPlans * 79  * 12 },
                      { name:'Premium Plans', value:dashboardData?.premiumPlans * 199 * 12 },
                    ]}
                    cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value"
                  >
                    {[0,1,2].map(i => <Cell key={i} fill={[C[4],C[2],C[1]][i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${v?.toLocaleString() || '0'}`} contentStyle={{borderRadius:8,fontSize:12}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 7 – Recently Registered Institutions Table
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <div className="mb-3">
                <h4 className="card-title mb-1">Recently Registered Institutions</h4>
                <p className="mb-0" style={{fontSize:12}}>New schools and colleges joining the platform</p>
              </div>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-success">+3 this month</span>
                <Link to="/super-admin/institutions" className="btn btn-primary btn-sm">
                  <i className="ti ti-eye me-1" />View All
                </Link>
              </div>
            </div>
            <div className="card-body px-0">
              <div className="custom-datatable-filter table-responsive">
                <table className="table">
                  <thead className="thead-light">
                    <tr><th>Institution</th><th>Type</th><th>Plan</th><th>Status</th><th>Students</th><th>Revenue</th><th>Joined</th><th>Expiry</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
{institutions.slice(-10).map((school: any) => {
                        const schoolType = typeof school.type === 'string' ? school.type : (school.type?.name || school.type?.type || 'N/A');
                        const statusLabel = typeof school.status === 'string' ? school.status : 'Unknown';
                      const d = school.subscriptionExpiry ? daysUntil(school.subscriptionExpiry) : 0
                      return (
                        <tr key={school._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-md bg-primary-transparent rounded me-2 flex-shrink-0">
                                <i className="ti ti-building text-primary" />
                              </span>
                              <div>
                                <h6 className="mb-0">{school.name || 'N/A'}</h6>
                                <small className="text-muted">{school.adminName || 'Admin'}</small>
                              </div>
                            </div>
                          </td>
                          <td><span className={`badge ${schoolType==='School'?'badge-soft-primary':schoolType==='Inter College'?'badge-soft-warning':'badge-soft-info'}`}>{schoolType}</span></td>
                          <td><span className={`badge ${statusLabel==='Active'?'badge-soft-success':statusLabel==='Suspended'?'badge-soft-warning':'badge-soft-danger'}`}>{statusLabel}</span></td>
                          <td>{school.students || school.analytics?.totalStudents || 0}</td>
                          <td>${school._monthlyRevenue || 0}</td>
                          <td>{school._createdAt || 'N/A'}</td>
                          <td>
                            <span className={`badge ${d<=7?'badge-soft-danger':d<=15?'badge-soft-warning':'badge-soft-info'} me-1`}>{d} days</span>
                            <small className="text-muted">{school.subscriptionExpiry}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary py-0 px-2"><i className="ti ti-bell" /></button>
                              <button className="btn btn-sm btn-outline-success py-0 px-2"><i className="ti ti-credit-card" /></button>
                              <button className="btn btn-sm btn-outline-info py-0 px-2"><i className="ti ti-message" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 8 – Recent Transactions + Expiring Subscriptions
      ══════════════════════════════════════════════════════════════ */}
      <div className="row mt-4">

        {/* Recent Transactions */}
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Recent Transactions</h4>
              <Link to="/super-admin/transactions" className="fw-medium">View All</Link>
            </div>
            <div className="card-body px-0">
              <div className="custom-datatable-filter table-responsive">
                <table className="table">
                  <thead className="thead-light">
                    <tr><th>School</th><th>Plan</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 4).map((tx: any) => (
                      <tr key={tx.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-md bg-primary-transparent rounded me-2">
                              <i className="ti ti-building text-primary" />
                            </span>
                            <div>
                              <h6 className="mb-0" style={{fontSize:13}}>{tx.schoolName}</h6>
                              <small className="text-muted">ID: {tx.id}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${tx.plan==='Premium'?'badge-soft-success':tx.plan==='Medium'?'badge-soft-warning':'badge-soft-info'}`}>{tx.plan}</span></td>
                        <td><span className="text-success fw-semibold">₹{tx.amount}</span></td>
                        <td><small>{tx.date}</small></td>
                        <td>
                          <span className={`badge ${tx.status==='Completed'?'bg-success':tx.status==='Pending'?'bg-warning text-dark':'bg-danger'}`}>
                            <i className="ti ti-circle-filled fs-8 me-1" />{tx.status}
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

        {/* Expiring Subscriptions */}
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Expiring Subscriptions</h4>
              <div className="d-flex gap-2">
                <span className="badge bg-danger">{expiringIn7} Critical</span>
                <span className="badge badge-soft-warning">0 Soon</span>
              </div>
            </div>
            <div className="card-body px-0">
              <div className="custom-datatable-filter table-responsive">
                <table className="table">
                  <thead className="thead-light">
                    <tr><th>Institution</th><th>Type</th><th>Plan</th><th>Expiry</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
{institutions.filter((inst: Institution) => {
    if (!inst.subscriptionExpiry) return false
    const d = daysUntil(inst.subscriptionExpiry)
    return d <= 30
}).map((school: Institution) => {
                      const d = daysUntil(school.subscriptionExpiry || '')
                      return (
                        <tr key={school._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-md bg-primary-transparent rounded me-2 flex-shrink-0">
                                <i className="ti ti-building text-primary" />
                              </span>
                              <div>
                                <h6 className="mb-0" style={{fontSize:13}}>{school.name}</h6>
                                <small className="text-muted">{school.analytics?.totalStudents || 0} students</small>
                              </div>
                            </div>
                          </td>
                          <td><span className={`badge ${school.type==='School'?'badge-soft-primary':school.type==='Inter College'?'badge-soft-warning':'badge-soft-info'}`}>{school.type}</span></td>
                          <td><span className={`badge ${school.plan==='Premium'?'badge-soft-success':school.plan==='Medium'?'badge-soft-warning':'badge-soft-info'}`}>{school.plan}</span></td>
                          <td>
                            <span className={`badge ${d<=7?'badge-soft-danger':d<=15?'badge-soft-warning':'badge-soft-info'} me-1`}>{d} days</span>
                            <small className="text-muted">{school.subscriptionExpiry}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary py-0 px-2"><i className="ti ti-bell" /></button>
                              <button className="btn btn-sm btn-outline-success py-0 px-2"><i className="ti ti-credit-card" /></button>
                              <button className="btn btn-sm btn-outline-info py-0 px-2"><i className="ti ti-message" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SuperAdminDashboard
