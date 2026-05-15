import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import { toast } from 'react-toastify'

const RoomsPage = () => {
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [formData, setFormData] = useState({
    roomNumber: '', block: '', floor: '1', type: 'single', capacity: '2', rent: ''
  })

  useEffect(() => { fetchRooms() }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/hostel/rooms').catch(() => ({ data: { success: true, data: [] } }))
      if (res.data?.success) {
        setRooms((res.data.data?.rooms || res.data.data || []).map((r: any) => ({
          _id: r._id || r.id || Math.random().toString(),
          roomNumber: r.roomNumber || r.roomNo || 'N/A',
          block: r.block || r.hostelName || 'A',
          floor: r.floor || 1,
          currentResidents: r.currentResidents || 0,
          capacity: r.capacity || 4,
          status: r.status || 'available',
          rent: r.rent || 0
        })))
      }
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.roomNumber) { toast.error('Room number required'); return }
    try {
      const res = await apiClient.post('/hostel/rooms', { ...formData, capacity: parseInt(formData.capacity), floor: parseInt(formData.floor), rent: parseInt(formData.rent) || 0 })
      if (res.data.success) { toast.success('Room created!'); setShowModal(false); setFormData({ roomNumber: '', block: '', floor: '1', type: 'single', capacity: '2', rent: '' }); fetchRooms() }
    } catch { toast.error('Failed to create') }
  }

  const handleUpdate = async () => {
    if (!editingRoom) return
    try {
      const res = await apiClient.put(`/hostel/rooms/${editingRoom._id}`, { roomNumber: editingRoom.roomNumber, capacity: parseInt(editingRoom.capacity), rent: parseInt(editingRoom.rent) || 0, status: editingRoom.status })
      if (res.data.success) { toast.success('Room updated!'); setEditingRoom(null); fetchRooms() }
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room?')) return
    try {
      const res = await apiClient.delete(`/hostel/rooms/${id}`)
      if (res.data.success) { toast.success('Deleted'); fetchRooms() }
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary"></div></div>

  return (
    <div className="content">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Hostel Rooms</h4>
          <nav className="d-flex gap-2 small text-muted">
            <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/hostel" className="text-decoration-none">Hostel</Link>
            <span>/</span>
            <span>Rooms</span>
          </nav>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}><i className="ti ti-plus me-1"></i>Add Room</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light"><tr><th className="py-2 px-3">Room No</th><th className="py-2">Block</th><th className="py-2">Type</th><th className="py-2 text-center">Occupied</th><th className="py-2 text-end">Rent</th><th className="py-2">Status</th><th className="py-2">Actions</th></tr></thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r._id}>
                  <td className="py-2 px-3 fw-medium">{r.roomNumber}</td>
                  <td className="py-2">{r.block}</td>
                  <td className="py-2"><span className="badge bg-secondary">{r.type}</span></td>
                  <td className="py-2 text-center">{r.currentResidents}/{r.capacity}</td>
                  <td className="py-2 text-end">&#8377;{r.rent?.toLocaleString() || 0}</td>
                  <td className="py-2"><span className={`badge ${r.status === 'available' ? 'bg-success' : 'bg-warning'}`}>{r.status}</span></td>
                  <td className="py-2">
                    <button className="btn btn-xs btn-outline-primary me-1" onClick={() => setEditingRoom({ ...r })}><i className="ti ti-edit" /></button>
                    <button className="btn btn-xs btn-outline-danger" onClick={() => handleDelete(r._id)}><i className="ti ti-trash" /></button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">No rooms found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Add Room</h5><button type="button" className="btn-close" onClick={() => setShowModal(false)}></button></div>
            <div className="modal-body">
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label small">Room No *</label><input type="text" className="form-control form-control-sm" value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} /></div><div className="col-md-6 mb-2"><label className="form-label small">Block</label><input type="text" className="form-control form-control-sm" value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })} /></div></div>
              <div className="row"><div className="col-md-4 mb-2"><label className="form-label small">Type</label><select className="form-select form-select-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option>single</option><option>double</option><option>triple</option></select></div><div className="col-md-4 mb-2"><label className="form-label small">Capacity</label><select className="form-select form-select-sm" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div><div className="col-md-4 mb-2"><label className="form-label small">Rent</label><input type="number" className="form-control form-control-sm" value={formData.rent} onChange={e => setFormData({ ...formData, rent: e.target.value })} /></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light btn-sm" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button></div>
          </div></div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRoom && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Edit Room</h5><button type="button" className="btn-close" onClick={() => setEditingRoom(null)}></button></div>
            <div className="modal-body">
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label small">Room Number</label><input type="text" className="form-control form-control-sm" value={editingRoom.roomNumber} onChange={e => setEditingRoom({ ...editingRoom, roomNumber: e.target.value })} /></div><div className="col-md-6 mb-2"><label className="form-label small">Capacity</label><input type="number" className="form-control form-control-sm" value={editingRoom.capacity} onChange={e => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) })} /></div></div>
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label small">Rent</label><input type="number" className="form-control form-control-sm" value={editingRoom.rent} onChange={e => setEditingRoom({ ...editingRoom, rent: parseInt(e.target.value) })} /></div><div className="col-md-6 mb-2"><label className="form-label small">Status</label><select className="form-select form-select-sm" value={editingRoom.status} onChange={e => setEditingRoom({ ...editingRoom, status: e.target.value })}><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light btn-sm" onClick={() => setEditingRoom(null)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={handleUpdate}>Update</button></div>
          </div></div>
        </div>
      )}
    </div>
  )
}

export default RoomsPage
