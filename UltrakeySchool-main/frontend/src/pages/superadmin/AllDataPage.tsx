import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'

interface AllUser {
  _id: string
  name: string
  email: string
  role: string
  status: string
  password: string
  designation: string
  institutionId: string | null
  institutionName: string
  institutionCode: string
  isOnline: boolean
  lastSeen: string | null
  createdAt: string | null
}

interface InstitutionData {
  _id: string
  name: string
  code: string
  type: string
  status: string
  email: string
  phone: string
  totalUsers: number
  totalAgents: number
  totalNonAgentUsers: number
  roleBreakdown: Record<string, number>
  users: AllUser[]
  agents: AllUser[]
  nonAgentUsers: AllUser[]
}

interface PlatformAgent {
  _id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  status: string
  commissionRate: number
  isGlobal: boolean
  password: string
  createdAt: string
}

interface AllData {
  summary: {
    totalInstitutions: number
    totalUsers: number
    totalAgents: number
    usersByRole: Record<string, number>
    platformLevelAgents: number
    institutionLevelAgents: number
  }
  institutions: InstitutionData[]
  platformAgents: PlatformAgent[]
  allUsers: AllUser[]
}

const AllDataPage: React.FC = () => {
  const [allData, setAllData] = useState<AllData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'institutions' | 'users' | 'agents' | 'platform'>('summary')
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await superAdminService.getAllData() as unknown as AllData
        setAllData(data)
        if (data.institutions?.length > 0) {
          setSelectedInstitution(data.institutions[0]._id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const selectedInstData = useMemo(() => {
    if (!allData || !selectedInstitution) return null
    return allData.institutions.find(i => i._id === selectedInstitution)
  }, [allData, selectedInstitution])

  const filteredUsers = useMemo(() => {
    if (!allData) return []
    let users = allData.allUsers || []
    if (roleFilter !== 'all') users = users.filter(u => u.role === roleFilter)
    if (statusFilter !== 'all') users = users.filter(u => u.status === statusFilter)
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      users = users.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s) ||
        u.institutionName.toLowerCase().includes(s)
      )
    }
    return users
  }, [allData, roleFilter, statusFilter, searchTerm])

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; text: string }> = {
      'active': { bg: 'bg-success', text: 'text-white' },
      'inactive': { bg: 'bg-secondary', text: 'text-white' },
      'suspended': { bg: 'bg-warning', text: 'text-dark' },
      'Active': { bg: 'bg-success', text: 'text-white' },
      'Inactive': { bg: 'bg-secondary', text: 'text-white' },
      'Suspended': { bg: 'bg-warning', text: 'text-dark' },
    }
    const c = cfg[status] || cfg['inactive']
    return <span className={`badge ${c.bg} ${c.text}`}>{status}</span>
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Loading all data...</p>
        </div>
      </div>
    )
  }

  if (error || !allData) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger mt-4">
          <i className="ti ti-alert-circle me-2" />
          {error || 'Failed to load data'}
          <button className="btn btn-danger btn-sm ms-3" onClick={() => window.location.reload()}>
            <i className="ti ti-refresh me-1" />Retry
          </button>
        </div>
      </div>
    )
  }

  const { summary } = allData
  const roles = Object.keys(summary.usersByRole || {}).sort()

  return (
    <div className="container-fluid">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Complete Database View</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item active">All Data</li>
          </ol></nav>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => window.print()}>
            <i className="ti ti-printer me-1" />Print
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={() => {
            const csv = [
              ['Institution', 'User Name', 'Email', 'Role', 'Status', 'Designation', 'Institution Code'].join(','),
              ...(allData.allUsers || []).map(u =>
                [u.institutionName, u.name, u.email, u.role, u.status, u.designation, u.institutionCode].join(',')
              )
            ].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `all_users_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
          }}>
            <i className="ti ti-download me-1" />Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-3">
        <div className="card-body p-2">
          <div className="nav nav-tabs" role="tablist">
            {[
              { key: 'summary', label: 'Summary', icon: 'ti ti-chart-bar' },
              { key: 'institutions', label: 'Institutions', icon: 'ti ti-building' },
              { key: 'users', label: 'All Users', icon: 'ti ti-users', count: summary.totalUsers },
              { key: 'agents', label: 'Agents', icon: 'ti ti-user-star', count: summary.totalAgents },
              { key: 'platform', label: 'Platform Agents', icon: 'ti ti-crown', count: summary.platformLevelAgents },
            ].map(tab => (
              <button
                key={tab.key}
                className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                data-bs-toggle="tab"
                onClick={() => setActiveTab(tab.key as any)}
              >
                <i className={`${tab.icon} me-1`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="badge bg-primary ms-1">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === SUMMARY TAB === */}
      {activeTab === 'summary' && (
        <>
          <div className="row mb-4">
            {[
              { label: 'Total Institutions', value: summary.totalInstitutions, icon: 'ti ti-building', color: 'text-primary', bg: 'bg-primary-transparent' },
              { label: 'Total Users', value: summary.totalUsers, icon: 'ti ti-users', color: 'text-success', bg: 'bg-success-transparent' },
              { label: 'Total Agents', value: summary.totalAgents, icon: 'ti ti-user-star', color: 'text-info', bg: 'bg-info-transparent' },
              { label: 'Platform Agents', value: summary.platformLevelAgents, icon: 'ti ti-crown', color: 'text-warning', bg: 'bg-warning-transparent' },
              { label: 'Institution Agents', value: summary.institutionLevelAgents, icon: 'ti ti-building', color: 'text-secondary', bg: 'bg-secondary-transparent' },
            ].map((stat, i) => (
              <div key={i} className="col-xl-2 col-md-4 col-6">
                <div className="card">
                  <div className="card-body text-center">
                    <span className={`avatar avatar-lg ${stat.bg} rounded-circle mb-2`}>
                      <i className={`${stat.icon} fs-24 ${stat.color}`} />
                    </span>
                    <h3 className={`mb-0 ${stat.color}`}>{stat.value}</h3>
                    <p className="text-muted mb-0 small">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title">Users by Role</h4>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Role</th>
                      <th>Count</th>
                      <th>Percentage</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role}>
                        <td>
                          <span className="badge bg-primary">{role}</span>
                        </td>
                        <td><strong>{(summary.usersByRole as any)[role]}</strong></td>
                        <td>{((summary.usersByRole as any)[role] / summary.totalUsers * 100).toFixed(1)}%</td>
                        <td>
                          <div className="progress" style={{height: 8}}>
                            <div
                              className="progress-bar"
                              style={{ width: `${(summary.usersByRole as any)[role] / summary.totalUsers * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Institutions Overview</h4>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Institution</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Total Users</th>
                      <th>Agents</th>
                      <th>Non-Agent Users</th>
                      <th>Role Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allData.institutions.map(inst => (
                      <tr key={inst._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedInstitution(inst._id); setActiveTab('institutions'); }}>
                        <td>
                          <strong>{inst.name}</strong>
                          <div className="small text-muted">{inst.code}</div>
                        </td>
                        <td>{inst.type}</td>
                        <td>{getStatusBadge(inst.status)}</td>
                        <td><span className="badge bg-primary">{inst.totalUsers}</span></td>
                        <td><span className="badge bg-success">{inst.totalAgents}</span></td>
                        <td><span className="badge bg-warning">{inst.totalNonAgentUsers}</span></td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {Object.entries(inst.roleBreakdown).map(([role, count]) => (
                              <span key={role} className="badge bg-secondary">{role}: {count}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === INSTITUTIONS TAB === */}
      {activeTab === 'institutions' && (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Select Institution</label>
                  <select
                    className="form-select"
                    value={selectedInstitution || ''}
                    onChange={e => setSelectedInstitution(e.target.value)}
                  >
                    {allData.institutions.map(inst => (
                      <option key={inst._id} value={inst._id}>{inst.name} ({inst.code})</option>
                    ))}
                  </select>
                </div>
                {selectedInstData && (
                  <>
                    <div className="col-md-8 d-flex align-items-center gap-3">
                      <div className="text-center px-3 border rounded">
                        <h5 className="mb-0 text-primary">{selectedInstData.totalUsers}</h5>
                        <small className="text-muted">Total Users</small>
                      </div>
                      <div className="text-center px-3 border rounded">
                        <h5 className="mb-0 text-success">{selectedInstData.totalAgents}</h5>
                        <small className="text-muted">Agents</small>
                      </div>
                      <div className="text-center px-3 border rounded">
                        <h5 className="mb-0 text-warning">{selectedInstData.totalNonAgentUsers}</h5>
                        <small className="text-muted">Non-Agents</small>
                      </div>
                      <div className="text-center px-3 border rounded">
                        <h5 className="mb-0 text-info">{selectedInstData.type}</h5>
                        <small className="text-muted">Type</small>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedInstData && (
            <>
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">
                    Users in {selectedInstData.name}
                    <span className="badge bg-primary ms-2">{selectedInstData.users.length}</span>
                  </h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <table className="table table-hover mb-0">
                      <thead className="bg-light sticky-top">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Designation</th>
                          <th>Password Hash</th>
                          <th>Online</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInstData.users.map((user) => (
                          <tr key={user._id}>
                            <td><strong>{user.name}</strong></td>
                            <td>{user.email}</td>
                            <td><span className="badge bg-info">{user.role}</span></td>
                            <td>{getStatusBadge(user.status)}</td>
                            <td>{user.designation || '-'}</td>
                            <td><code className="small" style={{ maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.password}</code></td>
                            <td>{user.isOnline ? <span className="badge bg-success">Online</span> : <span className="badge bg-secondary">Offline</span>}</td>
                            <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selectedInstData.agents.length > 0 && (
                <div className="card mb-3">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="ti ti-user-star me-2" />Agents in {selectedInstData.name}
                      <span className="badge bg-success ms-2">{selectedInstData.agents.length}</span>
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Password Hash</th>
                            <th>Designation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInstData.agents.map(agent => (
                            <tr key={agent._id}>
                              <td><strong>{agent.name}</strong></td>
                              <td>{agent.email}</td>
                              <td><span className="badge bg-success">{agent.role}</span></td>
                              <td>{getStatusBadge(agent.status)}</td>
                              <td><code className="small">{agent.password}</code></td>
                              <td>{agent.designation || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* === ALL USERS TAB === */}
      {activeTab === 'users' && (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search name, email, role, institution..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <span className="badge bg-primary fs-6 px-3 py-2">
                    Showing {filteredUsers.length} of {summary.totalUsers}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <table className="table table-hover mb-0">
                  <thead className="bg-light sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Institution</th>
                      <th>Code</th>
                      <th>Designation</th>
                      <th>Password Hash</th>
                      <th>Online</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => (
                      <tr key={user._id}>
                        <td>{idx + 1}</td>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td><span className="badge bg-info">{user.role}</span></td>
                        <td>{getStatusBadge(user.status)}</td>
                        <td>{user.institutionName || 'Platform'}</td>
                        <td>{user.institutionCode || '-'}</td>
                        <td>{user.designation || '-'}</td>
                        <td><code className="small" style={{ maxWidth: 100, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.password}</code></td>
                        <td>{user.isOnline ? <span className="badge bg-success">Online</span> : <span className="badge bg-secondary">Offline</span>}</td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === AGENTS TAB === */}
      {activeTab === 'agents' && (
        <>
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-primary">{summary.totalAgents}</h3>
                  <p className="mb-0 text-muted">Total Agents</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-warning">{summary.platformLevelAgents}</h3>
                  <p className="mb-0 text-muted">Platform Level</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-success">{summary.institutionLevelAgents}</h3>
                  <p className="mb-0 text-muted">Institution Level</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title mb-0">All Agents with Credentials</h4>
              <span className="badge bg-primary">{summary.totalAgents}</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <table className="table table-hover mb-0">
                  <thead className="bg-light sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Password Hash</th>
                      <th>Institution</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allData.institutions.flatMap((inst, i) =>
                      inst.agents.map((agent, j) => (
                        <tr key={`${inst._id}-${agent._id}`}>
                          <td>{i + 1}.{j + 1}</td>
                          <td><strong>{agent.name}</strong></td>
                          <td>{agent.email}</td>
                          <td><code className="small" style={{ maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.password}</code></td>
                          <td>{inst.name}</td>
                          <td><span className="badge bg-info">Institution</span></td>
                          <td>{getStatusBadge(agent.status)}</td>
                          <td>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === PLATFORM AGENTS TAB === */}
      {activeTab === 'platform' && (
        <>
          <div className="card mb-3">
            <div className="card-header">
              <h4 className="card-title mb-0">Platform-Level Agents (Global Agents)</h4>
            </div>
            <div className="card-body p-0">
              {allData.platformAgents.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-user-off fs-48 text-muted mb-3 d-block" />
                  <h5 className="text-muted">No platform-level agents found</h5>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Status</th>
                        <th>Commission Rate</th>
                        <th>Password</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allData.platformAgents.map((agent, idx) => (
                        <tr key={agent._id}>
                          <td>{idx + 1}</td>
                          <td><strong>{agent.name}</strong></td>
                          <td>{agent.email}</td>
                          <td>{agent.phone || '-'}</td>
                          <td>{agent.city || '-'}</td>
                          <td>{agent.state || '-'}</td>
                          <td>{getStatusBadge(agent.status)}</td>
                          <td><span className="badge bg-primary">{agent.commissionRate}%</span></td>
                          <td><code className="small">{agent.password}</code></td>
                          <td>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AllDataPage