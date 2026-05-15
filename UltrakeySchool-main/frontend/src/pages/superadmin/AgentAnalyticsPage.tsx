import React, { useState, useEffect, useMemo } from 'react'
import { superAdminService } from '../../services/superAdminService'
import agentService from '../../services/agentService'

interface Agent {
  _id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  status: string
  commissionRate: number
  createdAt: string
  institutionCount: number
  institutions?: any[]
  commissionData?: {
    totalCommission: number
    pending: number
    approved: number
    paid: number
    institutionCount: number
  }
}

interface AgentAnalyticsPageProps {
  // Props if needed
}

const AgentAnalyticsPage: React.FC<AgentAnalyticsPageProps> = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await superAdminService.getAllAgents()
      
      if (Array.isArray(response)) {
        const agentsData = response as unknown as Agent[]
        
        // Fetch commission data for each agent
        setCommissionLoading(true)
        const agentsWithCommissions = await Promise.all(
          agentsData.map(async (agent) => {
            try {
              const commissionData = await agentService.getCommissionsByAgent(agent._id)
              return {
                ...agent,
                commissionData: commissionData.summary || {
                  totalCommission: 0,
                  pending: 0,
                  approved: 0,
                  paid: 0,
                  institutionCount: 0
                }
              }
            } catch (e) {
              return {
                ...agent,
                commissionData: {
                  totalCommission: 0,
                  pending: 0,
                  approved: 0,
                  paid: 0,
                  institutionCount: agent.institutionCount || 0
                }
              }
            }
          })
        )
        setCommissionLoading(false)
        setAgents(agentsWithCommissions)
      } else {
        setAgents([])
      }
    } catch (err: any) {
      console.error('Error fetching agent data:', err)
      setError(err.message || 'Failed to fetch agent data')
    } finally {
      setLoading(false)
    }
  }

  // Filter agents
  const filteredAgents = useMemo(() => {
    let filtered = agents

    if (statusFilter !== 'all') {
      filtered = filtered.filter(agent => 
        agent.status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(agent =>
        agent.name?.toLowerCase().includes(term) ||
        agent.email?.toLowerCase().includes(term) ||
        agent.city?.toLowerCase().includes(term) ||
        agent.state?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [agents, statusFilter, searchTerm])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = agents.length
    const active = agents.filter(a => a.status?.toLowerCase() === 'active').length
    const inactive = agents.filter(a => a.status?.toLowerCase() !== 'active').length
    const totalInstitutions = agents.reduce((sum, a) => sum + (a.commissionData?.institutionCount || a.institutionCount || 0), 0)
    const totalCommission = agents.reduce((sum, a) => sum + (a.commissionData?.totalCommission || 0), 0)
    const totalPending = agents.reduce((sum, a) => sum + (a.commissionData?.pending || 0), 0)
    const totalPaid = agents.reduce((sum, a) => sum + (a.commissionData?.paid || 0), 0)
    
    return { total, active, inactive, totalInstitutions, totalCommission, totalPending, totalPaid }
  }, [agents])

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'active') {
      return 'bg-success'
    } else if (statusLower === 'suspended') {
      return 'bg-warning'
    } else {
      return 'bg-secondary'
    }
  }

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted mt-3">Loading agent analytics...</h5>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Agent Analytics</h4>
              <p className="text-muted mb-0">View agent performance and commission details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Agents</p>
                  <h3 className="mb-0">{stats.total}</h3>
                </div>
                <div className="icon-box bg-primary text-white">
                  <i className="ti ti-users fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Active Agents</p>
                  <h3 className="mb-0 text-success">{stats.active}</h3>
                </div>
                <div className="icon-box bg-success text-white">
                  <i className="ti ti-user-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Institutions</p>
                  <h3 className="mb-0 text-info">{stats.totalInstitutions}</h3>
                </div>
                <div className="icon-box bg-info text-white">
                  <i className="ti ti-building fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Commission</p>
                  <h3 className="mb-0 text-warning">₹{stats.totalCommission.toLocaleString()}</h3>
                </div>
                <div className="icon-box bg-warning text-white">
                  <i className="ti ti-currency-rupee fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Paid Commission</p>
                  <h3 className="mb-0 text-success">₹{stats.totalPaid.toLocaleString()}</h3>
                </div>
                <div className="icon-box bg-success text-white">
                  <i className="ti ti-check-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="ti ti-search"></i>
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
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Agent Performance</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Agent Details</th>
                      <th>Location</th>
                      <th>Institutions</th>
                      <th>Commission Rate</th>
                      <th>Est. Commission</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <div className="text-muted">
                            <i className="ti ti-user-off fs-48 mb-2 d-block"></i>
                            <p>No agents found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAgents.map((agent) => (
                        <tr key={agent._id}>
                          <td>
                            <div>
                              <div className="fw-semibold">{agent.name || 'N/A'}</div>
                              <small className="text-muted">{agent.email || 'N/A'}</small>
                              <div><small className="text-muted">{agent.phone || 'N/A'}</small></div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div>{agent.city || 'N/A'}</div>
                              <small className="text-muted">{agent.state || ''}</small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary fs-6">
                              {agent.commissionData?.institutionCount || agent.institutionCount || 0}
                            </span>
                          </td>
                          <td>
                            <div className="fw-semibold">{agent.commissionRate || 10}%</div>
                          </td>
                          <td>
                            <div>
                              <span className="text-success fw-semibold">
                                ₹{(agent.commissionData?.totalCommission || 0).toLocaleString()}
                              </span>
                              <div className="small text-muted">
                                Pending: ₹{(agent.commissionData?.pending || 0).toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(agent.status)}`}>
                              {agent.status || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setSelectedAgent(agent)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agent Details: {selectedAgent.name}</h5>
                <button className="btn-close" onClick={() => setSelectedAgent(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted">Email</label>
                      <p className="fw-semibold">{selectedAgent.email || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Phone</label>
                      <p className="fw-semibold">{selectedAgent.phone || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Location</label>
                      <p className="fw-semibold">{selectedAgent.city}, {selectedAgent.state}</p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Status</label>
                      <span className={`badge ${getStatusBadge(selectedAgent.status)} ms-2`}>
                        {selectedAgent.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted">Commission Rate</label>
                      <p className="fw-semibold">{selectedAgent.commissionRate || 10}%</p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Total Institutions</label>
                      <p className="fw-semibold">{selectedAgent.commissionData?.institutionCount || selectedAgent.institutionCount || 0}</p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Total Commission</label>
                      <p className="fw-semibold text-success">
                        ₹{(selectedAgent.commissionData?.totalCommission || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Pending Commission</label>
                      <p className="fw-semibold text-warning">
                        ₹{(selectedAgent.commissionData?.pending || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Paid Commission</label>
                      <p className="fw-semibold text-info">
                        ₹{(selectedAgent.commissionData?.paid || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted">Member Since</label>
                      <p className="fw-semibold">
                        {selectedAgent.createdAt ? new Date(selectedAgent.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Institutions List */}
                <div className="mt-4">
                  <h6>Institutions Created by this Agent</h6>
                  {selectedAgent.institutions && selectedAgent.institutions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead>
                          <tr>
                            <th>Institution Name</th>
                            <th>Code</th>
                            <th>Type</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAgent.institutions.map((inst: any, idx: number) => (
                            <tr key={idx}>
                              <td>{inst.name || 'N/A'}</td>
                              <td>{inst.instituteCode || inst.code || 'N/A'}</td>
                              <td>{inst.type || 'N/A'}</td>
                              <td>
                                <span className={`badge ${inst.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                  {inst.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No institutions created by this agent yet.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedAgent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentAnalyticsPage