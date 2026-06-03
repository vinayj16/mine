import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import { useAuth } from '../../../store/authStore'
import InstitutionDetailsCard from '../../../components/dashboard/InstitutionDetailsCard'
import AccountantFinancePayrollSection from './AccountantFinancePayrollSection'

interface FeeCategoryStats {
  total: number;
  pending: number;
  collected: number;
  amount?: number;
}

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalExpenses: number;
    pendingFees: number;
    collectedFees: number;
    currentMonthRevenue: number;
    budgetUtilization: number;
    tuitionFees?: FeeCategoryStats;
    hostelFees?: FeeCategoryStats;
    transportFees?: FeeCategoryStats;
  };
  recentTransactions: any[];
  recentInvoices?: any[];
  salariesSummary?: { total: number; recent: any[] };
  budgetsSummary?: { total: number; totalPlanned: number; totalSpent: number; recent: any[] };
  payrollSummary?: { total: number; recent: any[] };
  counts?: {
    invoices?: { total: number; paid: number; pending: number };
    transactions?: number;
    salaries?: number;
    payroll?: number;
    budgets?: number;
  };
  feeStats: any;
  expenseBreakdown: any;
  hostelFees?: any[];
  transportFees?: any[];
}

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const isIncomeTransaction = (type?: string) =>
  ['income', 'credit', 'payment', 'fee_collection', 'receipt'].includes((type || '').toLowerCase());

const normalizeTransaction = (tx: any) => ({
  date: tx.date || tx.processedAt || tx.createdAt,
  type: isIncomeTransaction(tx.type) ? 'income' : (tx.type || 'expense'),
  amount: Math.abs(parseAmount(tx.amount)),
  status: tx.status || 'completed',
  description: tx.description || tx.reference || tx.transactionId || 'Transaction',
  source: tx.source || 'finance'
});

const AccountantDashboardPage: React.FC = () => {
  const { user, institutionData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${filename} exported successfully`);
  };

  const exportToPDF = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const printContent = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${filename.replace('-', ' ').toUpperCase()}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0]).map(k => `<th>${k}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(v => `<td>${v ?? ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open PDF preview. Please enable popups for this site.');
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    toast.success('PDF generated - use print dialog to save');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [financeRes, transactionsRes, invoicesRes, accountantFeesRes] = await Promise.allSettled([
        apiClient.get('/finance/dashboard'),
        apiClient.get('/finance/transactions', { params: { limit: 20 } }),
        apiClient.get('/finance/invoices', { params: { limit: 10 } }),
        apiClient.get('/fees/accountant/dashboard')
      ]);

      const apiErrors: string[] = [];

      let overview = {
        totalRevenue: 0,
        totalExpenses: 0,
        pendingFees: 0,
        collectedFees: 0,
        currentMonthRevenue: 0,
        budgetUtilization: 0
      };
      let recentTransactions: any[] = [];
      let recentInvoices: any[] = [];
      let salariesSummary: DashboardData['salariesSummary'];
      let budgetsSummary: DashboardData['budgetsSummary'];
      let payrollSummary: DashboardData['payrollSummary'];
      let totalFees = 0;
      let pendingFeesCount = 0;

      if (financeRes.status === 'fulfilled' && financeRes.value.data.success) {
        const data = financeRes.value.data.data;
        overview = {
          totalRevenue: data.totalRevenue || data.overview?.totalIncome || 0,
          totalExpenses: data.totalExpenses || data.overview?.totalExpense || 0,
          pendingFees: data.pendingPayments || data.overview?.pendingFees || 0,
          collectedFees: data.overview?.collectedFees || data.totalRevenue || data.overview?.totalIncome || 0,
          currentMonthRevenue: data.overview?.currentMonthRevenue || 0,
          budgetUtilization: data.overview?.budgetUtilization || 0
        };
        recentTransactions = (data.recentTransactions || []).map(normalizeTransaction);
        recentInvoices = (data.invoices || []).map((inv: any) => ({
          ...inv,
          amount: parseAmount(inv.amount)
        }));
        salariesSummary = data.salariesSummary;
        budgetsSummary = data.budgetsSummary;
        payrollSummary = data.payrollSummary;
        const counts = data.counts;
        totalFees = data.overview?.totalFees || counts?.invoices?.total || 0;
        pendingFeesCount = data.overview?.pendingFees || 0;
      } else if (financeRes.status === 'rejected') {
        apiErrors.push('Finance dashboard');
      }

      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.data.success) {
        const transData = transactionsRes.value.data.data;
        const txList = Array.isArray(transData) ? transData : (transData.transactions || []);
        if (txList.length > 0) {
          const normalized = txList.map(normalizeTransaction);
          const merged = [...recentTransactions, ...normalized];
          const seen = new Set<string>();
          recentTransactions = merged.filter((t) => {
            const key = `${t.date}-${t.amount}-${t.description}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

          const income = txList.filter((t: any) => isIncomeTransaction(t.type)).reduce((sum: number, t: any) => sum + parseAmount(t.amount), 0);
          const expense = txList.filter((t: any) => !isIncomeTransaction(t.type)).reduce((sum: number, t: any) => sum + parseAmount(t.amount), 0);
          overview.totalRevenue = Math.max(overview.totalRevenue, income);
          overview.totalExpenses = Math.max(overview.totalExpenses, expense);
        }
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data.success) {
        const invList = invoicesRes.value.data.data?.invoices || [];
        if (invList.length > 0) {
          recentInvoices = invList.slice(0, 10).map((inv: any) => ({
            id: inv.invoiceNumber || inv._id,
            invoiceNumber: inv.invoiceNumber,
            student: inv.student?.user?.name || inv.student?.name || inv.studentName || 'N/A',
            amount: parseAmount(inv.totalAmount),
            status: inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : 'Pending',
            date: inv.createdAt
          }));
        }
      }

      let tuitionStats = { total: 0, pending: 0, collected: 0 };
      let hostelStats = { total: 0, pending: 0, collected: 0 };
      let transportStats = { total: 0, pending: 0, collected: 0 };
      let hostelFeesList: any[] = [];
      let transportFeesList: any[] = [];

      if (accountantFeesRes.status === 'fulfilled' && accountantFeesRes.value.data.success) {
        const feeData = accountantFeesRes.value.data.data;
        if (feeData) {
          tuitionStats = feeData.overview?.tuitionFees || tuitionStats;
          hostelStats = feeData.overview?.hostelFees || hostelStats;
          transportStats = feeData.overview?.transportFees || transportStats;

          overview.totalRevenue = Math.max(overview.totalRevenue, feeData.overview?.totalRevenue || 0);
          overview.collectedFees = Math.max(overview.collectedFees, feeData.overview?.collectedFees || 0);
          overview.pendingFees = Math.max(overview.pendingFees, feeData.overview?.pendingFees || 0);

          hostelFeesList = feeData.hostelFees || [];
          transportFeesList = feeData.transportFees || [];

          const feePayments = (feeData.recentPayments || []).map((p: any) =>
            normalizeTransaction({
              date: p.createdAt || p.verifiedAt,
              description: `Fee collection${p.paymentId ? ` · ${p.paymentId}` : ''}`,
              type: 'income',
              amount: p.amount,
              status: p.status || 'completed',
              source: 'fees'
            })
          );
          const merged = [...recentTransactions, ...feePayments];
          const seen = new Set<string>();
          recentTransactions = merged.filter((t) => {
            const key = `${t.date}-${t.amount}-${t.description}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
        }
      } else if (accountantFeesRes.status === 'rejected') {
        apiErrors.push('Fee collections');
      }

      if (apiErrors.length > 0) {
        toast.warn(`Some data could not be loaded: ${apiErrors.join(', ')}`);
      }

      const collectionRate = overview.collectedFees + overview.pendingFees > 0
        ? Math.round((overview.collectedFees / (overview.collectedFees + overview.pendingFees)) * 100)
        : 0;

      setDashboardData({
        overview: {
          ...overview,
          tuitionFees: tuitionStats,
          hostelFees: hostelStats,
          transportFees: transportStats
        },
        recentTransactions,
        recentInvoices,
        salariesSummary,
        budgetsSummary,
        payrollSummary,
        counts: financeRes.status === 'fulfilled' ? financeRes.value.data.data?.counts : undefined,
        feeStats: { total: totalFees, pending: pendingFeesCount, collectionRate },
        expenseBreakdown: {},
        hostelFees: hostelFeesList,
        transportFees: transportFeesList
      });
    } catch (err: any) {
      console.error('Error fetching accountant dashboard data:', err);
      toast.error('Failed to load dashboard data');
      setDashboardData({
        overview: { totalRevenue: 0, totalExpenses: 0, pendingFees: 0, collectedFees: 0, currentMonthRevenue: 0, budgetUtilization: 0 },
        recentTransactions: [],
        feeStats: {},
        expenseBreakdown: {}
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds for realtime updates

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Accountant Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Accountant</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <Link to="/dashboard/accountant/fees" className="btn btn-primary text-white d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-cash me-1" />Manage Fees
          </Link>
          <Link to="/accounts/expenses" className="btn btn-success text-white d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-plus me-1" />Add Expense
          </Link>
        </div>
      </div>

      {/* INSTITUTION DETAILS */}
      <InstitutionDetailsCard 
        institution={institutionData || user?.institutionData} 
        userRole={user?.role}
      />

       {/* Welcome Banner */}
        <div className="row">
          <div className="col-md-12">
            <div className="card bg-primary mb-4">
              <div className="overlay-img">
                <img src="/assets/img/bg/shape-04.webp" alt="shape" className="img-fluid shape-01" />
                <img src="/assets/img/bg/shape-01.webp" alt="shape" className="img-fluid shape-02" />
              </div>
              <div className="card-body">
                <div className="d-flex align-items-xl-center justify-content-xl-between flex-xl-row flex-column">
                  <div className="mb-3 mb-xl-0">
                    <h1 className="text-white me-2">Welcome to Accountant Dashboard</h1>
                    <p className="text-white mb-0">Manage finances, fees, and expenses efficiently</p>
                  </div>
                  <p className="text-white mb-0"><i className="ti ti-refresh me-1" />Updated recently on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Fee breakdown: Tuition, Hostel, Transport */}
      <div className="row mt-2 mb-3">
        <div className="col-xl-4 col-lg-6 mb-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <h6 className="text-muted">Tuition</h6>
            <p className="mb-0">{dashboardData?.overview?.tuitionFees?.pending || 0} pending / {dashboardData?.overview?.tuitionFees?.collected || 0} paid</p>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 mb-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <h6 className="text-muted">Hostel</h6>
            <p className="mb-0">{dashboardData?.overview?.hostelFees?.pending || 0} pending / {dashboardData?.overview?.hostelFees?.collected || 0} paid</p>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 mb-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <h6 className="text-muted">Transport</h6>
            <p className="mb-0">{dashboardData?.overview?.transportFees?.pending || 0} pending / {dashboardData?.overview?.transportFees?.collected || 0} paid</p>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="row">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-primary text-white me-3 flex-shrink-0">
                  <i className="ti ti-currency-rupee fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">₹{dashboardData?.overview?.totalRevenue?.toLocaleString() || 0}</h4>
                  <p className="mb-0 text-muted">Total Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-danger text-white me-3 flex-shrink-0">
                  <i className="ti ti-cash-off fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">₹{dashboardData?.overview?.totalExpenses?.toLocaleString() || 0}</h4>
                  <p className="mb-0 text-muted">Total Expenses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-warning text-white me-3 flex-shrink-0">
                  <i className="ti ti-clock fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">₹{dashboardData?.overview?.pendingFees?.toLocaleString() || 0}</h4>
                  <p className="mb-0 text-muted">Pending Fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-success text-white me-3 flex-shrink-0">
                  <i className="ti ti-cash fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">₹{dashboardData?.overview?.collectedFees?.toLocaleString() || 0}</h4>
                  <p className="mb-0 text-muted">Collected Fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Type Breakdown */}
      <div className="row mt-4">
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-info text-white me-3 flex-shrink-0">
                  <i className="ti ti-book fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">{dashboardData?.overview?.tuitionFees?.collected || 0} paid</h4>
                  <p className="mb-0 text-muted">Tuition · {dashboardData?.overview?.tuitionFees?.pending || 0} pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-purple text-white me-3 flex-shrink-0">
                  <i className="ti ti-building fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">{dashboardData?.overview?.hostelFees?.collected || 0} paid</h4>
                  <p className="mb-0 text-muted">Hostel · {dashboardData?.overview?.hostelFees?.pending || 0} pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-orange text-white me-3 flex-shrink-0">
                  <i className="ti ti-bus fs-24"></i>
                </div>
                <div className="overflow-hidden flex-fill">
                  <h4 className="counter mb-0">{dashboardData?.overview?.transportFees?.collected || 0} paid</h4>
                  <p className="mb-0 text-muted">Transport · {dashboardData?.overview?.transportFees?.pending || 0} pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Invoices */}
      <div className="row mt-4">
        <div className="col-xl-6 col-md-12">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
              <h4 className="card-title"><i className="ti ti-receipt me-2 text-primary" />Recent Transactions</h4>
              <div className="d-flex gap-2">
                <Link to="/dashboard/accountant/transactions" className="btn btn-sm btn-primary">
                  <i className="ti ti-eye me-1" />View All
                </Link>
                <button className="btn btn-sm btn-outline-primary" onClick={() => exportToCSV(dashboardData?.recentTransactions || [], 'transactions')}>
                  <i className="ti ti-file-export me-1" />Export CSV
                </button>
              </div>
            </div>
            <div className="card-body">
              {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentTransactions.map((transaction: any, index: number) => (
                        <tr key={index}>
                          <td>{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                          <td className="text-truncate" style={{ maxWidth: 160 }}>{transaction.description || '-'}</td>
                          <td>
                            <span className={`badge ${transaction.type === 'income' || transaction.type === 'payment' ? 'bg-success' : 'bg-danger'}`}>
                              {transaction.type || 'income'}
                            </span>
                          </td>
                          <td className="fw-semibold">₹{transaction.amount?.toLocaleString() || 0}</td>
                          <td>
                            <span className={`badge ${transaction.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                              {transaction.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="ti ti-receipt-off fs-48 text-muted mb-3"></i>
                  <h5 className="text-muted">No transactions found</h5>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-md-12">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
              <h4 className="card-title"><i className="ti ti-file-text me-2 text-info" />Recent Invoices</h4>
              <div className="d-flex gap-2">
                <Link to="/dashboard/accountant/invoices" className="btn btn-sm btn-info text-white">
                  <i className="ti ti-eye me-1" />View All
                </Link>
                <button className="btn btn-sm btn-outline-info" onClick={() => exportToCSV(dashboardData?.recentInvoices || [], 'invoices')}>
                  <i className="ti ti-file-export me-1" />Export CSV
                </button>
              </div>
            </div>
            <div className="card-body">
              {dashboardData?.recentInvoices && dashboardData.recentInvoices.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Inv #</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentInvoices.map((invoice: any, index: number) => (
                        <tr key={index}>
                          <td>{invoice.id || invoice.invoiceNumber}</td>
                          <td>{invoice.student || 'N/A'}</td>
                          <td className="fw-semibold">₹{parseAmount(invoice.amount).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${invoice.status === 'Paid' || invoice.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                              {invoice.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="ti ti-file-off fs-48 text-muted mb-3"></i>
                  <h5 className="text-muted">No invoices found</h5>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AccountantFinancePayrollSection
        salariesSummary={dashboardData?.salariesSummary}
        payrollSummary={dashboardData?.payrollSummary}
        budgetsSummary={dashboardData?.budgetsSummary}
      />

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title"><i className="ti ti-bolt me-2 text-warning" />Quick Actions</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <Link to="/dashboard/accountant/fees" className="btn btn-primary w-100 mb-2">
                    <i className="ti ti-cash me-2" />Manage Fees
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/accounts/expenses" className="btn btn-danger w-100 mb-2">
                    <i className="ti ti-receipt me-2" />Add Expense
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/reports/fees" className="btn btn-success w-100 mb-2">
                    <i className="ti ti-chart-bar me-2" />Financial Reports
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/accounts/invoices" className="btn btn-info w-100 mb-2">
                    <i className="ti ti-file-text me-2" />Generate Invoice
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/dashboard/accountant/salaries" className="btn btn-warning w-100 mb-2">
                    <i className="ti ti-wallet me-2" />View Salaries
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/dashboard/accountant/payroll" className="btn btn-secondary w-100 mb-2">
                    <i className="ti ti-users me-2" />View Payroll
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/dashboard/accountant/budgets" className="btn btn-dark w-100 mb-2">
                    <i className="ti ti-chart-pie me-2" />View Budgets
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboardPage;
