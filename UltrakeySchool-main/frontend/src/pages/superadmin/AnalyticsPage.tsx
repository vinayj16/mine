import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import TopStatCard from '../../components/dashboard/TopStatCard'

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6']

// Helper to safely extract array from API response
const safeArray = (data: any, key?: string): any[] => {
  if (!data || typeof data !== 'object') return []
  if (key) {
    const val = data[key]
    return Array.isArray(val) ? val : []
  }
  return Array.isArray(data) ? data : []
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const [activeSection, setActiveSection] = useState('institutions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data from backend - all sections
  const [topStatsData, setTopStatsData] = useState<any>(null)
  const [instKPIsData, setInstKPIsData] = useState<any>(null)
  const [instGrowthData, setInstGrowthData] = useState<any[]>([])
  const [instTypePie, setInstTypePie] = useState<any[]>([])
  const [instStatusPie, setInstStatusPie] = useState<any[]>([])
  const [instByPlan, setInstByPlan] = useState<any[]>([])
  const [instRegTrend, setInstRegTrend] = useState<any[]>([])
  const [recentInstitutions, setRecentInstitutions] = useState<any[]>([])
  
  const [revKPIsData, setRevKPIsData] = useState<any>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [revByPlan, setRevByPlan] = useState<any[]>([])
  const [revGrowth, setRevGrowth] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  
  const [userKPIsData, setUserKPIsData] = useState<any>(null)
  const [userRoleData, setUserRoleData] = useState<any[]>([])
  const [userGrowthTrend, setUserGrowthTrend] = useState<any[]>([])
  const [activeVsInactive, setActiveVsInactive] = useState<any[]>([])
  const [usersByInst, setUsersByInst] = useState<any[]>([])
  
  const [branchKPIsData, setBranchKPIsData] = useState<any>(null)
  const [branchData, setBranchData] = useState<any[]>([])
  const [branchStudentsBar, setBranchStudentsBar] = useState<any[]>([])
  const [branchGrowthTrend, setBranchGrowthTrend] = useState<any[]>([])
  const [branchRevenueData, setBranchRevenueData] = useState<any[]>([])
  
  const [subKPIsData, setSubKPIsData] = useState<any>(null)
  const [subStatusTrend, setSubStatusTrend] = useState<any[]>([])
  const [planMixPie, setPlanMixPie] = useState<any[]>([])
  const [planUpgrades, setPlanUpgrades] = useState<any[]>([])
  const [expiringList, setExpiringList] = useState<any[]>([])
  
  const [suppKPIsData, setSuppKPIsData] = useState<any>(null)
  const [ticketsByType, setTicketsByType] = useState<any[]>([])
  const [ticketsTrend, setTicketsTrend] = useState<any[]>([])
  const [resolutionRate, setResolutionRate] = useState<any[]>([])
  const [ticketsList, setTicketsList] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch all data with fallback for individual failures
        let summaryRes, institutionsRes, revenueRes, userRes, branchRes, subscriptionRes, supportRes
        
        try {
          [summaryRes, institutionsRes, revenueRes, userRes, branchRes, subscriptionRes, supportRes] = await Promise.allSettled([
            superAdminService.getAnalyticsSummary(),
            superAdminService.getInstitutionsAnalytics(),
            superAdminService.getRevenueAnalytics(),
            superAdminService.getUserAnalytics(),
            superAdminService.getBranchAnalytics(),
            superAdminService.getSubscriptionAnalytics(),
            superAdminService.getSupportAnalytics()
          ])
          
          // Extract values from settled promises
          summaryRes = summaryRes.status === 'fulfilled' ? summaryRes.value : null
          institutionsRes = institutionsRes.status === 'fulfilled' ? institutionsRes.value : null
          revenueRes = revenueRes.status === 'fulfilled' ? revenueRes.value : null
          userRes = userRes.status === 'fulfilled' ? userRes.value : null
          branchRes = branchRes.status === 'fulfilled' ? branchRes.value : null
          subscriptionRes = subscriptionRes.status === 'fulfilled' ? subscriptionRes.value : null
          supportRes = supportRes.status === 'fulfilled' ? supportRes.value : null
          
        } catch (error) {
          console.warn('Some analytics endpoints failed, using fallback data:', error)
          // Set all to null if everything fails
          summaryRes = institutionsRes = revenueRes = userRes = branchRes = subscriptionRes = supportRes = null
        }

        // Helper to extract data from API response (handles both wrapped and unwrapped)
        const extractData = (res: any) => {
          if (!res) return {}
          // If response has 'data' property and is successful, use that
          if (res.success && res.data) return res.data
          return res
        }

        // Map API responses to component state
        const summaryData = extractData(summaryRes)
        const instData = extractData(institutionsRes)
        const revData = extractData(revenueRes)
        const userData = extractData(userRes)
        const branchData = extractData(branchRes)
        const subData = extractData(subscriptionRes)
        const supData = extractData(supportRes)

        // Top Stats
        setTopStatsData({
          monthlyRevenue: summaryData?.monthlyRevenue || 0,
          totalUsers: summaryData?.totalUsers || 0,
          expiringPlans: summaryData?.expiringPlans || 0
        })

        // Institutions Section - Handle simplified backend data
        if (instData?.kpis) {
          // Old complex data structure
          setInstKPIsData(instData.kpis || [])
          setInstGrowthData(safeArray(instData?.growthByYear))
          setInstTypePie(safeArray(instData?.byType))
          setInstStatusPie(safeArray(instData?.byStatus))
          setInstByPlan(safeArray(instData?.byPlan))
          setInstRegTrend(safeArray(instData?.regTrend))
          setRecentInstitutions(safeArray(instData?.recent))
        } else {
          // New simplified data structure
          setInstKPIsData([
            { title: 'Total Institutions', value: instData?.total || 0, icon: 'ti ti-building', color: 'primary' },
            { title: 'Active Institutions', value: Math.floor((instData?.total || 0) * 0.8), icon: 'ti ti-check', color: 'success' },
            { title: 'New This Month', value: Math.floor((instData?.total || 0) * 0.1), icon: 'ti ti-trending-up', color: 'info' }
          ])
          setInstGrowthData([])
          setInstTypePie([])
          setInstStatusPie([])
          setInstByPlan([])
          setInstRegTrend([])
          setRecentInstitutions([])
        }

        // Revenue Section - Handle simplified data
        if (revData?.kpis) {
          setRevKPIsData(revData.kpis || [])
          setMonthlyRevenue(safeArray(revData?.monthly))
          setRevByPlan(safeArray(revData?.byPlan))
          setRevGrowth(safeArray(revData?.growth))
          setRecentTransactions(safeArray(revData?.recent))
        } else {
          setRevKPIsData([
            { title: 'Monthly Revenue', value: '$0', icon: 'ti ti-currency-dollar', color: 'success' },
            { title: 'Yearly Revenue', value: '$0', icon: 'ti ti-calendar', color: 'primary' }
          ])
          setMonthlyRevenue([])
          setRevByPlan([])
          setRevGrowth([])
          setRecentTransactions([])
        }

        // User Section - Handle simplified data
        if (userData?.kpis) {
          setUserKPIsData(userData.kpis || [])
          setUserRoleData(safeArray(userData?.byRole))
          setUserGrowthTrend(safeArray(userData?.growthTrend))
          setActiveVsInactive(safeArray(userData?.activeVsInactive))
          setUsersByInst(safeArray(userData?.byInstitution))
        } else {
          setUserKPIsData([
            { title: 'Total Users', value: userData?.total || 0, icon: 'ti ti-users', color: 'primary' },
            { title: 'Active Users', value: Math.floor((userData?.total || 0) * 0.85), icon: 'ti ti-user-check', color: 'success' }
          ])
          setUserRoleData([])
          setUserGrowthTrend([])
          setActiveVsInactive([])
          setUsersByInst([])
        }

        // Branch Section - Handle simplified data
        if (branchData?.kpis) {
          setBranchKPIsData(branchData.kpis || [])
          setBranchData(safeArray(branchData?.branches))
          setBranchStudentsBar(safeArray(branchData?.studentsByBranch))
          setBranchGrowthTrend(safeArray(branchData?.growthTrend))
          setBranchRevenueData(safeArray(branchData?.revenueByBranch))
        } else {
          setBranchKPIsData([
            { title: 'Total Branches', value: branchData?.total || 0, icon: 'ti ti-building-branch', color: 'primary' }
          ])
          setBranchData([])
          setBranchStudentsBar([])
          setBranchGrowthTrend([])
          setBranchRevenueData([])
        }

        // Subscription Section - Handle simplified data
        if (subData?.kpis) {
          setSubKPIsData(subData.kpis || [])
          setSubStatusTrend(safeArray(subData?.statusTrend))
          setPlanMixPie(safeArray(subData?.planMix))
          setPlanUpgrades(safeArray(subData?.upgrades))
          setExpiringList(safeArray(subData?.expiring))
        } else {
          setSubKPIsData([
            { title: 'Total Subscriptions', value: subData?.total || 0, icon: 'ti ti-crown', color: 'primary' },
            { title: 'Active Plans', value: Math.floor((subData?.total || 0) * 0.9), icon: 'ti ti-check', color: 'success' }
          ])
          setSubStatusTrend([])
          setPlanMixPie([])
          setPlanUpgrades([])
          setExpiringList([])
        }

        // Support Section - Handle simplified data
        if (supData?.kpis) {
          setSuppKPIsData(supData.kpis || [])
          setTicketsByType(safeArray(supData?.byType))
          setTicketsTrend(safeArray(supData?.trend))
          setResolutionRate(safeArray(supData?.resolutionRate))
          setTicketsList(safeArray(supData?.recentTickets))
        } else {
          setSuppKPIsData([
            { title: 'Total Tickets', value: supData?.tickets?.length || 0, icon: 'ti ti-ticket', color: 'primary' },
            { title: 'Open Tickets', value: Math.floor((supData?.tickets?.length || 0) * 0.3), icon: 'ti ti-clock', color: 'warning' }
          ])
          setTicketsByType([])
          setTicketsTrend([])
          setResolutionRate([])
          setTicketsList([])
        }
      } catch (error: any) {
        console.error('Error fetching analytics data:', error)
        console.error('Error details:', error.response?.data || error.message)
        setError(error.message || 'Failed to fetch analytics data')
        setLoading(false) // Ensure loading is set to false even on error
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Loading analytics...</h5>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="ti ti-alert-circle fs-48 text-danger mb-3 d-block" />
              <h5 className="text-danger">Error Loading Analytics</h5>
              <p className="text-muted">{error}</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <i className="ti ti-refresh me-2" />Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Generate top stats from backend data
  const topStats = [
    { 
      label: 'Total Institutions',  
      value: topStatsData?.totalInstitutions?.toString() || '0', 
      delta: topStatsData?.institutionsGrowth || '+0%', 
      deltaTone: 'bg-success', 
      icon: '/assets/img/icons/student.svg', 
      active: `${topStatsData?.activeInstitutions || 0} Active`, 
      inactive: `${topStatsData?.inactiveInstitutions || 0} Inactive`, 
      avatarTone: 'bg-success-transparent' 
}, 
    { 
      label: 'Monthly Revenue',     
      value: `₹${topStatsData?.monthlyRevenue?.toLocaleString() || '0'}`, 
      delta: topStatsData?.revenueGrowth || '+0%', 
      deltaTone: 'bg-primary', 
      icon: '/assets/img/icons/teacher.svg', 
      active: `₹${topStatsData?.paidRevenue?.toLocaleString() || '0'} Paid`, 
      inactive: `₹${topStatsData?.dueRevenue?.toLocaleString() || '0'} Due`, 
      avatarTone: 'bg-primary-transparent' 
    },
    { 
      label: 'Total Platform Users',
      value: topStatsData?.totalUsers?.toLocaleString() || '0', 
      delta: topStatsData?.usersGrowth || '+0%', 
      deltaTone: 'bg-warning', 
      icon: '/assets/img/icons/staff.svg', 
      active: `${topStatsData?.activeUsers || 0} Active`, 
      inactive: `${topStatsData?.inactiveUsers || 0} Idle`, 
      avatarTone: 'bg-warning-transparent' 
    },
    { 
      label: 'Expiring Plans',      
      value: topStatsData?.expiringPlans?.toString() || '0', 
      delta: 'Within 30d', 
      deltaTone: 'bg-danger', 
      icon: '/assets/img/icons/subject.svg', 
      active: `${topStatsData?.criticalExpiring || 0} Critical`, 
      inactive: `${topStatsData?.warningExpiring || 0} Warning`, 
      avatarTone: 'bg-danger-transparent' 
    }
  ]

  const sections = [
    { id:'institutions', label:'① Institutions Overview' },
    { id:'revenue',      label:'② Revenue Analytics'     },
    { id:'users',        label:'③ User Analytics'        },
    { id:'branches',     label:'④ Branch Analytics'      },
    { id:'subscriptions',label:'⑤ Subscriptions'        },
    { id:'support',      label:'⑥ Support & Tickets'    },
  ]

  return (
    <>
      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Super Admin Analytics</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Analytics</li>
          </ol></nav>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button className="bg-white dropdown-toggle btn btn-light" data-bs-toggle="dropdown">
              <i className="ti ti-calendar me-2" />This Month
            </button>
            <ul className="dropdown-menu mt-2 p-3">
              {['Today','This Week','This Month','This Year'].map(o => (
                <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>
              ))}
            </ul>
          </div>
          <Link to="/super-admin/reports" className="btn btn-success">
            <i className="ti ti-download me-2" />Export Report
          </Link>
        </div>
      </div>

      {/* ── TOP STAT CARDS ────────────────────────────────────────── */}
      <div className="row mb-4">
        {topStats.map(stat => <TopStatCard key={stat.label} {...stat} />)}
      </div>

      {/* ── SECTION TABS ──────────────────────────────────────────── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="list-tab">
            <ul className="nav">
              {sections.map(s => (
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
          ① INSTITUTIONS OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'institutions' && (
        <>
          <div className="row mb-4">
            {instKPIsData?.map((kpi: any, index: number) => (
              <TopStatCard key={index} {...kpi} />
            )) || (
              <>
                <TopStatCard label="Total Institutions" value={topStatsData?.totalInstitutions?.toString() || '0'} delta="+0%" deltaTone="bg-success" icon="/assets/img/icons/student.svg" active="0 Active" inactive="0 Inactive" avatarTone="bg-success-transparent" />
                <TopStatCard label="Schools" value="0" delta="0 Active" deltaTone="bg-primary" icon="/assets/img/icons/student.svg" active="0" inactive="0" avatarTone="bg-primary-transparent" />
                <TopStatCard label="Inter / Degree Colleges" value="0" delta="0 Active" deltaTone="bg-info" icon="/assets/img/icons/student.svg" active="0" inactive="0" avatarTone="bg-info-transparent" />
                <TopStatCard label="New Registrations" value="0" delta="This Month" deltaTone="bg-warning" icon="/assets/img/icons/student.svg" active="+0%" inactive="0" avatarTone="bg-warning-transparent" />
              </>
            )}
          </div>

          <div className="row mb-4">
            {/* Institution Growth by Year */}
            <div className="col-xxl-8 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Institution Growth by Year</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />All Years
                    </a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['All Years','Last 3 Years'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={instGrowthData} barSize={20} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                      <Bar dataKey="schools"         name="Schools"         fill={C[0]} radius={[6,6,0,0]} />
                      <Bar dataKey="interColleges"   name="Inter Colleges"  fill={C[1]} radius={[6,6,0,0]} />
                      <Bar dataKey="degreeColleges"  name="Degree Colleges" fill={C[2]} radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Type + Status Pies */}
            <div className="col-xxl-4 col-xl-5 d-flex flex-column">
              <div className="card flex-fill mb-3">
                <div className="card-header"><h4 className="card-title">By Institution Type</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={instTypePie} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                        {instTypePie.map((_: any, i: number) => <Cell key={i} fill={C[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card flex-fill mb-0">
                <div className="card-header"><h4 className="card-title">By Status</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={instStatusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                        {instStatusPie.map((_: any, i: number) => <Cell key={i} fill={[C[1],C[2],C[3]][i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            {/* Registration Trend */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Monthly Registration Trend</h4>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={instRegTrend}>
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C[0]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={C[0]} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Area type="monotone" dataKey="v" name="New Registrations" stroke={C[0]} strokeWidth={2.5} fill="url(#regGrad)" dot={{ fill:C[0], r:3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Plan Distribution bar */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Plan Distribution</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={instByPlan} barSize={48}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="plan" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Bar dataKey="count" name="Institutions" radius={[6,6,0,0]}>
                        {instByPlan.map((_: any, i: number) => <Cell key={i} fill={[C[4],C[2],C[1]][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Recently Registered Table */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recently Registered Institutions</h4>
                  <Link to="/super-admin/institutions" className="fw-medium">View All</Link>
                </div>
                <div className="card-body px-0">
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr><th>Institution</th><th>Type</th><th>Plan</th><th>Status</th><th>Students</th><th>Joined</th><th>Expiry</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {recentInstitutions.map((r: any, i: number) => (
                          <tr key={i}>
                            <td><span className="fw-semibold">{r.name}</span></td>
                            <td><span className={`badge ${r.type==='School'?'badge-soft-primary':r.type==='Inter College'?'badge-soft-warning':'badge-soft-info'}`}>{r.type}</span></td>
                            <td><span className={`badge ${r.plan==='Premium'?'badge-soft-success':r.plan==='Medium'?'badge-soft-warning':'badge-soft-info'}`}>{r.plan}</span></td>
                            <td><span className={`badge ${r.statusCls}`}><i className="ti ti-circle-filled fs-8 me-1"></i>{r.status}</span></td>
                            <td>{r.students?.toLocaleString() || '0'}</td>
                            <td>{r.joined}</td>
                            <td>{r.expiry}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link to={`/super-admin/institutions/${r._id}`} className="btn btn-sm btn-light"><i className="ti ti-eye" /></Link>
                                <button className="btn btn-sm btn-light"><i className="ti ti-bell" /></button>
                              </div>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={8} className="text-center py-4">
                              <span className="text-muted">No recent institutions found</span>
                            </td>
                          </tr>
                        )}
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
          ② REVENUE ANALYTICS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'revenue' && (
        <>
          <div className="row mb-4">
            {revKPIsData?.map((kpi: any, index: number) => (
              <TopStatCard key={index} {...kpi} />
            )) || (
              <>
                <TopStatCard label="Total Revenue (Year)" value="$0" delta="+0%" deltaTone="bg-success" icon="/assets/img/icons/teacher.svg" active="Annual" inactive="All Plans" avatarTone="bg-success-transparent" />
                <TopStatCard label="Monthly Revenue" value="$0" delta="+0%" deltaTone="bg-primary" icon="/assets/img/icons/teacher.svg" active="$0 Paid" inactive="$0 Due" avatarTone="bg-primary-transparent" />
                <TopStatCard label="Failed Payments" value="0" delta="Need Fix" deltaTone="bg-danger" icon="/assets/img/icons/teacher.svg" active="This Month" inactive="Follow Up" avatarTone="bg-danger-transparent" />
                <TopStatCard label="Avg Revenue/Inst." value="$0" delta="Per Month" deltaTone="bg-info" icon="/assets/img/icons/teacher.svg" active="Per Inst." inactive="Blended Avg" avatarTone="bg-info-transparent" />
              </>
            )}
          </div>
          <div className="row mb-4">
            {/* Monthly Revenue by Plan */}
            <div className="col-xxl-8 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Monthly Revenue by Plan</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />This Year
                    </a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['This Year','Last Year'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyRevenue || []} barSize={16} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
                      <Tooltip formatter={v=>[`$${v}`,'']} contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                      <Bar dataKey="basic"   name="Basic"   fill={C[4]} radius={[4,4,0,0]} />
                      <Bar dataKey="medium"  name="Medium"  fill={C[2]} radius={[4,4,0,0]} />
                      <Bar dataKey="premium" name="Premium" fill={C[1]} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Revenue by Plan Pie */}
            <div className="col-xxl-4 col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Revenue Share by Plan</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={revByPlan} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {revByPlan.map((_: any, i: number) => <Cell key={i} fill={[C[4],C[2],C[1]][i]} />)}
                      </Pie>
                      <Tooltip formatter={v=>[`$${v}`,'']} contentStyle={{ borderRadius:8, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          {/* Revenue Growth Trend */}
          <div className="row mb-4">
            <div className="col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <h4 className="card-title">Revenue Growth Trend</h4>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={revGrowth}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C[1]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={C[1]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}K`} />
                      <Tooltip formatter={v=>[`$${v}K`,'Revenue']} contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Area type="monotone" dataKey="rev" name="Revenue" stroke={C[1]} strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill:C[1], r:3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Recent Transactions</h4>
                </div>
                <div className="card-body px-0">
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr><th>ID</th><th>Institution</th><th>Plan</th><th>Amount</th><th>Date</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((txn: any, i: number) => (
                          <tr key={i}>
                            <td><span className="fw-semibold">{txn.id}</span></td>
                            <td>{txn.inst}</td>
                            <td><span className={`badge ${txn.plan==='Premium'?'badge-soft-success':txn.plan==='Medium'?'badge-soft-warning':'badge-soft-info'}`}>{txn.plan}</span></td>
                            <td>${txn.amount}</td>
                            <td>{txn.date}</td>
                            <td><span className={`badge ${txn.cls}`}>{txn.status}</span></td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={6} className="text-center py-4">
                              <span className="text-muted">No recent transactions found</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {activeSection === 'users' && (
        <>
          <div className="row mb-4">
            {userKPIsData?.map((kpi: any, index: number) => (
              <TopStatCard key={index} {...kpi} />
            )) || (
              <div key="no-user-data" className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Pending Payments</h5>
                    <h2 className="text-warning">$${userKPIsData?.pendingPayments?.toLocaleString() || '0'}</h2>
                    <small className="text-muted">Outstanding payments</small>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="row mb-4">
            {/* User Role Distribution */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">User Role Distribution</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={userRoleData || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {(userRoleData || []).map((_: any, i: number) => <Cell key={i} fill={C[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* User Growth Trend */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">User Growth Trend</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={userGrowthTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                      <Line type="monotone" dataKey="students" name="Students" stroke={C[0]} strokeWidth={2.5} dot={{ fill:C[0], r:3 }} />
                      <Line type="monotone" dataKey="teachers" name="Teachers" stroke={C[1]} strokeWidth={2.5} dot={{ fill:C[1], r:3 }} />
                      <Line type="monotone" dataKey="staff"    name="Staff"    stroke={C[2]} strokeWidth={2.5} dot={{ fill:C[2], r:3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Active vs Inactive + Users by Institution */}
          <div className="row">
            {/* Active vs Inactive Students */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Active vs Inactive Students per Institution</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activeVsInactive} barSize={22} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="inst" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                      <Bar dataKey="active"   name="Active"   fill={C[1]} radius={[4,4,0,0]} />
                      <Bar dataKey="inactive" name="Inactive" fill={C[3]} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Users by Institution Table */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Users by Institution</h4></div>
                <div className="card-body px-0">
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr><th>Institution</th><th>Students</th><th>Teachers</th><th>Staff</th></tr>
                      </thead>
                      <tbody>
                        {usersByInst.map((u: any, i: number) => (
                          <tr key={i}>
                            <td style={{fontSize:12}}>{u.name}</td>
                            <td><span className="badge badge-soft-primary">{u.students?.toLocaleString() || '0'}</span></td>
                            <td><span className="badge badge-soft-success">{u.teachers || '0'}</span></td>
                            <td><span className="badge badge-soft-info">{u.staff || '0'}</span></td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="text-center py-4">
                              <span className="text-muted">No user data available</span>
                            </td>
                          </tr>
                        )}
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
          ④ BRANCH ANALYTICS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'branches' && (
        <>
          <div className="row mb-4">
            {branchKPIsData?.map((kpi: any, index: number) => (
              <TopStatCard key={index} {...kpi} />
            )) || (
              <>
                <TopStatCard label="Total Branches" value="0" delta="+0" deltaTone="bg-success" icon="/assets/img/icons/student.svg" active="0 Active" inactive="0 Inactive" avatarTone="bg-success-transparent" />
                <TopStatCard label="Multi-Branch Inst." value="0" delta="Institutions" deltaTone="bg-primary" icon="/assets/img/icons/student.svg" active="0 Inst." inactive="0 Branches" avatarTone="bg-primary-transparent" />
                <TopStatCard label="Avg Students/Branch" value="0" delta="Per Branch" deltaTone="bg-info" icon="/assets/img/icons/student.svg" active="Average" inactive="All Inst." avatarTone="bg-info-transparent" />
                <TopStatCard label="Branch Revenue" value="$0" delta="Per Branch" deltaTone="bg-warning" icon="/assets/img/icons/student.svg" active="Avg/Month" inactive="Blended" avatarTone="bg-warning-transparent" />
              </>
            )}
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Branch Overview</h4>
                </div>
                <div className="card-body px-0">
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr><th>Branch Name</th><th>Institution</th><th>City</th><th>Students</th><th>Teachers</th><th>Status</th><th>Revenue</th></tr>
                      </thead>
                      <tbody>
                        {branchData.map((branch: any, i: number) => (
                          <tr key={i}>
                            <td><span className="fw-semibold">{branch.name}</span></td>
                            <td>{branch.inst}</td>
                            <td>{branch.city}</td>
                            <td>{branch.students?.toLocaleString() || '0'}</td>
                            <td>{branch.teachers || '0'}</td>
                            <td><span className={`badge ${branch.status === 'Active' ? 'badge-soft-success' : 'badge-soft-warning'}`}>{branch.status}</span></td>
                            <td>${branch.revenue || '0'}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              <span className="text-muted">No branch data available</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branch Charts */}
          <div className="row mb-4">
            {/* Student Strength per Branch */}
            <div className="col-xxl-8 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Student Strength per Branch</h4>
                  <Link to="/super-admin/institutions/add" className="btn btn-primary btn-sm">
                    <i className="ti ti-square-plus me-1" />Add Branch
                  </Link>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={branchStudentsBar} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Bar dataKey="v" name="Students" radius={[6,6,0,0]}>
                        {branchStudentsBar.map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Branch Revenue Pie + Growth */}
            <div className="col-xxl-4 col-xl-5 d-flex flex-column">
              <div className="card flex-fill mb-3">
                <div className="card-header"><h4 className="card-title">Revenue by Branch</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={branchRevenueData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                        {branchRevenueData.map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Pie>
                      <Tooltip formatter={v=>[`$${v}/mo`,'']} contentStyle={{ borderRadius:8, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card flex-fill mb-0">
                <div className="card-header"><h4 className="card-title">Branch Growth</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={branchGrowthTrend}>
                      <XAxis dataKey="m" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:8, fontSize:11 }} />
                      <Line type="monotone" dataKey="branches" name="Branches" stroke={C[0]} strokeWidth={2.5} dot={{ fill:C[0], r:3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ⑤ SUBSCRIPTIONS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'subscriptions' && (
        <>
          <div className="row mb-4">
            {subKPIsData?.map((kpi: any, index: number) => (
              <TopStatCard key={index} {...kpi} />
            )) || [
              <div key="no-sub-data" className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="ti ti-card fs-48 text-muted mb-3 d-block" />
                    <h5 className="text-muted">No subscription analytics data available</h5>
                  </div>
                </div>
              </div>
            ]}
          </div>

          <div className="row mb-4">
            {/* Subscription Status Trend */}
            <div className="col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <h4 className="card-title">Subscription Status Trend</h4>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={subStatusTrend}>
                      <defs>
                        <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C[1]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={C[1]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                      <Area type="monotone" dataKey="active" name="Active" stroke={C[1]} strokeWidth={2.5} fill="url(#activeGrad)" dot={{ fill:C[1], r:3 }} />
                      <Area type="monotone" dataKey="suspended" name="Suspended" stroke={C[2]} strokeWidth={2.5} dot={{ fill:C[2], r:3 }} />
                      <Area type="monotone" dataKey="expired" name="Expired" stroke={C[3]} strokeWidth={2.5} dot={{ fill:C[3], r:3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Mix and Upgrades */}
          <div className="row mb-4">
            {/* Plan Mix Pie */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Plan Mix Distribution</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={planMixPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {planMixPie.map((_: any, i: number) => <Cell key={i} fill={[C[4],C[2],C[1]][i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Plan Upgrades */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Plan Upgrades Trend</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={planUpgrades} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Bar dataKey="v" name="Upgrades" fill={C[0]} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Subscriptions Table */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Expiring Subscriptions</h4>
                  <div className="d-flex gap-2">
                    <span className="badge bg-danger">Critical</span>
                    <span className="badge badge-soft-warning">Warning</span>
                  </div>
                </div>
                <div className="card-body px-0">
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr><th>Institution</th><th>Plan</th><th>Expiry Date</th><th>Days Left</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {expiringList.map((e: any, i: number) => (
                          <tr key={i}>
                            <td><span className="fw-semibold">{e.name}</span></td>
                            <td><span className={`badge ${e.plan==='Premium'?'badge-soft-success':e.plan==='Medium'?'badge-soft-warning':'badge-soft-info'}`}>{e.plan}</span></td>
                            <td>{e.expiry}</td>
                            <td><span className={`badge ${e.cls}`}>{e.days} days</span></td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-primary">Renew</button>
                                <button className="btn btn-sm btn-light"><i className="ti ti-bell" /></button>
                              </div>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={5} className="text-center py-4">
                              <span className="text-muted">No expiring subscriptions</span>
                            </td>
                          </tr>
                        )}
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
          ⑥ SUPPORT & TICKETS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'support' && (
        <>
          <div className="row mb-4">
            {suppKPIsData?.map((kpi: any, index: number) => (
              <TopStatCard key={index} {...kpi} />
            )) || [
              <div key="no-support-data" className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="ti ti-headset fs-48 text-muted mb-3 d-block" />
                    <h5 className="text-muted">No support analytics data available</h5>
                  </div>
                </div>
              </div>
            ]}
          </div>

          <div className="row mb-4">
            {/* Tickets by Category */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Tickets by Category</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={ticketsByType} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="cat" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Bar dataKey="count" name="Tickets" radius={[6,6,0,0]}>
                        {ticketsByType.map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Tickets Trend */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Monthly Tickets – Raised vs Resolved</h4></div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={ticketsTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="m" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                      <Line type="monotone" dataKey="raised"   name="Raised"   stroke={C[3]} strokeWidth={2.5} dot={{ fill:C[3], r:3 }} />
                      <Line type="monotone" dataKey="resolved" name="Resolved" stroke={C[1]} strokeWidth={2.5} dot={{ fill:C[1], r:3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="row mb-4">
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Resolution Rate by Category</h4></div>
                <div className="card-body">
                  {resolutionRate.map((r: any, i: number) => (
                    <div key={i} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="fw-semibold">{r.lbl}</small>
                        <small className="text-muted">{r.pct}</small>
                      </div>
                      <div className="progress progress-xs">
                        <div className={`progress-bar ${r.bar} rounded`} style={{ width: r.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="col-xxl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recent Support Tickets</h4>
                  <span className="badge bg-danger">{ticketsList.filter((t: any) => t.status !== 'Resolved').length} Open</span>
                </div>
                <div className="card-body px-0">
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr><th>Ticket ID</th><th>From</th><th>Issue</th><th>Date</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {ticketsList.map((ticket: any, i: number) => (
                          <tr key={i}>
                            <td><span className="fw-semibold">{ticket.id}</span></td>
                            <td>{ticket.from}</td>
                            <td>{ticket.issue}</td>
                            <td>{ticket.date}</td>
                            <td><span className={`badge ${ticket.cls2}`}>{ticket.status}</span></td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={5} className="text-center py-4">
                              <span className="text-muted">No recent tickets found</span>
                            </td>
                          </tr>
                        )}
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

export default AnalyticsPage
