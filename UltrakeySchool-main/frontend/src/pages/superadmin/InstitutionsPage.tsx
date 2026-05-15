import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { superAdminService, type Institution } from '../../services/superAdminService'

const InstitutionsPage = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [activeTab, setActiveTab] = useState<string>('All')
  const itemsPerPage = 10

  useEffect(() => {
    fetchInstitutions()
  }, [currentPage, searchTerm, statusFilter, activeTab])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: 100 // Get more for filtering
      }
      
      if (searchTerm) params.search = searchTerm
      if (statusFilter !== 'All') params.status = statusFilter
      
      const response = await superAdminService.getInstitutions()
      
      // Handle both direct array and paginated response
      if (Array.isArray(response)) {
        setInstitutions(response as unknown as Institution[])
      } else if (response && typeof response === 'object' && 'data' in response) {
        setInstitutions((response as any).data as Institution[])
      } else {
        setInstitutions([])
      }
      
    } catch (err) {
      console.error('Error fetching institutions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch institutions')
      toast.error('Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInstitution = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this institution? This action cannot be undone.')) {
      return
    }

    try {
      await superAdminService.deleteInstitution(id)
      toast.success('Institution deleted successfully')
      fetchInstitutions()
    } catch (err) {
      console.error('Error deleting institution:', err)
      toast.error('Failed to delete institution')
    }
  }

  // Filter by tab (institution type)
  const tabFilteredInstitutions = institutions.filter(inst => {
    if (activeTab === 'All') return true
    return inst.type === activeTab
  })

  const filteredInstitutions = tabFilteredInstitutions.filter(institution => {
    const matchesSearch = institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (institution.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (institution.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' ||   
                         institution.status?.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInstitutions = filteredInstitutions.slice(startIndex, endIndex)

  // Stats by type
  const stats = {
    total: institutions.length,
    schools: institutions.filter(i => i.type === 'School').length,
    interColleges: institutions.filter(i => i.type === 'Inter College').length,
    degreeColleges: institutions.filter(i => i.type === 'Degree College').length,
    engineeringColleges: institutions.filter(i => i.type === 'Engineering College').length,
    active: institutions.filter(i => i.status === 'active' || i.status === 'Active').length,
    suspended: institutions.filter(i => i.status === 'suspended' || i.status === 'Suspended').length,
    expired: institutions.filter(i => i.status === 'Expired').length
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-success'
      case 'suspended': return 'bg-warning'
      case 'pending': return 'bg-info'
      case 'closed': return 'bg-danger'
      case 'expired': return 'bg-danger'
      default: return 'bg-secondary'
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/super-admin/institutions/edit/${id}`)
  }

  const handleViewDetails = (id: string) => {
    navigate(`/super-admin/institutions/details/${id}`)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '₹0'
    return new Intl.NumberFormat('en-INR', { style: 'currency', currency: 'INR' }).format(amount)
  }

  const navigate = useNavigate()

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
        <h4 className="alert-heading">Error Loading Institutions</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={fetchInstitutions}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Institutions Management</h4>
          <p className="text-muted mb-0">View and manage all registered institutions</p>
        </div>
        <div>
          <Link to="/super-admin/institutions/create" className="btn btn-primary">
            <i className="ti ti-plus me-2"></i>
            Create Institution
          </Link>
        </div>
      </div>

      {/* Stats Cards by Type */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Total</h6>
                  <h4 className="mb-0">{stats.total}</h4>
                </div>
                <div className="opacity-50">
                  <i className="ti ti-building fs-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-info text-white">
            <div className="card-body py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Schools</h6>
                  <h4 className="mb-0">{stats.schools}</h4>
                </div>
                <div className="opacity-50">
                  <i className="ti ti-school fs-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-purple text-white" style={{ backgroundColor: '#8b5cf6' }}>
            <div className="card-body py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Inter Colleges</h6>
                  <h4 className="mb-0">{stats.interColleges}</h4>
                </div>
                <div className="opacity-50">
                  <i className="ti ti-book fs-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-success text-white">
            <div className="card-body py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Degree</h6>
                  <h4 className="mb-0">{stats.degreeColleges}</h4>
                </div>
                <div className="opacity-50">
                  <i className="ti ti-bookmark fs-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-warning text-white">
            <div className="card-body py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Engineering</h6>
                  <h4 className="mb-0">{stats.engineeringColleges}</h4>
                </div>
                <div className="opacity-50">
                  <i className="ti ti-tools fs-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-secondary text-white">
            <div className="card-body py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">Active</h6>
                  <h4 className="mb-0">{stats.active}</h4>
                </div>
                <div className="opacity-50">
                  <i className="ti ti-check fs-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Institution Types */}
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'All' ? 'active' : ''}`}
                onClick={() => { setActiveTab('All'); setCurrentPage(1); }}
              >
                <i className="ti ti-building me-2" />All ({stats.total})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'School' ? 'active' : ''}`}
                onClick={() => { setActiveTab('School'); setCurrentPage(1); }}
              >
                <i className="ti ti-school me-2" />Schools ({stats.schools})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'Inter College' ? 'active' : ''}`}
                onClick={() => { setActiveTab('Inter College'); setCurrentPage(1); }}
              >
                <i className="ti ti-book me-2" />Inter Colleges ({stats.interColleges})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'Degree College' ? 'active' : ''}`}
                onClick={() => { setActiveTab('Degree College'); setCurrentPage(1); }}
              >
                <i className="ti ti-bookmark me-2" />Degree Colleges ({stats.degreeColleges})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'Engineering College' ? 'active' : ''}`}
                onClick={() => { setActiveTab('Engineering College'); setCurrentPage(1); }}
              >
                <i className="ti ti-tools me-2" />Engineering ({stats.engineeringColleges})
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 align-items-end mb-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, code, or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="col-md-5 text-end">
              <span className="text-muted">
                Showing {filteredInstitutions.length} institutions
              </span>
            </div>
          </div>

          {/* Institutions Table */}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Institution Name</th>
                  <th>Type</th>
                  <th>Admin</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Revenue</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInstitutions.map((institution) => (
                  <tr key={institution._id}>
                    <td className="fw-semibold">{institution.name}</td>
                    <td>
                      <span className={`badge ${
                        institution.type === 'School' ? 'bg-info' :
                        institution.type === 'Inter College' ? 'bg-purple' :
                        institution.type === 'Degree College' ? 'bg-success' :
                        'bg-warning'
                      } text-white`}>
                        {institution.type}
                      </span>
                    </td>
                    <td>
                      <div>{institution.contactEmail || institution.email || '-'}</div>
                      <small className="text-muted">{institution.contactPhone || institution.phone || ''}</small>
                    </td>
                    <td>{institution.plan || 'Basic'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(institution.status)} text-white`}>
                        {institution.status}
                      </span>
                    </td>
                    <td>{institution.currentUsers || institution.students || 0}</td>
                    <td>{formatCurrency(institution._monthlyRevenue || 0)}</td>
                    <td>{formatDate(institution.subscriptionExpiry || '')}</td>
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
                            <button className="dropdown-item" onClick={() => handleViewDetails(institution._id)}>
                              <i className="ti ti-eye me-2" />View Details
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleEdit(institution._id)}>
                              <i className="ti ti-edit me-2" />Edit
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => navigate(`/super-admin/institutions/${institution._id}/branches`)}>
                              <i className="ti tiitemap me-2" />Manage Branches
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteInstitution(institution._id)}>
                              <i className="ti ti-trash me-2" />Delete
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

          {/* Empty State */}
          {currentInstitutions.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-building-off fs-48 text-muted mb-3 d-block" />
              <h5 className="text-muted">No institutions found</h5>
              <p className="text-muted">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInstitutions.length)} of {filteredInstitutions.length} institutions
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1
                    return (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    )
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstitutionsPage
