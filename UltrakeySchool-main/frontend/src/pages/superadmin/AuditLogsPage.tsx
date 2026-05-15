import React, { useState, useEffect, useMemo } from 'react'
import { apiService } from '../../services/api'

interface AuditLog {
  _id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: string
  category: 'plan-change' | 'suspension' | 'password-reset' | 'login' | 'impersonation' | 'module-change' | 'settings-change'
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure' | 'warning'
  institutionId?: string
  institutionName?: string
}

const AuditLogsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('7days')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = {
        category: selectedCategory,
        status: selectedStatus,
        dateRange: dateRange,
        search: searchTerm,
        page: '1',
        limit: '100'
      }

      const data = await apiService.get<AuditLog[]>('/audit', params)

      if (data.success) {
        setAuditLogs(data.data || [])
      } else {
        const message = typeof data.error === 'string' ? data.error : data.message
        throw new Error(message || 'Failed to fetch audit logs')
      }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error)
      const status = error?.response?.status
      // Check if it's a connection error
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        setError('Backend server is not running. Please start the backend server to use audit logs.')
      } else if (status === 500) {
        setError('Server error: The audit logs service is temporarily unavailable. Please try again later or contact support.')
      } else {
        setError(error.message || 'Failed to fetch audit logs')
      }
      // Fallback to empty array on error
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [selectedCategory, selectedStatus, dateRange, searchTerm])

  // Use useMemo for filtered logs
  const filteredLogs = useMemo(() => {
    let logs = [...auditLogs];
    
    if (selectedCategory !== 'all') {
      logs = logs.filter(log => log.category === selectedCategory);
    }
    if (selectedStatus !== 'all') {
      logs = logs.filter(log => log.status === selectedStatus);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      logs = logs.filter(log => 
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      );
    }
    
    return logs;
  }, [auditLogs, selectedCategory, selectedStatus, searchTerm])

  const summaryStats = useMemo(() => {
    const total = filteredLogs.length
    const success = filteredLogs.filter(log => log.status === 'success').length
    const failure = filteredLogs.filter(log => log.status === 'failure').length
    const warning = filteredLogs.filter(log => log.status === 'warning').length
    return { total, success, failure, warning }
  }, [filteredLogs])

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
      <div className="alert alert-warning m-4">
        <h4><i className="ti ti-alert-triangle me-2"></i>Audit Logs Unavailable</h4>
        <p>{error}</p>
        <p className="mb-0 text-muted small">
          This may be due to database configuration or missing audit log records. 
          Please check the backend console for detailed error information.
        </p>
      </div>
    )
  }

  // Helper functions
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'plan-change': 'ti ti-arrow-up-down',
      'suspension': 'ti ti-ban',
      'password-reset': 'ti ti-lock',
      'login': 'ti ti-login',
      'impersonation': 'ti ti-user-share',
      'module-change': 'ti ti-settings',
      'settings-change': 'ti ti-adjustments'
    }
    return icons[category] || 'ti ti-file-text'
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'success': 'bg-success',
      'failure': 'bg-danger',
      'warning': 'bg-warning'
    }
    return badges[status] || 'bg-secondary'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'plan-change': 'Plan Change',
      'suspension': 'Suspension',
      'password-reset': 'Password Reset',
      'login': 'Login',
      'impersonation': 'Impersonation',
      'module-change': 'Module Change',
      'settings-change': 'Settings Change'
    }
    return labels[category] || category
  }

  return (
    <div className="">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Audit Logs</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Audit Logs
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              title="Refresh"
              onClick={fetchAuditLogs}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="btn btn-light fw-medium dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu">
              <li><a className="dropdown-item" href="#"><i className="ti ti-file-type-pdf me-2"></i>Export as PDF</a></li>
              <li><a className="dropdown-item" href="#"><i className="ti ti-file-type-xls me-2"></i>Export as Excel</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{summaryStats.total}</h4>
                  <p className="text-white mb-0">Total Logs</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-file-text text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{summaryStats.success}</h4>
                  <p className="text-white mb-0">Success</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{summaryStats.failure}</h4>
                  <p className="text-white mb-0">Failures</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-x text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{summaryStats.warning}</h4>
                  <p className="text-white mb-0">Warnings</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-alert-triangle text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select 
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="plan-change">Plan Changes</option>
                <option value="suspension">Suspensions</option>
                <option value="password-reset">Password Resets</option>
                <option value="login">Logins</option>
                <option value="impersonation">Impersonations</option>
                <option value="module-change">Module Changes</option>
                <option value="settings-change">Settings Changes</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Date Range</label>
              <select 
                className="form-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Audit Logs</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Category</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <div className="fw-medium">{log.userName}</div>
                      <small className="text-muted">{log.userRole}</small>
                    </td>
                    <td>{log.action}</td>
                    <td>
                      <span className="d-flex align-items-center">
                        <i className={`${getCategoryIcon(log.category)} me-2`}></i>
                        {getCategoryLabel(log.category)}
                      </span>
                    </td>
                    <td>{log.resource}</td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }} title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(log.status)} text-white`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <code className="text-muted">{log.ipAddress}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-4">
              <i className="ti ti-file-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No audit logs found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditLogsPage
