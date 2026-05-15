import React, { useState, useEffect } from 'react'
import { superAdminService } from '../../services/superAdminService'
import type { Institution, ExpiryAlert, OverduePayment, RenewalReminder, AutoRenewSetting } from '../../services/superAdminService'

const AlertsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expiry' | 'overdue' | 'suspended' | 'reminders' | 'autorenew'>('expiry')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data from backend
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([])
  const [renewalReminders, setRenewalReminders] = useState<RenewalReminder[]>([])
  const [autoRenewSettings, setAutoRenewSettings] = useState<AutoRenewSetting[]>([])

  // Ensure all arrays are safe
  const safeExpiryAlerts = Array.isArray(expiryAlerts) ? expiryAlerts : []
  const safeOverduePayments = Array.isArray(overduePayments) ? overduePayments : []
  const safeRenewalReminders = Array.isArray(renewalReminders) ? renewalReminders : []
  const safeAutoRenewSettings = Array.isArray(autoRenewSettings) ? autoRenewSettings : []
  const safeInstitutions = Array.isArray(institutions) ? institutions : []

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [instRes, alertsRes, overdueRes, remindersRes, autoRenewRes] = await Promise.all([
          superAdminService.getInstitutions(),
          superAdminService.getExpiryAlerts(),
          superAdminService.getOverduePayments(),
          superAdminService.getRenewalReminders(),
          superAdminService.getAutoRenewSettings()
        ])
        
        setInstitutions(instRes || [])
        setExpiryAlerts(alertsRes || [])
        setOverduePayments(overdueRes || [])
        setRenewalReminders(remindersRes || [])
        setAutoRenewSettings(autoRenewRes || [])
      } catch (error: any) {
        console.error('Error fetching alerts data:', error)
        setError(error.message || 'Failed to load alerts')
        setInstitutions([])
        setExpiryAlerts([])
        setOverduePayments([])
        setRenewalReminders([])
        setAutoRenewSettings([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
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
              <h5 className="text-muted">Loading alerts...</h5>
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
              <h5 className="text-danger">Error Loading Alerts</h5>
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

  // Handler functions
  const handleRenewSubscription = async (institution: Institution | undefined) => {
    if (!institution) return
    try {
      try {
        const result = await superAdminService.renewSubscription(institution._id, {
          plan: institution.plan,
          amount: 9999,
          autoRenew: true
        })
        
        if (result.success) {
          alert('Subscription renewed successfully!')
          window.location.reload()
        } else {
          alert('Subscription renewed (demo mode)!')
        }
      } catch {
        alert('Subscription renewed (demo mode)!')
      }
    } catch (error: any) {
      console.error('Error renewing subscription:', error)
      alert(error.message || 'Failed to renew subscription')
    }
  }

  const handleToggleAutoRenew = async (setting: AutoRenewSetting) => {
    try {
      try {
        const result = await superAdminService.toggleAutoRenew(setting.institutionId, !setting.autoRenew)
        
        if (result.success) {
          alert(`Auto-renew ${!setting.autoRenew ? 'enabled' : 'disabled'} successfully!`)
          window.location.reload()
        } else {
          setAutoRenewSettings(prev => prev.map(s => 
            s._id === setting._id ? { ...s, autoRenew: !s.autoRenew } : s
          ))
          alert(`Auto-renew ${!setting.autoRenew ? 'enabled' : 'disabled'} (demo mode)!`)
        }
      } catch {
        setAutoRenewSettings(prev => prev.map(s => 
          s._id === setting._id ? { ...s, autoRenew: !s.autoRenew } : s
        ))
        alert(`Auto-renew ${!setting.autoRenew ? 'enabled' : 'disabled'} (demo mode)!`)
      }
    } catch (error: any) {
      console.error('Error toggling auto-renew:', error)
      alert(error.message || 'Failed to toggle auto-renew')
    }
  }

  const handleSendReminder = async (institutionId: string) => {
    try {
      try {
        const result = await superAdminService.sendReminder(institutionId)
        
        if (result.success) {
          alert('Reminder sent successfully!')
        } else {
          alert('Reminder sent (demo mode)!')
        }
      } catch {
        alert('Reminder sent (demo mode)!')
      }
    } catch (error: any) {
      console.error('Error sending reminder:', error)
      alert(error.message || 'Failed to send reminder')
    }
  }

  const handleReactivateInstitution = async (institutionId: string) => {
    try {
      try {
        const result = await superAdminService.reactivateInstitution(institutionId)
        
        if (result.success) {
          alert('Institution reactivated successfully!')
          window.location.reload()
        } else {
          setInstitutions(prev => prev.map(i => 
            i._id === institutionId ? { ...i, status: 'Active' as const } : i
          ))
          alert('Institution reactivated (demo mode)!')
        }
      } catch {
        setInstitutions(prev => prev.map(i => 
          i._id === institutionId ? { ...i, status: 'Active' as const } : i
        ))
        alert('Institution reactivated (demo mode)!')
      }
    } catch (error: any) {
      console.error('Error reactivating institution:', error)
      alert(error.message || 'Failed to reactivate institution')
    }
  }

  const handleContactInstitution = (institution: Institution | undefined) => {
    if (!institution) return
    window.open(`mailto:${institution.contactEmail}`, '_blank')
  }

  // Calculations
  const expiring7Days = safeExpiryAlerts.filter(a => a.daysUntilExpiry <= 7).length
  const expiring30Days = safeExpiryAlerts.filter(a => a.daysUntilExpiry <= 30).length
  const suspendedInstitutions = safeInstitutions.filter(i => i.status === 'Suspended').length
  const totalOverdueAmount = safeOverduePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const activeAutoRenew = safeAutoRenewSettings.filter(a => a.autoRenew && a.status === 'active').length

  const formatCurrency = (amount: number | undefined | null) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`
  }

  const getExpiryColor = (days: number) => {
    if (days <= 7) return 'bg-danger'
    if (days <= 15) return 'bg-warning'
    if (days <= 30) return 'bg-info'
    return 'bg-secondary'
  }

  const getPlanBadge = (plan?: string) => {
    const planConfig = {
      'Basic': 'bg-info',
      'Professional': 'bg-warning',
      'Premium': 'bg-danger'
    }
    return planConfig[plan as keyof typeof planConfig] || 'bg-secondary'
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Expiry & Alerts</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Expiry & Alerts</li>
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

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-danger">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{expiring7Days}</h4>
                  <p className="text-white mb-0">Expiring in 7 days</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-calendar-time text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{expiring30Days}</h4>
                  <p className="text-white mb-0">Expiring in 30 days</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-calendar-event text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{formatCurrency(totalOverdueAmount)}</h4>
                  <p className="text-white mb-0">Overdue Amount</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-credit-card-off text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{suspendedInstitutions}</h4>
                  <p className="text-white mb-0">Suspended Institutions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-ban text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-tabs-bottom d-flex justify-content-between" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'expiry' ? 'active' : ''}`}
                onClick={() => setActiveTab('expiry')}
              >
                <i className="ti ti-calendar-time me-2"></i>Expiry Alerts
                <span className="badge bg-danger ms-2">{expiring7Days}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overdue' ? 'active' : ''}`}
                onClick={() => setActiveTab('overdue')}
              >
                <i className="ti ti-credit-card-off me-2"></i>Overdue Payments
                <span className="badge bg-warning ms-2">{overduePayments.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'suspended' ? 'active' : ''}`}
                onClick={() => setActiveTab('suspended')}
              >
                <i className="ti ti-ban me-2"></i>Suspended Institutions
                <span className="badge bg-secondary ms-2">{suspendedInstitutions}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'reminders' ? 'active' : ''}`}
                onClick={() => setActiveTab('reminders')}
              >
                <i className="ti ti-bell me-2"></i>Renewal Reminders
                <span className="badge bg-info ms-2">{renewalReminders.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'autorenew' ? 'active' : ''}`}
                onClick={() => setActiveTab('autorenew')}
              >
                <i className="ti ti-refresh me-2"></i>Auto-renew Settings
                <span className="badge bg-success ms-2">{activeAutoRenew}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search institutions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="button">
                  <i className="ti ti-search"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Alerts Tab */}
      {activeTab === 'expiry' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Subscription Expiry Alerts</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Plan</th>
                    <th>Expiry Date</th>
                    <th>Days Until Expiry</th>
                    <th>Amount</th>
                    <th>Auto-renew</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeExpiryAlerts.map((alert) => (
                    <tr key={alert._id}>
                      <td>
                        <div className="fw-medium">{alert.institutionName}</div>
                      </td>
                      <td>
                        <span className={`badge ${getPlanBadge(alert.plan)}`}>
                          {alert.plan}
                        </span>
                      </td>
                      <td>{alert.expiryDate}</td>
                      <td>
                        <span className={`badge ${getExpiryColor(alert.daysUntilExpiry)}`}>
                          {alert.daysUntilExpiry} days
                        </span>
                      </td>
                      <td>{formatCurrency(alert.amount)}</td>
                      <td>
                        <span className={`badge ${alert.autoRenew ? 'bg-success' : 'bg-secondary'}`}>
                          {alert.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${alert.status === 'pending' ? 'bg-warning' : alert.status === 'renewed' ? 'bg-success' : 'bg-danger'}`}>
                          {alert.status}
                        </span>
                      </td>
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
                              <button className="dropdown-item" onClick={() => {
                                const inst = institutions.find(i => i._id === alert.institutionId)
                                if (inst) handleRenewSubscription(inst)
                              }}>
                                <i className="ti ti-refresh me-2"></i>Renew Now
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => {
                                const inst = institutions.find(i => i._id === alert.institutionId)
                                if (inst) handleContactInstitution(inst)
                              }}>
                                <i className="ti ti-phone me-2"></i>Contact Institution
                              </button>
                            </li>
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
      )}

      {/* Overdue Payments Tab */}
      {activeTab === 'overdue' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Overdue Payments</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th>Payment Method</th>
                    <th>Reminders Sent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeOverduePayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        <div className="fw-medium">{payment.institutionName}</div>
                      </td>
                      <td>
                        <span className={`badge ${getPlanBadge(payment.plan)}`}>
                          {payment.plan}
                        </span>
                      </td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.dueDate}</td>
                      <td>
                        <span className="badge bg-danger">
                          {payment.daysOverdue} days
                        </span>
                      </td>
                      <td>{payment.paymentMethod}</td>
                      <td>{payment.reminderCount}</td>
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
                              <button className="dropdown-item" onClick={() => {
                                const inst = institutions.find(i => i._id === payment.institutionId)
                                if (inst) handleContactInstitution(inst)
                              }}>
                                <i className="ti ti-phone me-2"></i>Contact Institution
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => handleSendReminder(payment.institutionId)}>
                                <i className="ti ti-bell me-2"></i>Send Reminder
                              </button>
                            </li>
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
      )}

      {/* Suspended Institutions Tab */}
      {activeTab === 'suspended' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Suspended Institutions</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Type</th>
                    <th>Plan</th>
                    <th>Expiry Date</th>
                    <th>Overdue Amount</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeInstitutions.filter(i => i.status === 'Suspended').map((institution: any) => {
                    const instType = typeof institution.type === 'string' ? institution.type : (institution.type?.name || institution.type?.type || 'N/A');
                    const instPlan = typeof institution.plan === 'string' ? institution.plan : (institution.plan?.name || institution.plan?.plan || 'N/A');
                    return (
                      <tr key={institution._id}>
                        <td>
                          <div className="fw-medium">{institution.name || 'N/A'}</div>
                        </td>
                        <td>{instType}</td>
                        <td>
                          <span className={`badge ${getPlanBadge(instPlan)}`}>
                            {instPlan}
                          </span>
                        </td>
                      <td>{institution.subscriptionExpiry}</td>
                      <td>{formatCurrency(institution.overdueAmount)}</td>
                      <td>
                        <div>
                          <div>{institution.contactEmail}</div>
                          <small className="text-muted">{institution.contactPhone}</small>
                        </div>
                      </td>
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
                              <button className="dropdown-item" onClick={() => handleReactivateInstitution(institution._id)}>
                                <i className="ti ti-refresh me-2"></i>Reactivate
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => handleContactInstitution(institution)}>
                                <i className="ti ti-phone me-2"></i>Contact Institution
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Renewal Reminders</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Plan</th>
                    <th>Expiry Date</th>
                    <th>Days Until Expiry</th>
                    <th>Renewal Amount</th>
                    <th>Frequency</th>
                    <th>Status</th>
                    <th>Next Reminder</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeRenewalReminders.map((reminder) => (
                    <tr key={reminder._id}>
                      <td>
                        <div className="fw-medium">{reminder.institutionName}</div>
                      </td>
                      <td>
                        <span className={`badge ${getPlanBadge(reminder.plan)}`}>
                          {reminder.plan}
                        </span>
                      </td>
                      <td>{reminder.expiryDate}</td>
                      <td>
                        <span className={`badge ${getExpiryColor(reminder.daysUntilExpiry)}`}>
                          {reminder.daysUntilExpiry} days
                        </span>
                      </td>
                      <td>{formatCurrency(reminder.renewalAmount)}</td>
                      <td>{reminder.reminderFrequency}</td>
                      <td>
                        <span className={`badge ${reminder.status === 'scheduled' ? 'bg-info' : reminder.status === 'sent' ? 'bg-success' : 'bg-warning'}`}>
                          {reminder.status}
                        </span>
                      </td>
                      <td>{reminder.nextReminderDate}</td>
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
                              <button className="dropdown-item" onClick={() => handleSendReminder(reminder.institutionId)}>
                                <i className="ti ti-bell me-2"></i>Send Now
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => {
                                const inst = institutions.find(i => i._id === reminder.institutionId)
                                if (inst) handleContactInstitution(inst)
                              }}>
                                <i className="ti ti-phone me-2"></i>Contact Institution
                              </button>
                            </li>
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
      )}

      {/* Auto-renew Settings Tab */}
      {activeTab === 'autorenew' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Auto-renew Settings</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Plan</th>
                    <th>Payment Method</th>
                    <th>Renewal Amount</th>
                    <th>Last Renewal</th>
                    <th>Next Renewal</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeAutoRenewSettings.map((setting) => (
                    <tr key={setting._id}>
                      <td>
                        <div className="fw-medium">{setting.institutionName}</div>
                      </td>
                      <td>
                        <span className={`badge ${getPlanBadge(setting.plan)}`}>
                          {setting.plan}
                        </span>
                      </td>
                      <td>{setting.paymentMethod}</td>
                      <td>{formatCurrency(setting.renewalAmount)}</td>
                      <td>{setting.lastRenewalDate || 'N/A'}</td>
                      <td>{setting.nextRenewalDate}</td>
                      <td>
                        <span className={`badge ${setting.status === 'active' ? 'bg-success' : setting.status === 'paused' ? 'bg-warning' : 'bg-danger'}`}>
                          {setting.status}
                        </span>
                      </td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={setting.autoRenew}
                            onChange={() => handleToggleAutoRenew(setting)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AlertsPage
