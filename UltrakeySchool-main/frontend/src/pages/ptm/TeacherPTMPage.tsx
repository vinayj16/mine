import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import ptmService from '../../services/ptmService';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

interface PTMSlot {
  _id: string;
  teacherId: { _id: string; firstName: string; lastName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  bookedBy?: { _id: string; firstName: string; lastName: string; email: string };
  studentId?: { _id: string; firstName: string; lastName: string; rollNumber?: string };
  bookingNotes?: string;
  meetingMode?: string;
  meetingLink?: string;
  location?: string;
  attendanceStatus?: string;
  completedAt?: string;
}

const TeacherPTMPage = () => {
  const { user } = useAuthStore();
  const [teacherId, setTeacherId] = useState('');
  const [slots, setSlots] = useState<PTMSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState<string | null>(null);

  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [newSlotDuration, setNewSlotDuration] = useState('30');
  const [newSlotCount, setNewSlotCount] = useState('1');
  const [newSlotLocation, setNewSlotLocation] = useState('');
  const [newSlotMeetingMode, setNewSlotMeetingMode] = useState('in_person');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');

  const [completeNotes, setCompleteNotes] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignResults, setAssignResults] = useState<any[]>([]);
  const [assignSearching, setAssignSearching] = useState(false);

  const searchTimer = useRef<any>(null);

  const handleAssignSearch = useCallback(async (term: string) => {
    setAssignSearch(term);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (term.length < 2) { setAssignResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setAssignSearching(true);
      try {
        const res = await apiClient.get('/students', { params: { search: term, limit: 10 } });
        setAssignResults(res.data?.data || res.data?.students || []);
      } catch { setAssignResults([]); }
      setAssignSearching(false);
    }, 300);
  }, []);

  const handleAssignStudent = async (slotId: string, studentId: string) => {
    try {
      const updated = await ptmService.assignSlot(slotId, studentId);
      setSlots(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast.success('PTM slot assigned to parent successfully');
      setAssigningId(null);
      setAssignSearch('');
      setAssignResults([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign slot');
    }
  };

  useEffect(() => {
    const uid = user?._id || user?.id;
    if (uid) setTeacherId(uid);
  }, [user]);

  useEffect(() => {
    if (!teacherId) return;
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        const data = await ptmService.getSlotsByTeacher(teacherId, params);
        setSlots(Array.isArray(data) ? data : []);
      } catch (err: any) {
        toast.error('Failed to load PTM slots');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [teacherId, statusFilter]);

  const handleCreateSlots = async () => {
    if (!newSlotDate || !newSlotStart || !newSlotEnd) {
      toast.warn('Please fill in date, start and end time');
      return;
    }
    const count = parseInt(newSlotCount);
    const duration = parseInt(newSlotDuration);
    const slotsToCreate: any[] = [];
    const [startH, startM] = newSlotStart.split(':').map(Number);
    const [endH, endM] = newSlotEnd.split(':').map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let i = 0; i < count; i++) {
      if (currentMinutes + duration > endMinutes) break;
      const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
      currentMinutes += duration;
      const slotEnd = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
      slotsToCreate.push({
        date: newSlotDate,
        startTime: slotStart,
        endTime: slotEnd,
        duration,
        meetingMode: newSlotMeetingMode,
        location: newSlotLocation || undefined
      });
    }

    if (slotsToCreate.length === 0) {
      toast.warn('No slots could be created within the time range');
      return;
    }

    try {
      const created = await ptmService.createSlots(slotsToCreate);
      setSlots(prev => [...(Array.isArray(created) ? created : []), ...prev]);
      toast.success(`${slotsToCreate.length} PTM slot(s) created`);
      setShowCreateForm(false);
      setNewSlotDate('');
      setNewSlotStart('');
      setNewSlotEnd('');
      setNewSlotCount('1');
      setNewSlotLocation('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create slots');
    }
  };

  const handleComplete = async (slotId: string) => {
    try {
      const updated = await ptmService.completeSlot(slotId, {
        notes: completeNotes || undefined,
        attendanceStatus
      });
      setSlots(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast.success('Slot marked as completed');
      setCompletingId(null);
      setCompleteNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to complete');
    }
  };

  const handleReschedule = async (slotId: string) => {
    if (!rescheduleDate || !rescheduleStart || !rescheduleEnd) {
      toast.warn('Please fill in all reschedule fields');
      return;
    }
    try {
      const updated = await ptmService.rescheduleSlot(slotId, {
        date: rescheduleDate,
        startTime: rescheduleStart,
        endTime: rescheduleEnd
      });
      setSlots(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast.success('Slot rescheduled');
      setShowRescheduleForm(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reschedule');
    }
  };

  const handleCancelSlot = async (slotId: string) => {
    try {
      const updated = await ptmService.cancelBooking(slotId, 'Cancelled by teacher');
      setSlots(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast.success('Slot cancelled');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleSendReminder = async (slotId: string) => {
    try {
      const res = await ptmService.sendReminder(slotId);
      toast.success(`Reminder sent (${res.sent ? 'delivered' : 'queued'})`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reminder');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'info',
      booked: 'primary',
      completed: 'success',
      cancelled: 'secondary'
    };
    return `bg-${map[status] || 'secondary'}`;
  };

  if (loading) {
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
          My PTM Slots
        </h4>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          <i className="ti ti-plus me-1"></i> {showCreateForm ? 'Cancel' : 'Create Slots'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card mb-4 border-primary">
          <div className="card-header bg-primary bg-opacity-10">
            <h6 className="mb-0"><i className="ti ti-calendar-plus me-1"></i> Create PTM Slots</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-control" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">End Time</label>
                <input type="time" className="form-control" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Duration (min)</label>
                <select className="form-select" value={newSlotDuration} onChange={e => setNewSlotDuration(e.target.value)}>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                </select>
              </div>
              <div className="col-md-1">
                <label className="form-label">Count</label>
                <input type="number" className="form-control" min="1" max="20" value={newSlotCount} onChange={e => setNewSlotCount(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Mode</label>
                <select className="form-select" value={newSlotMeetingMode} onChange={e => setNewSlotMeetingMode(e.target.value)}>
                  <option value="in_person">In Person</option>
                  <option value="video">Video</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Location / Meeting Link</label>
                <input type="text" className="form-control" placeholder="Room number or video link" value={newSlotLocation} onChange={e => setNewSlotLocation(e.target.value)} />
              </div>
              <div className="col-md-12">
                <button className="btn btn-primary" onClick={handleCreateSlots}>
                  <i className="ti ti-plus me-1"></i> Generate Slots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-2 align-items-center">
          <label className="fw-semibold text-nowrap"><i className="ti ti-filter me-1"></i>Filter:</label>
          <select className="form-select form-select-sm" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-muted small ms-2">{slots.length} slot(s)</span>
        </div>
      </div>

      <div className="row">
        {slots.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-calendar-off fs-48 text-muted mb-3 d-block"></i>
                <h5>No PTM Slots</h5>
                <p className="text-muted">Create available slots for parents to book.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                  <i className="ti ti-plus me-1"></i> Create Slots
                </button>
              </div>
            </div>
          </div>
        ) : (
          slots.map(slot => (
            <div className="col-md-6 col-lg-4 mb-3" key={slot._id}>
              <div className={`card border-${slot.status === 'completed' ? 'success' : slot.status === 'booked' ? 'primary' : slot.status === 'available' ? 'info' : 'secondary'} h-100`}>
                <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-2">
                  <span className={`badge ${statusBadge(slot.status)}`}>{slot.status}</span>
                  <div className="btn-group btn-group-sm">
                    {slot.status === 'booked' && (
                      <>
                        <button className="btn btn-outline-success" title="Mark Complete" onClick={() => setCompletingId(slot._id)}>
                          <i className="ti ti-check"></i>
                        </button>
                        <button className="btn btn-outline-warning" title="Reschedule" onClick={() => {
                          setShowRescheduleForm(slot._id);
                          setRescheduleDate(slot.date.split('T')[0]);
                          setRescheduleStart(slot.startTime);
                          setRescheduleEnd(slot.endTime);
                        }}>
                          <i className="ti ti-calendar-refresh"></i>
                        </button>
                        <button className="btn btn-outline-info" title="Send Reminder" onClick={() => handleSendReminder(slot._id)}>
                          <i className="ti ti-bell"></i>
                        </button>
                      </>
                    )}
                    {slot.status === 'available' && (
                      <>
                        <button className="btn btn-outline-success" title="Assign to Parent" onClick={() => {
                          setAssigningId(assigningId === slot._id ? null : slot._id);
                          setAssignSearch('');
                          setAssignResults([]);
                        }}>
                          <i className="ti ti-user-plus"></i>
                        </button>
                        <button className="btn btn-outline-danger" title="Cancel" onClick={() => handleCancelSlot(slot._id)}>
                          <i className="ti ti-x"></i>
                        </button>
                      </>
                    )}
                    {slot.status === 'booked' && (
                      <button className="btn btn-outline-danger" title="Cancel" onClick={() => handleCancelSlot(slot._id)}>
                        <i className="ti ti-x"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <p className="mb-1 small">
                    <i className="ti ti-calendar me-1"></i> {formatDate(slot.date)}<br />
                    <i className="ti ti-clock me-1"></i> {slot.startTime} - {slot.endTime}
                  </p>
                  {slot.status === 'booked' && slot.bookedBy && (
                    <>
                      <hr className="my-2" />
                      <p className="mb-1 small">
                        <strong>Booked by:</strong> {slot.bookedBy.firstName} {slot.bookedBy.lastName}<br />
                        {slot.studentId && (
                          <><strong>Student:</strong> {slot.studentId.firstName} {slot.studentId.lastName}{slot.studentId.rollNumber ? ` (${slot.studentId.rollNumber})` : ''}<br /></>
                        )}
                        {slot.bookingNotes && <><strong>Notes:</strong> {slot.bookingNotes}</>}
                      </p>
                      {slot.meetingLink && (
                        <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary mt-1">
                          <i className="ti ti-video me-1"></i> Join
                        </a>
                      )}
                    </>
                  )}
                  {slot.location && (
                    <p className="small text-muted mb-0 mt-1"><i className="ti ti-map-pin me-1"></i> {slot.location}</p>
                  )}
                </div>
              </div>

              {assigningId === slot._id && (
                <div className="card border-success mt-2">
                  <div className="card-body p-3">
                    <h6 className="mb-2"><i className="ti ti-user-plus me-1 text-success"></i> Assign to Parent</h6>
                    <input
                      className="form-control form-control-sm mb-2"
                      placeholder="Search student by name..."
                      value={assignSearch}
                      onChange={e => handleAssignSearch(e.target.value)}
                      autoFocus
                    />
                    {assignSearching && <small className="text-muted">Searching...</small>}
                    {assignResults.length > 0 && (
                      <div className="list-group mb-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
                        {assignResults.map((st: any) => (
                          <button
                            key={st._id}
                            className="list-group-item list-group-item-action py-1 small"
                            onClick={() => handleAssignStudent(slot._id, st._id)}
                          >
                            <strong>{st.firstName} {st.lastName}</strong>
                            <span className="text-muted ms-2">Roll: {st.rollNumber || 'N/A'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={() => { setAssigningId(null); setAssignSearch(''); setAssignResults([]); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {completingId === slot._id && (
                <div className="card border-success mt-2">
                  <div className="card-body p-3">
                    <h6 className="mb-2"><i className="ti ti-check me-1 text-success"></i> Complete Meeting</h6>
                    <div className="mb-2">
                      <label className="form-label small">Attendance</label>
                      <select className="form-select form-select-sm" value={attendanceStatus} onChange={e => setAttendanceStatus(e.target.value)}>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small">Notes</label>
                      <textarea className="form-control form-control-sm" rows={2} value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} placeholder="Meeting notes..." />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-success" onClick={() => handleComplete(slot._id)}>
                        <i className="ti ti-check me-1"></i> Confirm Complete
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setCompletingId(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {showRescheduleForm === slot._id && (
                <div className="card border-warning mt-2">
                  <div className="card-body p-3">
                    <h6 className="mb-2"><i className="ti ti-calendar-refresh me-1 text-warning"></i> Reschedule</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-4">
                        <input type="date" className="form-control form-control-sm" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
                      </div>
                      <div className="col-4">
                        <input type="time" className="form-control form-control-sm" value={rescheduleStart} onChange={e => setRescheduleStart(e.target.value)} />
                      </div>
                      <div className="col-4">
                        <input type="time" className="form-control form-control-sm" value={rescheduleEnd} onChange={e => setRescheduleEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning" onClick={() => handleReschedule(slot._id)}>
                        <i className="ti ti-calendar-refresh me-1"></i> Confirm Reschedule
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowRescheduleForm(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherPTMPage;
