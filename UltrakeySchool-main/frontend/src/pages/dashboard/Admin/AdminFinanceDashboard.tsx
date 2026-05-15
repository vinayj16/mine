import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import apiClient from '../../../api/client'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface FinanceSummary {
  totalCollection: number;
  totalExpenses: number;
  netBalance: number;
  pendingFees: number;
  totalStudents: number;
  collectionRate: number;
}

interface Transaction {
  id: string;
  student: string;
  class: string;
  amount: number;
  mode: string;
  date: string;
  status: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

const AdminFinanceDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [pendingByGrade, setPendingByGrade] = useState<any[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [period] = useState('month');

  useEffect(() => {
    fetchFinanceData();
  }, [period]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get schoolId from localStorage or use default
      const userStr = localStorage.getItem('user');
      const schoolId = userStr ? JSON.parse(userStr)?.schoolId || '507f1f77bcf86cd799439011' : '507f1f77bcf86cd799439011';
      
      const [
        summaryRes,
        transactionsRes,
        expensesRes,
        trendRes,
        modesRes,
        pendingRes,
        overdueRes,
        expenseCatRes
      ] = await Promise.allSettled([
        apiClient.get('/finance/summary', { params: { schoolId } }),
        apiClient.get('/finance/transactions', { params: { schoolId, limit: 20 } }),
        apiClient.get('/expenses', { params: { schoolId, limit: 20 } }),
        apiClient.get('/finance/monthly-trend', { params: { schoolId } }),
        apiClient.get('/finance/payment-modes', { params: { schoolId } }),
        apiClient.get('/finance/pending-by-grade', { params: { schoolId } }),
        apiClient.get('/finance/overdue-students', { params: { schoolId } }),
        apiClient.get('/expenses/categories', { params: { schoolId } })
      ])

      if (summaryRes.status === 'fulfilled' && summaryRes.value.data?.data) {
        setFinanceSummary(summaryRes.value.data.data)
      }

      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.data?.data) {
        setTransactions(transactionsRes.value.data.data)
      }

      if (expensesRes.status === 'fulfilled' && expensesRes.value.data?.data) {
        setExpenses(expensesRes.value.data.data)
      }

      if (trendRes.status === 'fulfilled' && trendRes.value.data?.data) {
        setMonthlyTrend(trendRes.value.data.data)
      }

      if (modesRes.status === 'fulfilled' && modesRes.value.data?.data) {
        setPaymentModes(modesRes.value.data.data)
      }

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.data) {
        setPendingByGrade(pendingRes.value.data.data)
      }

      if (overdueRes.status === 'fulfilled' && overdueRes.value.data?.data) {
        setOverdueStudents(overdueRes.value.data.data)
      }

      if (expenseCatRes.status === 'fulfilled' && expenseCatRes.value.data?.data) {
        setExpenseCategories(expenseCatRes.value.data.data)
      }

    } catch (err: any) {
      console.error('Error fetching finance data:', err)
      setError(err.message || 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  const sendReminder = async (studentId: string) => {
    try {
      const response = await apiClient.post('/finance/send-reminder', { studentId })
      if (response.data.success) {
        toast.success('Reminder sent successfully')
      }
    } catch (err: any) {
      console.error('Error sending reminder:', err)
      toast.error('Failed to send reminder')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <i className="ti ti-alert-circle me-2" />
        {error}
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchFinanceData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  const C = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const summary = financeSummary || {
    totalCollection: 0,
    totalExpenses: 0,
    netBalance: 0,
    pendingFees: 0,
    totalStudents: 0,
    collectionRate: 0
  }

  const finSummary = [
    { label: 'Total Collection', value: `$${summary.totalCollection.toLocaleString()}`, icon: 'ti ti-currency-dollar', avatarTone: 'bg-success', delta: '+12%', deltaTone: 'badge-success', sub: 'This month' },
    { label: 'Total Expenses', value: `$${summary.totalExpenses.toLocaleString()}`, icon: 'ti ti-receipt', avatarTone: 'bg-danger', delta: '+5%', deltaTone: 'badge-danger', sub: 'This month' },
    { label: 'Net Balance', value: `$${summary.netBalance.toLocaleString()}`, icon: 'ti ti-wallet', avatarTone: 'bg-primary', delta: '+8%', deltaTone: 'badge-primary', sub: 'This month' },
    { label: 'Pending Fees', value: `$${summary.pendingFees.toLocaleString()}`, icon: 'ti ti-alert-circle', avatarTone: 'bg-warning', delta: '-3%', deltaTone: 'badge-warning', sub: 'Outstanding' },
    { label: 'Total Students', value: summary.totalStudents.toString(), icon: 'ti ti-users', avatarTone: 'bg-info', delta: '+2%', deltaTone: 'badge-info', sub: 'Active' },
    { label: 'Collection Rate', value: `${summary.collectionRate}%`, icon: 'ti ti-chart-pie', avatarTone: 'bg-success', delta: '+1%', deltaTone: 'badge-success', sub: 'This term' },
  ]

  const navSections = [
    { id: 'overview',  label: 'Overview',         icon: 'ti ti-layout-dashboard'   },
    { id: 'collection',label: 'Fee Collection',   icon: 'ti ti-currency-dollar'    },
    { id: 'pending',   label: 'Pending Fees',     icon: 'ti ti-alert-circle'       },
    { id: 'expenses',  label: 'Expenses',         icon: 'ti ti-receipt'            },
    { id: 'reports',   label: 'Reports',          icon: 'ti ti-report-analytics'   },
  ]

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Finance Dashboard</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Finance</li>
          </ol></nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button className="btn btn-primary d-flex align-items-center">
            <i className="ti ti-plus me-1" />Collect Fee
          </button>
          <button className="btn btn-warning d-flex align-items-center">
            <i className="ti ti-receipt me-1" />Add Expense
          </button>
          <Link to="/finance/reports" className="btn btn-success d-flex align-items-center">
            <i className="ti ti-download me-1" />Export
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              <ul className="nav nav-pills flex-wrap gap-1">
                {navSections.map(s => (
                  <li key={s.id} className="nav-item">
                    <a href="#"
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

      {activeSection === 'overview' && (
        <>
          <div className="row">
            {finSummary.map((stat: any) => (
              <div key={stat.label} className="col-xxl-2 col-xl-4 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <div className={`avatar avatar-lg ${stat.avatarTone} rounded d-flex align-items-center justify-content-center me-2 flex-shrink-0`}>
                        <i className={`${stat.icon} fs-20 text-white`} />
                      </div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h4 className="mb-0">{stat.value}</h4>
                        </div>
                        <p className="mb-0" style={{ fontSize: 11 }}>{stat.label}</p>
                      </div>
                    </div>
                    <div className="border-top pt-2">
                      <small className="text-muted">{stat.sub}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row mt-3">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Monthly Collection Trend</h4>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyTrend.length > 0 ? monthlyTrend : []}>
                      <defs>
                        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v || 0)/1000}k`} />
                      <Tooltip formatter={(v: any) => [`$${(v || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2.5} fill="url(#colGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Payment Mode Distribution</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={paymentModes.length > 0 ? paymentModes : []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {(paymentModes.length > 0 ? paymentModes : []).map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [`${v}`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-xl-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Recent Transactions</h4>
                  <Link to="/finance/transactions" className="btn btn-sm btn-light">View All</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Amount</th><th>Mode</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {transactions.length > 0 ? transactions.slice(0, 10).map((t: any, i: number) => (
                          <tr key={i}>
                            <td><span className="badge bg-secondary">{t.id?.slice(0, 8) || '-'}</span></td>
                            <td className="fw-semibold">{t.student || t.name || '-'}</td>
                            <td>{t.class || t.grade || '-'}</td>
                            <td className="text-success fw-semibold">${t.amount?.toLocaleString() || '0'}</td>
                            <td><span className="badge bg-light text-dark">{t.mode || t.paymentMode || '-'}</span></td>
                            <td><small className="text-muted">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</small></td>
                            <td><span className={`badge ${t.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{t.status || 'pending'}</span></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="text-center text-muted">No transactions found</td></tr>
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

      {activeSection === 'collection' && (
        <>
          <div className="row mt-3">
            <div className="col-xl-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Fee Collection by Grade</h4>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pendingByGrade.length > 0 ? pendingByGrade : []} barSize={32}>
                      <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v || 0)/1000}k`} />
                      <Tooltip formatter={(v: any) => [`$${(v || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[6,6,0,0]} />
                      <Bar dataKey="pending" name="Pending" fill="#ef4444" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-xl-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">All Transactions</h4>
                  <button className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />Collect Fee</button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Amount</th><th>Mode</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {transactions.length > 0 ? transactions.map((t: any, i: number) => (
                          <tr key={i}>
                            <td><span className="badge bg-secondary">{t.id?.slice(0, 8) || '-'}</span></td>
                            <td className="fw-semibold">{t.student || t.name || '-'}</td>
                            <td>{t.class || t.grade || '-'}</td>
                            <td className="text-success fw-semibold">${t.amount?.toLocaleString() || '0'}</td>
                            <td><span className="badge bg-light text-dark">{t.mode || t.paymentMode || '-'}</span></td>
                            <td><small className="text-muted">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</small></td>
                            <td><span className={`badge ${t.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{t.status || 'pending'}</span></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="text-center text-muted">No transactions found</td></tr>
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

      {activeSection === 'pending' && (
        <>
          <div className="row">
            <div className="col-xl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Pending Fees by Grade</h4>
                  <button className="btn btn-sm btn-warning"><i className="ti ti-send me-1" />Send Reminders</button>
                </div>
                <div className="card-body pb-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={pendingByGrade.length > 0 ? pendingByGrade : []} barSize={32}>
                      <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v || 0)/1000}k`} />
                      <Tooltip formatter={(v: any) => [`$${(v || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="pending" name="Pending Fees" fill="#ef4444" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Pending Summary</h4></div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <p className="mb-0 text-muted">Total Pending</p>
                    <span className="text-danger fw-bold fs-4">${summary.pendingFees.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <p className="mb-0 text-muted">Students with Dues</p>
                    <span className="fw-semibold">{overdueStudents.length}</span>
                  </div>
                  <button className="btn btn-warning w-100 mt-3"><i className="ti ti-send me-1" />Send All Reminders</button>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Overdue Students</h4>
                  <span className="badge bg-danger">{overdueStudents.length} Overdue</span>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr><th>Student</th><th>Class</th><th>Pending Amount</th><th>Days Overdue</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {overdueStudents.length > 0 ? overdueStudents.map((s: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-semibold">{s.name || '-'}</td>
                            <td>{s.grade || s.class || '-'}</td>
                            <td className="text-danger fw-semibold">${s.pending?.toLocaleString() || '0'}</td>
                            <td><span className="badge bg-danger">{s.daysOverdue || '0'} days</span></td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-warning px-2 py-1" onClick={() => sendReminder(s.id)}>
                                  <i className="ti ti-send" />
                                </button>
                                <button className="btn btn-sm btn-success px-2 py-1">Collect</button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="text-center text-muted">No overdue students</td></tr>
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

      {activeSection === 'expenses' && (
        <>
          <div className="row mb-3">
            {[
              { label: 'Total Expenses', value: `$${(summary.totalExpenses || 0).toLocaleString()}`, tone: 'bg-danger', icon: 'ti ti-receipt' },
              { label: 'Categories', value: expenseCategories.length.toString(), tone: 'bg-info', icon: 'ti ti-tags' },
            ].map((c: any) => (
              <div key={c.label} className="col-xl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div><h2 className="mb-0">{c.value}</h2><p className="mb-0">{c.label}</p></div>
                    <div className={`avatar avatar-xl ${c.tone} rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
                      <i className={`${c.icon} fs-24 text-white`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header"><h4 className="card-title">Expense Categories</h4></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseCategories.length > 0 ? expenseCategories : []} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                        {(expenseCategories.length > 0 ? expenseCategories : []).map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`$${v}`]} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Expense Records</h4>
                  <button className="btn btn-sm btn-primary"><i className="ti ti-plus me-1" />Add Expense</button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {expenses.length > 0 ? expenses.slice(0, 10).map((e: any, i: number) => (
                          <tr key={i}>
                            <td><span className="badge badge-soft-primary">{e.category || '-'}</span></td>
                            <td style={{ fontSize: 13 }}>{e.description || '-'}</td>
                            <td className="text-danger fw-semibold">${e.amount?.toLocaleString() || '0'}</td>
                            <td><small className="text-muted">{e.date ? new Date(e.date).toLocaleDateString() : '-'}</small></td>
                            <td><span className={`badge ${e.status === 'approved' ? 'bg-success' : 'bg-warning'}`}>{e.status || 'pending'}</span></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="text-center text-muted">No expenses found</td></tr>
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

      {activeSection === 'reports' && (
        <>
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Finance Reports</h4>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {[
                      { label: 'Fee Collection Report', desc: 'Download detailed fee collection report', icon: 'ti ti-currency-dollar', to: '/finance/reports/collection' },
                      { label: 'Expense Report', desc: 'Download expense summary', icon: 'ti ti-receipt', to: '/finance/reports/expenses' },
                      { label: 'Pending Fees Report', desc: 'Download pending fees report', icon: 'ti ti-alert-circle', to: '/finance/reports/pending' },
                      { label: 'Profit & Loss', desc: 'Download P&L statement', icon: 'ti ti-scale', to: '/finance/reports/pnl' },
                    ].map((r: any) => (
                      <div key={r.label} className="col-xxl-3 col-xl-6 col-md-6">
                        <Link to={r.to} className="d-flex align-items-center border rounded p-3" style={{ textDecoration: 'none' }}>
                          <div className="avatar avatar-lg bg-primary rounded me-3 d-flex align-items-center justify-content-center">
                            <i className={`${r.icon} fs-20 text-white`} />
                          </div>
                          <div>
                            <h6 className="mb-0">{r.label}</h6>
                            <small className="text-muted">{r.desc}</small>
                          </div>
                        </Link>
                      </div>
                    ))}
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

export default AdminFinanceDashboard
