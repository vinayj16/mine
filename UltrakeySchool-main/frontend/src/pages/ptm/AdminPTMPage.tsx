import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ptmService, { type PTMSlot, type PTMStats } from '../../services/ptmService';
import apiClient from '../../api/client';

const AdminPTMPage = () => {
  const [slots, setSlots] = useState<PTMSlot[]>([]);
  const [stats, setStats] = useState<PTMStats | null>(null);
  const [teachers, setTeachers] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'slots'>('overview');

  useEffect(() => {
    Promise.all([
      fetchTeachers(),
      fetchStats()
    ]);
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [filterStatus, filterTeacher, filterDate]);

  const fetchTeachers = async () => {
    try {
      const res = await apiClient.get('/users', { params: { role: 'teacher', limit: 200 } });
      if (res.data.success) setTeachers(res.data.data || []);
    } catch { /* ignore */ }
  };

  const fetchStats = async () => {
    try {
      const data = await ptmService.getStats();
      setStats(data);
    } catch { /* ignore */ }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterTeacher) params.teacherId = filterTeacher;
      if (filterDate) params.date = filterDate;
      const data = await ptmService.getSlots(params);
      // Response puts slots in data.data (controller returns data: result.slots)
      setSlots(data.data || (data.slots || []));
    } catch (err: any) {
      toast.error('Failed to load PTM slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) { toast.warn('Select slots to delete'); return; }
    try {
      await ptmService.bulkDeleteSlots(selectedIds);
      setSlots(prev => prev.filter(s => !selectedIds.includes(s._id)));
      setSelectedIds([]);
      setSelectAll(false);
      toast.success(`${selectedIds.length} slot(s) deleted`);
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk delete failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ptmService.deleteSlot(id);
      setSlots(prev => prev.filter(s => s._id !== id));
      toast.success('Slot deleted');
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleCancelByAdmin = async (id: string) => {
    try {
      const updated = await ptmService.cancelBooking(id, 'Cancelled by admin', true);
      setSlots(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast.success('Booking cancelled');
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cancel failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (selectAll) setSelectedIds(slots.map(s => s._id));
    else setSelectedIds([]);
  }, [selectAll, slots]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  if (loading && activeTab === 'overview') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="ti ti-calendar-time me-2 text-primary"></i>
          PTM Management
        </h4>
        {activeTab === 'slots' && selectedIds.length > 0 && (
          <button className="btn btn-danger" onClick={handleBulkDelete}>
            <i className="ti ti-trash me-1"></i> Delete {selectedIds.length} Selected
          </button>
        )}
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <i className="ti ti-chart-bar me-1"></i> Overview
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => setActiveTab('slots')}>
            <i className="ti ti-list me-1"></i> All Slots ({slots.length})
          </button>
        </li>
      </ul>

      {activeTab === 'overview' && stats && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-primary bg-opacity-10 border-primary">
              <div className="card-body text-center">
                <i className="ti ti-calendar fs-32 text-primary mb-2 d-block"></i>
                <h3 className="mb-0">{stats.total}</h3>
                <small className="text-muted">Total Slots</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-info bg-opacity-10 border-info">
              <div className="card-body text-center">
                <i className="ti ti-calendar-plus fs-32 text-info mb-2 d-block"></i>
                <h3 className="mb-0">{stats.available}</h3>
                <small className="text-muted">Available</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning bg-opacity-10 border-warning">
              <div className="card-body text-center">
                <i className="ti ti-calendar-check fs-32 text-warning mb-2 d-block"></i>
                <h3 className="mb-0">{stats.booked}</h3>
                <small className="text-muted">Booked</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-success bg-opacity-10 border-success">
              <div className="card-body text-center">
                <i className="ti ti-calendar-done fs-32 text-success mb-2 d-block"></i>
                <h3 className="mb-0">{stats.completed}</h3>
                <small className="text-muted">Completed</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && !stats && (
        <div className="card mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary me-2" />
            Loading statistics...
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <>
          <div className="card mb-4">
            <div className="card-body d-flex flex-wrap gap-3 align-items-center">
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold text-nowrap small">Status:</label>
                <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold text-nowrap small">Teacher:</label>
                <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: '180px' }} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                  <option value="">All Teachers</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold text-nowrap small">Date:</label>
                <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={fetchSlots}>
                <i className="ti ti-refresh me-1"></i> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input type="checkbox" className="form-check-input" checked={selectAll} onChange={() => setSelectAll(!selectAll)} />
                      </th>
                      <th>Teacher</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Booked By</th>
                      <th>Student</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">No PTM slots found</td>
                      </tr>
                    ) : (
                      slots.map(slot => (
                        <tr key={slot._id}>
                          <td>
                            <input type="checkbox" className="form-check-input" checked={selectedIds.includes(slot._id)} onChange={() => toggleSelect(slot._id)} />
                          </td>
                          <td>
                            <span className="fw-medium">
                              {slot.teacherId?.firstName} {slot.teacherId?.lastName}
                            </span>
                          </td>
                          <td>{formatDate(slot.date)}</td>
                          <td>{slot.startTime} - {slot.endTime}</td>
                          <td>
                            <span className={`badge bg-${slot.status === 'completed' ? 'success' : slot.status === 'booked' ? 'primary' : slot.status === 'available' ? 'info' : 'secondary'}`}>
                              {slot.status}
                            </span>
                          </td>
                          <td>
                            {slot.bookedBy
                              ? `${slot.bookedBy.firstName || ''} ${slot.bookedBy.lastName || ''}`
                              : <span className="text-muted">—</span>
                            }
                          </td>
                          <td>
                            {slot.studentId
                              ? `${slot.studentId.firstName || ''} ${slot.studentId.lastName || ''}`
                              : <span className="text-muted">—</span>
                            }
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {slot.status === 'booked' && (
                                <button className="btn btn-outline-danger" title="Cancel Booking" onClick={() => handleCancelByAdmin(slot._id)}>
                                  <i className="ti ti-x"></i>
                                </button>
                              )}
                              <button className="btn btn-outline-danger" title="Delete" onClick={() => handleDelete(slot._id)}>
                                <i className="ti ti-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPTMPage;
