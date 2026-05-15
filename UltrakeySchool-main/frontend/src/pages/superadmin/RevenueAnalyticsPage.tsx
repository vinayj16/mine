import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../../api/client'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface RevenueData {
  totalRevenue: number
  subscriptionRevenue: number
  addonRevenue: number
  transactions: number
  activeSubscriptions: number
  newSubscriptions: number
  churnedSubscriptions: number
  averageRevenue: number
  growth: number
}

interface InstitutionRevenue {
  _id: string
  name: string
  type: string
  subscription?: {
    plan: string
    status: string
  }
  monthlyRevenue: number
  totalTransactions: number
  lastPaymentDate?: string
}

const RevenueAnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  // Data state
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [institutionRevenue, setInstitutionRevenue] = useState<InstitutionRevenue[]>([])


  // Fetch revenue analytics
  const fetchRevenueAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if user is authenticated
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token available. Please log in again.')
      }

      // Use the correct super-admin analytics endpoints that exist
      const [revenueRes, summaryRes, schoolsRes] = await Promise.all([
        apiClient.get('/super-admin/analytics/revenue'),
        apiClient.get('/super-admin/analytics/summary'),
        apiClient.get('/schools', {
          params: { sortBy: 'monthlyRevenue', sortOrder: 'desc', limit: 10 }
        })
      ])

      // Process revenue data from super-admin analytics
      const revenue = revenueRes.data.data || revenueRes.data
      const summary = summaryRes.data.data || summaryRes.data

      setRevenueData({
        totalRevenue: revenue.totalRevenue || 0,
        subscriptionRevenue: revenue.subscriptionRevenue || 0,
        addonRevenue: revenue.addonRevenue || 0,
        transactions: summary.totalTransactions || 0,
        activeSubscriptions: summary.activeInstitutions || 0,
        newSubscriptions: summary.newInstitutions || 0,
        churnedSubscriptions: summary.inactiveInstitutions || 0,
        averageRevenue: revenue.averageRevenue || 0,
        growth: revenue.growthRate || 0
      })

      // Process institution data
      const schools = schoolsRes.data.data?.schools || schoolsRes.data.data || []
      setInstitutionRevenue(schools)
    } catch (err: any) {
      console.error('Error fetching revenue analytics:', err)
      let errorMessage = 'Failed to load revenue analytics'

      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.'
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to access this data.'
      } else if (err.response?.status === 404) {
        errorMessage = 'Revenue analytics endpoint not found.'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueAnalytics()
  }, [selectedPeriod, selectedYear])

  // Handle refresh
  const handleRefresh = () => {
    fetchRevenueAnalytics()
    toast.success('Data refreshed')
  }

  // Handle export
  const handleExport = (format: 'pdf' | 'excel') => {
    toast.info(`Exporting as ${format.toUpperCase()}...`)
    // Export functionality would be implemented here
  }

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h4>Error Loading Revenue Analytics</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchRevenueAnalytics}>
          <i className="ti ti-refresh me-2" />Retry
        </button>
      </div>
    )
  }

  // Calculate totals
  const totalRevenue = institutionRevenue.reduce((sum, inst) => sum + (inst.monthlyRevenue || 0), 0)
  const totalTransactions = institutionRevenue.reduce((sum, inst) => sum + (inst.totalTransactions || 0), 0)
  const activeInstitutions = institutionRevenue.filter(inst => inst.subscription?.status === 'Active').length

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Revenue Analytics</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Revenue Analytics</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={handleRefresh}>
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
                <button className="dropdown-item" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => handleExport('excel')}>
                  <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>


      {/* Period Selection */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Period</label>
                <select 
                  className="form-select"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Year</label>
                <select 
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">${revenueData?.totalRevenue.toLocaleString() || 0}</h4>
                  <p className="text-white mb-0">Total Revenue</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-dollar text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">${revenueData?.subscriptionRevenue.toLocaleString() || 0}</h4>
                  <p className="text-white mb-0">Subscription Revenue</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-crown text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">${revenueData?.addonRevenue.toLocaleString() || 0}</h4>
                  <p className="text-white mb-0">Addon Revenue</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-package text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{revenueData?.growth.toFixed(1) || 0}%</h4>
                  <p className="text-white mb-0">Growth Rate</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-trending-up text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{revenueData?.transactions || 0}</h4>
                  <p className="text-white mb-0">Total Transactions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-report-money text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{revenueData?.activeSubscriptions || 0}</h4>
                  <p className="text-white mb-0">Active Subscriptions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-check text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{revenueData?.newSubscriptions || 0}</h4>
                  <p className="text-white mb-0">New Subscriptions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-plus text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{revenueData?.churnedSubscriptions || 0}</h4>
                  <p className="text-white mb-0">Churned Subscriptions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-x text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Revenue Chart Placeholder */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Revenue Trend</h4>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <div className="text-center">
              <i className="ti ti-chart-line text-primary fs-1 mb-3"></i>
              <h5>Revenue Chart</h5>
              <p className="text-muted">
                {revenueData ? 
                  `Total Revenue: $${revenueData.totalRevenue.toLocaleString()} | Growth: ${revenueData.growth.toFixed(1)}%` :
                  'No data available'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Revenue Institutions */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Top Revenue Institutions</h4>
          <div className="d-flex align-items-center">
            <span className="badge bg-primary me-2">
              {activeInstitutions} Active
            </span>
            <button className="btn btn-outline-light bg-white btn-icon" onClick={handleRefresh}>
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {institutionRevenue.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Institution Name</th>
                    <th>Type</th>
                    <th>Plan</th>
                    <th>Revenue</th>
                    <th>Transactions</th>
                    <th>Status</th>
                    <th>Last Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {institutionRevenue.map((institution) => (
                    <tr key={institution._id}>
                      <td>
                        <div className="fw-medium">{institution.name}</div>
                      </td>
                      <td>
                        <span className="badge bg-info">{institution.type || 'N/A'}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {institution.subscription?.plan || 'No Plan'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium">${institution.monthlyRevenue?.toLocaleString() || 0}</div>
                      </td>
                      <td>{institution.totalTransactions || 0}</td>
                      <td>
                        <span className={`badge ${
                          institution.subscription?.status === 'Active' ? 'bg-success' : 
                          institution.subscription?.status === 'Suspended' ? 'bg-warning' : 
                          'bg-danger'
                        }`}>
                          {institution.subscription?.status || 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {institution.lastPaymentDate ? 
                          new Date(institution.lastPaymentDate).toLocaleDateString() : 
                          'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="ti ti-building-off text-muted fs-1 mb-3"></i>
              <h5>No Institutions Found</h5>
              <p className="text-muted">No revenue data available for the selected period</p>
            </div>
          )}
        </div>
        {institutionRevenue.length > 0 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {institutionRevenue.length} institutions
              </div>
              <div>
                Total Revenue: <strong>${totalRevenue.toLocaleString()}</strong> | 
                Total Transactions: <strong>{totalTransactions}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default RevenueAnalyticsPage
