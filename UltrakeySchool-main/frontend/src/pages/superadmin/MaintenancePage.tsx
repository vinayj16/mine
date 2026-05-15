import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiService } from '../../services/api'

interface MaintenanceSettings {
  enabled: boolean
  message: string
  startTime: string
  endTime: string
  affectedModules: string[]
  notifyUsers: boolean
  allowAdminAccess: boolean
}

interface ScheduledMaintenance {
  _id: string
  title: string
  description: string
  startDate: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  affectedModules: string[]
  notifyUsers: boolean
  type?: string
}

const MaintenancePage: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'System is currently under maintenance. We\'ll be back shortly.',
    startTime: '',
    endTime: '',
    affectedModules: [],
    notifyUsers: true,
    allowAdminAccess: true
  })

  const [scheduledMaintenance, setScheduledMaintenance] = useState<ScheduledMaintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [, setError] = useState<string | null>(null)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<ScheduledMaintenance | null>(null)
  const [modalForm, setModalForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endTime: '',
    type: 'routine',
    affectedModules: [] as string[],
    notifyUsers: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [settingsResponse, maintenanceResponse] = await Promise.all([
        apiService.get<any>('/super-admin/settings/maintenance'),
        apiService.get<any>('/super-admin/settings/maintenance/scheduled')
      ])
      
      if (settingsResponse.success && settingsResponse.data) {
        setSettings({
          enabled: settingsResponse.data.enabled || false,
          message: settingsResponse.data.message || '',
          startTime: settingsResponse.data.startTime || '',
          endTime: settingsResponse.data.endTime || '',
          affectedModules: settingsResponse.data.affectedModules || [],
          notifyUsers: settingsResponse.data.notifyUsers ?? true,
          allowAdminAccess: settingsResponse.data.allowAdminAccess ?? true
        })
      }
      
      if (maintenanceResponse.success && maintenanceResponse.data) {
        const all = [
          ...(maintenanceResponse.data.scheduled || []),
          ...(maintenanceResponse.data.completed || [])
        ]
        setScheduledMaintenance(all)
      }
    } catch (err) {
      console.error('Error fetching maintenance data:', err)
      setError('Failed to fetch maintenance data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const response = await apiService.put('/settings/maintenance', settings)
      
      if (response.success) {
        toast.success('Maintenance settings saved successfully!')
        fetchData()
      } else {
        toast.error('Failed to save maintenance settings')
      }
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleMaintenanceToggle = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const handleModuleToggle = (module: string) => {
    setSettings(prev => ({
      ...prev,
      affectedModules: prev.affectedModules.includes(module)
        ? prev.affectedModules.filter(m => m !== module)
        : [...prev.affectedModules, module]
    }))
  }

  const availableModules = [
    'User Management',
    'Student Records',
    'Financial System',
    'Attendance System',
    'Library System',
    'HR Management',
    'Reports & Analytics',
    'Communication Tools',
    'Settings & Configuration'
  ]

  const handleOpenModal = (maintenance?: ScheduledMaintenance) => {
    if (maintenance) {
      setEditingMaintenance(maintenance)
      setModalForm({
        title: maintenance.title,
        description: maintenance.description || '',
        startDate: maintenance.startDate,
        startTime: maintenance.startTime,
        endTime: maintenance.endTime,
        type: maintenance.type || 'routine',
        affectedModules: maintenance.affectedModules || [],
        notifyUsers: maintenance.notifyUsers ?? true
      })
    } else {
      setEditingMaintenance(null)
      setModalForm({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endTime: '',
        type: 'routine',
        affectedModules: [],
        notifyUsers: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMaintenance(null)
  }

  const handleSaveMaintenance = async () => {
    try {
      setSaving(true)
      
      if (editingMaintenance) {
        // Update existing
        const response = await apiService.put(`/settings/maintenance/scheduled/${editingMaintenance._id}`, modalForm)
        if (response.success) {
          toast.success('Maintenance schedule updated!')
        }
      } else {
        // Create new
        const response = await apiService.post('/settings/maintenance/scheduled', modalForm)
        if (response.success) {
          toast.success('Maintenance scheduled successfully!')
        }
      }
      
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save maintenance')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMaintenance = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled maintenance?')) {
      return
    }

    try {
      const response = await apiService.delete(`/settings/maintenance/scheduled/${id}`)
      if (response.success) {
        toast.success('Maintenance deleted!')
        fetchData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete maintenance')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await apiService.put(`/settings/maintenance/scheduled/${id}`, { status: newStatus })
      if (response.success) {
        toast.success(`Maintenance marked as ${newStatus}!`)
        fetchData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <span className="badge bg-warning">Scheduled</span>
      case 'in-progress': return <span className="badge bg-info">In Progress</span>
      case 'completed': return <span className="badge bg-success">Completed</span>
      case 'cancelled': return <span className="badge bg-danger">Cancelled</span>
      default: return <span className="badge bg-secondary">Unknown</span>
    }
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

  return (
    <div className="">
      <style>{`
        .bg-purple { background-color: #8b5cf6 !important; }
      `}</style>

      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Maintenance Mode</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">System</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Maintenance Mode
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              title="Refresh"
              onClick={fetchData}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className={`card ${settings.enabled ? 'bg-warning' : 'bg-success'}`}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">
                    {settings.enabled ? 'ACTIVE' : 'INACTIVE'}
                  </h4>
                  <p className="text-white mb-0">Maintenance Status</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className={`ti ${settings.enabled ? 'ti-alert-triangle' : 'ti-check'} text-white fs-4`}></i>
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
                  <h4 className="text-white mb-1">{scheduledMaintenance.filter(m => m.status === 'scheduled').length}</h4>
                  <p className="text-white mb-0">Scheduled</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-calendar text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-purple">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{settings.affectedModules?.length || 0}</h4>
                  <p className="text-white mb-0">Affected Modules</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-puzzle text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{scheduledMaintenance.filter(m => m.status === 'completed').length}</h4>
                  <p className="text-white mb-0">Completed</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-checks text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Settings */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Maintenance Settings</h5>
          <div className="form-check form-switch">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="maintenance-toggle"
              checked={settings.enabled}
              onChange={handleMaintenanceToggle}
            />
            <label className="form-check-label" htmlFor="maintenance-toggle">
              {settings.enabled ? 'Disable' : 'Enable'} Maintenance Mode
            </label>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Maintenance Message</label>
              <textarea 
                className="form-control" 
                rows={3}
                value={settings.message}
                onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter maintenance message for users"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Maintenance Schedule</label>
              <div className="row">
                <div className="col-6">
                  <input 
                    type="datetime-local" 
                    className="form-control mb-2"
                    value={settings.startTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                  <small className="text-muted">Start Time</small>
                </div>
                <div className="col-6">
                  <input 
                    type="datetime-local" 
                    className="form-control mb-2"
                    value={settings.endTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                  <small className="text-muted">End Time</small>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Affected Modules</label>
              <div className="row">
                {availableModules.map((module) => (
                  <div key={module} className="col-md-6 mb-2">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`module-${module}`}
                        checked={settings.affectedModules.includes(module)}
                        onChange={() => handleModuleToggle(module)}
                      />
                      <label className="form-check-label" htmlFor={`module-${module}`}>
                        {module}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Additional Options</label>
              <div className="space-y-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="notify-users"
                    checked={settings.notifyUsers}
                    onChange={(e) => setSettings(prev => ({ ...prev, notifyUsers: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="notify-users">
                    Notify users via email
                  </label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="admin-access"
                    checked={settings.allowAdminAccess}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowAdminAccess: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="admin-access">
                    Allow admin access during maintenance
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button 
              className="btn btn-primary" 
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="ti ti-check me-2" />Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Maintenance */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Scheduled Maintenance</h5>
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
            <i className="ti ti-plus me-2"></i>Schedule Maintenance
          </button>
        </div>
        <div className="card-body">
          {scheduledMaintenance.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledMaintenance.map((maintenance) => (
                    <tr key={maintenance._id}>
                      <td className="fw-semibold">{maintenance.title}</td>
                      <td>{maintenance.startDate}</td>
                      <td>{maintenance.startTime} - {maintenance.endTime}</td>
                      <td>{getStatusBadge(maintenance.status)}</td>
                      <td>{maintenance.description}</td>
                      <td>
                        <div className="dropdown">
                          <button 
                            className="btn btn-sm btn-white btn-icon" 
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button className="dropdown-item" onClick={() => handleOpenModal(maintenance)}>
                                <i className="ti ti-edit me-2"></i>Edit
                              </button>
                            </li>
                            {maintenance.status === 'scheduled' && (
                              <>
                                <li>
                                  <button className="dropdown-item" onClick={() => handleStatusChange(maintenance._id, 'in-progress')}>
                                    <i className="ti ti-player-play me-2"></i>Start Now
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => handleStatusChange(maintenance._id, 'completed')}>
                                    <i className="ti ti-check me-2"></i>Mark Completed
                                  </button>
                                </li>
                              </>
                            )}
                            {maintenance.status === 'in-progress' && (
                              <li>
                                <button className="dropdown-item" onClick={() => handleStatusChange(maintenance._id, 'completed')}>
                                  <i className="ti ti-check me-2"></i>Mark Completed
                                </button>
                              </li>
                            )}
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button className="dropdown-item text-danger" onClick={() => handleDeleteMaintenance(maintenance._id)}>
                                <i className="ti ti-trash me-2"></i>Delete
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
            <div className="text-center py-5">
              <i className="ti ti-calendar-off fs-48 text-muted mb-3 d-block" />
              <h5 className="text-muted">No scheduled maintenance</h5>
              <p className="text-muted">Click the button above to schedule maintenance</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingMaintenance ? 'Edit Maintenance' : 'Schedule Maintenance'}</h5>
              <button type="button" className="btn-close" onClick={handleCloseModal}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter maintenance title"
                  value={modalForm.title}
                  onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="Enter maintenance description"
                  value={modalForm.description}
                  onChange={(e) => setModalForm(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={modalForm.startDate}
                    onChange={(e) => setModalForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-select"
                    value={modalForm.type}
                    onChange={(e) => setModalForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="routine">Routine</option>
                    <option value="emergency">Emergency</option>
                    <option value="upgrade">Upgrade</option>
                    <option value="security">Security Update</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Time *</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={modalForm.startTime}
                    onChange={(e) => setModalForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Time *</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={modalForm.endTime}
                    onChange={(e) => setModalForm(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="modal-notify-users"
                    checked={modalForm.notifyUsers}
                    onChange={(e) => setModalForm(prev => ({ ...prev, notifyUsers: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="modal-notify-users">
                    Notify users via email
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveMaintenance}
                disabled={saving || !modalForm.title || !modalForm.startDate || !modalForm.startTime || !modalForm.endTime}
              >
                {saving ? 'Saving...' : editingMaintenance ? 'Update' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Backdrop */}
      {showModal && <div className="modal-backdrop fade show" onClick={handleCloseModal}></div>}
    </div>
  )
}

export default MaintenancePage
