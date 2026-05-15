import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiService } from '../../services/api'

interface Invoice {
  id: string
  invoiceId: string
  schoolId: string
  schoolName: string
  plan: string
  amount: number
  currency: string
  date: string
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded'
  description: string
  createdBy: string
  createdAt: string
  dueDate: string
  paidDate?: string
}

const InvoiceDetailsPage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch invoice details from API
        const response = await apiService.get(`/finance/invoices/${invoiceId}`)
        
        if (response.success && response.data) {
          setInvoice(response.data as Invoice)
        } else {
          setError('Failed to fetch invoice details')
        }
      } catch (err) {
        console.error('Error fetching invoice:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch invoice details')
      } finally {
        setLoading(false)
      }
    }

    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Completed: 'bg-success',
      Pending: 'bg-warning',
      Failed: 'bg-danger',
      Refunded: 'bg-info'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-warning">Invoice not found</div>
          <Link to="/super-admin/transactions" className="btn btn-primary">
            Back to Transactions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Invoice Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/transactions">Transactions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/super-admin/transactions/${invoiceId}`}>{invoiceId}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Details</li>
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

      {/* Invoice Details Card */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Invoice Information</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Invoice ID</label>
                    <div className="form-control-plaintext">{invoice.invoiceId}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">School</label>
                    <div className="form-control-plaintext">
                      <div className="fw-medium">{invoice.schoolName}</div>
                      <small className="text-muted">ID: {invoice.schoolId}</small>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Plan</label>
                    <div className="form-control-plaintext">
                      <span className={`badge bg-${invoice.plan === 'Premium' ? 'danger' : invoice.plan === 'Medium' ? 'warning' : 'info'}`}>
                        {invoice.plan}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount</label>
                    <div className="form-control-plaintext">${invoice.amount} {invoice.currency}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <div className="form-control-plaintext">{invoice.date}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <div className="form-control-plaintext">
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <div className="form-control-plaintext">{invoice.description}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <div className="form-control-plaintext">{invoice.dueDate}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Paid Date</label>
                    <div className="form-control-plaintext">{invoice.paidDate || 'Not paid yet'}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Created By</label>
                    <div className="form-control-plaintext">{invoice.createdBy}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Created At</label>
                    <div className="form-control-plaintext">{invoice.createdAt}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Billing Information</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Billing Address</label>
              </div>
              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <div className="form-control-plaintext">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-credit-card me-2 text-primary"></i>
                    Credit Card ending in 4242
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Next Billing Date</label>
                <div className="form-control-plaintext">2024-07-01</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InvoiceDetailsPage
