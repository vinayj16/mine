import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getInstitutionConfigFromPath, INSTITUTION_CONFIGS } from '../../utils/institutionUtils'
import superAdminService from '../../services/superAdminService'
import { toast } from 'react-toastify'
import ConfirmModal from '../../components/common/ConfirmModal'

interface Institution {
  id: string
  name: string
  type: string
  plan: string
  status: string
  students: number
  monthlyRevenue: number
  adminName: string
  adminEmail: string
  adminPhone: string
  address: string
  city: string
  state: string
  expiryDate: string
}

interface FormData {
  name: string
  type: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  adminName: string
  adminEmail: string
  adminPhone: string
  plan: string
}

const INSTITUTION_TYPES = [
  { value: 'School', label: 'School' },
  { value: 'Inter College', label: 'Inter College' },
  { value: 'Degree College', label: 'Degree College' },
  { value: 'Engineering College', label: 'Engineering College' },
]

const extractPlanName = (plan: any): string => {
  if (!plan) return 'Basic'
  if (typeof plan === 'string') return plan.charAt(0).toUpperCase() + plan.slice(1)
  if (typeof plan === 'object' && plan.name) return plan.name
  return 'Basic'
}

const getTypeBasePath = (): string => {
  return '/super-admin/institutions'
}

const InstitutionsManagementPage: React.FC = () => {
  const location = useLocation()
  const institutionConfig = getInstitutionConfigFromPath(location.pathname)

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '', type: 'School', email: '', phone: '', address: '', city: '', state: '',
    adminName: '', adminEmail: '', adminPhone: '', plan: 'Basic',
  })
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const fetchInstitutions = async () => {
    setLoading(true)
    try {
      const data = await superAdminService.getInstitutionsByType()
      const mapped: Institution[] = (data || []).map((inst: any) => ({
        id: inst._id || inst.id || '',
        name: inst.name || '',
        type: inst.type || 'School',
        plan: extractPlanName(inst.plan),
        status: inst.status ? (inst.status.charAt(0).toUpperCase() + inst.status.slice(1)) : 'Active',
        students: inst.currentUsers || inst.students || 0,
        monthlyRevenue: inst.monthlyRevenue || 0,
        adminName: inst.adminName || inst.contactPerson || inst.principalName || '',
        adminEmail: inst.email || inst.contactEmail || inst.principalEmail || '',
        adminPhone: inst.phone || inst.contactPhone || inst.principalPhone || '',
        address: typeof inst.address === 'string' ? inst.address : (inst.address?.street || ''),
        city: inst.address?.city || inst.city || '',
        state: inst.address?.state || inst.state || '',
        expiryDate: inst.subscriptionExpiry || inst.expiryDate || '',
      }))
      setInstitutions(mapped)
    } catch (err) {
      toast.error('Failed to fetch institutions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitutions()
  }, [])

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInstitutions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredInstitutions.map(x => x.id))
    }
  }

  const handleDelete = (id: string) => {
    setShowDeleteModal(true)
    setDeleteTarget({ type: 'delete', id })
  }

  const handleConfirmAction = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'delete') {
        await superAdminService.deleteInstitution(deleteTarget.id)
        setInstitutions(prev => prev.filter(x => x.id !== deleteTarget.id))
        setSelectedIds(prev => prev.filter(x => x !== deleteTarget.id))
        toast.success('Institution deleted successfully')
      } else if (deleteTarget.type === 'bulkDelete') {
        let success = 0
        for (const id of selectedIds) {
          try {
            await superAdminService.deleteInstitution(id)
            success++
          } catch { /* skip */ }
        }
        setInstitutions(prev => prev.filter(x => !selectedIds.includes(x.id)))
        setSelectedIds([])
        toast.success(`Deleted ${success} of ${selectedIds.length} institutions`)
      } else if (deleteTarget.type === 'bulkSuspend') {
        let success = 0
        for (const id of selectedIds) {
          try {
            await superAdminService.updateInstitution(id, { status: 'suspended' })
            success++
          } catch { /* skip */ }
        }
        setInstitutions(prev => prev.map(x =>
          selectedIds.includes(x.id) ? { ...x, status: 'Suspended' } : x
        ))
        setSelectedIds([])
        toast.success(`Suspended ${success} of ${selectedIds.length} institutions`)
      }
    } catch {
      toast.error('Failed to perform action')
    } finally {
      setShowDeleteModal(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleStatus = async (inst: Institution) => {
    const newStatus = inst.status === 'Active' ? 'suspended' : 'active'
    try {
      await superAdminService.updateInstitution(inst.id, { status: newStatus })
      setInstitutions(prev => prev.map(x =>
        x.id === inst.id ? { ...x, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) } : x
      ))
      toast.success(`Institution ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`)
    } catch {
      toast.error('Failed to update institution status')
    }
  }

  const handleSendReminder = async (id: string) => {
    try {
      await superAdminService.sendReminder(id)
      toast.success('Reminder sent successfully')
    } catch {
      toast.error('Failed to send reminder')
    }
  }

  const handleBulkDelete = () => {
    setShowDeleteModal(true)
    setDeleteTarget({ type: 'bulkDelete' })
  }

  const handleBulkSuspend = () => {
    setShowDeleteModal(true)
    setDeleteTarget({ type: 'bulkSuspend' })
  }

  const openAddModal = () => {
    setFormData({ name: '', type: 'School', email: '', phone: '', address: '', city: '', state: '', adminName: '', adminEmail: '', adminPhone: '', plan: 'Basic' })
    setShowAddModal(true)
  }

  const openEditModal = (inst: Institution) => {
    setEditingId(inst.id)
    setFormData({
      name: inst.name, type: inst.type, email: inst.adminEmail, phone: inst.adminPhone,
      address: inst.address, city: inst.city, state: inst.state,
      adminName: inst.adminName, adminEmail: inst.adminEmail, adminPhone: inst.adminPhone,
      plan: inst.plan,
    })
    setShowEditModal(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Institution name is required'); return }
    setSaving(true)
    try {
      if (showEditModal && editingId) {
        await superAdminService.updateInstitution(editingId, {
          name: formData.name,
          type: formData.type,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          contactPerson: formData.adminName,
          contactEmail: formData.adminEmail,
          contactPhone: formData.adminPhone,
          plan: formData.plan,
          status: 'active',
        })
        toast.success('Institution updated successfully')
      } else {
        await superAdminService.createInstitution({
          name: formData.name,
          type: formData.type,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          contactPerson: formData.adminName,
          contactEmail: formData.adminEmail,
          contactPhone: formData.adminPhone,
          plan: formData.plan,
          status: 'active',
        })
        toast.success('Institution created successfully')
      }
      setShowAddModal(false)
      setShowEditModal(false)
      setEditingId(null)
      await fetchInstitutions()
    } catch {
      toast.error('Failed to save institution')
    } finally {
      setSaving(false)
    }
  }

  const filteredInstitutions = institutions.filter(inst => {
    const matchesStatus = filterStatus === 'all' || inst.status === filterStatus
    const matchesPlan = filterPlan === 'all' || inst.plan === filterPlan
    const search = searchTerm.toLowerCase()
    const matchesSearch = !search || inst.name.toLowerCase().includes(search) ||
      inst.adminName.toLowerCase().includes(search) ||
      inst.adminEmail.toLowerCase().includes(search)
    return matchesStatus && matchesPlan && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { Active: 'bg-success', Suspended: 'bg-warning', Expired: 'bg-danger' }
    return map[status] || 'bg-secondary'
  }

  const getPlanBadge = (plan: string) => {
    const map: Record<string, string> = { Basic: 'bg-info', Medium: 'bg-warning', Premium: 'bg-danger' }
    return map[plan] || 'bg-secondary'
  }

  const selectedCount = selectedIds.length
  const totalCount = filteredInstitutions.length

  const modalOverlay = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1050 }
  const modalCard = { backgroundColor: '#fff', borderRadius: 12, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' as const, padding: 24 }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{institutionConfig?.name || 'Institutions'} Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/super-admin/institutions">Institutions</Link></li>
              <li className="breadcrumb-item active">Management</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={fetchInstitutions} title="Refresh">
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2 me-2">
            <button className="btn btn-primary" onClick={openAddModal}>
              <i className="ti ti-plus me-2"></i>Add Institution
            </button>
          </div>
          {selectedCount > 0 && (
            <div className="dropdown me-2 mb-2">
              <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-settings me-2"></i>Actions ({selectedCount})
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                <li><button className="dropdown-item" onClick={handleBulkSuspend}><i className="ti ti-user-x me-2"></i>Suspend Selected</button></li>
                <li><button className="dropdown-item text-danger" onClick={handleBulkDelete}><i className="ti ti-trash me-2"></i>Delete Selected</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={() => setSelectedIds([])}><i className="ti ti-x me-2"></i>Clear Selection</button></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        {[
          { label: 'Total', count: institutions.length, color: 'bg-primary', icon: 'ti ti-building' },
          { label: 'Active', count: institutions.filter(s => s.status === 'Active').length, color: 'bg-success', icon: 'ti ti-checks' },
          { label: 'Suspended', count: institutions.filter(s => s.status === 'Suspended').length, color: 'bg-warning', icon: 'ti ti-alert-triangle' },
          { label: 'Expired', count: institutions.filter(s => s.status === 'Expired').length, color: 'bg-danger', icon: 'ti ti-x-circle' },
        ].map((card, i) => (
          <div className="col-lg-3 col-md-6" key={i}>
            <div className={`card ${card.color}`}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-1">{loading ? '...' : card.count}</h4>
                    <p className="text-white mb-0">{card.label} {institutionConfig?.name || 'Institutions'}</p>
                  </div>
                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                    <i className={`${card.icon} text-white fs-4`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header"><h4 className="card-title">Filters</h4></div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Search</label>
                <input type="text" className="form-control" placeholder="Search institutions, admins, or emails..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Plan</label>
                <select className="form-select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
                  <option value="all">All Plans</option>
                  <option value="Basic">Basic</option>
                  <option value="Medium">Medium</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>
            <div className="col-md-2">
              <div className="mb-3">
                <label className="form-label">&nbsp;</label>
                <button className="btn btn-secondary w-100" onClick={() => { setFilterStatus('all'); setFilterPlan('all'); setSearchTerm('') }}>
                  <i className="ti ti-refresh me-2"></i>Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">{institutionConfig?.name || 'Institutions'} ({totalCount})</h4>
          <div className="d-flex align-items-center">
            {selectedCount > 0 && <span className="badge bg-primary me-2">{selectedCount} selected</span>}
            <div className="form-check">
              <input className="form-check-input" type="checkbox" checked={selectedCount === totalCount && totalCount > 0} onChange={handleSelectAll} />
              <label className="form-check-label">Select All</label>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-2">Loading...</p></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th className="w-1">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={selectedCount === totalCount && totalCount > 0} onChange={handleSelectAll} />
                      </div>
                    </th>
                    <th>Institution Name</th>
                    <th>Type</th>
                    <th>Admin</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map(inst => {
                    const basePath = getTypeBasePath()
                    return (
                      <tr key={inst.id}>
                        <td>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" checked={selectedIds.includes(inst.id)} onChange={() => handleSelect(inst.id)} />
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-2"><i className="ti ti-building text-primary"></i></div>
                            <div>
                              <div className="fw-medium">{inst.name}</div>
                              <small className="text-muted d-block">{inst.address}, {inst.city} {inst.state}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-secondary">{inst.type}</span></td>
                        <td>
                          <div>
                            <div className="fw-medium">{inst.adminName || '-'}</div>
                            <small className="text-muted d-block">{inst.adminEmail}</small>
                            <small className="text-muted d-block">{inst.adminPhone}</small>
                          </div>
                        </td>
                        <td><span className={`badge ${getPlanBadge(inst.plan)}`}>{inst.plan}</span></td>
                        <td><span className={`badge ${getStatusBadge(inst.status)}`}>{inst.status}</span></td>
                        <td>{inst.students}</td>
                        <td>{inst.expiryDate || '-'}</td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                              <i className="ti ti-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li><Link to={`${basePath}/${inst.id}`} className="dropdown-item"><i className="ti ti-eye me-2"></i>View Details</Link></li>
                              <li><button className="dropdown-item" onClick={() => openEditModal(inst)}><i className="ti ti-edit me-2"></i>Edit</button></li>
                              <li><Link to={`${basePath}/${inst.id}/admin`} className="dropdown-item"><i className="ti ti-user-check me-2"></i>Manage Admin</Link></li>
                              <li><Link to={`${basePath}/${inst.id}/upgrade`} className="dropdown-item"><i className="ti ti-credit-card me-2"></i>Upgrade Plan</Link></li>
                              <li><button className="dropdown-item" onClick={() => handleSendReminder(inst.id)}><i className="ti ti-bell me-2"></i>Send Reminder</button></li>
                              <li><hr className="dropdown-divider" /></li>
                              <li><button className={`dropdown-item ${inst.status === 'Active' ? 'text-warning' : 'text-success'}`} onClick={() => handleToggleStatus(inst)}>
                                <i className={`ti ti-${inst.status === 'Active' ? 'player-pause' : 'player-play'} me-2`}></i>
                                {inst.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button></li>
                              <li><button className="dropdown-item text-danger" onClick={() => handleDelete(inst.id)}><i className="ti ti-trash me-2"></i>Delete</button></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredInstitutions.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-4 text-muted">No institutions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">Showing {filteredInstitutions.length} of {institutions.length} {institutionConfig?.name?.toLowerCase() || 'institutions'}</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div style={modalOverlay} onClick={() => { setShowAddModal(false); setShowEditModal(false) }}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">{showEditModal ? 'Edit Institution' : 'Add Institution'}</h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false) }}><i className="ti ti-x"></i></button>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Institution Name *</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleFormChange} placeholder="Enter name" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Type</label>
                <select className="form-select" name="type" value={formData.type} onChange={handleFormChange}>
                  {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleFormChange} placeholder="admin@institution.edu" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="Phone number" />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Address</label>
                <input type="text" className="form-control" name="address" value={formData.address} onChange={handleFormChange} placeholder="Street address" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">City</label>
                <input type="text" className="form-control" name="city" value={formData.city} onChange={handleFormChange} placeholder="City" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">State</label>
                <input type="text" className="form-control" name="state" value={formData.state} onChange={handleFormChange} placeholder="State" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Name</label>
                <input type="text" className="form-control" name="adminName" value={formData.adminName} onChange={handleFormChange} placeholder="Admin name" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Email</label>
                <input type="email" className="form-control" name="adminEmail" value={formData.adminEmail} onChange={handleFormChange} placeholder="admin@example.com" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Phone</label>
                <input type="text" className="form-control" name="adminPhone" value={formData.adminPhone} onChange={handleFormChange} placeholder="Admin phone" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Plan</label>
                <select className="form-select" name="plan" value={formData.plan} onChange={handleFormChange}>
                  <option value="Basic">Basic</option>
                  <option value="Medium">Medium</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false) }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {showEditModal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleConfirmAction} message={deleteTarget?.type === 'bulkSuspend' ? `Are you sure you want to suspend ${selectedIds.length} institutions?` : `Are you sure you want to delete ${deleteTarget?.type === 'delete' ? 'this' : selectedIds.length + ' selected'} institution${deleteTarget?.type === 'delete' ? '' : 's'}? This cannot be undone.`} />
    </>
  )
}

export default InstitutionsManagementPage
