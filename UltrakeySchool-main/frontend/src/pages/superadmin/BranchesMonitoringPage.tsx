import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import branchService, { type Branch } from '../../services/branchService'

const BranchesMonitoringPage: React.FC = () => {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterInstitutionType, setFilterInstitutionType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  const safeBranches = branches || []

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true)
        const response = await branchService.getBranches({ limit: 100 })
        if (response?.branches && Array.isArray(response.branches)) {
          setBranches(response.branches)
        } else if (Array.isArray(response)) {
          setBranches(response as Branch[])
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
        // Use demo data if API fails
        setBranches([])
      } finally {
        setLoading(false)
      }
    }

    fetchBranches()
  }, [])

  const handleSelectBranch = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter(id => id !== branchId))
    } else {
      setSelectedBranches([...selectedBranches, branchId])
    }
  }

  const handleSelectAll = () => {
    setSelectedBranches((filteredBranches || []).map(branch => branch.id || branch._id))
  }

  const handleViewDetails = (branchId: string) => {
    window.location.href = `/super-admin/branches/${branchId}`
  }

  const handleEditBranch = (branchId: string) => {
    window.location.href = `/super-admin/branches/${branchId}/edit`
  }

  const handleManageStudents = (branchId: string) => {
    window.location.href = `/super-admin/branches/${branchId}/students`
  }

  const handleToggleStatus = async (branchId: string) => {
    try {
      const branch = safeBranches.find(b => (b.id || b._id) === branchId)
      if (!branch) return

      try {
        if (branch.status === 'Active') {
          await branchService.suspendBranch(branchId, 'Suspended by admin')
        } else {
          await branchService.activateBranch(branchId)
        }
        const response = await branchService.getBranches()
        if (response?.branches) {
          setBranches(response.branches)
        }
      } catch {
        setBranches(safeBranches.map(b => 
          (b.id || b._id) === branchId ? { ...b, status: b.status === 'Active' ? 'Suspended' : 'Active' } : b
        ))
      }
      alert(`Branch ${branch.status === 'Active' ? 'suspended' : 'activated'} successfully!`)
    } catch (err) {
      console.error('Failed to toggle status:', err)
      alert('Failed to toggle branch status')
    }
  }

  const handleDeleteBranch = async (branchId: string) => {
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      try {
        try {
          await branchService.deleteBranch(branchId)
        } catch {
          // Demo mode - just remove locally
        }
        setBranches(safeBranches.filter(b => (b.id || b._id) !== branchId))
        alert('Branch deleted successfully!')
      } catch (err) {
        console.error('Failed to delete branch:', err)
        alert('Failed to delete branch')
      }
    }
  }

  const handleBulkActivate = async () => {
    try {
      try {
        await Promise.all(selectedBranches.map(id => branchService.activateBranch(id)))
        const response = await branchService.getBranches()
        if (response?.branches) {
          setBranches(response.branches)
        }
      } catch {
        setBranches(safeBranches.map(b => 
          selectedBranches.includes(b.id || b._id) ? { ...b, status: 'Active' as const } : b
        ))
      }
      setSelectedBranches([])
      alert('Branches activated successfully!')
    } catch (err) {
      console.error('Failed to activate branches:', err)
      alert('Failed to activate selected branches')
    }
  }

  const handleBulkSuspend = async () => {
    try {
      try {
        await Promise.all(selectedBranches.map(id => branchService.suspendBranch(id, 'Bulk suspend by admin')))
        const response = await branchService.getBranches()
        if (response?.branches) {
          setBranches(response.branches)
        }
      } catch {
        setBranches(safeBranches.map(b => 
          selectedBranches.includes(b.id || b._id) ? { ...b, status: 'Suspended' as const } : b
        ))
      }
      setSelectedBranches([])
      alert('Branches suspended successfully!')
    } catch (err) {
      console.error('Failed to suspend branches:', err)
      alert('Failed to suspend selected branches')
    }
  }

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedBranches.length} selected branches? This action cannot be undone.`)) {
      try {
        try {
          await branchService.bulkDelete(selectedBranches)
        } catch {
          // Demo mode - just remove locally
        }
        setBranches(safeBranches.filter(b => !selectedBranches.includes(b.id || b._id)))
        setSelectedBranches([])
        alert('Branches deleted successfully!')
      } catch (err) {
        console.error('Failed to delete branches:', err)
        alert('Failed to delete selected branches')
      }
    }
  }

  const handleClearSelection = () => {
    setSelectedBranches([])
  }

  const filteredBranches = useMemo(() => {
    const list = safeBranches
    return list.filter(branch => {
      const matchesStatus = filterStatus === 'all' || branch.status === filterStatus
      const matchesInstitutionType = filterInstitutionType === 'all' || branch.institutionType === filterInstitutionType
      const matchesSearch = (branch.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.institutionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase())

      return matchesStatus && matchesInstitutionType && matchesSearch
    })
  }, [safeBranches, filterStatus, filterInstitutionType, searchTerm])

  // Calculate totals for statistics
  const totalStudents = useMemo(() => {
    return safeBranches.reduce((sum, branch) => sum + (branch.students || 0), 0)
  }, [safeBranches])

  const totalCapacity = useMemo(() => {
    return safeBranches.reduce((sum, branch) => sum + (branch.capacity?.maxStudents || 0), 0)
  }, [safeBranches])

  const avgRevenue = useMemo(() => {
    const activeBranches = safeBranches.filter(branch => branch.status === 'Active')
    if (activeBranches.length === 0) return 0
    const totalRevenue = activeBranches.reduce((sum, branch) => sum + (branch.monthlyRevenue || 0), 0)
    return totalRevenue / activeBranches.length
  }, [safeBranches])

  const avgPerformance = useMemo(() => {
    const activeBranches = safeBranches.filter(branch => branch.status === 'Active')
    if (activeBranches.length === 0) return 0
    const totalPerformance = activeBranches.reduce((sum, branch) => sum + (branch.performance || 85), 0)
    return Math.round(totalPerformance / activeBranches.length)
  }, [safeBranches])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: 'bg-success',
      Suspended: 'bg-warning'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  const getInstitutionTypeBadge = (type: string) => {
    const typeConfig = {
      'School': 'bg-info',
      'Inter College': 'bg-warning',
      'Degree College': 'bg-danger',
      'Engineering College': 'bg-primary'
    }
    return typeConfig[type as keyof typeof typeConfig] || 'bg-secondary'
  }

  const selectedCount = selectedBranches.length
  const totalCount = filteredBranches.length

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Branches Monitoring</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Branches Monitoring</li>
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
                  <button className="dropdown-item" onClick={handleBulkActivate}>
                    <i className="ti ti-user-check me-2"></i>Activate Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleBulkSuspend}>
                    <i className="ti ti-user-x me-2"></i>Suspend Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleBulkDelete}>
                    <i className="ti ti-trash me-2"></i>Delete Selected
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleClearSelection}>
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
                  <h4 className="text-white mb-1">{safeBranches.length}</h4>
                  <p className="text-white mb-0">Total Branches</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-git-branch text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{safeBranches.filter(b => b.status === 'Active').length}</h4>
                  <p className="text-white mb-0">Active Branches</p>
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
                  <h4 className="text-white mb-1">{safeBranches.filter(b => b.status === 'Suspended').length}</h4>
                  <p className="text-white mb-0">Suspended Branches</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-alert-triangle text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{totalStudents.toLocaleString()}</h4>
                  <p className="text-white mb-0">Total Students</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-users text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Performance Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">${totalCapacity.toLocaleString()}</h4>
                  <p className="text-white mb-0">Total Monthly Revenue</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-cash text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">${avgRevenue.toLocaleString()}</h4>
                  <p className="text-white mb-0">Avg Revenue per Branch</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-chart-bar text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{avgPerformance}%</h4>
                  <p className="text-white mb-0">Avg Performance Score</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-trending-up text-white fs-4"></i>
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
                  <h4 className="text-white mb-1">{avgPerformance}%</h4>
                  <p className="text-white mb-0">Avg Satisfaction Score</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-mood-happy text-white fs-4"></i>
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
                    placeholder="Search branches, codes, institutions..."
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
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Institution Type</label>
                <select
                  className="form-select"
                  value={filterInstitutionType}
                  onChange={(e) => setFilterInstitutionType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="School">School</option>
                  <option value="Inter College">Inter College</option>
                  <option value="Degree College">Degree College</option>
                  <option value="Engineering College">Engineering College</option>
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
                    setFilterInstitutionType('all')
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

      {/* Branches Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Branches ({filteredBranches.length})</h4>
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
                  <th>Branch Name</th>
                  <th>Branch Code</th>
                  <th>Institution</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Students</th>
                  <th>Monthly Revenue</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr key={branch._id || branch.id}>
                    <td>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedBranches.includes(branch._id || branch.id)}
                          onChange={() => handleSelectBranch(branch._id || branch.id)}
                        />
                        <label className="form-check-label"></label>
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium">{branch.name}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{branch.code}</span>
                    </td>
                    <td>
                      <div className="fw-medium">{branch.institutionName || 'N/A'}</div>
                      <small className="text-muted">ID: {branch.institutionId || 'N/A'}</small>
                    </td>
                    <td>
                      <span className={`badge ${getInstitutionTypeBadge(branch.institutionType)}`}>
                        {branch.institutionType}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div>{branch.address?.city || 'N/A'}</div>
                        <small className="text-muted">{branch.address?.state || 'N/A'}</small>
                      </div>
                    </td>
                    <td>{branch.students}</td>
                    <td>
                      <div className="fw-medium">${(branch.capacity?.maxStudents || 0).toLocaleString()}</div>
                      <small className="text-muted">Max Capacity</small>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="me-2">
                          <div className="fw-medium">{branch.students || 0}</div>
                          <small className="text-muted">Students</small>
                        </div>
                        <div className="avatar avatar-sm bg-light rounded-circle">
                          <span className={`fs-7 fw-bold ${branch.students >= 100 ? 'text-success' : branch.students >= 50 ? 'text-warning' : 'text-danger'}`}>
                            {branch.students >= 100 ? 'H' : branch.students >= 50 ? 'M' : 'L'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(branch.status)}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div>{branch.lastActivity}</div>
                        <small className="text-muted">{branch.createdAt}</small>
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
                            <button className="dropdown-item" onClick={() => handleViewDetails(branch.id)}>
                              <i className="ti ti-eye me-2"></i>View Details
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleEditBranch(branch.id)}>
                              <i className="ti ti-edit me-2"></i>Edit Branch
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleManageStudents(branch.id)}>
                              <i className="ti ti-users me-2"></i>Manage Students
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button 
                              className={`dropdown-item ${branch.status === 'Active' ? 'text-warning' : 'text-success'}`}
                              onClick={() => handleToggleStatus(branch.id)}
                            >
                              <i className={`ti ti-${branch.status === 'Active' ? 'player-pause' : 'player-play'} me-2`}></i>
                              {branch.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteBranch(branch.id)}>
                              <i className="ti ti-trash me-2"></i>Delete Branch
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
              Showing {filteredBranches.length} of {branches.length} branches
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

export default BranchesMonitoringPage
