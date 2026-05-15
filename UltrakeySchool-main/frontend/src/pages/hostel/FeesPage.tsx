import { useState, useEffect } from 'react'
import apiClient from '../../api/client'
import { toast } from 'react-toastify'

const FeesPage = () => {
  const [loading, setLoading] = useState(true)
  const [fees, setFees] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [formData, setFormData] = useState({ studentId: '', period: '', amount: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [feesRes, studentsRes] = await Promise.all([
        apiClient.get('/hostel/fees').catch(() => ({ data: { success: true, data: [] } })),
        apiClient.get('/hostel/students').catch(() => ({ data: { success: true, data: [] } }))
      ])
      if (feesRes.data?.success) setFees(feesRes.data.data?.fees || [])
      if (studentsRes.data?.success) setStudents(studentsRes.data.data?.students || [])
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const allocatedStudents = students.filter(s => s.hostelAllocated)

  const handleCreate = async () => {
    if (!formData.studentId || !formData.period || !formData.amount) { toast.error('All fields required'); return }
    const student = students.find(s => s._id === formData.studentId)
    try {
      const res = await apiClient.post('/hostel/fees', { studentId: formData.studentId, studentName: student ? `${student.firstName} ${student.lastName}` : '', period: formData.period, amount: parseInt(formData.amount) })
      if (res.data.success) { toast.success('Fee created!'); setShowModal(false); setFormData({ studentId: '', period: '', amount: '' }); fetchData() }
    } catch { toast.error('Failed') }
  }

  const handlePayment = async () => {
    if (!selectedFee || !paymentAmount) return
    try {
      const res = await apiClient.post('/hostel/fees/pay', { feeId: selectedFee._id, amount: parseFloat(paymentAmount) })
      if (res.data.success) { toast.success('Payment successful!'); setShowPaymentModal(false); setSelectedFee(null); setPaymentAmount(''); fetchData() }
    } catch { toast.error('Payment failed') }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary"></div></div>

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div><h4 className="mb-1">Hostel Fees</h4><nav className="d-flex gap-2 small text-muted"><span>Dashboard</span><span>/</span><span>Fees</span></nav></div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}><i className="ti ti-plus me-1"></i>Create Fee</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light"><tr><th className="py-2 px-3">Student</th><th className="py-2">Period</th><th className="py-2 text-end">Total</th><th className="py-2 text-end">Paid</th><th className="py-2 text-end">Due</th><th className="py-2">Status</th><th className="py-2">Action</th></tr></thead>
            <tbody>
              {fees.map(f => (
                <tr key={f._id}>
                  <td className="py-2 px-3 fw-medium">{f.studentName}</td>
                  <td className="py-2">{f.period}</td>
                  <td className="py-2 text-end">&#8377;{f.amount.toLocaleString()}</td>
                  <td className="py-2 text-end text-success">&#8377;{f.paidAmount.toLocaleString()}</td>
                  <td className="py-2 text-end text-danger">&#8377;{f.dueAmount.toLocaleString()}</td>
                  <td className="py-2"><span className={`badge ${f.status === 'paid' ? 'bg-success' : f.status === 'partial' ? 'bg-warning' : 'bg-danger'}`}>{f.status}</span></td>
                  <td className="py-2">{f.status !== 'paid' && <button className="btn btn-xs btn-success" onClick={() => { setSelectedFee(f); setPaymentAmount(f.dueAmount.toString()); setShowPaymentModal(true) }}><i className="ti ti-cash me-1" />Collect</button>}</td>
                </tr>
              ))}
              {fees.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">No fees found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Create Fee</h5><button type="button" className="btn-close" onClick={() => setShowModal(false)}></button></div>
            <div className="modal-body">
              <div className="mb-2"><label className="form-label small">Student *</label><select className="form-select form-select-sm" value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })}><option value="">Select</option>{allocatedStudents.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}</select></div>
              <div className="mb-2"><label className="form-label small">Period *</label><input type="text" className="form-control form-control-sm" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })} placeholder="April 2026" /></div>
              <div className="mb-2"><label className="form-label small">Amount *</label><input type="number" className="form-control form-control-sm" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="5000" /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light btn-sm" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button></div>
          </div></div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedFee && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Collect Payment</h5><button type="button" className="btn-close" onClick={() => { setShowPaymentModal(false); setSelectedFee(null) }}></button></div>
            <div className="modal-body">
              <div className="alert alert-light mb-2"><strong>{selectedFee.studentName}</strong><br /><span className="text-muted">{selectedFee.period}</span><br /><span className="text-danger">Due: &#8377;{selectedFee.dueAmount.toLocaleString()}</span></div>
              <div className="mb-2"><label className="form-label small">Amount (&#8377;)</label><input type="number" className="form-control" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={selectedFee.dueAmount} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-light btn-sm" onClick={() => { setShowPaymentModal(false); setSelectedFee(null) }}>Cancel</button><button className="btn btn-success btn-sm" onClick={handlePayment} disabled={!paymentAmount}>Collect</button></div>
          </div></div>
        </div>
      )}
    </div>
  )
}

export default FeesPage
