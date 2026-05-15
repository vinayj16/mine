import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import { toast } from 'react-toastify'

const HostelDashboardPage = () => {
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    totalResidents: 0, totalRooms: 0, maintenanceIssues: 0,
    pendingComplaints: 0, vacantRooms: 0, totalCollected: 0, totalPending: 0
  })
  const [rooms, setRooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [hostels, setHostels] = useState<any[]>([])

  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showCreateHostelModal, setShowCreateHostelModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [showCreateFeeModal, setShowCreateFeeModal] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedFee, setSelectedFee] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false)

  const [newHostel, setNewHostel] = useState({ name: '', code: '', type: 'boys', intake: '', address: '' })
  const [newRoom, setNewRoom] = useState({ roomNumber: '', hostelId: '', block: '', floor: '', type: 'single', capacity: '2', rent: '' })
  const [newFee, setNewFee] = useState({ studentId: '', period: '', amount: '' })

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (showPaymentHistory) fetchPaymentHistory() }, [showPaymentHistory])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, roomsRes, studentsRes, feesRes, hostelsRes] = await Promise.all([
        apiClient.get('/hostel/dashboard/stats').catch(() => ({ data: { success: true, data: {} } })),
        apiClient.get('/hostel/rooms').catch(() => ({ data: { success: true, data: [] } })),
        apiClient.get('/hostel/students').catch(() => ({ data: { success: true, data: [] } })),
        apiClient.get('/hostel/fees').catch(() => ({ data: { success: true, data: [] } })),
        apiClient.get('/hostel/hostels').catch(() => ({ data: { success: true, data: [] } }))
      ])
      if (statsRes.data?.success) {
        const d = statsRes.data.data || {}
        setStats({
          totalResidents: d.totalResidents || 0,
          totalRooms: d.totalRooms || 0,
          maintenanceIssues: d.maintenanceIssues || 0,
          pendingComplaints: d.pendingComplaints || 0,
          vacantRooms: d.vacantRooms || 0,
          totalCollected: d.totalCollected || 0,
          totalPending: d.totalPending || 0
        })
      }
      if (roomsRes.data?.success) {
        const roomsData = roomsRes.data.data?.rooms || roomsRes.data.data || []
        setRooms(roomsData.map((r: any) => ({
          _id: r._id || r.id || Math.random().toString(),
          roomNumber: r.roomNumber || r.roomNo || 'N/A',
          block: r.block || r.hostelName || 'A',
          floor: r.floor || 1,
          currentResidents: r.currentResidents || 0,
          capacity: r.capacity || 4,
          status: r.status || 'available',
          rent: r.rent || 0,
          hostelId: r.hostel || r.hostelId || '',
          hostelName: r.hostelName || r.hostel || ''
        })))
      }
      if (studentsRes.data?.success) setStudents(studentsRes.data.data?.students || [])
      if (feesRes.data?.success) setFees(feesRes.data.data?.fees || [])
      if (hostelsRes.data?.success) setHostels(hostelsRes.data.data?.hostels || [])
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const fetchPaymentHistory = async () => {
    try {
      setPaymentHistoryLoading(true)
      const res = await apiClient.get('/hostel/payments/history').catch(() => ({ data: { success: true, data: { records: [] } } }))
      if (res.data?.success) setPaymentHistory(res.data.data?.records || [])
    } catch (err) { console.error('Error:', err) } finally { setPaymentHistoryLoading(false) }
  }

  // HOSTEL CRUD
  const handleCreateHostel = async () => {
    if (!newHostel.name || !newHostel.code) { toast.error('Please fill required fields'); return }
    try {
      const res = await apiClient.post('/hostel/hostels', { ...newHostel, intake: parseInt(newHostel.intake) })
      if (res.data.success) {
        toast.success('Hostel created!')
        setShowCreateHostelModal(false)
        setNewHostel({ name: '', code: '', type: 'boys', intake: '', address: '' })
        fetchData()
      }
    } catch { toast.error('Failed to create hostel') }
  }

  const handleDeleteHostel = async (id: string) => {
    if (!confirm('Delete this hostel?')) return
    try {
      const res = await apiClient.delete(`/hostel/hostels/${id}`)
      if (res.data.success) { toast.success('Hostel deleted'); fetchData() }
    } catch { toast.error('Failed to delete') }
  }

  // ROOM CRUD
  const handleCreateRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.hostelId) { toast.error('Please fill required fields'); return }
    try {
      const res = await apiClient.post('/hostel/rooms', {
        ...newRoom,
        capacity: parseInt(newRoom.capacity),
        floor: parseInt(newRoom.floor),
        rent: parseInt(newRoom.rent) || 0
      })
      if (res.data.success) {
        toast.success('Room created!')
        setShowCreateRoomModal(false)
        setNewRoom({ roomNumber: '', hostelId: '', block: '', floor: '', type: 'single', capacity: '2', rent: '' })
        fetchData()
      }
    } catch { toast.error('Failed to create room') }
  }

  const handleUpdateRoom = async () => {
    if (!selectedRoom) return
    try {
      const res = await apiClient.put(`/hostel/rooms/${selectedRoom._id}`, {
        roomNumber: selectedRoom.roomNumber,
        capacity: parseInt(selectedRoom.capacity),
        rent: parseInt(selectedRoom.rent) || 0,
        status: selectedRoom.status
      })
      if (res.data.success) {
        toast.success('Room updated!')
        setShowEditRoomModal(false)
        setSelectedRoom(null)
        fetchData()
      }
    } catch { toast.error('Failed to update') }
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Delete this room?')) return
    try {
      const res = await apiClient.delete(`/hostel/rooms/${id}`)
      if (res.data.success) { toast.success('Room deleted'); fetchData() }
    } catch { toast.error('Failed to delete') }
  }

  // STUDENT ALLOCATION
  const handleAllocateStudent = async (studentId: string, roomId: string) => {
    try {
      const res = await apiClient.post('/hostel/allocate', { studentId, roomId })
      if (res.data.success) { toast.success('Student allocated!'); setShowAllocateModal(false); setSelectedStudent(null); fetchData() }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDeallocateStudent = async (studentId: string) => {
    if (!confirm('Remove student from hostel?')) return
    try {
      const res = await apiClient.post('/hostel/deallocate', { studentId })
      if (res.data.success) { toast.success('Student deallocated'); fetchData() }
    } catch { toast.error('Failed') }
  }

  // FEE CRUD
  const handleCreateFee = async () => {
    if (!newFee.studentId || !newFee.period || !newFee.amount) { toast.error('Please fill all fields'); return }
    try {
      const student = students.find(s => s._id === newFee.studentId)
      const res = await apiClient.post('/hostel/fees', {
        studentId: newFee.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        period: newFee.period,
        amount: parseInt(newFee.amount)
      })
      if (res.data.success) {
        toast.success('Fee created!')
        setShowCreateFeeModal(false)
        setNewFee({ studentId: '', period: '', amount: '' })
        fetchData()
      }
    } catch { toast.error('Failed to create fee') }
  }

  // PAYMENT
  const handlePayment = async () => {
    if (!selectedFee || !paymentAmount) return
    try {
      const res = await apiClient.post('/hostel/fees/pay', { feeId: selectedFee._id, amount: parseFloat(paymentAmount) })
      if (res.data.success) { toast.success('Payment successful!'); setShowPaymentModal(false); setSelectedFee(null); setPaymentAmount(''); fetchData() }
    } catch { toast.error('Payment failed') }
  }

  const allocatedStudents = students.filter(s => s.hostelAllocated)
  const pendingFees = fees.filter(f => f.status !== 'paid')

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary"><span className="visually-hidden">Loading...</span></div>
    </div>
  }

  return (
    <div className="content">
      {/* PAGE HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Hostel Dashboard</h4>
          <nav className="d-flex align-items-center gap-2 small text-muted">
            <Link to="/dashboard" className="text-decoration-none">Dashboard</Link>
            <span>/</span>
            <span>Hostel</span>
          </nav>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body py-2"><div className="d-flex align-items-center"><div><p className="text-muted mb-1 small">Residents</p><h3 className="mb-0">{stats.totalResidents}</h3></div><div className="avatar avatar-sm bg-primary rounded-circle ms-auto"><i className="ti ti-users text-white" /></div></div></div></div></div>
        <div className="col-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body py-2"><div className="d-flex align-items-center"><div><p className="text-muted mb-1 small">Total Rooms</p><h3 className="mb-0">{stats.totalRooms}</h3></div><div className="avatar avatar-sm bg-success rounded-circle ms-auto"><i className="ti ti-door text-white" /></div></div></div></div></div>
        <div className="col-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body py-2"><div className="d-flex align-items-center"><div><p className="text-muted mb-1 small">Collected</p><h4 className="mb-0 text-success">&#8377;{(stats.totalCollected || 0).toLocaleString()}</h4></div><div className="avatar avatar-sm bg-info rounded-circle ms-auto"><i className="ti ti-cash text-white" /></div></div></div></div></div>
        <div className="col-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body py-2"><div className="d-flex align-items-center"><div><p className="text-muted mb-1 small">Pending</p><h4 className="mb-0 text-danger">&#8377;{(stats.totalPending || 0).toLocaleString()}</h4></div><div className="avatar avatar-sm bg-warning rounded-circle ms-auto"><i className="ti ti-alert-circle text-white" /></div></div></div></div></div>
      </div>

      {/* TABLES ROW */}
      <div className="row g-3">
        {/* Hostel Students */}
        <div className="col-xl-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2"><h6 className="mb-0">Hostel Students ({allocatedStudents.length})</h6><button className="btn btn-xs btn-primary" onClick={() => setShowAllocateModal(true)}><i className="ti ti-plus me-1" />Allocate</button></div>
            <div className="card-body p-0">
              {allocatedStudents.length > 0 ? (
                <table className="table table-hover table-sm mb-0"><thead className="table-light"><tr><th className="py-2 px-3">Student</th><th className="py-2">Room</th><th className="py-2">Actions</th></tr></thead><tbody>
                  {allocatedStudents.map(s => {
                    const room = rooms.find(r => r._id === s.roomId)
                    return <tr key={s._id}><td className="py-2 px-3"><span className="fw-medium">{s.firstName} {s.lastName}</span><br /><small className="text-muted">{s.class}-{s.section}</small></td><td className="py-2">{room ? `R${room.roomNumber}` : '-'}</td><td className="py-2"><button className="btn btn-xs btn-outline-danger" onClick={() => handleDeallocateStudent(s._id)} title="Remove"><i className="ti ti-trash" /></button></td></tr>
                  })}
                </tbody></table>
              ) : <div className="text-center py-4 text-muted">No students allocated</div>}
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="col-xl-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2"><h6 className="mb-0">Pending Payments ({pendingFees.length})</h6><span className="badge bg-danger">&#8377;{pendingFees.reduce((s, f) => s + f.dueAmount, 0).toLocaleString()}</span></div>
            <div className="card-body p-0">
              {pendingFees.length > 0 ? (
                <table className="table table-hover table-sm mb-0"><thead className="table-light"><tr><th className="py-2 px-3">Student</th><th className="py-2">Due</th><th className="py-2">Action</th></tr></thead><tbody>
                  {pendingFees.map(f => <tr key={f._id}><td className="py-2 px-3"><span className="fw-medium">{f.studentName}</span><br /><small className="text-muted">{f.period}</small></td><td className="py-2"><span className="badge bg-danger">&#8377;{f.dueAmount.toLocaleString()}</span></td><td className="py-2"><button className="btn btn-xs btn-success" onClick={() => { setSelectedFee(f); setPaymentAmount(f.dueAmount.toString()); setShowPaymentModal(true) }}><i className="ti ti-cash" /></button></td></tr>)}
                </tbody></table>
              ) : <div className="text-center py-4"><i className="ti ti-check-circle text-success" /><p className="text-muted mb-0">All fees paid!</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* ALLOCATE STUDENT MODAL */}
      {showAllocateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Allocate Student</h5><button type="button" className="btn-close" onClick={() => { setShowAllocateModal(false); setSelectedStudent(null) }}></button></div>
            <div className="modal-body">
              <div className="mb-3"><label className="form-label">Select Student</label><select className="form-select" value={selectedStudent?._id || ''} onChange={e => { const s = students.find(x => x._id === e.target.value); setSelectedStudent(s || null) }}><option value="">Choose...</option>{students.filter(s => !s.hostelAllocated).map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}</select></div>
              {selectedStudent && <div className="mb-3"><label className="form-label">Select Room</label><select className="form-select" onChange={e => { if (selectedStudent && e.target.value) handleAllocateStudent(selectedStudent._id, e.target.value) }}><option value="">Choose...</option>{rooms.filter(r => r.currentResidents < r.capacity).map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.capacity - r.currentResidents} beds)</option>)}</select></div>}
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => { setShowAllocateModal(false); setSelectedStudent(null) }}>Close</button></div>
          </div></div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedFee && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Collect Payment</h5><button type="button" className="btn-close" onClick={() => { setShowPaymentModal(false); setSelectedFee(null); setPaymentAmount('') }}></button></div>
            <div className="modal-body">
              <div className="alert alert-light"><strong>{selectedFee.studentName}</strong><br /><span className="text-muted">{selectedFee.period}</span><br /><span className="text-danger">Due: &#8377;{selectedFee.dueAmount.toLocaleString()}</span></div>
              <div className="mb-2"><label className="form-label">Amount (&#8377;)</label><input type="number" className="form-control" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={selectedFee.dueAmount} min={0} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => { setShowPaymentModal(false); setSelectedFee(null); setPaymentAmount('') }}>Cancel</button><button className="btn btn-success" onClick={handlePayment} disabled={!paymentAmount}>Collect</button></div>
          </div></div>
        </div>
      )}

      {/* CREATE HOSTEL MODAL */}
      {showCreateHostelModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Create Hostel</h5><button type="button" className="btn-close" onClick={() => setShowCreateHostelModal(false)}></button></div>
            <div className="modal-body">
              <div className="mb-2"><label className="form-label">Name *</label><input type="text" className="form-control" value={newHostel.name} onChange={e => setNewHostel({ ...newHostel, name: e.target.value })} placeholder="Boys Hostel A" /></div>
              <div className="mb-2"><label className="form-label">Code *</label><input type="text" className="form-control" value={newHostel.code} onChange={e => setNewHostel({ ...newHostel, code: e.target.value })} placeholder="BHA" /></div>
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label">Type</label><select className="form-select" value={newHostel.type} onChange={e => setNewHostel({ ...newHostel, type: e.target.value })}><option value="boys">Boys</option><option value="girls">Girls</option></select></div><div className="col-md-6 mb-2"><label className="form-label">Intake</label><input type="number" className="form-control" value={newHostel.intake} onChange={e => setNewHostel({ ...newHostel, intake: e.target.value })} /></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setShowCreateHostelModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreateHostel}>Create</button></div>
          </div></div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {showCreateRoomModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Create Room</h5><button type="button" className="btn-close" onClick={() => setShowCreateRoomModal(false)}></button></div>
            <div className="modal-body">
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label">Room No *</label><input type="text" className="form-control" value={newRoom.roomNumber} onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })} placeholder="101" /></div><div className="col-md-6 mb-2"><label className="form-label">Hostel *</label><select className="form-select" value={newRoom.hostelId} onChange={e => setNewRoom({ ...newRoom, hostelId: e.target.value })}><option value="">Select</option>{hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}</select></div></div>
              <div className="row"><div className="col-md-4 mb-2"><label className="form-label">Type</label><select className="form-select" value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option></select></div><div className="col-md-4 mb-2"><label className="form-label">Capacity</label><select className="form-select" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div><div className="col-md-4 mb-2"><label className="form-label">Rent</label><input type="number" className="form-control" value={newRoom.rent} onChange={e => setNewRoom({ ...newRoom, rent: e.target.value })} placeholder="5000" /></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setShowCreateRoomModal(false)}>Cancel</button><button className="btn btn-success" onClick={handleCreateRoom}>Create</button></div>
          </div></div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {showEditRoomModal && selectedRoom && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Edit Room</h5><button type="button" className="btn-close" onClick={() => { setShowEditRoomModal(false); setSelectedRoom(null) }}></button></div>
            <div className="modal-body">
              <div className="mb-2"><label className="form-label">Room Number</label><input type="text" className="form-control" value={selectedRoom.roomNumber} onChange={e => setSelectedRoom({ ...selectedRoom, roomNumber: e.target.value })} /></div>
              <div className="row"><div className="col-md-6 mb-2"><label className="form-label">Capacity</label><input type="number" className="form-control" value={selectedRoom.capacity} onChange={e => setSelectedRoom({ ...selectedRoom, capacity: parseInt(e.target.value) })} /></div><div className="col-md-6 mb-2"><label className="form-label">Rent</label><input type="number" className="form-control" value={selectedRoom.rent} onChange={e => setSelectedRoom({ ...selectedRoom, rent: parseInt(e.target.value) })} /></div></div>
              <div className="mb-2"><label className="form-label">Status</label><select className="form-select" value={selectedRoom.status} onChange={e => setSelectedRoom({ ...selectedRoom, status: e.target.value })}><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => { setShowEditRoomModal(false); setSelectedRoom(null) }}>Cancel</button><button className="btn btn-primary" onClick={handleUpdateRoom}>Update</button></div>
          </div></div>
        </div>
      )}

      {/* CREATE FEE MODAL */}
      {showCreateFeeModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Create Fee</h5><button type="button" className="btn-close" onClick={() => setShowCreateFeeModal(false)}></button></div>
            <div className="modal-body">
              <div className="mb-2"><label className="form-label">Student *</label><select className="form-select" value={newFee.studentId} onChange={e => setNewFee({ ...newFee, studentId: e.target.value })}><option value="">Select</option>{allocatedStudents.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}</select></div>
              <div className="mb-2"><label className="form-label">Period *</label><input type="text" className="form-control" value={newFee.period} onChange={e => setNewFee({ ...newFee, period: e.target.value })} placeholder="April 2026" /></div>
              <div className="mb-2"><label className="form-label">Amount (&#8377;) *</label><input type="number" className="form-control" value={newFee.amount} onChange={e => setNewFee({ ...newFee, amount: e.target.value })} placeholder="5000" /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setShowCreateFeeModal(false)}>Cancel</button><button className="btn btn-info" onClick={handleCreateFee}>Create Fee</button></div>
          </div></div>
        </div>
      )}

      {/* PAYMENT HISTORY MODAL */}
      {showPaymentHistory && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl"><div className="modal-content">
            <div className="modal-header"><div><h5 className="mb-1">Payment History</h5><p className="text-muted small mb-0">{paymentHistory.length} transactions</p></div><button type="button" className="btn-close" onClick={() => setShowPaymentHistory(false)}></button></div>
            <div className="modal-body p-0">
              {paymentHistoryLoading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <table className="table table-hover mb-0"><thead className="table-light position-sticky top-0"><tr><th className="py-2 px-3">Receipt</th><th className="py-2">Student</th><th className="py-2">Period</th><th className="py-2 text-end">Amount</th><th className="py-2">Method</th><th className="py-2">Date</th></tr></thead><tbody>
                    {paymentHistory.map(p => <tr key={p._id}><td className="py-2 px-3"><span className="badge bg-light">{p.receiptNo}</span></td><td className="py-2">{p.studentName}</td><td className="py-2">{p.period}</td><td className="py-2 text-end text-success">&#8377;{p.amount.toLocaleString()}</td><td className="py-2"><span className="badge bg-secondary">{p.paymentMethod}</span></td><td className="py-2">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '-'}</td></tr>)}
                  </tbody></table>
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-light" onClick={() => setShowPaymentHistory(false)}>Close</button></div>
          </div></div>
        </div>
      )}
    </div>
  )
}

export default HostelDashboardPage
