import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import eventService, { type Event } from '../../services/eventService';
import crossAppCommunicationService from '../../services/crossApplicationCommunicationService';
import applicationPersistenceService from '../../services/applicationPersistenceService';

// User interface - adjust based on your auth system
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string;
}

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [removeAfterDrop, setRemoveAfterDrop] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const eventsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [, setUser] = useState<User | null>(null);
  const [, setVisibleUsers] = useState<any[]>([]);

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState('#1A6FA8');
  const [eventType, setEventType] = useState('other');
  const [eventLocation, setEventLocation] = useState('');
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventStatus, setEventStatus] = useState('scheduled');

  const eventTypeColors: Record<string, string> = {
    academic: '#1A6FA8',
    cultural: '#16a34a',
    sports: '#d97706',
    celebration: '#dc2626',
    meeting: '#f59e0b',
    workshop: '#7c3aed',
    other: '#6b7280'
  };

  const colorPresets = ['#1A6FA8', '#16a34a', '#d97706', '#dc2626', '#f59e0b', '#7c3aed', '#6b7280'];

  // Check for upcoming events and show notifications
  const checkUpcomingEvents = () => {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const notifiedEvents = JSON.parse(localStorage.getItem('notifiedEvents') || '[]');
    
    eventsRef.current.forEach(event => {
      const eventStart = new Date(event.start);
      const eventId = event.id || event._id;
      
      // Check if event is starting in the next 15 minutes
      if (eventStart >= now && eventStart <= fifteenMinutesFromNow) {
        // Check if we haven't already notified for this event
        if (!notifiedEvents.includes(eventId)) {
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`📅 Upcoming Event: ${event.title}`, {
              body: `Starting at ${eventStart.toLocaleTimeString()}`,
              icon: '/favicon.ico',
              tag: eventId
            });
          }
          
          // Show toast notification
          toast.info(`📅 ${event.title} starting in ${Math.round((eventStart.getTime() - now.getTime()) / 60000)} minutes`, {
            position: 'top-right',
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
          
          // Mark as notified
          notifiedEvents.push(eventId);
          localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
        }
      }
      
      // Clean up old notifications (events that have passed)
      const updatedNotifiedEvents = notifiedEvents.filter((id: string) => {
        const notifiedEvent = eventsRef.current.find(e => (e.id || e._id) === id);
        if (notifiedEvent) {
          const eventStart = new Date(notifiedEvent.start);
          return eventStart > now;
        }
        return false;
      });
      
      if (updatedNotifiedEvents.length !== notifiedEvents.length) {
        localStorage.setItem('notifiedEvents', JSON.stringify(updatedNotifiedEvents));
      }
    });
  };

  useEffect(() => {
    // Get user from localStorage or auth context
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Load cross-app communication data
      const visibleUsers = crossAppCommunicationService.getVisibleUsers(parsedUser);
      setVisibleUsers(visibleUsers);
      
      // Load calendar events from communication service
      const messages = crossAppCommunicationService.getMessages(parsedUser.id, 'calendar');
      const calendarEvents = messages.map(msg => ({
        id: msg.id,
        title: msg.subject || 'Calendar Event',
        start: msg.timestamp,
        end: new Date(new Date(msg.timestamp).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        backgroundColor: msg.metadata?.color || '#1A6FA8',
        extendedProps: {
          eventType: msg.content?.type || 'meeting',
          participants: msg.content?.participants,
          institutionId: msg.institutionId
        }
      }));
      
      setEvents([...calendarEvents]);
    }
    
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    fetchEvents();
    initializeDraggable();
    
    // Check for upcoming events every minute
    const notificationInterval = setInterval(checkUpcomingEvents, 60000);
    
    // Update application last accessed
    if (userData) {
      const parsedUser = JSON.parse(userData);
      applicationPersistenceService.updateLastAccessed(parsedUser, 'calendar');
    }
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  // Update events ref when events change
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Share event with institution

  // Schedule meeting with users

  const initializeDraggable = () => {
    const containerEl = document.getElementById('calendar-events');
    if (containerEl) {
      new Draggable(containerEl, {
        itemSelector: '.calendar-events',
        eventData: (eventEl: HTMLElement) => ({
          title: eventEl.innerText.trim(),
          backgroundColor: eventEl.getAttribute('data-color') || '#1A6FA8',
          borderColor: eventEl.getAttribute('data-color') || '#1A6FA8',
          extendedProps: {
            eventType: eventEl.getAttribute('data-type') || 'other'
          }
        })
      });
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId');
      
      let eventsData: Event[] = []
      
      try {
        if (schoolId) {
          const response = await eventService.getAll({ schoolId });
          eventsData = ((response as any).data || []) as Event[];
        } else {
          // For global users (superadmin, agents), fetch all events without schoolId filter
          const response = await eventService.getAll({});
          eventsData = ((response as any).data || []) as Event[];
        }
      } catch {
        // Use demo data when API fails
        eventsData = [] as Event[]
      }

      // Transform backend events to FullCalendar format
      const calendarEvents = eventsData.map(event => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: event.color || eventTypeColors[event.eventType] || '#1A6FA8',
        borderColor: event.color || eventTypeColors[event.eventType] || '#1A6FA8',
        allDay: false,
        extendedProps: {
          description: event.description,
          eventType: event.eventType,
          location: event.location,
          status: event.status,
          color: event.color,
          _id: event._id
        }
      }));

      setEvents(calendarEvents);
    } catch (error: any) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventStartDate('');
    setEventEndDate('');
    setEventDescription('');
    setEventColor('#1A6FA8');
    setEventType('other');
    setEventLocation('');
    setEventAllDay(false);
    setEventStatus('scheduled');
  };

  const openEventModal = () => {
    setSelectedEvent(null);
    resetEventForm();
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    resetEventForm();
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!eventStartDate || !eventEndDate) {
      toast.error('Start and end dates are required');
      return;
    }

    try {
      setSaving(true);
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId');
      
      const eventData = {
        ...(schoolId && { schoolId }),
        title: eventTitle,
        description: eventDescription,
        eventType: eventType as any,
        startDate: eventStartDate,
        endDate: eventEndDate,
        location: eventLocation,
        status: eventStatus as any,
        color: eventColor,
        isPublic: true,
        targetAudience: ['all' as any]
      };

      await eventService.create(eventData);
      toast.success('Event created successfully');
      
      // Show browser notification for new event
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📅 New Event Created', {
          body: `${eventTitle} on ${new Date(eventStartDate).toLocaleDateString()}`,
          icon: '/favicon.ico'
        });
      }
      
      closeEventModal();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEventTitle(event.title || '');
    setEventStartDate(event.startStr || event.start?.toISOString().slice(0, 16) || '');
    setEventEndDate(event.endStr || event.end?.toISOString().slice(0, 16) || '');
    setEventDescription(event.extendedProps?.description || '');
    setEventColor(event.backgroundColor || '#1A6FA8');
    setEventType(event.extendedProps?.eventType || 'other');
    setEventLocation(event.extendedProps?.location || '');
    setEventAllDay(event.allDay || false);
    setEventStatus(event.extendedProps?.status || 'scheduled');
    setShowEventModal(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !eventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!eventStartDate || !eventEndDate) {
      toast.error('Start and end dates are required');
      return;
    }

    try {
      setSaving(true);
      const eventId = selectedEvent.extendedProps?._id || selectedEvent.id;

      const eventData = {
        title: eventTitle,
        description: eventDescription,
        eventType: eventType as any,
        startDate: eventStartDate,
        endDate: eventEndDate,
        location: eventLocation,
        status: eventStatus as any,
        color: eventColor
      };

      await eventService.update(eventId, eventData);
      toast.success('Event updated successfully');
      closeEventModal();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setSaving(true);
      const id = selectedEvent?.extendedProps?._id || selectedEvent?.id || eventId;
      await eventService.delete(id);
      toast.success('Event deleted successfully');
      closeEventModal();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Calendar</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/applications">Application</Link>
              </li>
              <li className="breadcrumb-item active">Calendar</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchEvents} disabled={loading}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={openEventModal}>
            <i className="ti ti-calendar-plus me-2"></i>Create Event
          </button>
        </div>
      </div>

      <div className="row">
        {/* Drag & Drop Sidebar */}
        <div className="col-lg-3 col-md-4 mb-3">
          <h4 className="mb-3">Event Types</h4>

          <div id="calendar-events" className="mb-3">
            {[
              { label: 'Academic Event', type: 'academic', color: eventTypeColors.academic },
              { label: 'Cultural Event', type: 'cultural', color: eventTypeColors.cultural },
              { label: 'Sports Event', type: 'sports', color: eventTypeColors.sports },
              { label: 'Celebration', type: 'celebration', color: eventTypeColors.celebration },
              { label: 'Meeting', type: 'meeting', color: eventTypeColors.meeting },
              { label: 'Workshop', type: 'workshop', color: eventTypeColors.workshop }
            ].map(ev => (
              <div
                key={ev.type}
                className="calendar-events rounded p-2 mb-2 text-white"
                data-type={ev.type}
                data-color={ev.color}
                style={{ cursor: 'grab', backgroundColor: ev.color }}
              >
                {ev.label}
              </div>
            ))}

            <button className="btn btn-primary w-100 mt-1" onClick={openEventModal}>
              <i className="ti ti-plus me-2"></i>Add New Event
            </button>
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="removeDrop"
              checked={removeAfterDrop}
              onChange={e => setRemoveAfterDrop(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="removeDrop">
              Remove after drop
            </label>
          </div>

          {/* Legend */}
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Event Types</h6>
              {Object.entries(eventTypeColors).map(([type, color]) => (
                <div key={type} className="d-flex align-items-center mb-2">
                  <span
                    className="d-inline-block rounded"
                    style={{ width: 16, height: 16, backgroundColor: color }}
                  ></span>
                  <span className="ms-2 text-capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="col-lg-9 col-md-8">
          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  editable
                  droppable
                  selectable
                  events={events}
                  eventClick={info => handleEditEvent(info.event)}
                  select={info => {
                    setEventStartDate(info.startStr);
                    setEventEndDate(info.endStr);
                    openEventModal();
                  }}
                  drop={info => {
                    const type = info.draggedEl.getAttribute('data-type') || 'other';
                    setEventType(type);
                    setEventTitle(info.draggedEl.innerText.trim());
                    setEventStartDate(info.date.toISOString().slice(0, 16));
                    setEventEndDate(new Date(info.date.getTime() + 3600000).toISOString().slice(0, 16));
                    setEventColor(info.draggedEl.getAttribute('data-color') || '#1A6FA8');
                    openEventModal();

                    if (removeAfterDrop) {
                      info.draggedEl.parentNode?.removeChild(info.draggedEl);
                    }
                  }}
                  height="auto"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={e => {
            if (e.target === e.currentTarget) closeEventModal();
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className={`ti ti-calendar-${selectedEvent ? 'edit' : 'plus'} me-2`}></i>
                  {selectedEvent ? 'Edit Event' : 'Create Event'}
                </h5>
                <button type="button" className="btn-close" onClick={closeEventModal}></button>
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  {/* Title */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Event Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter event title"
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Start Date */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type={eventAllDay ? 'date' : 'datetime-local'}
                      className="form-control"
                      value={eventStartDate}
                      onChange={e => setEventStartDate(e.target.value)}
                    />
                  </div>

                  {/* End Date */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      End Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type={eventAllDay ? 'date' : 'datetime-local'}
                      className="form-control"
                      value={eventEndDate}
                      onChange={e => setEventEndDate(e.target.value)}
                    />
                  </div>

                  {/* All Day */}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="eventAllDay"
                        checked={eventAllDay}
                        onChange={e => setEventAllDay(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="eventAllDay">
                        All Day Event
                      </label>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter event location"
                      value={eventLocation}
                      onChange={e => setEventLocation(e.target.value)}
                    />
                  </div>

                  {/* Event Type */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Event Type</label>
                    <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value)}>
                      <option value="academic">Academic</option>
                      <option value="cultural">Cultural</option>
                      <option value="sports">Sports</option>
                      <option value="celebration">Celebration</option>
                      <option value="meeting">Meeting</option>
                      <option value="workshop">Workshop</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" value={eventStatus} onChange={e => setEventStatus(e.target.value)}>
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Event Color</label>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        style={{ width: 40, height: 38, padding: 2 }}
                        value={eventColor}
                        onChange={e => setEventColor(e.target.value)}
                        title="Custom color"
                      />
                      <div className="d-flex gap-1 flex-wrap">
                        {colorPresets.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEventColor(color)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: color,
                              border: 'none',
                              cursor: 'pointer',
                              outline: eventColor === color ? `3px solid ${color}` : 'none',
                              outlineOffset: 2,
                              boxShadow: eventColor === color ? '0 0 0 2px #fff inset' : 'none',
                              transition: 'outline .15s'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    <div
                      className="mt-2 rounded px-3 py-1 d-inline-block text-white small fw-semibold"
                      style={{ background: eventColor }}
                    >
                      {eventTitle || 'Event Preview'}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter event description"
                      value={eventDescription}
                      onChange={e => setEventDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={closeEventModal} disabled={saving}>
                  <i className="ti ti-x me-1"></i>Cancel
                </button>
                {selectedEvent && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    disabled={saving}
                  >
                    <i className="ti ti-trash me-1"></i>Delete
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!eventTitle.trim() || saving}
                  onClick={selectedEvent ? handleUpdateEvent : handleCreateEvent}
                >
                  <i className={`ti ti-${selectedEvent ? 'device-floppy' : 'check'} me-1`}></i>
                  {saving ? 'Saving...' : selectedEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;
