import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import eventService, { type Event } from '../../services/eventService';
import { ensureArray } from '../../utils/safeDataHandler';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const filters = selectedCategory !== 'all' ? { eventType: selectedCategory } : undefined;
      const data = await eventService.getAll(filters);
      // Ensure data is always an array using safe handler
      setEvents(ensureArray<Event>(data));
    } catch (error: any) {
      console.error('Error fetching events:', error);
      // Set empty array on error
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
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventService.delete(id);
      toast.success('Event deleted successfully');
      setShowEventModal(false);
      fetchEvents();
    } catch (error: any) {
      toast.error('Failed to delete event');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
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
          <div className="mb-2">
            <button 
              className="btn btn-light d-flex align-items-center"
              onClick={() => toast.info('Google Calendar sync coming soon')}
            >
              <i className="ti ti-calendar-up me-2"></i>Sync with Google Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Event Calendar */}
        <div className="col-xl-8 col-xxl-9">
          <div className="card">
            <div className="card-body">
              <div className="calendar-placeholder text-center py-5">
                <i className="ti ti-calendar fs-48 text-muted mb-3 d-block"></i>
                <h5 className="text-muted">Calendar View</h5>
                <p className="text-muted">Calendar integration coming soon</p>
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
                    onClick={() => toast.info('Edit feature coming soon')}
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
    </>
  );
};

export default EventsPage;
