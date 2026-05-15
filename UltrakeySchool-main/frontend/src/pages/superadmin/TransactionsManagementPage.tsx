import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

interface Transaction {
  id: string
  schoolId: string
  schoolName: string
  plan: string
  amount: number
  currency: string
  date: string
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded'
  paymentMethod: string
  transactionId: string
  invoiceId: string
  description: string
  createdBy: string
  createdAt: string
  gstAmount: number
  totalAmount: number
  refundAmount?: number
  refundReason?: string
  failureReason?: string
  retryCount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  transactionId: string
  schoolId: string
  schoolName: string
  plan: string
  amount: number
  gstAmount: number
  totalAmount: number
  date: string
  status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled'
  dueDate: string
  paidDate?: string
}

interface InstitutionRevenue {
  schoolId: string
  schoolName: string
  totalRevenue: number
  totalGST: number
  totalAmount: number
  transactionCount: number
  plan: string
  lastTransaction: string
}

interface PlanRevenue {
  planName: string
  totalRevenue: number
  totalGST: number
  totalAmount: number
  transactionCount: number
  averageAmount: number
  growth: number
}

const extractPlanName = (plan: any): string => {
  if (!plan) return 'Unknown'
  if (typeof plan === 'string') return plan
  if (typeof plan === 'object' && plan.name) return plan.name
  return 'Unknown'
}

const TransactionsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'failed' | 'refunds' | 'invoices' | 'analytics' | 'institution' | 'plan' | 'tax'>('transactions')
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [transactions] = useState<Transaction[]>([])
  const [invoices] = useState<Invoice[]>([])

  const formatCurrency = (amount: number, currency: string = '₹') => {
    return `${currency}${amount.toLocaleString('en-IN')}`
  }

  // Revenue calculations
  const institutionRevenue = useMemo(() => {
    const revenueMap = new Map<string, InstitutionRevenue>()
    
    transactions.forEach((transaction: { status: string; schoolId: string; amount: number; gstAmount: number; totalAmount: number; date: string; schoolName: any; plan: any }) => {
      if (transaction.status === 'Completed') {
        const planName = extractPlanName(transaction.plan)
        const existing = revenueMap.get(transaction.schoolId)
        if (existing) {
          existing.totalRevenue += transaction.amount
          existing.totalGST += transaction.gstAmount
          existing.totalAmount += transaction.totalAmount
          existing.transactionCount += 1
          existing.lastTransaction = transaction.date
        } else {
          revenueMap.set(transaction.schoolId, {
            schoolId: transaction.schoolId,
            schoolName: transaction.schoolName,
            totalRevenue: transaction.amount,
            totalGST: transaction.gstAmount,
            totalAmount: transaction.totalAmount,
            transactionCount: 1,
            plan: planName,
            lastTransaction: transaction.date
          })
        }
      }
    })
    
    return Array.from(revenueMap.values())
  }, [transactions])

  const planRevenue = useMemo(() => {
    const revenueMap = new Map<string, PlanRevenue>()
    
    transactions.forEach((transaction: { status: string; plan: any; amount: number; gstAmount: number; totalAmount: number }) => {
      if (transaction.status === 'Completed') {
        const planName = extractPlanName(transaction.plan)
        const existing = revenueMap.get(planName)
        if (existing) {
          existing.totalRevenue += transaction.amount
          existing.totalGST += transaction.gstAmount
          existing.totalAmount += transaction.totalAmount
          existing.transactionCount += 1
        } else {
          revenueMap.set(planName, {
            planName: planName,
            totalRevenue: transaction.amount,
            totalGST: transaction.gstAmount,
            totalAmount: transaction.totalAmount,
            transactionCount: 1,
            averageAmount: transaction.amount,
            growth: Math.random() * 20 - 5 // Random growth for demo
          })
        }
      }
    })
    
    // Calculate averages
    revenueMap.forEach(plan => {
      plan.averageAmount = plan.totalRevenue / plan.transactionCount
    })
    
    return Array.from(revenueMap.values())
  }, [transactions])

  const taxReport = useMemo(() => {
    const totalGST = transactions
      .filter((t: { status: string }) => t.status === 'Completed')
      .reduce((sum: any, t: { gstAmount: any }) => sum + t.gstAmount, 0)
    
    const totalRevenue = transactions
      .filter((t: { status: string }) => t.status === 'Completed')
      .reduce((sum: any, t: { amount: any }) => sum + t.amount, 0)
    
    const totalAmount = transactions
      .filter((t: { status: string }) => t.status === 'Completed')
      .reduce((sum: any, t: { totalAmount: any }) => sum + t.totalAmount, 0)
    
    return {
      totalGST,
      totalRevenue,
      totalAmount,
      gstRate: 18, // 18% GST
      taxableAmount: totalRevenue,
      cgst: totalGST / 2,
      sgst: totalGST / 2
    }
  }, [transactions])

  // Transaction action handlers
  const handleViewDetails = (transactionId: string) => {
    console.log('Navigate to transaction details:', transactionId)
    window.location.href = `/super-admin/transactions/${transactionId}`
  }

  const handleViewInvoice = (invoiceId: string) => {
    console.log('Navigate to invoice details:', invoiceId)
    window.location.href = `/super-admin/transactions/invoices/${invoiceId}`
  }

  const handleProcessRefund = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setRefundAmount(transaction.amount.toString())
    setShowRefundModal(true)
  }

  const handleConfirmRefund = () => {
    if (selectedTransaction && refundAmount && refundReason) {
      console.log('Processing refund:', {
        transactionId: selectedTransaction.id,
        amount: refundAmount,
        reason: refundReason
      })
      alert(`Refund of ${formatCurrency(parseInt(refundAmount))} processed for transaction ${selectedTransaction.id}`)
      setShowRefundModal(false)
      setSelectedTransaction(null)
      setRefundAmount('')
      setRefundReason('')
    }
  }

  const handleDownloadReceipt = (transactionId: string) => {
    console.log('Download receipt:', transactionId)
    alert(`Downloading receipt for transaction: ${transactionId}`)
  }

  const handleRetryPayment = (transactionId: string) => {
    console.log('Retry payment:', transactionId)
    if (window.confirm('Are you sure you want to retry payment for this transaction?')) {
      alert(`Payment retry initiated for transaction: ${transactionId}`)
    }
  }

  const handleExportCSV = () => {
    const csvData = transactions.map((t: { transactionId: any; schoolName: any; plan: any; amount: any; gstAmount: any; totalAmount: any; status: any; date: any; paymentMethod: any }) => [
      t.transactionId,
      t.schoolName,
      t.plan,
      t.amount,
      t.gstAmount,
      t.totalAmount,
      t.status,
      t.date,
      t.paymentMethod
    ])
    
    const headers = ['Transaction ID', 'School', 'Plan', 'Amount', 'GST', 'Total', 'Status', 'Date', 'Payment Method']
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<string>('30days')

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Completed: 'bg-success',
      Pending: 'bg-warning',
      Failed: 'bg-danger',
      Refunded: 'bg-info'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      Basic: 'bg-info',
      Professional: 'bg-warning',
      Premium: 'bg-danger'
    }
    return planConfig[plan as keyof typeof planConfig] || 'bg-secondary'
  }

  const getPaymentIcon = (method: string) => {
    const iconConfig = {
      'Credit Card': 'ti ti-credit-card',
      'PayPal': 'ti ti-brand-paypal',
      'Bank Transfer': 'ti ti-building-bank',
      'Stripe': 'ti ti-brand-stripe'
    }
    return iconConfig[method as keyof typeof iconConfig] || 'ti ti-credit-card'
  }

  const filteredTransactions = transactions.filter((transaction: { status: string; plan: string; schoolName: string; transactionId: string; invoiceId: string }) => {
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesPlan = filterPlan === 'all' || transaction.plan === filterPlan
    const matchesSearch = transaction.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesPlan && matchesSearch
  })

  const totalRevenue = transactions
    .filter((t: { status: string }) => t.status === 'Completed')
    .reduce((sum: any, t: { totalAmount: any }) => sum + t.totalAmount, 0)

  const pendingAmount = transactions
    .filter((t: { status: string }) => t.status === 'Pending')
    .reduce((sum: any, t: { totalAmount: any }) => sum + t.totalAmount, 0)

  const failedTransactions = transactions.filter((t: { status: string }) => t.status === 'Failed')
  const refundedTransactions = transactions.filter((t: { status: string }) => t.status === 'Refunded')

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Billing & Transactions</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Billing & Transactions</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="btn btn-light fw-medium dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item" onClick={handleExportCSV}>
                  <i className="ti ti-file-type-csv me-2"></i>Export as CSV
                </button>
              </li>
              <li>
                <button className="dropdown-item">
                  <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item">
                  <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-tabs-bottom d-flex justify-content-between" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <i className="ti ti-credit-card me-2"></i>All Transactions
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'failed' ? 'active' : ''}`}
                onClick={() => setActiveTab('failed')}
              >
                <i className="ti ti-alert-triangle me-2"></i>Failed Payments
                <span className="badge bg-danger ms-2">{failedTransactions.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'refunds' ? 'active' : ''}`}
                onClick={() => setActiveTab('refunds')}
              >
                <i className="ti ti-arrow-back-up me-2"></i>Refunds
                <span className="badge bg-info ms-2">{refundedTransactions.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                <i className="ti ti-file-text me-2"></i>Invoices
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <i className="ti ti-chart-bar me-2"></i>Revenue Analytics
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'institution' ? 'active' : ''}`}
                onClick={() => setActiveTab('institution')}
              >
                <i className="ti ti-building me-2"></i>Institution-wise
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'plan' ? 'active' : ''}`}
                onClick={() => setActiveTab('plan')}
              >
                <i className="ti ti-crown me-2"></i>Plan-wise
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'tax' ? 'active' : ''}`}
                onClick={() => setActiveTab('tax')}
              >
                <i className="ti ti-receipt me-2"></i>GST/Tax Reports
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{formatCurrency(totalRevenue)}</h4>
                  <p className="text-white mb-0">Total Revenue</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{formatCurrency(pendingAmount)}</h4>
                  <p className="text-white mb-0">Pending Amount</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-clock text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-danger">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{failedTransactions.length}</h4>
                  <p className="text-white mb-0">Failed Payments</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-alert-triangle text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{formatCurrency(taxReport.totalGST)}</h4>
                  <p className="text-white mb-0">Total GST</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-receipt text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title">Filters</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Search</label>
                    <div className="input-group">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Search by school, transaction ID, or invoice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-outline-secondary" type="button">
                        <i className="ti ti-search"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Plan</label>
                    <select 
                      className="form-select"
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                    >
                      <option value="all">All Plans</option>
                      <option value="Basic">Basic</option>
                      <option value="Professional">Professional</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Date Range</label>
                    <select 
                      className="form-select"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                      <option value="365days">Last Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Transactions ({filteredTransactions.length})</h4>
              <div className="text-muted">
                Total: {formatCurrency(totalRevenue)} | Pending: {formatCurrency(pendingAmount)}
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>School</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>GST</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction: Transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <span className="text-muted font-monospace">{transaction.transactionId}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-2">
                              <i className="ti ti-building text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-medium">{transaction.schoolName}</div>
                              <small className="text-muted">ID: {transaction.schoolId}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getPlanBadge(transaction.plan)}`}>
                            {transaction.plan}
                          </span>
                        </td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{formatCurrency(transaction.gstAmount)}</td>
                        <td>{formatCurrency(transaction.totalAmount)}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`${getPaymentIcon(transaction.paymentMethod)} me-2`}></i>
                            {transaction.paymentMethod}
                          </div>
                        </td>
                        <td>{transaction.date}</td>
                        <td>
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button className="dropdown-item" onClick={() => handleViewDetails(transaction.transactionId)}>
                                  <i className="ti ti-eye me-2"></i>View Details
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => handleViewInvoice(transaction.invoiceId)}>
                                  <i className="ti ti-file-text me-2"></i>View Invoice
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => handleDownloadReceipt(transaction.transactionId)}>
                                  <i className="ti ti-download me-2"></i>Download Receipt
                                </button>
                              </li>
                              <li>
                                <hr className="dropdown-divider" />
                              </li>
                              {transaction.status === 'Failed' && (
                                <li>
                                  <button className="dropdown-item" onClick={() => handleRetryPayment(transaction.transactionId)}>
                                    <i className="ti ti-refresh me-2"></i>Retry Payment
                                  </button>
                                </li>
                              )}
                              {transaction.status === 'Completed' && (
                                <li>
                                  <button className="dropdown-item" onClick={() => handleProcessRefund(transaction)}>
                                    <i className="ti ti-arrow-back-up me-2"></i>Process Refund
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'failed' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Failed Payments ({failedTransactions.length})</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>School</th>
                    <th>Amount</th>
                    <th>Failure Reason</th>
                    <th>Retry Count</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {failedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className="text-muted font-monospace">{transaction.transactionId}</span>
                      </td>
                      <td>{transaction.schoolName}</td>
                      <td>{formatCurrency(transaction.totalAmount)}</td>
                      <td>
                        <span className="badge bg-danger">{transaction.failureReason}</span>
                      </td>
                      <td>
                        <span className="badge bg-warning">{transaction.retryCount} retries</span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRetryPayment(transaction.transactionId as string)}
                        >
                          <i className="ti ti-refresh me-1"></i>Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Refunds ({refundedTransactions.length})</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>School</th>
                    <th>Refund Amount</th>
                    <th>Refund Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refundedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className="text-muted font-monospace">{transaction.transactionId}</span>
                      </td>
                      <td>{transaction.schoolName}</td>
                      <td>{formatCurrency(transaction.refundAmount || 0)}</td>
                      <td>{transaction.refundReason}</td>
                      <td>{transaction.date}</td>
                      <td>
                        <button className="btn btn-sm btn-info">
                          <i className="ti ti-file-text me-1"></i>View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Invoices ({invoices.length})</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>School</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>GST</th>    
                    <th>Total</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>  
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <span className="fw-medium">{invoice.invoiceNumber}</span>
                      </td>
                      <td>{invoice.schoolName}</td>
                      <td>
                        <span className={`badge ${getPlanBadge(invoice.plan as string)}`}>
                          {invoice.plan}
                        </span>
                      </td>
                      <td>{formatCurrency(invoice.amount)}</td>
                      <td>{formatCurrency(invoice.gstAmount)}</td>
                      <td>{formatCurrency(invoice.totalAmount)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
                          {invoice.status as string}
                        </span>
                      </td>
                      <td>{invoice.dueDate}</td>
                      <td>
                        <button className="btn btn-sm btn-primary">
                          <i className="ti ti-download me-1"></i>Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Revenue Overview</h4>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Revenue</span>
                    <strong>{formatCurrency(taxReport.totalAmount)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Net Revenue (Excl. GST)</span>
                    <strong>{formatCurrency(taxReport.totalRevenue)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total GST Collected</span>
                    <strong>{formatCurrency(taxReport.totalGST)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>GST Rate</span>
                    <strong>{taxReport.gstRate}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Transaction Summary</h4>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Completed</span>
                    <strong className="text-success">{transactions.filter((t: { status: string }) => t.status === 'Completed').length}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pending</span>
                    <strong className="text-warning">{transactions.filter((t: { status: string }) => t.status === 'Pending').length}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Failed</span>
                    <strong className="text-danger">{failedTransactions.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Refunded</span>
                    <strong className="text-info">{refundedTransactions.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'institution' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Institution-wise Revenue</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Plan</th>
                    <th>Transactions</th>
                    <th>Revenue</th>
                    <th>GST</th>
                    <th>Total Amount</th>
                    <th>Last Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {institutionRevenue.map((institution) => (
                    <tr key={institution.schoolId}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <i className="ti ti-building text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-medium">{institution.schoolName}</div>
                            <small className="text-muted">ID: {institution.schoolId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getPlanBadge(institution.plan)}`}>
                          {institution.plan}
                        </span>
                      </td>
                      <td>{institution.transactionCount}</td>
                      <td>{formatCurrency(institution.totalRevenue)}</td>
                      <td>{formatCurrency(institution.totalGST)}</td>
                      <td>{formatCurrency(institution.totalAmount)}</td>
                      <td>{institution.lastTransaction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Plan-wise Revenue</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Transactions</th>
                    <th>Average Amount</th>
                    <th>Total Revenue</th>
                    <th>GST</th>
                    <th>Total Amount</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {planRevenue.map((plan) => (
                    <tr key={plan.planName}>
                      <td>
                        <span className={`badge ${getPlanBadge(plan.planName)} fs-6`}>
                          {plan.planName}
                        </span>
                      </td>
                      <td>{plan.transactionCount}</td>
                      <td>{formatCurrency(plan.averageAmount)}</td>
                      <td>{formatCurrency(plan.totalRevenue)}</td>
                      <td>{formatCurrency(plan.totalGST)}</td>
                      <td>{formatCurrency(plan.totalAmount)}</td>
                      <td>
                        <span className={`badge ${plan.growth >= 0 ? 'bg-success' : 'bg-danger'}`}>
                          {plan.growth >= 0 ? '+' : ''}{plan.growth.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">GST/Tax Report</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="mb-3">Tax Summary</h6>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Taxable Amount</span>
                        <strong>{formatCurrency(taxReport.taxableAmount)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>GST Rate</span>
                        <strong>{taxReport.gstRate}%</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>CGST (9%)</span>
                        <strong>{formatCurrency(taxReport.cgst)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>SGST (9%)</span>
                        <strong>{formatCurrency(taxReport.sgst)}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Total GST</span>
                        <strong className="text-primary">{formatCurrency(taxReport.totalGST)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3">Financial Summary</h6>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Net Revenue</span>
                        <strong>{formatCurrency(taxReport.totalRevenue)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total GST</span>
                        <strong>{formatCurrency(taxReport.totalGST)}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Total Amount</span>
                        <strong className="text-success">{formatCurrency(taxReport.totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Tax Breakdown</h4>
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  <h2 className="text-primary">{formatCurrency(taxReport.totalGST)}</h2>
                  <p className="text-muted">Total GST Collected</p>
                </div>
                <div className="progress mb-3" style={{height: '8px'}}>
                  <div className="progress-bar bg-info" style={{width: '50%'}}>CGST</div>
                  <div className="progress-bar bg-warning" style={{width: '50%'}}>SGST</div>
                </div>
                <div className="d-flex justify-content-between">
                  <small>CGST: {formatCurrency(taxReport.cgst)}</small>
                  <small>SGST: {formatCurrency(taxReport.sgst)}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Process Refund</h5>
                <button type="button" className="btn-close" onClick={() => setShowRefundModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Transaction ID</label>
                  <input type="text" className="form-control" value={selectedTransaction.transactionId} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">School</label>
                  <input type="text" className="form-control" value={selectedTransaction.schoolName} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Original Amount</label>
                  <input type="text" className="form-control" value={formatCurrency(selectedTransaction.totalAmount)} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Refund Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={selectedTransaction.totalAmount.toString()}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Refund Reason</label>
                  <textarea 
                    className="form-control"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    placeholder="Enter refund reason..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRefundModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleConfirmRefund}>
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </>
  )
}

export default TransactionsManagementPage
