import React, { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getInstitutionConfigFromPath } from '../../utils/institutionUtils'
import { apiService } from '../../services/api'

interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  students: number
  status: 'Active' | 'Suspended'
}

interface School {
  id: string
  name: string
  type: string
  plan: string
  status: string
  expiryDate: string
  students: number
  monthlyRevenue: number
  totalRevenue: number
  adminName: string
  adminEmail: string
  adminPhone: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  createdAt: string
  lastLogin: string
}

const InstitutionsDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const institutionConfig = getInstitutionConfigFromPath(location.pathname)
  
  // Get institution by ID and type from the current path
  // const institutionType = location.pathname.includes('/inter-colleges') ? 'inter-colleges' : 
  //                         location.pathname.includes('/degree-colleges') ? 'degree-colleges' : 'schools'
  
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch school from API based on institution type
        const response = await apiService.get(`/schools/${id}`)
        
        if (response.success && response.data) {
          setSchool(response.data as School)
        } else {
          setError('Failed to fetch school details')
        }
      } catch (err) {
        console.error('Error fetching school:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch school details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSchool()
    }
  }, [id])

  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await apiService.get(`/schools/${id}/branches`)
        if (response.success && response.data) {
          setBranches(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
        setBranches([])
      }
    }

    if (id) {
      fetchBranches()
    }
  }, [id])

  const handleEditBranch = (branchId: string) => {
    console.log('Edit branch:', branchId)
    // Navigate to edit page or open modal
  }

  const handleViewDetails = (branchId: string) => {
    console.log('View branch details:', branchId)
    // Navigate to branch details page or open modal
  }

  const handleManageStudents = (branchId: string) => {
    console.log('Manage students for branch:', branchId)
    // Navigate to students management page for this branch
  }

  const handleDeactivateBranch = async (branchId: string) => {
    if (window.confirm('Are you sure you want to deactivate this branch? This action cannot be undone.')) {
      try {
        const response = await apiService.patch(`/schools/${id}/branches/${branchId}/toggle-status`)
        if (response.success) {
          // Refresh branches list
          const branchesResponse = await apiService.get(`/schools/${id}/branches`)
          if (branchesResponse.success && branchesResponse.data) {
            setBranches(branchesResponse.data as Branch[])
          }
        }
      } catch (err) {
        console.error('Error deactivating branch:', err)
      }
    }
  }

  const handleDeleteBranch = async (branchId: string) => {
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      try {
        const response = await apiService.delete(`/schools/${id}/branches/${branchId}`)
        if (response.success) {
          // Refresh branches list
          const branchesResponse = await apiService.get(`/schools/${id}/branches`)
          if (branchesResponse.success && branchesResponse.data) {
            setBranches(branchesResponse.data as Branch[])
          }
        }
      } catch (err) {
        console.error('Error deleting branch:', err)
      }
    }
  }

  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success'
      case 'Suspended': return 'warning'
      case 'Expired': return 'danger'
      default: return 'secondary'
    }
  }

  // const getPlanColor = (plan: string) => {
  //   switch (plan) {
  //     case 'Premium': return 'danger'
  //     case 'Medium': return 'warning'
  //     case 'Basic': return 'info'
  //     default: return 'secondary'
  //   }
  // }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="alert alert-warning">School not found</div>
          <Link to={institutionConfig?.basePath || '/super-admin/institutions'} className="btn btn-primary">
            Back to Institutions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{institutionConfig?.singularName || 'Institution'} Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={institutionConfig?.basePath || '#'}>{institutionConfig?.name || 'Institutions'}</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`${institutionConfig?.basePath || '#'}/${id}`}>{school.name}</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Details</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <Link to={institutionConfig?.basePath || '/super-admin/institutions'} className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-arrow-left"></i>
            </Link>
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

      {/* School Overview Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{institutionConfig?.singularName || 'Institution'} Overview</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-building text-primary"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.name}</h4>
                      <p className="text-muted mb-0">{institutionConfig?.singularName || 'Institution'} Name</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-credit-card text-success"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.plan}</h4>
                      <p className="text-muted mb-0">Subscription Plan</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className={`ti ti-shield text-${getStatusColor(school.status)}`}></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.status}</h4>
                      <p className="text-muted mb-0">Status</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-calendar text-info"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{school.expiryDate}</h4>
                      <p className="text-muted mb-0">Expiry Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs nav-tabs-line mb-0" role="tablist">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
                    onClick={() => setActiveTab('branches')}
                  >
                    Branches
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    Contact Details
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'usage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('usage')}
                  >
                    Usage Analytics
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'billing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('billing')}
                  >
                    Billing History
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="row">
                  <div className="col-md-3">
                    <div className="card bg-primary">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">{school.students}</h4>
                            <p className="text-white mb-0">Total Students</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-users text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">${school.monthlyRevenue}</h4>
                            <p className="text-white mb-0">Monthly Revenue</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-credit-card text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">${school.totalRevenue}</h4>
                            <p className="text-white mb-0">Total Revenue</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-chart-line text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-info">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h4 className="text-white mb-1">{school.createdAt}</h4>
                            <p className="text-white mb-0">Member Since</p>
                          </div>
                          <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                            <i className="ti ti-calendar-event text-white fs-4"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Details Tab */}
              {activeTab === 'details' && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Contact Information</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label">Email Address</label>
                          <div className="form-control">{school.adminEmail}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Phone Number</label>
                          <div className="form-control">{school.adminPhone}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Website</label>
                          <div className="form-control">
                            <a href="#" target="_blank" rel="noopener noreferrer">
                              {school.adminEmail}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Address Information</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <div className="form-control">{school.address}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">City</label>
                          <div className="form-control">{school.city}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">State</label>
                          <div className="form-control">{school.state}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Country</label>
                          <div className="form-control">{school.country}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Postal Code</label>
                          <div className="form-control">{school.postalCode}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Branches Tab */}
              {activeTab === 'branches' && (
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Branch Management</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Branch Name</th>
                                <th>Branch Code</th>
                                <th>Address</th>
                                <th>City</th>
                                <th>State</th>
                                <th>Students Count</th>
                                <th>Status</th>
                                <th className="text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {branches.map((branch) => (
                                <tr key={branch.id}>
                                  <td>{branch.name}</td>
                                  <td>{branch.code}</td>
                                  <td>{branch.address}</td>
                                  <td>{branch.city}</td>
                                  <td>{branch.state}</td>
                                  <td>{branch.students}</td>
                                  <td>
                                    <span className={`badge bg-${branch.status === 'Active' ? 'success' : branch.status === 'Suspended' ? 'warning' : 'secondary'}`}>
                                      {branch.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="dropdown">
                                      <button className="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                        <i className="ti ti-dots-vertical"></i>
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end">
                                        <li><button className="dropdown-item" onClick={() => handleEditBranch(branch.id)}>Edit Branch</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleViewDetails(branch.id)}>View Details</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleManageStudents(branch.id)}>Manage Students</button></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><button className="dropdown-item" onClick={() => handleDeactivateBranch(branch.id)}>Deactivate Branch</button></li>
                                        <li><button className="dropdown-item text-danger" onClick={() => handleDeleteBranch(branch.id)}>Delete Branch</button></li>
                                      </ul>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3">
                          <button className="btn btn-primary">
                            <i className="ti ti-plus me-2"></i>
                            Add New Branch
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Analytics Tab */}
              {activeTab === 'usage' && (
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Usage Analytics</h5>
                      </div>
                      <div className="card-body">
                        {/* Storage Usage Overview */}
                        <div className="row mb-4">
                          <div className="col-md-3">
                            <div className="card bg-primary">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">75.2 GB</h4>
                                    <p className="text-white mb-0">Total Storage</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-database text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card bg-success">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">56.8 GB</h4>
                                    <p className="text-white mb-0">Used Storage</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-hard-drive text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card bg-warning">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">18.4 GB</h4>
                                    <p className="text-white mb-0">Available</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-database-export text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card bg-info">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <h4 className="text-white mb-1">75.5%</h4>
                                    <p className="text-white mb-0">Usage Rate</p>
                                  </div>
                                  <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                                    <i className="ti ti-chart-pie text-white fs-4"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Storage Breakdown */}
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <div className="card">
                              <div className="card-header">
                                <h6 className="card-title mb-0">Storage Breakdown</h6>
                              </div>
                              <div className="card-body">
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Documents</span>
                                    <span className="fw-medium">22.4 GB</span>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar bg-primary" 
                                      style={{ width: '39.4%' }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Images</span>
                                    <span className="fw-medium">18.7 GB</span>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar bg-success" 
                                      style={{ width: '32.9%' }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Videos</span>
                                    <span className="fw-medium">12.1 GB</span>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar bg-warning" 
                                      style={{ width: '21.3%' }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Database</span>
                                    <span className="fw-medium">3.6 GB</span>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar bg-danger" 
                                      style={{ width: '6.3%' }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="mb-0">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Other Files</span>
                                    <span className="fw-medium">0.4 GB</span>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar bg-info" 
                                      style={{ width: '0.7%' }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="card">
                              <div className="card-header">
                                <h6 className="card-title mb-0">Activity Metrics</h6>
                              </div>
                              <div className="card-body">
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr>
                                        <th>Metric</th>
                                        <th>This Month</th>
                                        <th>Last Month</th>
                                        <th>Trend</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>API Calls</td>
                                        <td>45,231</td>
                                        <td>38,945</td>
                                        <td><span className="badge bg-success">+16.2%</span></td>
                                      </tr>
                                      <tr>
                                        <td>File Uploads</td>
                                        <td>1,247</td>
                                        <td>1,089</td>
                                        <td><span className="badge bg-success">+14.5%</span></td>
                                      </tr>
                                      <tr>
                                        <td>User Logins</td>
                                        <td>8,934</td>
                                        <td>7,656</td>
                                        <td><span className="badge bg-success">+16.7%</span></td>
                                      </tr>
                                      <tr>
                                        <td>Data Transfer</td>
                                        <td>124.7 GB</td>
                                        <td>108.3 GB</td>
                                        <td><span className="badge bg-success">+15.1%</span></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing History Tab */}
              {activeTab === 'billing' && (
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Billing History</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Method</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>2024-06-01</td>
                                <td>Monthly Subscription - Premium Plan</td>
                                <td>₹199.00</td>
                                <td><span className="badge bg-success">Paid</span></td>
                                <td>Credit Card</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary">Receipt</button>
                                </td>
                              </tr>
                              <tr>
                                <td>2024-05-01</td>
                                <td>Monthly Subscription - Premium Plan</td>
                                <td>₹199.00</td>
                                <td><span className="badge bg-success">Paid</span></td>
                                <td>Credit Card</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary">Receipt</button>
                                </td>
                              </tr>
                              <tr>
                                <td>2024-04-01</td>
                                <td>Monthly Subscription - Premium Plan</td>
                                <td>₹199.00</td>
                                <td><span className="badge bg-success">Paid</span></td>
                                <td>Credit Card</td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary">Receipt</button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InstitutionsDetailsPage
