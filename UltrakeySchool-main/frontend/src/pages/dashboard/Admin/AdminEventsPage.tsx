import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface EventData {
  overview: {
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    thisMonthEvents: number;
  };
  events: {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    venue: string;
    organizer: string;
    targetAudience: string[];
    maxParticipants: number;
    registeredParticipants: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    priority: 'high' | 'medium' | 'low';
    cost: number;
    attachments: number;
  }[];
  eventTypes: {
    type: string;
    count: number;
    color: string;
  }[];
  monthlyTrend: {
    month: string;
    events: number;
    participants: number;
  }[];
  venueUtilization: {
    venue: string;
    events: number;
    utilizationRate: number;
  }[];
}

const AdminEventsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchEventData();
  }, [selectedType, searchTerm]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setEventData({
        overview: {
          totalEvents: 0,
          upcomingEvents: 0,
          ongoingEvents: 0,
          completedEvents: 0,
          thisMonthEvents: 0
        },
        events: [],
        eventTypes: [
          { type: 'Academic', count: 0, color: '#3b82f6' },
          { type: 'Sports', count: 0, color: '#10b981' },
          { type: 'Cultural', count: 0, color: '#f59e0b' },
          { type: 'Workshop', count: 0, color: '#ef4444' },
          { type: 'Holiday', count: 0, color: '#8b5cf6' }
        ],
        monthlyTrend: [
          { month: 'Jan', events: 0, participants: 0 },
          { month: 'Feb', events: 0, participants: 0 },
          { month: 'Mar', events: 0, participants: 0 },
          { month: 'Apr', events: 0, participants: 0 },
          { month: 'May', events: 0, participants: 0 },
          { month: 'Jun', events: 0, participants: 0 }
        ],
        venueUtilization: [
          { venue: 'School Auditorium', events: 0, utilizationRate: 0 },
          { venue: 'Sports Ground', events: 0, utilizationRate: 0 },
          { venue: 'Conference Room', events: 0, utilizationRate: 0 },
          { venue: 'Playground', events: 0, utilizationRate: 0 },
          { venue: 'Library Hall', events: 0, utilizationRate: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    // Handle event creation logic
    console.log('Creating new event...');
  };

  const filteredEvents = eventData?.events.filter(event => {
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const statusData = eventData ? [
    { name: 'Upcoming', value: eventData.overview.upcomingEvents, color: '#3b82f6' },
    { name: 'Ongoing', value: eventData.overview.ongoingEvents, color: '#f59e0b' },
    { name: 'Completed', value: eventData.overview.completedEvents, color: '#10b981' }
  ] : [];

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
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Events</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Announcements</li>
              <li className="breadcrumb-item active">Events</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchEventData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleCreateEvent}>
            <i className="ti ti-calendar-plus me-2"></i>Create Event
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{eventData?.overview.totalEvents}</h4>
                  <p className="mb-0">Total Events</p>
                  <small>All time</small>
                </div>
                <i className="ti ti-calendar-event fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{eventData?.overview.upcomingEvents}</h4>
                  <p className="mb-0">Upcoming</p>
                  <small>Scheduled events</small>
                </div>
                <i className="ti ti-calendar-time fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{eventData?.overview.ongoingEvents}</h4>
                  <p className="mb-0">Ongoing</p>
                  <small>In progress</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{eventData?.overview.thisMonthEvents}</h4>
                  <p className="mb-0">This Month</p>
                  <small>New events</small>
                </div>
                <i className="ti ti-calendar-stats fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Event Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'events' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('events')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Events
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'create' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('create')}
                >
                  <i className="ti ti-plus me-2"></i>
                  Create Event
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'calendar' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('calendar')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Calendar View
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'venues' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('venues')}
                >
                  <i className="ti ti-building me-2"></i>
                  Venues
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Event Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Event Types</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={eventData?.eventTypes || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Monthly Event Trend</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={eventData?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Events */}
          {selectedSection === 'events' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Events</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search events..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select 
                    className="form-select form-select-sm"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Event Title</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Venue</th>
                        <th>Participants</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted">
                            No events found. Click "Create Event" to schedule your first event.
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((event) => (
                          <tr key={event.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`avatar avatar-sm bg-${
                                  event.type === 'Academic' ? 'primary' :
                                  event.type === 'Sports' ? 'success' :
                                  event.type === 'Cultural' ? 'warning' : 'info'
                                } text-white rounded-circle me-2`}>
                                  <i className="ti ti-calendar-event"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{event.title}</h6>
                                  <small className="text-muted">{event.description.substring(0, 50)}...</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                event.type === 'Academic' ? 'primary' :
                                event.type === 'Sports' ? 'success' :
                                event.type === 'Cultural' ? 'warning' : 'info'
                              }`}>
                                {event.type}
                              </span>
                            </td>
                            <td>{event.startDate}</td>
                            <td>{event.startTime} - {event.endTime}</td>
                            <td>{event.venue}</td>
                            <td>
                              {event.registeredParticipants}/{event.maxParticipants}
                            </td>
                            <td>
                              <span className={`badge ${
                                event.status === 'upcoming' ? 'bg-info' :
                                event.status === 'ongoing' ? 'bg-warning' :
                                event.status === 'completed' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                <button className="btn btn-outline-danger" title="Cancel">
                                  <i className="ti ti-x"></i>
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
            </div>
          )}

          {/* Create Event */}
          {selectedSection === 'create' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Create New Event</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Event Title</label>
                        <input type="text" className="form-control" placeholder="Enter event title" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Event Type</label>
                        <select className="form-select" required>
                          <option value="">Select Type</option>
                          <option value="Academic">Academic</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Holiday">Holiday</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <input type="time" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <input type="time" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Venue</label>
                        <select className="form-select" required>
                          <option value="">Select Venue</option>
                          <option value="auditorium">School Auditorium</option>
                          <option value="sports-ground">Sports Ground</option>
                          <option value="conference">Conference Room</option>
                          <option value="playground">Playground</option>
                          <option value="library">Library Hall</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Max Participants</label>
                        <input type="number" className="form-control" placeholder="Enter maximum participants" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Event Description</label>
                    <textarea className="form-control" rows={4} placeholder="Enter event description" required></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Target Audience</label>
                        <select className="form-select" multiple>
                          <option value="students">Students</option>
                          <option value="teachers">Teachers</option>
                          <option value="parents">Parents</option>
                          <option value="staff">Staff</option>
                          <option value="all">All</option>
                        </select>
                        <small className="text-muted">Hold Ctrl/Cmd to select multiple</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select className="form-select">
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Attachments</label>
                    <input type="file" className="form-control" multiple />
                    <small className="text-muted">Upload event documents, images, etc.</small>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-outline-primary">
                      <i className="ti ti-eye me-1"></i>Preview
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-calendar-plus me-1"></i>Create Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {selectedSection === 'calendar' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Event Calendar</h5>
              </div>
              <div className="card-body">
                <div className="text-center py-5">
                  <i className="ti ti-calendar fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">Calendar View</h5>
                  <p className="text-muted">Event calendar will be displayed here</p>
                  <p className="text-muted small">Integrate with a calendar component for visual event scheduling</p>
                </div>
              </div>
            </div>
          )}

          {/* Venues */}
          {selectedSection === 'venues' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Venue Utilization</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventData?.venueUtilization || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="venue" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="events" fill="#3b82f6" />
                    <Bar dataKey="utilizationRate" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEventsPage;
