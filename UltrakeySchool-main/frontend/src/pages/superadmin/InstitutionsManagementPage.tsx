import React, { useState, useEffect} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getInstitutionConfigFromPath } from '../../utils/institutionUtils'
import superAdminService from '../../services/superAdminService'

interface School {
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

const extractPlanName = (plan: any): string => {
  if (!plan) return 'Basic'
  if (typeof plan === 'string') return plan.charAt(0).toUpperCase() + plan.slice(1)
  if (typeof plan === 'object' && plan.name) return plan.name
  return 'Basic'
}

const InstitutionsManagementPage: React.FC = () => {
  const location = useLocation()
  const institutionConfig = getInstitutionConfigFromPath(location.pathname)
  
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        // Derive institution type from path config (e.g. 'School', 'Inter College', etc.)
        const typeLabel = institutionConfig?.singularName || 'School'
        const data = await superAdminService.getInstitutionsByType(typeLabel)

        const mapped: School[] = (data || []).map((inst: any) => ({
          id: inst._id || inst.id || '',
          name: inst.name || '',
          type: inst.type || typeLabel,
          plan: extractPlanName(inst.plan),
          status: inst.status ? (inst.status.charAt(0).toUpperCase() + inst.status.slice(1)) : 'Active',
          students: inst.currentUsers || inst.students || 0,
          monthlyRevenue: inst.monthlyRevenue || 0,
          adminName: inst.adminName || inst.contactPerson || '',
          adminEmail: inst.email || inst.contactEmail || '',
          adminPhone: inst.phone || inst.contactPhone || '',
          address: inst.address?.street || inst.address || '',
          city: inst.address?.city || inst.city || '',
          state: inst.address?.state || inst.state || '',
          expiryDate: inst.subscriptionExpiry || inst.expiryDate || '',
        }))

        setSchools(mapped)
      } catch (err) {
        console.error('Error fetching schools:', err)
      }
    }

    fetchSchools()
  }, [institutionConfig?.singularName])

  const handleSelectSchool = (schoolId: string) => {
    if (selectedSchools.includes(schoolId)) {
      setSelectedSchools(selectedSchools.filter(id => id !== schoolId))
    } else {
      setSelectedSchools([...selectedSchools, schoolId])
    }
  }

  const handleSelectAll = () => {
    setSelectedSchools(schools.map(school => school.id))
  }

  const handleSendReminder = (schoolId: string) => {
    console.log('Send reminder to school:', schoolId)
    // Implement reminder functionality
    alert(`Reminder sent to school ${schoolId}`)
  }

  const handleToggleStatus = (schoolId: string) => {
    setSchools(prevSchools =>
      prevSchools.map(school => {
        if (school.id === schoolId) {
          const newStatus = school.status === 'Active' ? 'Suspended' : 'Active'
          return { ...school, status: newStatus }
        }
        return school
      })
    )
  }

  const handleDeleteSchool = (schoolId: string) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      setSchools(prevSchools => prevSchools.filter(school => school.id !== schoolId))
      setSelectedSchools(prevSelected => prevSelected.filter(id => id !== schoolId))
      alert('School deleted successfully')
    }
  }

  const handleBulkApprove = () => {
    console.log('Approve selected schools:', selectedSchools)
    // Implement bulk approval
    alert(`Approved ${selectedSchools.length} schools`)
    setSelectedSchools([])
  }

  const handleBulkSuspend = () => {
    if (window.confirm(`Are you sure you want to suspend ${selectedSchools.length} schools?`)) {
      setSchools(prevSchools =>
        prevSchools.map(school => {
          if (selectedSchools.includes(school.id)) {
            return { ...school, status: 'Suspended' }
          }
          return school
        })
      )
      setSelectedSchools([])
      alert(`Suspended ${selectedSchools.length} schools`)
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedSchools.length} schools? This action cannot be undone.`)) {
      setSchools(prevSchools => prevSchools.filter(school => !selectedSchools.includes(school.id)))
      setSelectedSchools([])
      alert(`Deleted ${selectedSchools.length} schools`)
    }
  }

  const filteredSchools = schools.filter(school => {
    const matchesStatus = filterStatus === 'all' || school.status === filterStatus
    const matchesPlan = filterPlan === 'all' || school.plan === filterPlan
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesPlan && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: 'bg-success',
      Suspended: 'bg-warning',
      Expired: 'bg-danger'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      Basic: 'bg-info',
      Medium: 'bg-warning',
      Premium: 'bg-danger'
    }
    return planConfig[plan as keyof typeof planConfig] || 'bg-secondary'
  }

  const selectedCount = selectedSchools.length
  const totalCount = filteredSchools.length

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{institutionConfig?.name || 'Institutions'} Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={institutionConfig?.basePath || '#'}>{institutionConfig?.name || 'Institutions'}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Management</li>
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
          {selectedCount > 0 && (
            <div className="dropdown me-2 mb-2">
              <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-settings me-2"></i>
                Actions ({selectedCount})
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                <li>
                  <button className="dropdown-item" onClick={handleBulkApprove}>
                    <i className="ti ti-user-check me-2"></i>Approve Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleBulkSuspend}>
                    <i className="ti ti-user-x me-2"></i>Suspend Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleBulkDelete}>
                    <i className="ti ti-trash me-2"></i>Delete Selected
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item text-danger">
                    <i className="ti ti-x me-2"></i>Clear Selection
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{schools.length}</h4>
                  <p className="text-white mb-0">Total {institutionConfig?.name || 'Institutions'}</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className={`${institutionConfig?.icon || 'ti ti-building'} text-white fs-4`}></i>
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
                  <h4 className="text-white mb-1">{schools.filter(s => s.status === 'Active').length}</h4>
                  <p className="text-white mb-0">Active {institutionConfig?.name || 'Institutions'}</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-checks text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{schools.filter(s => s.status === 'Suspended').length}</h4>
                  <p className="text-white mb-0">Suspended {institutionConfig?.name || 'Institutions'}</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-alert-triangle text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{schools.filter(s => s.status === 'Expired').length}</h4>
                  <p className="text-white mb-0">Expired {institutionConfig?.name || 'Institutions'}</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-x-circle text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    placeholder="Search schools, admins, or emails..."
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
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
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
                  <option value="Medium">Medium</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">&nbsp;</label>
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setFilterStatus('all')
                    setFilterPlan('all')
                    setSearchTerm('')
                  }}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">{institutionConfig?.name || 'Institutions'} ({filteredSchools.length})</h4>
          <div className="d-flex align-items-center">
            {selectedCount > 0 && (
              <span className="badge bg-primary me-2">
                {selectedCount} selected
              </span>
            )}
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="selectAll"
                checked={selectedCount === totalCount && totalCount > 0}
                onChange={handleSelectAll}
              />
              <label className="form-check-label" htmlFor="selectAll">
                Select All
              </label>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="w-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="headerSelectAll"
                        checked={selectedCount === totalCount && totalCount > 0}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label" htmlFor="headerSelectAll"></label>
                    </div>
                  </th>
                  <th>{institutionConfig?.singularName || 'Institution'} Name</th>
                  <th>Admin</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Revenue</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id}>
                    <td>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedSchools.includes(school.id)}
                          onChange={() => handleSelectSchool(school.id)}
                        />
                        <label className="form-check-label"></label>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="ti ti-building text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-medium">{school.name}</div>
                          <small className="text-muted d-block">{school.address}, {school.city}, {school.state}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="ti ti-user text-info"></i>
                        </div>
                        <div>
                          <div className="fw-medium">{school.adminName}</div>
                          <small className="text-muted d-block">{school.adminEmail}</small>
                          <small className="text-muted d-block">{school.adminPhone}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getPlanBadge(school.plan)}`}>
                        {school.plan}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(school.status)}`}>
                        {school.status}
                      </span>
                    </td>
                    <td>{school.students}</td>
                    <td>${school.monthlyRevenue}</td>
                    <td>{school.expiryDate}</td>
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
                            <Link to={`${institutionConfig?.basePath || '#'}/${school.id}`} className="dropdown-item">
                              <i className="ti ti-eye me-2"></i>View Details
                            </Link>
                          </li>
                          <li>
                            <Link to={`${institutionConfig?.basePath || '#'}/${school.id}/edit`} className="dropdown-item">
                              <i className="ti ti-edit me-2"></i>Edit
                            </Link>
                          </li>
                          <li>
                            <Link to={`${institutionConfig?.basePath || '#'}/${school.id}/admin`} className="dropdown-item">
                              <i className="ti ti-user-check me-2"></i>Manage Admin
                            </Link>
                          </li>
                          <li>
                            <Link to={`${institutionConfig?.basePath || '#'}/${school.id}/upgrade`} className="dropdown-item">
                              <i className="ti ti-credit-card me-2"></i>Upgrade Plan
                            </Link>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleSendReminder(school.id)}>
                              <i className="ti ti-bell me-2"></i>Send Reminder
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button className={`dropdown-item ${school.status === 'Active' ? 'text-warning' : 'text-success'
                              }`} onClick={() => handleToggleStatus(school.id)}>
                              <i className={`ti ti-${school.status === 'Active' ? 'player-pause' : 'player-play'} me-2`}></i>
                              {school.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteSchool(school.id)}>
                              <i className="ti ti-trash me-2"></i>Delete School
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
        <div className="card-footer">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Showing {filteredSchools.length} of {schools.length} {institutionConfig?.name?.toLowerCase() || 'institutions'}
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className="page-item disabled">
                  <a className="page-link" href="#" tabIndex={-1}>
                    <i className="ti ti-chevron-left"></i>
                  </a>
                </li>
                <li className="page-item active">
                  <a className="page-link" href="#">1</a>
                </li>
                <li className="page-item">
                  <a className="page-link" href="#">2</a>
                </li>
                <li className="page-item">
                  <a className="page-link" href="#">
                    <i className="ti ti-chevron-right"></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default InstitutionsManagementPage
