import React, { useState, useEffect } from 'react'

const DEMO_CATEGORIES = [
  {
    id: 'academic',
    name: 'Academic',
    description: 'Core academic modules',
    icon: 'ti ti-school',
    badgeColor: 'bg-primary',
    institutionTypes: ['School', 'Inter College', 'Degree College', 'University'],
    modules: [
      { id: 'm1', name: 'Student Management', enabled: true, description: 'Manage student records', icon: 'ti ti-users', category: 'academic', institutionTypes: ['School'], plans: ['Basic', 'Medium', 'Premium'], features: [{ id: 'f1', name: 'Admission', enabled: true, description: 'Student admission process' }, { id: 'f2', name: 'Attendance', enabled: true, description: 'Track student attendance' }], version: '1.0.0', lastUpdated: '2024-01-15' },
      { id: 'm2', name: 'Examination', enabled: true, description: 'Exam management', icon: 'ti ti-clipboard-list', category: 'academic', institutionTypes: ['School', 'Inter College', 'Degree College'], plans: ['Medium', 'Premium'], features: [{ id: 'f3', name: 'Online Exams', enabled: true, description: 'Conduct exams online' }], isBeta: false, version: '2.1.0', lastUpdated: '2024-02-20' },
      { id: 'm3', name: 'Results', enabled: true, description: 'Manage exam results', icon: 'ti ti-chart-bar', category: 'academic', institutionTypes: ['School', 'Inter College', 'Degree College', 'University'], plans: ['Basic', 'Medium', 'Premium'], features: [], version: '1.5.0', lastUpdated: '2024-01-10' },
    ]
  },
  {
    id: 'administration',
    name: 'Administration',
    description: 'Administrative modules',
    icon: 'ti ti-settings',
    badgeColor: 'bg-success',
    institutionTypes: ['School', 'Inter College', 'Degree College', 'University'],
    modules: [
      { id: 'm4', name: 'Fee Management', enabled: true, description: 'Manage fees and payments', icon: 'ti ti-credit-card', category: 'administration', institutionTypes: ['School', 'Inter College', 'Degree College', 'University'], plans: ['Basic', 'Medium', 'Premium'], features: [{ id: 'f4', name: 'Online Payment', enabled: true, description: 'Accept online payments' }, { id: 'f5', name: 'Installments', enabled: true, description: 'Payment in installments' }], mandatory: true, version: '1.2.0', lastUpdated: '2024-03-01' },
      { id: 'm5', name: 'HR Management', enabled: true, description: 'Manage staff and payroll', icon: 'ti ti-users-group', category: 'administration', institutionTypes: ['School', 'Inter College', 'Degree College', 'University'], plans: ['Medium', 'Premium'], features: [], version: '1.0.0', lastUpdated: '2024-02-15' },
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Communication modules',
    icon: 'ti ti-messages',
    badgeColor: 'bg-info',
    institutionTypes: ['School', 'Inter College', 'Degree College', 'University'],
    modules: [
      { id: 'm6', name: 'Notice Board', enabled: true, description: 'Publish notices', icon: 'ti ti-bell', category: 'communication', institutionTypes: ['School', 'Inter College', 'Degree College', 'University'], plans: ['Basic', 'Medium', 'Premium'], features: [], mandatory: true, version: '1.0.0', lastUpdated: '2024-01-05' },
      { id: 'm7', name: 'Chat', enabled: false, description: 'Internal messaging', icon: 'ti ti-message', category: 'communication', institutionTypes: ['School', 'Inter College', 'Degree College', 'University'], plans: ['Premium'], features: [], isBeta: true, version: '0.9.0', lastUpdated: '2024-03-10' },
    ]
  }
];

interface Feature {
  id: string
  name: string
  enabled: boolean
  description: string
  isBeta?: boolean
  requiredPlan?: string
}

interface Module {
  id: string
  name: string
  enabled: boolean
  description: string
  icon: string
  category: string
  institutionTypes: string[]
  plans: string[]
  features: Feature[]
  isBeta?: boolean
  version?: string
  lastUpdated?: string
  mandatory?: boolean
  dependencyModules?: string[]
  dragged?: boolean
  targetCategory?: string
}

interface ModuleCategory {
  id: string
  name: string
  description: string
  icon: string
  badgeColor: string
  institutionTypes: string[]
  modules: Module[]
}

/* ─── EDIT MODAL ─────────────────────────────────────────────── */
const EditModuleModal: React.FC<{
  module: Module
  onClose: () => void
  onSave: (m: Module) => void
}> = ({ module, onClose, onSave }) => {
  const [form, setForm] = useState<Module>({ ...module, features: module.features.map(f => ({ ...f })) })

  const updateFeature = (id: string, key: keyof Feature, val: any) =>
    setForm(p => ({ ...p, features: p.features.map(f => f.id === id ? { ...f, [key]: val } : f) }))

  const addFeature = () =>
    setForm(p => ({ ...p, features: [...p.features, { id: Date.now().toString(), name: 'New Feature', enabled: false, description: '' }] }))

  const removeFeature = (id: string) =>
    setForm(p => ({ ...p, features: p.features.filter(f => f.id !== id) }))

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-edit me-2 text-primary"></i>Edit Module
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Module Name</label>
                <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Icon (Tabler class)</label>
                <div className="input-group">
                  <span className="input-group-text"><i className={form.icon}></i></span>
                  <input className="form-control" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="ti ti-package" />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Version</label>
                <input className="form-control" value={form.version || ''} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} placeholder="1.0.0" />
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Flags</label>
                <div className="d-flex gap-3 mt-1">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="edit-beta" checked={!!form.isBeta} onChange={e => setForm(p => ({ ...p, isBeta: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="edit-beta">Beta Module</label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="edit-mandatory" checked={!!form.mandatory} onChange={e => setForm(p => ({ ...p, mandatory: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="edit-mandatory">Mandatory</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Assign to Plans</label>
              <div className="d-flex gap-3 flex-wrap">
                {['Basic', 'Professional', 'Premium'].map(plan => (
                  <div key={plan} className="form-check form-check-inline">
                    <input className="form-check-input" type="checkbox" id={`ep-${plan}`}
                      checked={form.plans.includes(plan)}
                      onChange={e => setForm(p => ({ ...p, plans: e.target.checked ? [...p.plans, plan] : p.plans.filter(pl => pl !== plan) }))} />
                    <label className="form-check-label" htmlFor={`ep-${plan}`}>{plan}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Institution Types</label>
              <div className="d-flex gap-3 flex-wrap">
                {['School', 'Inter', 'Degree', 'Engineering'].map(type => (
                  <div key={type} className="form-check form-check-inline">
                    <input className="form-check-input" type="checkbox" id={`et-${type}`}
                      checked={form.institutionTypes.includes(type)}
                      onChange={e => setForm(p => ({ ...p, institutionTypes: e.target.checked ? [...p.institutionTypes, type] : p.institutionTypes.filter(t => t !== type) }))} />
                    <label className="form-check-label" htmlFor={`et-${type}`}>{type}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold">
                  Features <span className="badge bg-secondary ms-1">{form.features.length}</span>
                </h6>
                <button className="btn btn-sm btn-primary" onClick={addFeature}>
                  <i className="ti ti-plus me-1"></i>Add Feature
                </button>
              </div>
              {form.features.length === 0 && (
                <div className="text-center text-muted py-3">
                  <i className="ti ti-puzzle-off fs-2 d-block mb-2"></i>No features yet. Add one above.
                </div>
              )}
              {form.features.map(f => (
                <div key={f.id} className="card mb-2 border">
                  <div className="card-body p-2">
                    <div className="row g-2 align-items-center">
                      <div className="col-md-4">
                        <input className="form-control form-control-sm" placeholder="Feature name" value={f.name} onChange={e => updateFeature(f.id, 'name', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <input className="form-control form-control-sm" placeholder="Description" value={f.description} onChange={e => updateFeature(f.id, 'description', e.target.value)} />
                      </div>
                      <div className="col-md-2">
                        <select className="form-select form-select-sm" value={f.requiredPlan || ''} onChange={e => updateFeature(f.id, 'requiredPlan', e.target.value || undefined)}>
                          <option value="">Any plan</option>
                          <option value="Basic">Basic+</option>
                          <option value="Professional">Pro+</option>
                          <option value="Premium">Premium</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" checked={!!f.isBeta} onChange={e => updateFeature(f.id, 'isBeta', e.target.checked)} />
                          <label className="form-check-label small">Beta</label>
                        </div>
                      </div>
                      <div className="col-md-1 text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeFeature(f.id)}>
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(form)}>
              <i className="ti ti-check me-1"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── ADD MODULE MODAL ───────────────────────────────────────── */
const AddModuleModal: React.FC<{
  categories: ModuleCategory[]
  onClose: () => void
  onAdd: (categoryId: string, module: Module) => void
}> = ({ categories, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: '', category: categories[0]?.id || '', description: '',
    icon: 'ti ti-package', version: '1.0.0', isBeta: false,
    plans: [] as string[], institutionTypes: [] as string[]
  })

  const handleAdd = () => {
    if (!form.name.trim()) return alert('Please enter a module name')
    const module: Module = {
      id: Date.now().toString(), name: form.name, category: form.category,
      enabled: false, description: form.description, icon: form.icon,
      version: form.version, isBeta: form.isBeta, plans: form.plans,
      features: [], institutionTypes: form.institutionTypes,
      lastUpdated: new Date().toISOString().split('T')[0]
    }
    onAdd(form.category, module)
  }

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-plus me-2 text-primary"></i>Add New Module
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Module Name <span className="text-danger">*</span></label>
                <input className="form-control" placeholder="e.g. Scholarship Management" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Icon Class</label>
                <div className="input-group">
                  <span className="input-group-text"><i className={form.icon}></i></span>
                  <input className="form-control" placeholder="ti ti-package" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Version</label>
                <input className="form-control" placeholder="1.0.0" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} />
              </div>
            </div>
            <div className="mb-3">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="add-beta" checked={form.isBeta} onChange={e => setForm(p => ({ ...p, isBeta: e.target.checked }))} />
                <label className="form-check-label fw-semibold" htmlFor="add-beta">Mark as Beta Module</label>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Assign to Plans</label>
              <div className="d-flex gap-3 flex-wrap">
                {['Basic', 'Professional', 'Premium'].map(plan => (
                  <div key={plan} className="form-check">
                    <input className="form-check-input" type="checkbox" id={`ap-${plan}`}
                      checked={form.plans.includes(plan)}
                      onChange={e => setForm(p => ({ ...p, plans: e.target.checked ? [...p.plans, plan] : p.plans.filter(pl => pl !== plan) }))} />
                    <label className="form-check-label" htmlFor={`ap-${plan}`}>{plan}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label fw-semibold">Institution Types</label>
              <div className="d-flex gap-3 flex-wrap">
                {['School', 'Inter', 'Degree', 'Engineering'].map(type => (
                  <div key={type} className="form-check">
                    <input className="form-check-input" type="checkbox" id={`at-${type}`}
                      checked={form.institutionTypes.includes(type)}
                      onChange={e => setForm(p => ({ ...p, institutionTypes: e.target.checked ? [...p.institutionTypes, type] : p.institutionTypes.filter(t => t !== type) }))} />
                    <label className="form-check-label" htmlFor={`at-${type}`}>{type}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>
              <i className="ti ti-plus me-1"></i>Add Module
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
const ModulesControlPage: React.FC = () => {
  const [categories, setCategories] = useState<ModuleCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([])
  const [expandedPlanSections, setExpandedPlanSections] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedInstitution, setSelectedInstitution] = useState('all')
  const [activeTab, setActiveTab] = useState<'modules' | 'plans'>('modules')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingModule, setEditingModule] = useState<{ module: Module; categoryId: string } | null>(null)
  
  // Drag and drop state
  const [draggedModule, setDraggedModule] = useState<{ module: Module; sourceCategoryId: string } | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Demo mode - use demo data
        setCategories(DEMO_CATEGORIES)
      } catch (err) {
        console.error('Error fetching modules:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch modules')
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <h3 className="text-danger mb-2">Error loading modules</h3>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    )
  }

  /* ── Helpers ── */
  const toggleCategoryCollapse = (id: string) =>
    setCollapsedCategories(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id])

  const toggleModuleExpand = (id: string) =>
    setExpandedModules(p => p.includes(id) ? p.filter(m => m !== id) : [...p, id])

  const togglePlanSection = (key: string) =>
    setExpandedPlanSections(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])

  const toggleModuleStatus = (categoryId: string, moduleId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id !== categoryId ? cat : {
        ...cat,
        modules: cat.modules.map(mod => {
          if (mod.id !== moduleId || mod.mandatory) return mod
          if (!mod.enabled && mod.dependencyModules?.length) {
            const ok = mod.dependencyModules.every(depId => prev.some(c => c.modules.some(m => m.id === depId && m.enabled)))
            if (!ok) { alert('Enable required dependencies first!'); return mod }
          }
          return {
            ...mod,
            enabled: !mod.enabled,
            features: mod.enabled ? mod.features.map(f => ({ ...f, enabled: false })) : mod.features
          }
        })
      }
    ))
  }

  const toggleFeature = (categoryId: string, moduleId: string, featureId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id !== categoryId ? cat : {
        ...cat,
        modules: cat.modules.map(mod =>
          mod.id !== moduleId ? mod : {
            ...mod,
            features: mod.features.map(f => {
              if (f.id !== featureId) return f
              if (f.requiredPlan && !mod.plans.includes(f.requiredPlan)) return f
              return { ...f, enabled: !f.enabled }
            })
          }
        )
      }
    ))
  }

  const handleSaveEdit = (updated: Module) => {
    if (!editingModule) return
    setCategories(prev => prev.map(cat =>
      cat.id !== editingModule.categoryId ? cat : {
        ...cat,
        modules: cat.modules.map(m => m.id === updated.id ? updated : m)
      }
    ))
    setEditingModule(null)
  }

  const handleAddModule = (categoryId: string, module: Module) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, modules: [...cat.modules, module] } : cat
    ))
    setShowAddModal(false)
  }

  // Drag and drop handlers
  const handleDragStart = (module: Module, sourceCategoryId: string) => {
    setDraggedModule({ module, sourceCategoryId })
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    setDragOverCategory(categoryId)
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault()
    setDragOverCategory(null)
    
    if (!draggedModule || draggedModule.sourceCategoryId === targetCategoryId) return
    
    setCategories(prev => {
      const updated = prev.map(cat => {
        // Remove from source category
        if (cat.id === draggedModule.sourceCategoryId) {
          return {
            ...cat,
            modules: cat.modules.filter(m => m.id !== draggedModule.module.id)
          }
        }
        // Add to target category
        if (cat.id === targetCategoryId) {
          return {
            ...cat,
            modules: [...cat.modules, { ...draggedModule.module, category: targetCategoryId }]
          }
        }
        return cat
      })
      return updated
    })
    
    setDraggedModule(null)
  }

  const filteredCategories = categories
    .filter(cat => selectedInstitution === 'all' || cat.institutionTypes.includes(selectedInstitution))
    .map(cat => ({
      ...cat,
      modules: cat.modules.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchPlan = selectedPlan === 'all' || m.plans.includes(selectedPlan)
        return matchSearch && matchPlan
      })
    })).filter(cat => cat.modules.length > 0)

  const totalModules = categories.reduce((s, c) => s + c.modules.length, 0)
  const enabledModules = categories.reduce((s, c) => s + c.modules.filter(m => m.enabled).length, 0)
  const totalFeatures = categories.reduce((s, c) => s + c.modules.reduce((ms, m) => ms + m.features.length, 0), 0)
  const enabledFeatures = categories.reduce((s, c) => s + c.modules.reduce((ms, m) => ms + m.features.filter(f => f.enabled).length, 0), 0)

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Modules Control</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/super-admin/dashboard">Dashboard</a></li>
              <li className="breadcrumb-item active" aria-current="page">Modules Control</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-plus me-2"></i>Add Module
          </button>
          <button className="btn btn-success" onClick={() => alert('Module configuration saved successfully!')}>
            <i className="ti ti-device-floppy me-2"></i>Save Configuration
          </button>
          <button className="btn btn-outline-primary">
            <i className="ti ti-refresh me-2"></i>Reset to Default
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        {[
          { label: 'Total Modules', value: totalModules, icon: 'ti ti-package', bg: 'bg-primary' },
          { label: 'Active Modules', value: enabledModules, icon: 'ti ti-checks', bg: 'bg-success' },
          { label: 'Total Features', value: totalFeatures, icon: 'ti ti-settings', bg: 'bg-info' },
          { label: 'Active Features', value: `${enabledFeatures}/${totalFeatures}`, icon: 'ti ti-bolt', bg: 'bg-warning' },
        ].map((s, i) => (
          <div className="col-lg-3 col-md-6" key={i}>
            <div className={`card ${s.bg}`}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-1">{s.value}</h4>
                    <p className="text-white mb-0">{s.label}</p>
                  </div>
                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                    <i className={`${s.icon} text-white fs-4`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search Modules</label>
              <div className="input-group">
                <span className="input-group-text"><i className="ti ti-search"></i></span>
                <input type="text" className="form-control" placeholder="Search modules..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Plan</label>
              <select className="form-select" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Professional">Professional</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Institution</label>
              <select className="form-select" value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)}>
                <option value="all">All Types</option>
                <option value="School">School</option>
                <option value="Inter">Intermediate</option>
                <option value="Degree">Degree College</option>
                <option value="Engineering">Engineering College</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-tabs-bottom" role="tablist">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'modules' ? 'active' : ''}`} onClick={() => setActiveTab('modules')}>
                <i className="ti ti-package me-2"></i>Modules
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
                <i className="ti ti-crown me-2"></i>Plan Assignment
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ── MODULES TAB ── */}
      {activeTab === 'modules' && (
        <div>
          {filteredCategories.map(category => {
            const isCollapsed = collapsedCategories.includes(category.id)
            const activeCount = category.modules.filter(m => m.enabled).length

            return (
              <div className={`card mb-4 ${dragOverCategory === category.id ? 'border-primary border-2' : ''}`} key={category.id}
                   onDragOver={(e) => handleDragOver(e, category.id)}
                   onDragLeave={handleDragLeave}
                   onDrop={(e) => handleDrop(e, category.id)}>
                {/* Category Header — click anywhere to collapse/expand */}
                <div
                  className="card-header"
                  onClick={() => toggleCategoryCollapse(category.id)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <i className={`${category.icon} fs-5 text-primary`}></i>
                      <div>
                        <h5 className="card-title mb-0">{category.name}</h5>
                        <small className="text-muted">{category.description}</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark">
                        {activeCount}/{category.modules.length} Active
                      </span>
                      <span className={`badge bg-${category.badgeColor}`}>
                        {category.institutionTypes.join(' + ')}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-success"
                        title="Add Module to Category"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingModule({ 
                            module: {
                              id: '',
                              name: '',
                              description: '',
                              icon: 'ti ti-package',
                              enabled: false,
                              mandatory: false,
                              category: category.id,
                              institutionTypes: ['School', 'Inter', 'Degree', 'Engineering'],
                              plans: ['Basic', 'Professional', 'Premium'],
                              features: []
                            } as Module,
                            categoryId: category.id
                          })
                        }}
                      >
                        <i className="ti ti-plus"></i>
                      </button>
                      {/* Collapse arrow */}
                      <i className={`ti ti-chevron-${isCollapsed ? 'right' : 'down'} fs-5 text-muted`}></i>
                    </div>
                  </div>
                </div>

                {/* Collapsible body */}
                {!isCollapsed && (
                  <div className="card-body">
                    {category.modules.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="ti ti-search fs-1 d-block mb-2"></i>
                        No modules found matching your filters
                      </div>
                    ) : (
                      /* Responsive: 4 cols on xl, 3 on lg, 2 on md, 1 on xs */
                      <div className="row g-3">
                        {category.modules.map(module => {
                          const isExpanded = expandedModules.includes(module.id)
                          const activeFeatures = module.features.filter(f => f.enabled).length

                          return (
                            <div className="col-xl-3 col-lg-4 col-md-6 col-12" key={module.id}>
                              <div className={`card h-100 border ${module.enabled ? 'border-success' : 'border-secondary'} mb-0 ${draggedModule?.module.id === module.id ? 'opacity-50' : ''}`}
                                     draggable
                                     onDragStart={() => handleDragStart(module, category.id)}
                                     style={{ cursor: 'move' }}>
                                <div className="card-body d-flex flex-column p-3">

                                  {/* Module top row: icon + name + toggle */}
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-start gap-2" style={{ flex: 1, minWidth: 0 }}>
                                      <span className={`avatar avatar-sm rounded ${module.enabled ? 'bg-success-transparent' : 'bg-light'}`}>
                                        <i className={`${module.icon} ${module.enabled ? 'text-success' : 'text-muted'}`}></i>
                                      </span>
                                      <div style={{ minWidth: 0 }}>
                                        <h6 className="mb-0" style={{ fontSize: '0.875rem' }}>{module.name}</h6>
                                        <small className="text-muted d-block">{module.description}</small>
                                      </div>
                                    </div>
                                    <div className="form-check form-switch ms-2 mb-0 flex-shrink-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={module.enabled}
                                        disabled={module.mandatory}
                                        onChange={() => toggleModuleStatus(category.id, module.id)}
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>

                                  {/* Badges row */}
                                  <div className="d-flex flex-wrap gap-1 mb-2">
                                    {module.plans.map(plan => (
                                      <span key={plan} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>{plan}</span>
                                    ))}
                                    {module.isBeta && <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>BETA</span>}
                                    {module.mandatory && <span className="badge bg-danger" style={{ fontSize: '0.7rem' }}>MANDATORY</span>}
                                    {module.dependencyModules?.length ? (
                                      <span className="badge bg-info" style={{ fontSize: '0.7rem' }}>
                                        <i className="ti ti-link me-1"></i>Dep
                                      </span>
                                    ) : null}
                                  </div>

                                  <small className="text-muted mb-3">
                                    <i className="ti ti-building me-1"></i>
                                    {module.institutionTypes.join(', ')}
                                  </small>

                                  {/* Action buttons */}
                                  <div className="d-flex justify-content-between align-items-center mt-auto">
                                    <div className="d-flex gap-1">
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => toggleModuleExpand(module.id)}
                                      >
                                        <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} me-1`}></i>
                                        {isExpanded ? 'Hide' : 'Features'} ({module.features.length})
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        title="Edit Module"
                                        onClick={() => setEditingModule({ module, categoryId: category.id })}
                                      >
                                        <i className="ti ti-edit"></i>
                                      </button>
                                    </div>
                                    <span className="badge bg-success">
                                      {activeFeatures} active
                                    </span>
                                  </div>

                                  {/* Features list (expanded) */}
                                  {isExpanded && (
                                    <div className="mt-3 border-top pt-3">
                                      <div className="d-flex flex-column gap-2">
                                        {module.features.map(feature => {
                                          const isLocked = !!(feature.requiredPlan && !module.plans.includes(feature.requiredPlan))
                                          return (
                                            <div
                                              key={feature.id}
                                              className={`d-flex align-items-center justify-content-between p-2 rounded border ${isLocked ? 'bg-light border-danger' : 'bg-light'}`}
                                            >
                                              <div className="d-flex align-items-center gap-2">
                                                <div className="form-check form-switch mb-0">
                                                  <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={feature.enabled}
                                                    disabled={isLocked}
                                                    onChange={() => toggleFeature(category.id, module.id, feature.id)}
                                                  />
                                                </div>
                                                <div>
                                                  <small className="fw-semibold">{feature.name}</small>
                                                  {feature.isBeta && (
                                                    <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.6rem' }}>BETA</span>
                                                  )}
                                                  {isLocked && (
                                                    <small className="text-danger d-block">
                                                      <i className="ti ti-lock me-1"></i>Requires {feature.requiredPlan}
                                                    </small>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── PLAN ASSIGNMENT TAB ── */}
      {activeTab === 'plans' && (
        <div className="row g-4">
          {(['Basic', 'Professional', 'Premium'] as const).map(plan => {
            const planCats = categories.filter(cat => cat.modules.some(m => m.plans.includes(plan)))
            const allPlanModules = categories.flatMap(c => c.modules.filter(m => m.plans.includes(plan)))
            const planBg = plan === 'Basic' ? 'bg-primary' : plan === 'Professional' ? 'bg-info' : 'bg-warning'
            const planIcon = plan === 'Basic' ? 'ti ti-package' : plan === 'Professional' ? 'ti ti-star' : 'ti ti-crown'

            return (
              <div className="col-lg-4" key={plan}>
                <div className="card h-100">
                  {/* Plan Header */}
                  <div className={`card-header ${planBg}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title text-white mb-1">
                          <i className={`${planIcon} me-2`}></i>{plan} Plan
                        </h5>
                        <small className="text-white-50">
                          {allPlanModules.length} modules · {allPlanModules.filter(m => m.enabled).length} active
                        </small>
                      </div>
                      <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                        <i className={`${planIcon} text-white fs-5`}></i>
                      </div>
                    </div>
                  </div>

                  {/* Plan body — categories as Bootstrap accordion (click to open/close) */}
                  <div className="card-body p-0">
                    <div className="accordion accordion-flush" id={`acc-${plan}`}>
                      {planCats.map(cat => {
                        const catModules = cat.modules.filter(m => m.plans.includes(plan))
                        const sectionKey = `${plan}-${cat.id}`
                        const isOpen = expandedPlanSections.includes(sectionKey)

                        return (
                          <div className="accordion-item" key={cat.id}>
                            <h2 className="accordion-header">
                              <button
                                className={`accordion-button py-3 ${isOpen ? '' : 'collapsed'}`}
                                type="button"
                                onClick={() => togglePlanSection(sectionKey)}
                              >
                                <div className="d-flex align-items-center justify-content-between w-100 me-2">
                                  <div className="d-flex align-items-center">
                                    <i className={`${cat.icon} me-2 text-primary`}></i>
                                    <span className="fw-semibold">{cat.name}</span>
                                  </div>
                                  <span className={`badge bg-${cat.badgeColor}`}>{catModules.length}</span>
                                </div>
                              </button>
                            </h2>

                            {isOpen && (
                              <div>
                                <div className="accordion-body p-0">
                                  <div className="list-group list-group-flush">
                                    {catModules.map(module => {
                                      const isExpanded = expandedModules.includes(module.id)
                                      
                                      // Different colors for different modules based on category
                                      const moduleColors = {
                                        'academic': 'border-primary bg-primary-transparent',
                                        'school-specific': 'border-secondary bg-secondary-transparent', 
                                        'inter-college': 'border-warning bg-warning-transparent',
                                        'degree-college': 'border-info bg-info-transparent',
                                        'administrative': 'border-success bg-success-transparent',
                                        'financial': 'border-danger bg-danger-transparent',
                                        'communication': 'border-dark bg-dark-transparent',
                                        'advanced': 'border-purple bg-purple-transparent',
                                        'security': 'border-orange bg-orange-transparent',
                                        'compliance': 'border-teal bg-teal-transparent',
                                        'infrastructure': 'border-indigo bg-indigo-transparent'
                                      }
                                      const moduleColorClass = moduleColors[module.category as keyof typeof moduleColors] || 'border-light bg-light-transparent'

                                      return (
                                        <div
                                          key={module.id}
                                          className={`list-group-item px-3 py-3 mb-2 rounded border ${draggedModule?.module.id === module.id ? 'opacity-50' : ''} ${module.enabled ? moduleColorClass : 'border-secondary bg-light'}`}
                                          draggable
                                          onDragStart={() => handleDragStart(module, module.category)}
                                          style={{ cursor: 'move' }}
                                          onClick={() => toggleModuleExpand(module.id)}
                                        >
                                          <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                              <i className={`${module.icon} fs-5 ${module.enabled ? '' : 'text-muted'}`}></i>
                                              <div className="flex-grow-1">
                                                <div className="fw-semibold mb-1">{module.name}</div>
                                                <div className="d-flex gap-2 flex-wrap">
                                                  {module.mandatory && <span className="badge bg-danger" style={{ fontSize: '0.7rem' }}>MANDATORY</span>}
                                                  {module.isBeta && <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>BETA</span>}
                                                  <span className={`badge ${module.enabled ? 'bg-success' : 'bg-secondary'}`}>
                                                    {module.enabled ? 'Active' : 'Inactive'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} text-muted`}></i>
                                          </div>

                                          {/* Features list (expanded) */}
                                          {isExpanded && (
                                            <div className="mt-3 border-top pt-3">
                                              <h6 className="fw-bold mb-3 text-primary">
                                                <i className="ti ti-list-check me-2"></i>Module Features
                                              </h6>
                                              <div className="d-flex flex-column gap-2">
                                                {module.features.map(feature => {
                                                  const isLocked = !!(feature.requiredPlan && !module.plans.includes(feature.requiredPlan))
                                                  return (
                                                    <div
                                                      key={feature.id}
                                                      className={`d-flex align-items-center justify-content-between p-3 rounded border ${isLocked ? 'bg-light border-danger' : 'bg-light'}`}
                                                    >
                                                      <div className="d-flex align-items-center gap-3">
                                                        <div className="form-check form-switch mb-0">
                                                          <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={feature.enabled}
                                                            disabled={isLocked}
                                                            onChange={(e) => {
                                                              e.stopPropagation()
                                                              toggleFeature(module.category, module.id, feature.id)
                                                            }}
                                                          />
                                                        </div>
                                                        <div>
                                                          <div className="fw-semibold">{feature.name}</div>
                                                          <div className="text-muted small">{feature.description}</div>
                                                          {feature.isBeta && (
                                                            <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.6rem' }}>BETA</span>
                                                          )}
                                                          {isLocked && (
                                                            <div className="text-danger small">
                                                              <i className="ti ti-lock me-1"></i>Requires {feature.requiredPlan}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Module Modal */}
      {editingModule && (
        <EditModuleModal
          module={editingModule.module}
          onClose={() => setEditingModule(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Module Modal */}
      {showAddModal && (
        <AddModuleModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddModule}
        />
      )}
    </div>
  )
}

export default ModulesControlPage
