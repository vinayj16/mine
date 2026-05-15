import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import { toast } from 'react-toastify'

const HostelsPage = () => {
  const [loading, setLoading] = useState(true)
  const [hostels, setHostels] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', code: '', type: 'boys', intake: '', address: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/hostel/hostels').catch(() => ({ data: { success: true, data: [] } }))
      if (res.data?.success) setHostels(res.data.data?.hostels || res.data.data || [])
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.code) { toast.error('Name and code required'); return }
    try {
      const res = await apiClient.post('/hostel/hostels', { ...formData, intake: parseInt(formData.intake) || 0 })
      if (res.data.success) { toast.success('Hostel created!'); setShowModal(false); setFormData({ name: '', code: '', type: 'boys', intake: '', address: '' }); fetchData() }
    } catch { toast.error('Failed to create') }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary"></div></div>

  return (
    <div className="content">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Hostel List</h4>
          <nav className="d-flex gap-2 small text-muted">
            <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/hostel" className="text-decoration-none">Hostel</Link>
            <span>/</span>
            <span>Hostel List</span>
          </nav>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}><i className="ti ti-plus me-1"></i>Add Hostel</button>
      </div>

      <div className="row g-3">
        {hostels.map(h => (
          <div key={h._id} className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div className="avatar avatar-sm bg-primary rounded"><i className="ti ti-building text-white" /></div>
                  <span className={`badge ${h.type === 'boys' ? 'bg-info' : 'bg-pink'}`}>{h.type}</span>
                </div>
                <h5 className="mb-1">{h.name}</h5>
                <p className="text-muted small mb-1">Code: {h.code}</p>
                <p className="text-muted small mb-0">Intake: {h.intake || 0} students</p>
              </div>
            </div>
          </div>
        ))}
        {hostels.length === 0 && <div className="col-12"><div className="alert alert-info text-center">No hostels found</div></div>}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Add Hostel</h5><button type="button" className="btn-close" onClick={() => setShowModal(false)}></button></div>
            <div className="modal-body">
              <div className="mb-2"><label className="form-label small">Name *</label><input type="text" className="form-control form-control-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Boys Hostel A" /></div>
              <div className="mb-2"><label className="form-label small">Code *</label><input type="text" className="form-control form-control-sm" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="BHA" /></div>
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label small">Type</label><select className="form-select form-select-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="boys">Boys</option><option value="girls">Girls</option></select></div><div className="col-md-6 mb-2"><label className="form-label small">Intake</label><input type="number" className="form-control form-control-sm" value={formData.intake} onChange={e => setFormData({ ...formData, intake: e.target.value })} /></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light btn-sm" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button></div>
          </div></div>
        </div>
      )}
    </div>
  )
}

export default HostelsPage
