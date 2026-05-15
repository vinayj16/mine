import React, { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'

interface FinanceData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  pendingPayments: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    status: 'completed' | 'pending';
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

const FinancePage: React.FC = () => {
  const [data, setData] = useState<FinanceData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    pendingPayments: 0,
    recentTransactions: [],
    monthlyRevenue: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      
      try {
        const response = await apiClient.get('/finance/institution')
        if (response.data?.success && response.data?.data) {
          const apiData = response.data.data
          // Validate and ensure arrays exist
          setData({
            totalRevenue: apiData.totalRevenue || 0,
            totalExpenses: apiData.totalExpenses || 0,
            netIncome: apiData.netIncome || 0,
            pendingPayments: apiData.pendingPayments || 0,
            recentTransactions: Array.isArray(apiData.recentTransactions) ? apiData.recentTransactions : [],
            monthlyRevenue: Array.isArray(apiData.monthlyRevenue) ? apiData.monthlyRevenue : []
          })
        }
      } catch {
        // Use demo data - already set as initial state
      }
    } catch (err: any) {
      console.error('Error fetching finance data:', err)
    } finally {
      setLoading(false)
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

  const financeData = data

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Finance</h4>
          <p className="text-muted mb-0">
            {data ? 'Live financial data' : 'Manage financial records and transactions'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => fetchFinanceData()}
            disabled={loading}
          >
            <i className="ti ti-refresh me-1"></i>
            Refresh Data
          </button>
          {data && (
            <span className="badge bg-success ms-2">
              <i className="ti ti-database me-1"></i>
              Live Data
            </span>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <div className="card border-0 bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Total Revenue</h5>
                  <h3 className="mb-0">${financeData.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-cash fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Total Expenses</h5>
                  <h3 className="mb-0">${financeData.totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-wallet fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Net Income</h5>
                  <h3 className="mb-0">${financeData.netIncome.toLocaleString()}</h3>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-chart-line fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Pending Payments</h5>
                  <h3 className="mb-0">${financeData.pendingPayments.toLocaleString()}</h3>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-clock fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="row mt-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Transactions</h5>
            </div>
            <div className="card-body">
              {financeData.recentTransactions.length > 0 ? (
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
                      {financeData.recentTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{new Date(transaction.date).toLocaleDateString()}</td>
                          <td>{transaction.description}</td>
                          <td>
                            <span className={`badge ${
                              transaction.type === 'income' ? 'bg-success' : 'bg-danger'
                            }`}>
                              {transaction.type === 'income' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className={
                            transaction.type === 'income' ? 'text-success' : 'text-danger'
                          }>
                            ${Math.abs(transaction.amount).toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${
                              transaction.status === 'completed' ? 'bg-primary' : 'bg-warning'
                            }`}>
                              {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="ti ti-receipt-off fs-24 mb-2"></i>
                  <p>No transaction data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Monthly Overview</h5>
            </div>
            <div className="card-body">
              {financeData.monthlyRevenue.length > 0 ? (
                <div className="list-group list-group-flush">
                  {financeData.monthlyRevenue.map((month, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>{month.month}</strong>
                        <span className="badge bg-primary">
                          Net: ${(month.revenue - month.expenses).toLocaleString()}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-sm">
                        <span className="text-success">Revenue: ${month.revenue.toLocaleString()}</span>
                        <span className="text-danger">Expenses: ${month.expenses.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="ti ti-calendar-off fs-24 mb-2"></i>
                  <p>No monthly data available</p>
                </div>
              )}
            </div>
            <h5 className="text-muted">Finance Dashboard</h5>
            <p className="text-muted">Detailed financial management features will be available here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancePage
