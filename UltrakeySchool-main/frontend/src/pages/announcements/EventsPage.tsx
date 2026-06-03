import React, { useState, useEffect, useMemo } from 'react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import eventService, { type Event } from '../../services/eventService';
import { ensureArray } from '../../utils/safeDataHandler';
import { getInstitutionId } from '../../utils/auth';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'academic' as Event['eventType'],
    startDate: '',
    endDate: '',
    location: '',
    status: 'scheduled' as Event['status'],
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendarMonth = calendarDate.getMonth();
  const calendarYear = calendarDate.getFullYear();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const filteredByCategory = useMemo(() => {
    return selectedCategory === 'all'
      ? events
      : events.filter(e => e.eventType === selectedCategory);
  }, [events, selectedCategory]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    filteredByCategory.forEach(event => {
      const d = event.startDate?.split('T')[0] || '';
      if (!map[d]) map[d] = [];
      map[d].push(event);
    });
    return map;
  }, [filteredByCategory]);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const institutionId = localStorage.getItem('institutionId') || getInstitutionId();
      const filters: any = {};
      if (institutionId) filters.institutionId = institutionId;
      if (selectedCategory !== 'all') filters.eventType = selectedCategory;
      const data = await eventService.getAll(filters);
      setEvents(ensureArray<Event>(data));
    } catch (error: any) {
      setEvents([]);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDelete = async (id: string) => {
    setShowDeleteModal(true);
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await eventService.delete(deleteTarget);
      toast.success('Event deleted successfully');
      setShowEventModal(false);
      fetchEvents();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error('Failed to delete event');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditMode(false);
    setFormData({
      title: '',
      description: '',
      eventType: 'academic',
      startDate: '',
      endDate: '',
      location: '',
      status: 'scheduled',
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (event: Event) => {
    setEditMode(true);
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      eventType: event.eventType,
      startDate: event.startDate?.split('T')[0] || '',
      endDate: event.endDate?.split('T')[0] || '',
      location: event.location || '',
      status: event.status,
    });
    setShowAddEditModal(true);
    setShowEventModal(false);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : '',
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : '',
        institutionId: getInstitutionId(),
        isActive: true,
      };

      if (editMode && selectedEvent) {
        await eventService.update(selectedEvent._id, payload);
        toast.success('Event updated successfully');
      } else {
        await eventService.create(payload);
        toast.success('Event created successfully');
      }
      setShowAddEditModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast.error(editMode ? 'Failed to update event' : 'Failed to create event');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatTime = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.toDateString() === end.toDateString()) {
      return `${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'All Day';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return 'ti ti-users-group';
      case 'celebration': return 'ti ti-confetti';
      case 'academic': return 'ti ti-book';
      case 'sports': return 'ti ti-ball-football';
      case 'cultural': return 'ti ti-palette';
      case 'workshop': return 'ti ti-tools';
      default: return 'ti ti-calendar-event';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'border-info';
      case 'celebration': return 'border-warning';
      case 'academic': return 'border-primary';
      case 'sports': return 'border-success';
      case 'cultural': return 'border-danger';
      case 'workshop': return 'border-secondary';
      default: return 'border-info';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="mb-1">Events</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Announcement</li>
              <li className="breadcrumb-item active" aria-current="page">Events</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-primary d-flex align-items-center me-1"
              onClick={openAddModal}
              title="Create Event"
            >
              <i className="ti ti-plus me-2"></i>Create Event
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchEvents}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Event Calendar */}
        <div className="col-xl-8 col-xxl-9">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0"><i className="ti ti-calendar me-2"></i>Calendar</h5>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-outline-light" onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}>
                  <i className="ti ti-chevron-left"></i>
                </button>
                <span className="fw-medium mx-2">{new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button className="btn btn-sm btn-outline-light" onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}>
                  <i className="ti ti-chevron-right"></i>
                </button>
                <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => setCalendarDate(new Date())}>
                  Today
                </button>
              </div>
            </div>
            <div className="card-body p-2">
              <div className="row g-1 text-center fw-medium small mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="col text-muted py-1">{d}</div>
                ))}
              </div>
              <div className="row g-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="col" style={{ minHeight: 80 }}></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = new Date().toDateString() === new Date(calendarYear, calendarMonth, day).toDateString();
                  return (
                    <div key={day} className={`col border ${isToday ? 'bg-primary bg-opacity-10 border-primary' : ''}`} style={{ minHeight: 80, cursor: 'pointer' }} onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}>
                      <span className={`d-inline-block p-1 small fw-medium ${isToday ? 'bg-primary text-white rounded-circle' : ''}`} style={{ width: 24, height: 24, textAlign: 'center', lineHeight: '24px' }}>{day}</span>
                      <div className="mt-1" style={{ maxHeight: 48, overflow: 'hidden' }}>
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev._id} className={`small text-truncate px-1 rounded ${ev.eventType === 'academic' ? 'bg-primary bg-opacity-10 text-primary' : ev.eventType === 'celebration' ? 'bg-warning bg-opacity-10 text-warning' : ev.eventType === 'meeting' ? 'bg-info bg-opacity-10 text-info' : ev.eventType === 'sports' ? 'bg-success bg-opacity-10 text-success' : ev.eventType === 'cultural' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div className="small text-muted text-center">+{dayEvents.length - 2} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Event List */}
        <div className="col-xl-4 col-xxl-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-3">Events</h5>
            <div className="dropdown mb-3">
              <button
                className="btn btn-outline-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                {selectedCategory === 'all' ? 'All Category' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-primary me-2"></i>All Events
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'celebration' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('celebration')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-warning me-2"></i>Celebration
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'academic' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('academic')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-primary me-2"></i>Academic
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'meeting' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('meeting')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-info me-2"></i>Meeting
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'sports' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('sports')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-success me-2"></i>Sports
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'cultural' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('cultural')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-danger me-2"></i>Cultural
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 d-flex align-items-center ${selectedCategory === 'workshop' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('workshop')}
                  >
                    <i className="ti ti-circle-filled fs-8 text-secondary me-2"></i>Workshop
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {events.length > 0 ? (
            events.map(event => {
              const borderColor = getBorderColor(event.eventType);
              const icon = getEventIcon(event.eventType);
              
              return (
                <div 
                  key={event._id} 
                  className={`border-start ${borderColor} border-3 shadow-sm p-3 mb-3 bg-white`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <span className={`avatar p-1 me-2 bg-${borderColor.replace('border-', '')}-transparent flex-shrink-0`}>
                      <i className={`${icon} fs-20`}></i>
                    </span>
                    <div className="flex-fill">
                      <h6 className="mb-1">{event.title}</h6>
                      <p className="fs-12 mb-0">
                        <i className="ti ti-calendar me-1"></i>
                        {formatDate(event.startDate)}
                        {event.endDate && new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString() && 
                          ` - ${formatDate(event.endDate)}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="fs-12 mb-0">
                      <i className="ti ti-clock me-1"></i>
                      {formatTime(event.startDate, event.endDate)}
                    </p>
                    {event.location && (
                      <p className="fs-12 mb-0 text-muted">
                        <i className="ti ti-map-pin me-1"></i>
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5">
              <i className="ti ti-calendar-off fs-48 text-muted mb-3 d-block"></i>
              <h6 className="text-muted">No events found</h6>
              <p className="text-muted mb-0">
                {selectedCategory === 'all' 
                  ? 'No events available'
                  : `No ${selectedCategory} events found`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
          onClick={() => setShowEventModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border shadow-lg">
              <div className="modal-header justify-content-between">
                <span className="d-inline-flex align-items-center">
                  <i className={`ti ti-circle-filled fs-8 me-1 text-${getBorderColor(selectedEvent.eventType).replace('border-', '')}`}></i>
                  {selectedEvent.eventType.charAt(0).toUpperCase() + selectedEvent.eventType.slice(1)}
                </span>
                <div className="d-flex align-items-center">
                  <button 
                    className="btn btn-link text-primary me-1"
                    onClick={() => openEditModal(selectedEvent)}
                  >
                    <i className="ti ti-edit-circle fs-5"></i>
                  </button>
                  <button 
                    className="btn btn-link text-danger me-1"
                    onClick={() => handleDelete(selectedEvent._id)}
                  >
                    <i className="ti ti-trash-x fs-5"></i>
                  </button>
                  <button 
                    className="btn btn-link"
                    onClick={() => setShowEventModal(false)}
                  >
                    <i className="ti ti-x fs-5"></i>
                  </button>
                </div>
              </div>
              <div className="modal-body pb-0">
                <div className="d-flex align-items-center mb-3">
                  <span className={`avatar avatar-xl bg-${getBorderColor(selectedEvent.eventType).replace('border-', '')}-transparent me-3 flex-shrink-0`}>
                    <i className={`${getEventIcon(selectedEvent.eventType)} fs-30`}></i>
                  </span>
                  <div>
                    <h3 className="mb-1">{selectedEvent.title}</h3>
                    <div className="d-flex align-items-center flex-wrap">
                      <p className="me-3 mb-0">
                        <i className="ti ti-calendar me-1"></i>
                        {formatDate(selectedEvent.startDate)}
                        {selectedEvent.endDate && new Date(selectedEvent.startDate).toDateString() !== new Date(selectedEvent.endDate).toDateString() && 
                          ` - ${formatDate(selectedEvent.endDate)}`
                        }
                      </p>
                      <p className="mb-0">
                        <i className="ti ti-clock me-1"></i>
                        {formatTime(selectedEvent.startDate, selectedEvent.endDate)}
                      </p>
                    </div>
                    {selectedEvent.location && (
                      <p className="mb-0 text-muted">
                        <i className="ti ti-map-pin me-1"></i>
                        {selectedEvent.location}
                      </p>
                    )}
                  </div>
                </div>
                {selectedEvent.description && (
                  <div className="bg-light p-3 rounded mb-3">
                    <p className="mb-0">{selectedEvent.description}</p>
                  </div>
                )}
                <div className="mb-3">
                  <span className={`badge bg-${selectedEvent.status === 'scheduled' ? 'primary' : selectedEvent.status === 'ongoing' ? 'success' : selectedEvent.status === 'completed' ? 'secondary' : 'danger'}`}>
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} role="dialog" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editMode ? 'Edit Event' : 'Create Event'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowAddEditModal(false); setSelectedEvent(null); }}></button>
              </div>
              <form onSubmit={handleSaveEvent}>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-8">
                      <label className="form-label">Title *</label>
                      <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Type *</label>
                      <select className="form-select" name="eventType" value={formData.eventType} onChange={handleInputChange} required>
                        <option value="academic">Academic</option>
                        <option value="cultural">Cultural</option>
                        <option value="sports">Sports</option>
                        <option value="celebration">Celebration</option>
                        <option value="meeting">Meeting</option>
                        <option value="workshop">Workshop</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Date *</label>
                      <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Date *</label>
                      <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-8">
                      <label className="form-label">Location</label>
                      <input type="text" className="form-control" name="location" value={formData.location} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" rows={3} value={formData.description} onChange={handleInputChange}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAddEditModal(false); setSelectedEvent(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Are you sure you want to delete this event?" />
    </>
  );
};

export default EventsPage;
