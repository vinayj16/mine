import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ptmService from '../../services/ptmService';
import { useAuthStore } from '../../store/authStore';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  class?: string;
  section?: string;
}

interface BookedSlot {
  _id: string;
  teacherId: { _id: string; firstName: string; lastName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  studentId?: { _id: string; firstName: string; lastName: string; rollNumber?: string };
  meetingMode?: string;
  meetingLink?: string;
  location?: string;
  bookingNotes?: string;
  bookedAt?: string;
}

const ParentPTMPage = () => {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<BookedSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState<'booked' | 'available'>('booked');

  useEffect(() => {
    const load = async () => {
      try {
        const userId = user?._id || user?.id;
        if (!userId) return;

        const [childrenRes, bookingRes] = await Promise.all([
          ptmService.getBookingsByParent(userId, {}),
          ptmService.getBookingsByParent(userId)
        ]);

        setChildren(Array.isArray(childrenRes) ? childrenRes : []);
        setBookings(Array.isArray(bookingRes) ? bookingRes : []);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load PTM data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'available') return;
    const fetchAvailable = async () => {
      try {
        const params: any = {};
        if (filterDate) params.date = filterDate;
        const slots = await ptmService.getAvailableSlots(params);
        setAvailableSlots(Array.isArray(slots) ? slots : []);
      } catch (err: any) {
        toast.error('Failed to load available slots');
      }
    };
    fetchAvailable();
  }, [activeTab, filterDate]);

  const handleBookSlot = async (slotId: string) => {
    if (!selectedStudent) {
      toast.warn('Please select a student/child');
      return;
    }
    try {
      const updated = await ptmService.bookSlot(slotId, selectedStudent);
      toast.success('PTM slot booked successfully');
      setBookings(prev => [updated, ...prev.map(b => b._id === updated._id ? updated : b)]);
      setAvailableSlots(prev => prev.filter(s => s._id !== slotId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to book slot');
    }
  };

  const handleCancel = async (slotId: string) => {
    try {
      const updated = await ptmService.cancelBooking(slotId, 'Cancelled by parent');
      toast.success('Booking cancelled');
      setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

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
          Parent-Teacher Meetings
        </h4>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'booked' ? 'active' : ''}`} onClick={() => setActiveTab('booked')}>
            <i className="ti ti-calendar-check me-1"></i> My Bookings ({bookings.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>
            <i className="ti ti-calendar-plus me-1"></i> Available Slots
          </button>
        </li>
      </ul>

      {activeTab === 'booked' && (
        <div className="row">
          {bookings.length === 0 ? (
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="ti ti-calendar-off fs-48 text-muted mb-3 d-block"></i>
                  <h5>No Bookings Yet</h5>
                  <p className="text-muted">Browse available slots and book a PTM with your child's teacher.</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('available')}>
                    <i className="ti ti-calendar-plus me-1"></i> Browse Available Slots
                  </button>
                </div>
              </div>
            </div>
          ) : (
            bookings.filter(b => b.status !== 'cancelled').map(slot => (
              <div className="col-md-6 col-lg-4 mb-3" key={slot._id}>
                <div className={`card border-${slot.status === 'completed' ? 'success' : slot.status === 'booked' ? 'primary' : 'secondary'}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className={`badge bg-${slot.status === 'completed' ? 'success' : slot.status === 'booked' ? 'primary' : 'secondary'}`}>
                        {slot.status}
                      </span>
                      {slot.status === 'booked' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(slot._id)}>
                          <i className="ti ti-x"></i> Cancel
                        </button>
                      )}
                    </div>
                    <h6 className="mb-1">
                      <i className="ti ti-chalkboard-user me-1 text-primary"></i>
                      {slot.teacherId?.firstName} {slot.teacherId?.lastName}
                    </h6>
                    <p className="text-muted small mb-0">
                      <i className="ti ti-calendar me-1"></i> {formatDate(slot.date)}<br />
                      <i className="ti ti-clock me-1"></i> {slot.startTime} - {slot.endTime}
                    </p>
                    {slot.studentId && (
                      <p className="small mb-0 mt-1">
                        <i className="ti ti-user me-1"></i> {slot.studentId.firstName} {slot.studentId.lastName}
                        {slot.studentId.rollNumber && <span className="text-muted ms-1">(Roll: {slot.studentId.rollNumber})</span>}
                      </p>
                    )}
                    {slot.meetingLink && (
                      <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary mt-2">
                        <i className="ti ti-video me-1"></i> Join Meeting
                      </a>
                    )}
                    {slot.location && (
                      <p className="small text-muted mt-1 mb-0"><i className="ti ti-map-pin me-1"></i> {slot.location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'available' && (
        <>
          <div className="card mb-4">
            <div className="card-body d-flex flex-wrap gap-3 align-items-center">
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold text-nowrap"><i className="ti ti-user me-1"></i>Child:</label>
                <select className="form-select form-select-sm" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ minWidth: '200px' }}>
                  <option value="">Select a child</option>
                  {children.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.firstName} {c.lastName} {c.rollNumber ? `(${c.rollNumber})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold text-nowrap"><i className="ti ti-calendar me-1"></i>Date:</label>
                <input type="date" className="form-control form-control-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="row">
            {availableSlots.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="ti ti-calendar-off fs-48 text-muted mb-3 d-block"></i>
                    <h5>No Available Slots</h5>
                    <p className="text-muted">There are no available PTM slots. Check back later or contact your school.</p>
                  </div>
                </div>
              </div>
            ) : (
              availableSlots.map(slot => (
                <div className="col-md-6 col-lg-4 mb-3" key={slot._id}>
                  <div className="card border-info h-100">
                    <div className="card-body d-flex flex-column">
                      <h6 className="mb-1">
                        <i className="ti ti-chalkboard-user me-1 text-info"></i>
                        {slot.teacherId?.firstName} {slot.teacherId?.lastName}
                      </h6>
                      <p className="text-muted small mb-0">
                        <i className="ti ti-calendar me-1"></i> {formatDate(slot.date)}<br />
                        <i className="ti ti-clock me-1"></i> {slot.startTime} - {slot.endTime}
                      </p>
                      <div className="mt-auto pt-3">
                        <button
                          className="btn btn-info w-100"
                          onClick={() => handleBookSlot(slot._id)}
                          disabled={!selectedStudent}
                        >
                          <i className="ti ti-calendar-plus me-1"></i> Book Slot
                        </button>
                        {!selectedStudent && <p className="text-muted small mt-1 mb-0"><i className="ti ti-info-circle me-1"></i>Select a child first</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentPTMPage;
