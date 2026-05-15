import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

// Type definitions for API data
interface TopStat {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface ParentKPI {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

interface ParentEngagement {
  category: string
  engaged: number
  total: number
  pct: string
  bar: string
}

interface CommunicationStats {
  type: string
  sent: number
  delivered: number
  pending: number
  pct: string
  bar: string
}

const ParentsOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parentForm, setParentForm] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'father',
    occupation: '',
    address: '',
    studentId: ''
  })
  const [students, setStudents] = useState<any[]>([])

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchParentData()
    fetchStudents()
  }, [])

  const fetchParentData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/analytics/parent-overview')
      
      console.log('Parent Overview API Response:', response.data)
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
        toast.success('Parent Overview loaded successfully')
      } else {
        console.error('API response structure:', response.data)
        setError('Invalid API response structure')
      }
    } catch (err: any) {
      console.error('Error fetching parent overview:', err)
      setError(err.message || 'Failed to load parent data')
      toast.error('Failed to load parent data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await apiClient.get('/students?limit=100')
      setStudents(res.data.data?.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Create user account for parent
      await apiClient.post('/auth/register', {
        name: parentForm.name,
        email: parentForm.email,
        phone: parentForm.phone,
        password: 'Parent@123',
        role: 'parent',
        guardianData: {
          relationship: parentForm.relationship,
          occupation: parentForm.occupation,
          address: parentForm.address,
          studentId: parentForm.studentId
        }
      })
      toast.success('Parent added successfully!')
      setShowAddModal(false)
      setParentForm({
        name: '',
        email: '',
        phone: '',
        relationship: 'father',
        occupation: '',
        address: '',
        studentId: ''
      })
      fetchParentData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add parent')
    } finally {
      setSaving(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <i className="ti ti-alert-circle me-2" />
        {error}
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchParentData}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    )
  }

  // Transform backend data for UI - using empty arrays/objects as fallbacks
  const topStats: TopStat[] = dashboardData?.topStats || []
  const parentKPIs: ParentKPI[] = dashboardData?.parentKPIs || []
  const parentEngagement: ParentEngagement[] = dashboardData?.parentEngagement || []
  const communicationStats: CommunicationStats[] = dashboardData?.communicationStats || []

  return (
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Parent Overview</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/parents">Parents</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Parent Overview</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <Link to="/reports/export" className="btn btn-primary d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-download me-1" />Export Report
          </Link>
          <Link to="/reports" className="btn btn-light d-flex align-items-center" style={{ fontSize: 13 }}>
            <i className="ti ti-report me-1" />View All Reports
          </Link>
        </div>
      </div>

      {/* TOP STATISTICS */}
      <div className="row mb-3">
        {topStats.map((stat: TopStat) => (
          <div key={stat.label} className="col-xxl-3 col-xl-4 col-sm-6 d-flex">
            <div className="card flex-fill animate-card border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className={`avatar avatar-xl ${stat.avatarTone} me-2 p-1 flex-shrink-0`}>
                    <img src={stat.icon} alt="img" />
                  </div>
                  <div className="overflow-hidden flex-fill">
                    <h6 className="mb-1 text-truncate">{stat.label}</h6>
                    <h3 className="mb-0">{stat.value}</h3>
                    <p className="mb-0 text-muted">{stat.delta}</p>
                    <div className="d-flex align-items-center">
                      <small className="text-muted">{stat.active}</small>
                      <span className="mx-2">•</span>
                      <small className="text-muted">{stat.inactive}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PARENT KPIS */}
      <div className="row mb-4">
        {parentKPIs.map((kpi: ParentKPI) => (
          <div key={kpi.label} className="col-xl-3 col-lg-4 col-md-6 d-flex">
            <div className="card flex-fill animate-card border-0">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className={`avatar avatar-xl ${kpi.avatarTone} me-2 p-1 flex-shrink-0`}>
                    <i className={`${kpi.icon} fs-20`}></i>
                  </div>
                  <div className="overflow-hidden flex-fill">
                    <h6 className="mb-1 text-truncate">{kpi.label}</h6>
                    <h3 className="mb-0">{kpi.value}</h3>
                    <p className="mb-0 text-muted">{kpi.delta}</p>
                    <div className="d-flex align-items-center">
                      <small className="text-muted">{kpi.active}</small>
                      <span className="mx-2">•</span>
                      <small className="text-muted">{kpi.inactive}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PARENT ENGAGEMENT */}
      <div className="row mb-4">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Parent Engagement</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={parentEngagement} barSize={40} barGap={4}>
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="engaged" name="Engaged" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total" name="Total Parents" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* COMMUNICATION STATS */}
      <div className="row">
        <div className="col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Communication Statistics</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={communicationStats} barSize={40} barGap={4}>
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sent" name="Sent" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* PARENT MANAGEMENT SECTION */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Parent Management</h4>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <i className="ti ti-users-group fs-48 text-muted mb-3 d-block" />
                <h5 className="text-muted">Parent Management Dashboard</h5>
                <p className="text-muted">Comprehensive parent management features will be available here.</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <i className="ti ti-user-plus me-1"></i>Add Parent
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={fetchParentData}
                  >
                    <i className="ti ti-refresh me-1"></i>Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD PARENT MODAL */}
      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Parent/Guardian</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <form onSubmit={handleAddParent}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Full Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={parentForm.name}
                        onChange={e => setParentForm({...parentForm, name: e.target.value})} 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email *</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        required 
                        value={parentForm.email}
                        onChange={e => setParentForm({...parentForm, email: e.target.value})} 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone Number *</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        required 
                        value={parentForm.phone}
                        onChange={e => setParentForm({...parentForm, phone: e.target.value})} 
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Relationship *</label>
                        <select 
                          className="form-select" 
                          required 
                          value={parentForm.relationship}
                          onChange={e => setParentForm({...parentForm, relationship: e.target.value})}
                        >
                          <option value="father">Father</option>
                          <option value="mother">Mother</option>
                          <option value="guardian">Guardian</option>
                          <option value="grandfather">Grandfather</option>
                          <option value="grandmother">Grandmother</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Occupation</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={parentForm.occupation}
                          onChange={e => setParentForm({...parentForm, occupation: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <textarea 
                        className="form-control" 
                        rows={2} 
                        value={parentForm.address}
                        onChange={e => setParentForm({...parentForm, address: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Link to Student (Optional)</label>
                      <select 
                        className="form-select" 
                        value={parentForm.studentId}
                        onChange={e => setParentForm({...parentForm, studentId: e.target.value})}
                      >
                        <option value="">Select Student</option>
                        {students.map(s => (
                          <option key={s._id} value={s._id}>{s.name || s.firstName + ' ' + s.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Adding...' : 'Add Parent'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  )
}

export default ParentsOverviewPage
