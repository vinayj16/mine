import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import agentService from '../../services/agentService'

// Agent interface definition
interface Agent {
  loginHistory?: Array<{ timestamp: string; ip?: string }>
  _id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  country?: string
  postalCode?: string
  address?: string
  status: 'Active' | 'Suspended' | 'Inactive'
  commissionRate: number
  createdAt: string
  updatedAt?: string
  institutions?: any[]
  institutionCount?: number
  isGlobal?: boolean
  lastLogin?: string
  institutionId?: string
}

const AgentsManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAgents, setTotalAgents] = useState(0)
  const [agentsPerPage] = useState(10)

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await superAdminService.getAllAgents()
        
        if (response && Array.isArray(response)) {
          setAgents(response as unknown as Agent[])
          setTotalAgents(response.length)
          setTotalPages(Math.ceil(response.length / agentsPerPage) || 1)
        } else {
          setAgents([])
          setTotalAgents(0)
        }
      } catch (err: any) {
        console.error('Error fetching agents:', err)
        setError(err.message || 'Failed to fetch agents')
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  // Filter and search agents
  const filteredAgents = useMemo(() => {
    let filtered = agents

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(agent => agent.status === filterStatus)
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone.includes(searchTerm) ||
        agent.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.state.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [agents, filterStatus, searchTerm])

  const handleSelectAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId))
    } else {
      setSelectedAgents([...selectedAgents, agentId])
    }
  }

  const handleSelectAll = () => {
    setSelectedAgents(filteredAgents.map(agent => agent._id))
  }

  // Action handlers
  const handleEditAgent = (agentId: string) => {
    navigate(`/super-admin/agents/${agentId}/edit`)
  }

  const handleViewDetails = (agentId: string) => {
    navigate(`/super-admin/agents/${agentId}`)
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }
    
    try {
      setLoading(true)
      await agentService.delete(agentId)
      
      const response = await superAdminService.getAllAgents()
      setAgents(response as unknown as Agent[])
      setTotalAgents((response || []).length)
      setSelectedAgents(prevSelected => prevSelected.filter(id => id !== agentId))
      alert('Agent deleted successfully')
    } catch (error: any) {
      console.error('Error deleting agent:', error)
      alert(error.message || 'Failed to delete agent')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkActivate = async () => {
    try {
      for (const id of selectedAgents) {
        await agentService.update(id, { status: 'Active' })
      }
      const response = await superAdminService.getAllAgents()
      setAgents(response as unknown as Agent[])
      setTotalAgents(response.length)
      alert(`Activated ${selectedAgents.length} agents`)
      setSelectedAgents([])
    } catch (error: any) {
      console.error('Error activating agents:', error)
      alert('Failed to activate agents')
    }
  }

  const handleBulkSuspend = async () => {
    if (window.confirm(`Are you sure you want to suspend ${selectedAgents.length} agents?`)) {
      try {
        for (const id of selectedAgents) {
          await agentService.update(id, { status: 'Suspended' })
        }
        const response = await superAdminService.getAllAgents()
        setAgents(response as unknown as Agent[])
        setTotalAgents((response || []).length)
        alert(`Suspended ${selectedAgents.length} agents`)
        setSelectedAgents([])
      } catch (error: any) {
        console.error('Error suspending agents:', error)
        alert('Failed to suspend agents')
      }
    }
  }

  // Add Agent handlers

  const handleExportAgents = async () => {
    try {
      // Get all agents without pagination for export
      const allAgents = await agentService.getAllWithoutPagination()
      
      // Create CSV content
      const headers = ['Name', 'Email', 'Phone', 'City', 'State', 'Commission Rate', 'Status', 'Performance']
      const csvContent = [
        headers.join(','),
        ...allAgents.map(agent => [
          agent.name,
          agent.email,
          agent.phone,
          agent.city,
          agent.state,
          agent.commissionRate,
          agent.status,
          'Good' // Default performance for export
        ].join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `agents_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert('Agents exported successfully!')
    } catch (error: any) {
      console.error('Error exporting agents:', error)
      alert('Failed to export agents')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': { bg: 'bg-success', text: 'text-white' },
      'Suspended': { bg: 'bg-warning', text: 'text-dark' },
      'Inactive': { bg: 'bg-secondary', text: 'text-white' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Inactive']
    return <span className={`badge ${config.bg} ${config.text}`}>{status}</span>
  }

  // Add Agent Modal

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
              <h5 className="text-muted">Loading agents...</h5>
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
              <h5 className="text-danger">Error Loading Agents</h5>
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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Agents Management</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <a href="/super-admin/dashboard">Dashboard</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Agents</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary d-flex align-items-center"
                onClick={() => navigate('/super-admin/agents/add')}
              >
                <i className="ti ti-user-plus me-2" />Add Agent
              </button>
              <button 
                className="btn btn-outline-success d-flex align-items-center"
                onClick={handleExportAgents}
              >
                <i className="ti ti-download me-2" />Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Search</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="ti ti-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">&nbsp;</label>
                  <div className="d-flex gap-2">
                    {selectedAgents.length > 0 && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={handleBulkActivate}>
                          <i className="ti ti-check me-1" />Activate ({selectedAgents.length})
                        </button>
                        <button className="btn btn-warning btn-sm" onClick={handleBulkSuspend}>
                          <i className="ti ti-pause me-1" />Suspend ({selectedAgents.length})
                        </button>
                      </>
                    )}
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedAgents([])}>
                      <i className="ti ti-refresh me-1" />Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agents Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedAgents.length === filteredAgents.length && filteredAgents.length > 0}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th>Agent Details</th>
                      <th>Institutions</th>
                      <th>Last Login</th>
                      <th>Status</th>
                      <th>Commission</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent._id}>
                        <td>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedAgents.includes(agent._id)}
                              onChange={() => handleSelectAgent(agent._id)}
                            />
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-semibold">{agent.name}</div>
                            <div className="text-muted small">{agent.email}</div>
                            <div className="text-muted small">{agent.phone}</div>
                            <div className="text-muted small">{agent.city}, {agent.state}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className="badge bg-primary">{agent.institutionCount || agent.institutions?.length || 0}</span>
                            {agent.isGlobal && <span className="badge bg-success ms-1">Global</span>}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {agent.lastLogin ? new Date(agent.lastLogin).toLocaleString() : 'Never'}
                          </div>
                          {agent.loginHistory && agent.loginHistory.length > 0 && (
                            <div className="text-muted small">
                              {agent.loginHistory[0]?.timestamp ? new Date(agent.loginHistory[0].timestamp).toLocaleString() : ''}
                            </div>
                          )}
                        </td>
                        <td>{getStatusBadge(agent.status)}</td>
                        <td>
                          <div className="fw-semibold">{agent.commissionRate}%</div>
                          <div className="text-muted small">commission rate</div>
                        </td>
                        <td>
                          <div className="text-muted small">{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</div>
                        </td>
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
                                <button className="dropdown-item" onClick={() => handleViewDetails(agent._id)}>
                                  <i className="ti ti-eye me-2" />View Details
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => handleEditAgent(agent._id)}>
                                  <i className="ti ti-edit me-2" />Edit
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => handleDeleteAgent(agent._id)}>
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

              {filteredAgents.length === 0 && (
                <div className="text-center py-5">
                  <i className="ti ti-user-off fs-48 text-muted mb-3 d-block" />
                  <h5 className="text-muted">No agents found</h5>
                  <p className="text-muted mb-3">
                    {agents.length === 0 
                      ? "Get started by adding your first agent to the system" 
                      : "Try adjusting your search or filters"}
                  </p>
                  {agents.length === 0 && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => navigate('/super-admin/agents/add')}
                    >
                      <i className="ti ti-user-plus me-2" />Add First Agent
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {agents.length} of {totalAgents} agents
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="ti ti-chevron-left me-1" />Previous
                    </button>
                    <span className="btn btn-sm btn-secondary">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next<i className="ti ti-chevron-right ms-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentsManagementPage
