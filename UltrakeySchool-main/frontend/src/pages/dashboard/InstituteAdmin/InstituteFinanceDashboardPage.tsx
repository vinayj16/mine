/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { toast } from 'react-toastify'
import { apiClient } from '../../../api/client'
import TopStatCard from '../../../components/dashboard/TopStatCard'

// Type definitions for API data
interface FinanceTopStat {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface FinanceKPI {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface FinanceData {
  topStats: FinanceTopStat[]
  financeKPIs: FinanceKPI[]
  revenueData: any[]
  expensePie: any[]
  budgetVsActual: any[]
  plData: any[]
  feeByTerm: any[]
  invoices: any[]
  infraStats: FinanceTopStat[]
  maintenanceRequests: any[]
  busData: any[]
  safetyReports: any[]
  inventoryItems: any[]
}

const InstituteFinanceDashboardPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('financial')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<FinanceData | null>(null)

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/finance/dashboard')
      
      console.log('Finance API Response:', response.data)
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('Finance Dashboard loaded successfully')
      } else {
        console.error('API response structure:', response.data)
        setError('Invalid API response structure')
      }
    } catch (err: any) {
      console.error('Error fetching finance dashboard:', err)
      setError(err.message || 'Failed to load finance data')
      toast.error('Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="text-danger mb-3">
            <i className="ti ti-alert-circle fs-1"></i>
          </div>
          <h5>Error loading finance data</h5>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchFinanceData}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Use API data or fallback
  const topStats = dashboardData?.topStats || []
  const financeKPIs = dashboardData?.financeKPIs || []
  const revenueData = dashboardData?.revenueData || []
  const expensePie = dashboardData?.expensePie || []
  const budgetVsActual = dashboardData?.budgetVsActual || []
  const plData = dashboardData?.plData || []
  const feeByTerm = dashboardData?.feeByTerm || []
  const invoices = dashboardData?.invoices || []
  const infraStats = dashboardData?.infraStats || []
  const maintenanceRequests = dashboardData?.maintenanceRequests || []
  const busData = dashboardData?.busData || []
  const safetyReports = dashboardData?.safetyReports || []
  const inventoryItems = dashboardData?.inventoryItems || []

  // Debug: Log the data being used
  console.log('Dashboard Data:', {
    topStats: topStats.length,
    financeKPIs: financeKPIs.length,
    revenueData: revenueData.length,
    expensePie: expensePie.length,
    budgetVsActual: budgetVsActual.length,
    plData: plData.length,
    feeByTerm: feeByTerm.length,
    invoices: invoices.length,
    infraStats: infraStats.length,
    maintenanceRequests: maintenanceRequests.length,
    busData: busData.length,
    safetyReports: safetyReports.length,
    inventoryItems: inventoryItems.length
  })

  const EXP_COLORS = ['#6366f1','#f59e0b','#10b981','#06b6d4','#ef4444']

  const sections = [
    { id: 'financial', label: '③ Financial Overview' },
    { id: 'infrastructure', label: '⑥ Infrastructure & Operations' }
  ]

  return (
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Finance Dashboard</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/institution/dashboard/main">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Finance</li>
          </ol></nav>
        </div>
      </div>

      {/* TOP STAT CARDS */}
      <div className="row mb-4">
        {topStats.map(stat => <TopStatCard key={stat.label} {...stat} />)}
      </div>

      {/* SECTION TABS */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="list-tab">
            <ul className="nav">
              {sections.map(s => (
                <li key={s.id}>
                  <a href="#" className={activeSection === s.id ? 'active' : ''} onClick={e => { e.preventDefault(); setActiveSection(s.id) }}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ══════════ ③ FINANCIAL OVERVIEW ══════════ */}
      {activeSection === 'financial' && (
        <>
          {/* Finance Chairman KPI Cards */}
          <div className="row mb-4">
            {financeKPIs.map(stat => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Revenue Area Chart + Expense Pie */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Revenue Trend (Revenue vs Expenses vs Profit)</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />Last 8 Months</a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['Last 6 Months','Last 8 Months','This Year','Last Year'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${(v as number)/1000}k`} />
                      <Tooltip formatter={(v: any, n: any) => [`$${(v as number)?.toLocaleString()}`,n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)"  dot={false} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2}   fill="url(#expGrad)"  dot={false} />
                      <Area type="monotone" dataKey="profit"   name="Profit"   stroke="#10b981" strokeWidth={2}   fill="url(#profGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Expense Distribution</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={expensePie} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                        {expensePie.map((_: any, i: number) => <Cell key={i} fill={EXP_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v,n) => [`${v}%`,n]} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Budget vs Actual Stacked Bar + P&L Summary */}
          <div className="row">
            <div className="col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Budget vs Actual Comparison</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />This Year</a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['This Year','Last Year','Q1 2024','Q2 2024'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={budgetVsActual} barSize={22} barGap={4}>
                      <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${(v as number)/1000}k`} />
                      <Tooltip formatter={(v: any, n: any) => [`$${(v as number)?.toLocaleString()}`,n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Variance indicators */}
                  <div className="row g-2 mt-2">
                    {budgetVsActual.map(b => (
                      <div key={b.dept} className="col">
                        <div className="text-center">
                          <small className="d-block text-muted" style={{ fontSize: 10 }}>{b.dept}</small>
                          <span className={`badge ${b.variance >= 0 ? 'badge-soft-success' : 'badge-soft-danger'}`} style={{ fontSize: 10 }}>
                            {b.variance >= 0 ? '+' : ''}{b.variance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Profit & Loss Summary</h4></div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    {plData.map((p, i) => (
                      <li key={i} className={`list-group-item d-flex justify-content-between align-items-center px-0 ${p.category === 'Net Profit' ? 'border-top pt-3' : ''}`}>
                        <span className="text-dark" style={{ fontSize: 13 }}>{p.category}</span>
                        <span className={p.cls} style={{ fontSize: 13 }}>{p.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Collection Bar + Recent Invoices */}
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Fee Collection (Month / Year)</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown"><i className="ti ti-calendar me-2" />Last 8 Quarter</a>
                    <ul className="dropdown-menu mt-2 p-3">
                      {['This Month','This Year','Last 12 Quarter','Last 16 Quarter'].map(o => <li key={o}><a href="#" className="dropdown-item rounded-1">{o}</a></li>)}
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={feeByTerm} barSize={18} barGap={4}>
                      <XAxis dataKey="q" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${(v as number)/1000}k`} />
                      <Tooltip formatter={(v: any, n: any) => [`$${(v as number)?.toLocaleString()}`,n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="collected"   name="Collected"   fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="outstanding" name="Outstanding" fill="#ef4444" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recent Invoices</h4>
                  <Link to="/invoices" className="fw-medium">View All</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped mb-0">
                      <thead>
                        <tr><th>#Invoice</th><th>Student</th><th>Amount</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id}>
                            <td>{inv.id}</td>
                            <td>{inv.student}</td>
                            <td>{inv.amount}</td>
                            <td><span className={`badge ${inv.cls}`}>{inv.status}</span></td>
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

      {/* ══════════ ⑥ INFRASTRUCTURE & OPERATIONS ══════════ */}
      {activeSection === 'infrastructure' && (
        <>
          {/* Infra KPI Cards */}
          <div className="row mb-4">
            {infraStats.map(stat => <TopStatCard key={stat.label} {...stat} />)}
          </div>

          {/* Bus Usage + Classroom Utilization */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Bus Route Usage</h4></div>
                <div className="card-body">
                  <ul className="list-group">
                    {busData.map(b => (
                      <li key={b.route} className="list-group-item">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <p className="text-dark mb-0" style={{ fontSize: 13 }}>{b.route}</p>
                          <small className="text-muted">{b.students} / {b.capacity} students</small>
                        </div>
                        <div className="progress progress-xs">
                          <div className={`progress-bar ${b.bar} rounded`} style={{ width: b.pct }} />
                        </div>
                        <small className="text-muted">{b.pct} capacity</small>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Classroom Utilization</h4></div>
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    {[
                      { lbl: 'Total Rooms',    val: '48', tone: 'bg-primary-transparent',  icon: 'ti ti-building' },
                      { lbl: 'Active',         val: '42', tone: 'bg-success-transparent',  icon: 'ti ti-check'    },
                      { lbl: 'Vacant',         val: '6',  tone: 'bg-warning-transparent',  icon: 'ti ti-door'     },
                      { lbl: 'Under Maintenance',val:'2', tone: 'bg-danger-transparent',   icon: 'ti ti-tools'    },
                    ].map(c => (
                      <div key={c.lbl} className="col-6">
                        <div className={`card ${c.tone} border-0 mb-0`}>
                          <div className="card-body p-3 d-flex align-items-center">
                            <div className={`avatar avatar-md ${c.tone} me-2 d-flex align-items-center justify-content-center`}>
                              <i className={`${c.icon} fs-18`} />
                            </div>
                            <div>
                              <h4 className="mb-0">{c.val}</h4>
                              <p className="mb-0" style={{ fontSize: 12 }}>{c.lbl}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={[{ name:'Active', value:42 },{ name:'Vacant', value:6 },{ name:'Maintenance', value:2 }]} cx="50%" cy="50%" outerRadius={60} paddingAngle={2} dataKey="value">
                        <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Requests + Safety Reports */}
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Maintenance Requests</h4>
                  <span className="badge bg-danger">3 Critical / High</span>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr><th>Area</th><th>Priority</th><th>Status</th><th>Age</th></tr>
                      </thead>
                      <tbody>
                        {maintenanceRequests.map(m => (
                          <tr key={m.area}>
                            <td>{m.area}</td>
                            <td><span className={`badge ${m.cls}`}>{m.priority}</span></td>
                            <td>{m.status}</td>
                            <td>{m.days}</td>
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
                  <h4 className="card-title">Safety Reports (Monthly)</h4>
                  <span className="badge badge-soft-success">3 Drills Done YTD</span>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={safetyReports} barSize={22} barGap={4}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="incidents" name="Incidents"   fill="#ef4444" radius={[6,6,0,0]} />
                      <Bar dataKey="drills"    name="Safety Drills" fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="row">
            <div className="col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Inventory Status</h4>
                  <span className="badge badge-soft-warning">2 Items Low Stock</span>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr><th>Item</th><th>Stock Level</th><th>Status</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {inventoryItems.map(inv => (
                          <tr key={inv.item}>
                            <td>{inv.item}</td>
                            <td>{inv.stock}</td>
                            <td><span className={`badge ${inv.statusCls}`}>{inv.status}</span></td>
                            <td>
                              {inv.status === 'Low Stock'
                                ? <Link to="/inventory/reorder" className="btn btn-sm btn-danger">Reorder</Link>
                                : <span className="text-muted fs-12">No action</span>
                              }
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
    </>
  )
}

export default InstituteFinanceDashboardPage
