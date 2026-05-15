import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import agentService, { type Agent, type AgentSettings } from '../../services/agentService'

interface AgentStatistics {
  totalInstitutions: number;
  activeInstitutions: number;
  pendingInstitutions: number;
  suspendedInstitutions: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  approvedCommission: number;
  commissionRate: number;
  totalRevenue: number;
  performanceScore: string;
}

interface AgentDetails extends Agent {
  statistics: AgentStatistics;
  recentInstitutions: any[];
  recentCommissions: any[];
  settings: AgentSettings;
  profile?: {
    profileComplete?: boolean;
    aadharCard?: string;
    panCard?: string;
    dateOfBirth?: string;
    gender?: string;
    bankAccount?: {
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
    };
    emergencyContact?: {
      name?: string;
      phone?: string;
    };
    profileCompletedAt?: string;
  };
  activityHistory?: any[];
}

const AgentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [agent, setAgent] = useState<AgentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'institutions' | 'commissions' | 'settings' | 'activity'>('overview')
  const [deletingInstitution, setDeletingInstitution] = useState<string | null>(null)

  const handleDeleteInstitution = async (institutionId: string) => {
    if (!window.confirm('Are you sure you want to delete this institution? This action cannot be undone.')) {
      return
    }
    
    setDeletingInstitution(institutionId)
    try {
      // API call would go here - for now simulate success
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove from local state
      if (agent) {
        setAgent({
          ...agent,
          recentInstitutions: agent.recentInstitutions.filter((inst: any) => inst._id !== institutionId),
          statistics: {
            ...agent.statistics,
            totalInstitutions: agent.statistics.totalInstitutions - 1,
            activeInstitutions: agent.statistics.activeInstitutions - 1
          }
        })
      }
      alert('Institution deleted successfully')
    } catch (err: any) {
      console.error('Error deleting institution:', err)
      alert(err.message || 'Failed to delete institution')
    } finally {
      setDeletingInstitution(null)
    }
  }

  const handleEditInstitution = (institutionId: string) => {
    navigate(`/super-admin/institutions/edit/${institutionId}`)
  }

  const handleViewInstitution = (institutionId: string) => {
    navigate(`/super-admin/institutions/details/${institutionId}`)
  }

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) {
        setError('Agent ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const agentData = await agentService.getAgentDetails(id)
        setAgent(agentData)
      } catch (err: any) {
        console.error('Error fetching agent:', err)
        setError(err.message || 'Failed to fetch agent details')
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [id])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'Active': { bg: 'bg-success', text: 'text-white' },
      'Suspended': { bg: 'bg-warning', text: 'text-dark' },
      'Inactive': { bg: 'bg-secondary', text: 'text-white' }
    }
    const config = statusConfig[status] || statusConfig['Inactive']
    return <span className={`badge ${config.bg} ${config.text}`}>{status}</span>
  }

  const getPerformanceBadge = (score: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      'Excellent': { bg: 'bg-success', text: 'text-white' },
      'Good': { bg: 'bg-info', text: 'text-white' },
      'Average': { bg: 'bg-warning', text: 'text-dark' },
      'Needs Improvement': { bg: 'bg-danger', text: 'text-white' }
    }
    const badge = config[score] || config['Average']
    return <span className={`badge ${badge.bg} ${badge.text}`}>{score}</span>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Loading agent details...</h5>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="ti ti-user-off fs-48 text-muted mb-3 d-block" />
              <h5 className="text-muted">{error || 'Agent not found'}</h5>
              <p className="text-muted">{error ? 'Please try again later.' : 'The agent you\'re looking for doesn\'t exist.'}</p>
              <button className="btn btn-primary" onClick={() => navigate('/super-admin/agents')}>
                <i className="ti ti-arrow-left me-2" />Back to Agents
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Agent Details</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <a href="/super-admin/dashboard">Dashboard</a>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="/super-admin/agents">Agents</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Agent Details</li>
                </ol>
              </nav>
            </div>
            <div>
              <button className="btn btn-light me-2" onClick={() => navigate('/super-admin/agents')}>
                <i className="ti ti-arrow-left me-2" />Back to Agents
              </button>
              <button className="btn btn-primary" onClick={() => navigate(`/super-admin/agents/${agent._id}/edit`)}>
                <i className="ti ti-edit me-2" />Edit Agent
              </button>
            </div>
          </div>

          {/* Agent Profile Card */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl bg-primary-transparent rounded-circle me-3">
                      <i className="ti ti-user fs-36 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1">{agent.name}</h4>
                      <div className="d-flex gap-2 mb-2 align-items-center">
                        {getStatusBadge(agent.status)}
                        {agent.statistics && getPerformanceBadge(agent.statistics.performanceScore)}
                      </div>
                      <div className="text-muted">
                        <i className="ti ti-calendar me-1" />Created: {new Date(agent.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div className="text-muted small mb-1">Agent ID</div>
                  <div className="fw-bold">{agent._id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {agent.statistics && (
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-white-50 small">Total Institutions</div>
                        <div className="fs-24 fw-bold">{agent.statistics.totalInstitutions}</div>
                      </div>
                      <div className="fs-32 opacity-50">
                        <i className="ti ti-building-school" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-white-50 small">Active Institutions</div>
                        <div className="fs-24 fw-bold">{agent.statistics.activeInstitutions}</div>
                      </div>
                      <div className="fs-32 opacity-50">
                        <i className="ti ti-check" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-white-50 small">Total Commission</div>
                        <div className="fs-24 fw-bold">{formatCurrency(agent.statistics.totalCommission)}</div>
                      </div>
                      <div className="fs-32 opacity-50">
                        <i className="ti ti-currency-dollar" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-dark">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-dark-50 small">Pending Commission</div>
                        <div className="fs-24 fw-bold">{formatCurrency(agent.statistics.pendingCommission)}</div>
                      </div>
                      <div className="fs-32 opacity-50">
                        <i className="ti ti-clock" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="ti ti-info-circle me-2" />Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'institutions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('institutions')}
                  >
                    <i className="ti ti-building-school me-2" />Institutions ({agent.statistics?.totalInstitutions || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'commissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('commissions')}
                  >
                    <i className="ti ti-currency-dollar me-2" />Commissions
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <i className="ti ti-settings me-2" />Settings
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <i className="ti ti-history me-2" />Activity
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header">
                        <h5 className="card-title mb-0"><i className="ti ti-phone-call me-2" />Contact Information</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="text-muted small">Email</label>
                          <div className="fw-semibold">{agent.email}</div>
                        </div>
                        <div className="mb-3">
                          <label className="text-muted small">Phone</label>
                          <div className="fw-semibold">{agent.phone}</div>
                        </div>
                        <div className="mb-3">
                          <label className="text-muted small">Commission Rate</label>
                          <div className="fw-semibold">{agent.commissionRate}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header">
                        <h5 className="card-title mb-0"><i className="ti ti-map-pin me-2" />Address Information</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="text-muted small">Address</label>
                          <div className="fw-semibold">{agent.address}</div>
                        </div>
                        <div className="mb-3">
                          <label className="text-muted small">City, State</label>
                          <div className="fw-semibold">{agent.city}, {agent.state}</div>
                        </div>
                        <div className="mb-3">
                          <label className="text-muted small">Country</label>
                          <div className="fw-semibold">{agent.country}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Status Card */}
                  {agent.profile && (
                    <div className="col-12">
                      <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0"><i className="ti ti-user me-2" />Profile Information</h5>
                          <span className={`badge ${agent.profile.profileComplete ? 'bg-success' : 'bg-warning'}`}>
                            {agent.profile.profileComplete ? 'Complete' : 'Incomplete'}
                          </span>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-3">
                              <div className="text-muted small">Aadhar Card</div>
                              <div className="fw-semibold">{agent.profile.aadharCard || 'Not provided'}</div>
                            </div>
                            <div className="col-md-3">
                              <div className="text-muted small">PAN Card</div>
                              <div className="fw-semibold">{agent.profile.panCard || 'Not provided'}</div>
                            </div>
                            <div className="col-md-3">
                              <div className="text-muted small">Date of Birth</div>
                              <div className="fw-semibold">{agent.profile.dateOfBirth ? new Date(agent.profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</div>
                            </div>
                            <div className="col-md-3">
                              <div className="text-muted small">Gender</div>
                              <div className="fw-semibold">{agent.profile.gender || 'Not provided'}</div>
                            </div>
                            {agent.profile.bankAccount && (
                              <>
                                <div className="col-md-3">
                                  <div className="text-muted small">Bank Name</div>
                                  <div className="fw-semibold">{agent.profile.bankAccount.bankName || 'Not provided'}</div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-muted small">Account Number</div>
                                  <div className="fw-semibold">{agent.profile.bankAccount.accountNumber || 'Not provided'}</div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-muted small">IFSC Code</div>
                                  <div className="fw-semibold">{agent.profile.bankAccount.ifscCode || 'Not provided'}</div>
                                </div>
                              </>
                            )}
                            {agent.profile.emergencyContact && (
                              <div className="col-md-3">
                                <div className="text-muted small">Emergency Contact</div>
                                <div className="fw-semibold">
                                  {agent.profile.emergencyContact.name || 'Not provided'}
                                  {agent.profile.emergencyContact.phone && ` - ${agent.profile.emergencyContact.phone}`}
                                </div>
                              </div>
                            )}
                            {agent.profile.profileCompletedAt && (
                              <div className="col-12">
                                <div className="text-muted small">Profile Completed On</div>
                                <div className="fw-semibold">{new Date(agent.profile.profileCompletedAt).toLocaleString()}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {agent.statistics && (
                    <div className="col-12">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title mb-0"><i className="ti ti-chart-bar me-2" />Performance Summary</h5>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-3">
                              <div className="text-center">
                                <div className="fs-32 fw-bold text-primary">{agent.statistics.totalInstitutions}</div>
                                <div className="text-muted small">Total Institutions</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="text-center">
                                <div className="fs-32 fw-bold text-success">{agent.statistics.activeInstitutions}</div>
                                <div className="text-muted small">Active</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="text-center">
                                <div className="fs-32 fw-bold text-info">{formatCurrency(agent.statistics.totalRevenue)}</div>
                                <div className="text-muted small">Total Revenue</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="text-center">
                                <div className="fs-32 fw-bold text-warning">{formatCurrency(agent.statistics.paidCommission)}</div>
                                <div className="text-muted small">Paid Commission</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Institutions Tab */}
              {activeTab === 'institutions' && (
                <div>
                  {agent.recentInstitutions && agent.recentInstitutions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Institution Name</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Plan</th>
                            <th>Revenue</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agent.recentInstitutions.map((inst: any) => (
                            <tr key={inst._id}>
                              <td className="fw-semibold">{inst.name}</td>
                              <td>
                                <span className={`badge ${
                                  inst.type === 'School' ? 'bg-info' :
                                  inst.type === 'Inter College' ? 'bg-purple' :
                                  inst.type === 'Degree College' ? 'bg-success' :
                                  'bg-warning'
                                } text-white`}>
                                  {inst.type}
                                </span>
                              </td>
                              <td>{getStatusBadge(inst.status)}</td>
                              <td>{inst.subscription?.planName || inst.plan || 'Basic'}</td>
                              <td>{formatCurrency(inst.subscription?.monthlyCost || inst.monthlyRevenue || 0)}</td>
                              <td>{new Date(inst.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className="dropdown">
                                  <button 
                                    className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                    type="button" 
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="ti ti-dots-vertical" />
                                  </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <button className="dropdown-item" onClick={() => handleViewInstitution(inst._id)}>
                                          <i className="ti ti-eye me-2" />View Details
                                        </button>
                                      </li>
                                      <li>
                                        <button className="dropdown-item" onClick={() => handleEditInstitution(inst._id)}>
                                          <i className="ti ti-edit me-2" />Edit Institution
                                        </button>
                                      </li>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button 
                                          className="dropdown-item text-danger" 
                                          onClick={() => handleDeleteInstitution(inst._id)}
                                          disabled={deletingInstitution === inst._id}
                                        >
                                          <i className="ti ti-trash me-2" />
                                          {deletingInstitution === inst._id ? 'Deleting...' : 'Delete'}
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
                  ) : (
                    <div className="text-center py-4">
                      <i className="ti ti-building-school fs-48 text-muted mb-3 d-block" />
                      <h5 className="text-muted">No institutions found</h5>
                      <p className="text-muted">This agent hasn't created any institutions yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Commissions Tab */}
              {activeTab === 'commissions' && (
                <div>
                  {agent.statistics && (
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <div className="fs-24 fw-bold">{formatCurrency(agent.statistics.totalCommission)}</div>
                            <div className="text-muted small">Total Commission</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <div className="fs-24 fw-bold text-warning">{formatCurrency(agent.statistics.pendingCommission)}</div>
                            <div className="text-muted small">Pending</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <div className="fs-24 fw-bold text-success">{formatCurrency(agent.statistics.paidCommission)}</div>
                            <div className="text-muted small">Paid</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <div className="fs-24 fw-bold text-info">{formatCurrency(agent.statistics.approvedCommission)}</div>
                            <div className="text-muted small">Approved</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {agent.recentCommissions && agent.recentCommissions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Institution</th>
                            <th>Revenue</th>
                            <th>Commission Rate</th>
                            <th>Commission Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agent.recentCommissions.map((comm: any) => (
                            <tr key={comm._id}>
                              <td className="fw-semibold">{comm.institutionName}</td>
                              <td>{formatCurrency(comm.revenue)}</td>
                              <td>{comm.commissionRate}%</td>
                              <td className="fw-bold">{formatCurrency(comm.commissionAmount)}</td>
                              <td>{getStatusBadge(comm.status)}</td>
                              <td>{new Date(comm.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="ti ti-currency-dollar fs-48 text-muted mb-3 d-block" />
                      <h5 className="text-muted">No commissions found</h5>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && agent.settings && (
                <div>
                  {/* Notifications */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3"><i className="ti ti-bell me-2" />Notification Preferences</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={agent.settings.notifications?.emailNotifications} disabled />
                          <label className="form-check-label">Email Notifications</label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={agent.settings.notifications?.smsNotifications} disabled />
                          <label className="form-check-label">SMS Notifications</label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" checked={agent.settings.notifications?.pushNotifications} disabled />
                          <label className="form-check-label">Push Notifications</label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-muted small">Session Timeout</div>
                        <div className="fw-semibold">{agent.settings.security?.sessionTimeout || 30} minutes</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  {(agent.activityHistory && agent.activityHistory.length > 0) ? (
                    <div className="timeline-container">
                      {agent.activityHistory.map((activity: any, index: number) => (
                        <div key={index} className="d-flex mb-3">
                          <div className="timeline-icon me-3">
                            <div className={`avatar avatar-sm rounded-circle ${
                              activity.action === 'login' ? 'bg-info' :
                              activity.action === 'institution_created' ? 'bg-success' :
                              activity.action === 'institution_updated' ? 'bg-warning' :
                              activity.action === 'commission_earned' ? 'bg-primary' :
                              'bg-secondary'
                            }`}>
                              <i className={`ti ${
                                activity.action === 'login' ? 'ti-login' :
                                activity.action === 'institution_created' ? 'ti-plus' :
                                activity.action === 'institution_updated' ? 'ti-edit' :
                                activity.action === 'commission_earned' ? 'ti-currency-dollar' :
                                'ti-activity'
                              } text-white`} />
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">{activity.description}</div>
                                <div className="text-muted small">
                                  {activity.entityType && <span className="me-2">Type: {activity.entityType}</span>}
                                  {activity.entityId && <span>ID: {activity.entityId}</span>}
                                </div>
                              </div>
                              <div className="text-muted small">
                                {activity.timestamp && new Date(activity.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="ti ti-history fs-48 text-muted mb-3 d-block" />
                      <h5 className="text-muted">No activity yet</h5>
                      <p className="text-muted">Agent activities will appear here.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    )
  }

export default AgentDetailsPage
