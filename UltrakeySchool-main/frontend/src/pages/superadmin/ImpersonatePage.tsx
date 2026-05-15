import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import institutionService, { type Institution } from '../../services/institutionService'
import apiService from '../../services/api'

interface ImpersonationSession {
  id: string
  superAdminId: string
  superAdminName: string
  institutionId: string
  institutionName: string
  startTime: string
  endTime?: string
  duration: number
  status: 'active' | 'expired' | 'ended'
  actions: ImpersonationAction[]
}

interface ImpersonationAction {
  id: string
  timestamp: string
  action: string
  details: string
  ipAddress: string
  userAgent: string
  category: 'login' | 'data_access' | 'settings_change' | 'user_action' | 'system_change'
}

const ImpersonatePage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(30)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showImpersonationModal, setShowImpersonationModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [callReason, setCallReason] = useState('')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [impersonationSessions, setImpersonationSessions] = useState<ImpersonationSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch institutions
        const institutionsResponse = await institutionService.getInstitutions({ limit: 100 })
        setInstitutions(institutionsResponse?.institutions ?? [])
        
        // Fetch impersonation sessions (if endpoint exists)
        try {
          const sessionsResponse = await apiService.get('/super-admin/impersonation-sessions')
          if (sessionsResponse.success) {
            // Backend returns { success: true, data: [] } - extract array from data.data or use data directly
            const sessions = (sessionsResponse.data as any)?.data || (sessionsResponse.data as any) || []
            setImpersonationSessions(Array.isArray(sessions) ? sessions : [])
          }
        } catch (sessionErr) {
          // If endpoint doesn't exist, use empty array
          console.log('Impersonation sessions endpoint not available')
          setImpersonationSessions([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        setInstitutions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter institutions
  const filteredInstitutions = useMemo(() => {
    const list = Array.isArray(institutions) ? institutions : []
    return list.filter(institution => {
      const matchesSearch = institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (institution as any).email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (institution as any).contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'all' || institution.type === selectedType
      const matchesStatus = selectedStatus === 'all' || institution.status === selectedStatus
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [institutions, searchTerm, selectedType, selectedStatus])

  // Handler functions
  const handleSelectInstitution = (institution: Institution) => {
    setSelectedInstitution(institution)
    setShowImpersonationModal(true)
  }

  const handleViewDetails = (institution: Institution) => {
    setSelectedInstitution(institution)
    setShowDetailsModal(true)
  }

  const handleSendEmail = (institution: Institution) => {
    setSelectedInstitution(institution)
    setEmailSubject('')
    setEmailMessage('')
    setShowEmailModal(true)
  }

  const handleCallAdmin = (institution: Institution) => {
    setSelectedInstitution(institution)
    setCallReason('')
    setShowCallModal(true)
  }

  const handleStartImpersonation = async () => {
    if (selectedInstitution) {
      try {
        const response = await apiService.post('/super-admin/impersonate', {
          institutionId: selectedInstitution._id,
          duration: sessionDuration
        })
        
        if (response.success) {
          const responseData = response.data as any
          const newSession: ImpersonationSession = {
            id: responseData.sessionId || `session_${Date.now()}`,
            superAdminId: responseData.superAdminId || 'current_admin',
            superAdminName: responseData.superAdminName || 'Current Admin',
            institutionId: selectedInstitution._id,
            institutionName: selectedInstitution.name,
            startTime: new Date().toLocaleString(),
            duration: sessionDuration,
            status: 'active',
            actions: []
          }
          
          setCurrentSession(newSession)
          setShowImpersonationModal(false)
          
          // Add to sessions list
          setImpersonationSessions(prev => [newSession, ...prev])
          
          alert(`Impersonation session started for ${selectedInstitution.name}`)
          alert(`Session duration: ${sessionDuration} minutes`)
          
          // Navigate to institution dashboard
          setTimeout(() => {
            navigate(`/dashboard/main`) // Navigate to institution dashboard
          }, 2000)
        } else {
          alert(response.message || 'Failed to start impersonation session')
        }
      } catch (error: any) {
        console.error('Error starting impersonation:', error)
        alert(error.message || 'Failed to start impersonation session')
      }
    }
  }

  const handleSendEmailSubmit = async () => {
    if (selectedInstitution && emailSubject && emailMessage) {
      try {
        const response = await apiService.post('/super-admin/send-email', {
          institutionId: selectedInstitution._id,
          to: (selectedInstitution as any).adminEmail || (selectedInstitution as any).contactEmail || selectedInstitution.principalEmail,
          subject: emailSubject,
          message: emailMessage
        })
        
        if (response.success) {
          alert(`Email sent to ${(selectedInstitution as any).adminEmail || (selectedInstitution as any).contactEmail}`)
          setShowEmailModal(false)
          setEmailSubject('')
          setEmailMessage('')
        } else {
          alert(response.message || 'Failed to send email')
        }
      } catch (error: any) {
        console.error('Error sending email:', error)
        alert(error.message || 'Failed to send email')
      }
    }
  }

  const handleCallSubmit = async () => {
    if (selectedInstitution && callReason) {
      try {
        const response = await apiService.post('/super-admin/initiate-call', {
          institutionId: selectedInstitution._id,
          phoneNumber: (selectedInstitution as any).contactPhone || (selectedInstitution as any).phone || selectedInstitution.contact.phone,
          reason: callReason
        })
        
        if (response.success) {
          alert(`Call initiated to ${(selectedInstitution as any).contactPhone || (selectedInstitution as any).phone}\nReason: ${callReason}`)
          setShowCallModal(false)
          setCallReason('')
        } else {
          alert(response.message || 'Failed to initiate call')
        }
      } catch (error: any) {
        console.error('Error initiating call:', error)
        alert(error.message || 'Failed to initiate call')
      }
    }
  }

  const handleEndSession = async () => {
    if (currentSession) {
      try {
        const response = await apiService.post('/super-admin/end-impersonation', {
          sessionId: currentSession.id
        })
        
        if (response.success) {
          setCurrentSession(null)
          alert(`Impersonation session ended for ${currentSession.institutionName}`)
          navigate('/super-admin/impersonate')
        } else {
          alert(response.message || 'Failed to end session')
        }
      } catch (error: any) {
        console.error('Error ending session:', error)
        alert(error.message || 'Failed to end session')
      }
    }
  }

  const handleViewSession = (session: ImpersonationSession) => {
    setCurrentSession(session)
    setShowSessionModal(true)
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Premium': return 'bg-warning'
      case 'Professional': return 'bg-info'
      case 'Basic': return 'bg-secondary'
      default: return 'bg-secondary'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success'
      case 'Suspended': return 'bg-danger'
      case 'Inactive': return 'bg-secondary'
      default: return 'bg-secondary'
    }
  }

  const getActionCategoryBadge = (category: string) => {
    switch (category) {
      case 'login': return 'bg-success'
      case 'data_access': return 'bg-info'
      case 'settings_change': return 'bg-warning'
      case 'user_action': return 'bg-primary'
      case 'system_change': return 'bg-secondary'
      default: return 'bg-secondary'
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  }
  return (
    <div className="">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Impersonate Institution</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Impersonate Institution
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          {currentSession && (
            <div className="alert alert-warning me-2 mb-2">
              <i className="ti ti-user-switch me-2"></i>
              <strong>Active Session:</strong> {currentSession.institutionName}
              <button className="btn btn-sm btn-danger ms-2" onClick={handleEndSession}>
                <i className="ti ti-logout me-1"></i>End Session
              </button>
            </div>
          )}
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              title="Refresh"
              onClick={() => window.location.reload()}
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
              <li><a className="dropdown-item" href="#"><i className="ti ti-file-type-csv me-2"></i>Export as CSV</a></li>
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
                  <h4 className="text-white mb-1">{institutions.length}</h4>
                  <p className="text-white mb-0">Total Institutions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-building text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{institutions.filter(i => i.status === 'Active').length}</h4>
                  <p className="text-white mb-0">Active Institutions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{impersonationSessions.filter(s => s.status === 'active').length}</h4>
                  <p className="text-white mb-0">Active Sessions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-switch text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{impersonationSessions.length}</h4>
                  <p className="text-white mb-0">Total Sessions</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-history text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-2">
              <label className="form-label">Search Institutions</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name, email, or contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Institution Type</label>
              <select 
                className="form-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="School">School</option>
                <option value="Inter College">Inter College</option>
                <option value="Degree College">Degree College</option>
                <option value="Educational Center">Educational Center</option>
                <option value="International School">International School</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2 mb-2">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-secondary w-100" onClick={() => {
                setSearchTerm('')
                setSelectedType('all')
                setSelectedStatus('all')
              }}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Institutions ({filteredInstitutions.length})</h4>
          <div className="d-flex align-items-center">
            <span className="badge bg-success me-2">
              {institutions.filter(i => i.status === 'Active').length} Active
            </span>
            <button className="btn btn-outline-light bg-white btn-icon">
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Type</th>
                  <th>Plan</th>
                  <th>Contact Person</th>
                  <th>Students</th>
                  <th>Branches</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstitutions.map((institution) => (
                  <tr key={institution._id}>
                    <td>
                      <div>
                        <div className="fw-medium">{institution.name}</div>
                        <small className="text-muted">{institution.contact?.email || '-'}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{institution.type}</span>
                    </td>
                    <td>
                      <span className={`badge ${getPlanBadge(institution.subscription?.planName)} text-white`}>
                        {institution.subscription?.planName || '-'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{institution.principalName || '-'}</div>
                        <small className="text-muted">{institution.contact?.phone || '-'}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary text-white">{institution.analytics?.totalStudents || 0}</span>
                    </td>
                    <td>
                      <span className="badge bg-info text-white">N/A</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(institution.status)} text-white`}>
                        {institution.status}
                      </span>
                    </td>
                    <td>N/A</td>
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
                            <button className="dropdown-item" onClick={() => handleSelectInstitution(institution)}>
                              <i className="ti ti-user-switch me-2"></i>Impersonate
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleViewDetails(institution)}>
                              <i className="ti ti-eye me-2"></i>View Details
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleSendEmail(institution)}>
                              <i className="ti ti-mail me-2"></i>Send Email
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleCallAdmin(institution)}>
                              <i className="ti ti-phone me-2"></i>Call Admin
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

      {/* Recent Sessions */}
      <div className="card mt-4">
        <div className="card-header">
          <h4 className="card-title">Recent Impersonation Sessions</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Super Admin</th>
                  <th>Institution</th>
                  <th>Start Time</th>
<th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {impersonationSessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <code className="text-muted">{session.id}</code>
                    </td>
                    <td>{session.superAdminName}</td>
                    <td>
                      <div>
                        <div className="fw-medium">{session.institutionName}</div>
                        <small className="text-muted">ID: {session.institutionId}</small>
                      </div>
                    </td>
                    <td>{session.startTime}</td>
                    <td>{session.duration} minutes</td>
                    <td>
                      <span className={`badge ${
                        session.status === 'active' ? 'bg-success' :
                        session.status === 'expired' ? 'bg-warning' : 'bg-secondary'
                      } text-white`}>
                        {session.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewSession(session)}>
                        <i className="ti ti-eye me-1"></i>View Actions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Impersonation Modal */}
      {showImpersonationModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Impersonate Institution</h5>
                <button type="button" className="btn-close" onClick={() => setShowImpersonationModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="ti ti-info-circle me-2"></i>
                  You are about to start an impersonation session. This will allow you to access the institution's dashboard with their permissions.
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Institution Name</label>
                    <div className="form-control-plaintext">{selectedInstitution.name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Type</label>
                    <div className="form-control-plaintext">{selectedInstitution.type}</div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Plan</label>
                    <span className={`badge ${getPlanBadge(selectedInstitution.subscription?.planName || 'free')} text-white`}>
                      {selectedInstitution.subscription?.planName || 'free'}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <span className={`badge ${getStatusBadge(selectedInstitution.status)} text-white`}>
                      {selectedInstitution.status}
                    </span>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Admin Name</label>
                    <div className="form-control-plaintext">{selectedInstitution.principalName}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Admin Email</label>
                    <div className="form-control-plaintext">{selectedInstitution.principalEmail}</div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Total Students</label>
                    <div className="form-control-plaintext">{selectedInstitution.analytics?.totalStudents || 0}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Total Branches</label>
                    <div className="form-control-plaintext">N/A</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Session Duration (minutes)</label>
                  <select 
                    className="form-select" 
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                </div>
                
                <div className="alert alert-warning">
                  <i className="ti ti-alert-triangle me-2"></i>
                  <strong>Important:</strong>
                  <ul className="mb-0 mt-2">
                    <li>All actions will be logged and monitored</li>
                    <li>You will be automatically logged out when the session expires</li>
                    <li>Session can be ended manually at any time</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImpersonationModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-warning" onClick={handleStartImpersonation}>
                  <i className="ti ti-user-switch me-2"></i>Start Impersonation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionModal && currentSession && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Session Details - {currentSession.institutionName}</h5>
                <button type="button" className="btn-close" onClick={() => setShowSessionModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Session ID</label>
                    <div className="form-control-plaintext">{currentSession.id}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <span className={`badge ${
                      currentSession.status === 'active' ? 'bg-success' :
                      currentSession.status === 'expired' ? 'bg-warning' : 'bg-secondary'
                    } text-white`}>
                      {currentSession.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Super Admin</label>
                    <div className="form-control-plaintext">{currentSession.superAdminName}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Duration</label>
                    <div className="form-control-plaintext">{currentSession.duration} minutes</div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Start Time</label>
                    <div className="form-control-plaintext">{currentSession.startTime}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">End Time</label>
                    <div className="form-control-plaintext">{currentSession.endTime || 'Session Active'}</div>
                  </div>
                </div>
                
                <h6 className="mb-3">Session Actions</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Details</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSession.actions.map((action) => (
                        <tr key={action.id}>
                          <td>{action.timestamp}</td>
                          <td>{action.action}</td>
                          <td>{action.details}</td>
                          <td>
                            <span className={`badge ${getActionCategoryBadge(action.category)} text-white`}>
                              {action.category.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSessionModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Institution Details - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Institution ID</label>
                      <div className="form-control-plaintext">{selectedInstitution._id}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <div className="form-control-plaintext">{selectedInstitution.name}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Type</label>
                      <span className="badge bg-light text-dark">{selectedInstitution.type}</span>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Plan</label>
                      <span className={`badge ${getPlanBadge(selectedInstitution.subscription?.planName || 'Unknown')} text-white`}>
                      {selectedInstitution.subscription?.planName || 'Unknown Plan'}
                    </span>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <span className={`badge ${getStatusBadge(selectedInstitution.status)} text-white`}>
                        {selectedInstitution.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <div className="form-control-plaintext">{selectedInstitution.contact?.email || '-'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <div className="form-control-plaintext">{selectedInstitution.contact?.phone || '-'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Location</label>
                      <div className="form-control-plaintext">
                        {selectedInstitution.contact?.address?.city || '-'}, {selectedInstitution.contact?.address?.state || '-'}, {selectedInstitution.contact?.address?.country || '-'}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Subscription End</label>
                      <div className="form-control-plaintext">{selectedInstitution.subscription?.endDate || '-'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Created Date</label>
                      <div className="form-control-plaintext">N/A</div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Contact Person</label>
                      <div className="form-control-plaintext">{selectedInstitution.principalName}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Admin Name</label>
                      <div className="form-control-plaintext">{selectedInstitution.principalName}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Admin Email</label>
                      <div className="form-control-plaintext">{selectedInstitution.principalEmail}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Last Login</label>
                      <div className="form-control-plaintext">N/A</div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Total Students</label>
                      <span className="badge bg-primary text-white">{selectedInstitution.analytics?.totalStudents || 0}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Total Branches</label>
                      <span className="badge bg-info text-white">N/A</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  setShowDetailsModal(false)
                  handleSendEmail(selectedInstitution)
                }}>
                  <i className="ti ti-mail me-2"></i>Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Send Email - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEmailModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">To</label>
                  <div className="form-control-plaintext">{selectedInstitution.principalEmail}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea 
                    className="form-control" 
                    rows={4}
                    placeholder="Enter your message here..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Template</label>
                  <select className="form-select">
                    <option value="">Custom Message</option>
                    <option value="support">Support Request</option>
                    <option value="notification">System Notification</option>
                    <option value="reminder">Payment Reminder</option>
                    <option value="announcement">Platform Announcement</option>
                  </select>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="sendCopy" />
                  <label className="form-check-label" htmlFor="sendCopy">
                    Send copy to my email
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSendEmailSubmit}>
                  <i className="ti ti-mail me-2"></i>Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Admin Modal */}
      {showCallModal && selectedInstitution && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Call Admin - {selectedInstitution.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCallModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="ti ti-phone me-2"></i>
                  You are about to initiate a call to the institution administrator.
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Institution</label>
                    <div className="form-control-plaintext">{selectedInstitution.name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Admin Name</label>
                    <div className="form-control-plaintext">{selectedInstitution.principalName}</div>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <div className="form-control-plaintext">{selectedInstitution.contact?.phone || '-'}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <div className="form-control-plaintext">{selectedInstitution.principalEmail}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Call Reason</label>
                  <select 
                    className="form-select" 
                    value={callReason}
                    onChange={(e) => setCallReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="support">Support Request</option>
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Problem</option>
                    <option value="followup">Follow-up Call</option>
                    <option value="urgent">Urgent Matter</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Additional Notes</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    placeholder="Add any additional notes for the call..."
                  ></textarea>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="scheduleCall" />
                  <label className="form-check-label" htmlFor="scheduleCall">
                    Schedule call for later
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCallModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleCallSubmit}>
                  <i className="ti ti-phone me-2"></i>Initiate Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImpersonatePage
