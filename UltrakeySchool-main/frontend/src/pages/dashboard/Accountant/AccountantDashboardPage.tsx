import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalExpenses: number;
    pendingFees: number;
    collectedFees: number;
    currentMonthRevenue: number;
    budgetUtilization: number;
  };
  recentTransactions: any[];
  feeStats: any;
  expenseBreakdown: any;
}

const AccountantDashboardPage: React.FC = () => {
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
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('PDF generated - use print dialog to save');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [financeRes, feesRes, transactionsRes] = await Promise.allSettled([
        apiClient.get('/finance/dashboard'),
        apiClient.get('/finance/fees'),
        apiClient.get('/finance/transactions')
      ]);

      let overview = {
        totalRevenue: 0,
        totalExpenses: 0,
        pendingFees: 0,
        collectedFees: 0,
        currentMonthRevenue: 0,
        budgetUtilization: 0
      };
      let recentTransactions: any[] = [];
      let totalFees = 0;
      let pendingFeesCount = 0;

      if (financeRes.status === 'fulfilled' && financeRes.value.data.success) {
        const data = financeRes.value.data.data;
        overview = {
          totalRevenue: data.overview?.totalIncome || 0,
          totalExpenses: data.overview?.totalExpense || 0,
          pendingFees: data.overview?.pendingFees || 0,
          collectedFees: data.overview?.totalFees || 0,
          currentMonthRevenue: data.overview?.totalIncome || 0,
          budgetUtilization: 0
        };
        recentTransactions = data.recentTransactions || [];
      }

      if (feesRes.status === 'fulfilled' && feesRes.value.data.success) {
        const feesData = feesRes.value.data.data;
        if (Array.isArray(feesData)) {
          totalFees = feesData.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
          pendingFeesCount = feesData.filter((f: any) => f.status === 'pending' || f.status === 'unpaid').length;
        } else if (feesData?.feeStructures) {
          totalFees = feesData.feeStructures.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        }
        overview.collectedFees = totalFees;
        overview.pendingFees = pendingFeesCount * 1000;
      }

      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.data.success) {
        const transData = transactionsRes.value.data.data;
        if (Array.isArray(transData) && transData.length > 0) {
          recentTransactions = transData.slice(0, 10);
          const income = transData.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          const expense = transData.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          overview.totalRevenue = income;
          overview.totalExpenses = expense;
        }
      }

      setDashboardData({
        overview,
        recentTransactions,
        feeStats: { total: totalFees, pending: pendingFeesCount },
        expenseBreakdown: {}
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
          <Link to="/fees/collect" className="btn btn-primary text-white d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-cash me-1" />Collect Fees
          </Link>
          <Link to="/expenses/add" className="btn btn-success text-white d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-plus me-1" />Add Expense
          </Link>
        </div>
      </div>

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

      {/* Financial Overview Cards */}
      <div className="row">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl bg-primary text-white me-3 flex-shrink-0">
                  <i className="ti ti-currency-dollar fs-24"></i>
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

      {/* Recent Transactions */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
              <h4 className="card-title"><i className="ti ti-receipt me-2 text-primary" />Recent Transactions</h4>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => exportToCSV(dashboardData?.recentTransactions || [], 'transactions')}>
                  <i className="ti ti-file-export me-1" />Export CSV
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => exportToPDF(dashboardData?.recentTransactions || [], 'transactions')}>
                  <i className="ti ti-file-type-pdf me-1" />Export PDF
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
                          <td>{transaction.description || 'Transaction'}</td>
                          <td>
                            <span className={`badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}`}>
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
                  <p className="text-muted">Transactions will appear here once data is available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  <Link to="/fees/collect" className="btn btn-primary w-100 mb-2">
                    <i className="ti ti-cash me-2" />Collect Fees
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/expenses/add" className="btn btn-danger w-100 mb-2">
                    <i className="ti ti-receipt me-2" />Add Expense
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/reports/financial" className="btn btn-success w-100 mb-2">
                    <i className="ti ti-chart-bar me-2" />Financial Reports
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/invoices/generate" className="btn btn-info w-100 mb-2">
                    <i className="ti ti-file-text me-2" />Generate Invoice
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
