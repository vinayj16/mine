import { useState, useEffect } from 'react'
import apiClient from '../../api/client'

const PaymentsPage = () => {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, count: 0, paid: 0 })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/hostel/payments/history').catch(() => ({ data: { success: true, data: { records: [], summary: {} } } }))
      if (res.data?.success) {
        setRecords(res.data.data?.records || [])
        setStats({
          total: res.data.data?.summary?.totalCollected || 0,
          count: res.data.data?.summary?.transactionCount || 0,
          paid: res.data.data?.summary?.paidCount || 0
        })
      }
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary"></div></div>

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div><h4 className="mb-1">Payment History</h4><nav className="d-flex gap-2 small text-muted"><span>Dashboard</span><span>/</span><span>Payments</span></nav></div>
        <button className="btn btn-sm btn-light" onClick={fetchData}><i className="ti ti-refresh me-1"></i>Refresh</button>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body py-2"><div className="d-flex align-items-center"><div className="avatar avatar-sm bg-success rounded-circle me-2"><i className="ti ti-cash text-white" /></div><div><p className="text-muted mb-0 small">Total Collected</p><h4 className="mb-0">&#8377;{stats.total.toLocaleString()}</h4></div></div></div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body py-2"><div className="d-flex align-items-center"><div className="avatar avatar-sm bg-primary rounded-circle me-2"><i className="ti ti-receipt text-white" /></div><div><p className="text-muted mb-0 small">Transactions</p><h4 className="mb-0">{stats.count}</h4></div></div></div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body py-2"><div className="d-flex align-items-center"><div className="avatar avatar-sm bg-info rounded-circle me-2"><i className="ti ti-user-check text-white" /></div><div><p className="text-muted mb-0 small">Payments</p><h4 className="mb-0">{stats.paid}</h4></div></div></div></div></div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light"><tr><th className="py-2 px-3">Receipt</th><th className="py-2">Student</th><th className="py-2">Period</th><th className="py-2 text-end">Amount</th><th className="py-2">Method</th><th className="py-2">Date</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r._id}>
                  <td className="py-2 px-3"><span className="badge bg-light text-dark">{r.receiptNo}</span></td>
                  <td className="py-2">{r.studentName}</td>
                  <td className="py-2 small">{r.period}</td>
                  <td className="py-2 text-end text-success fw-medium">&#8377;{r.amount.toLocaleString()}</td>
                  <td className="py-2"><span className="badge bg-secondary">{r.paymentMethod}</span></td>
                  <td className="py-2 small">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No payment records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PaymentsPage
