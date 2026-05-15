import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SportsData {
  overview: {
    totalSports: number;
    activeTeams: number;
    totalPlayers: number;
    coaches: number;
    upcomingEvents: number;
    completedEvents: number;
  };
  sports: {
    id: string;
    name: string;
    category: string;
    totalPlayers: number;
    activePlayers: number;
    teams: number;
    coach: string;
    practiceSchedule: string;
    achievements: string[];
    equipment: string[];
    status: 'active' | 'inactive' | 'seasonal';
  }[];
  events: {
    id: string;
    name: string;
    sport: string;
    type: 'tournament' | 'match' | 'practice' | 'competition';
    date: string;
    venue: string;
    participants: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    result?: string;
  }[];
  performance: {
    sport: string;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  }[];
  facilities: {
    name: string;
    type: string;
    capacity: number;
    status: 'available' | 'maintenance' | 'occupied';
    schedule: string;
  }[];
}

const AdminSportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sportsData, setSportsData] = useState<SportsData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  useEffect(() => {
    fetchSportsData();
  }, [selectedSport]);

  const fetchSportsData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setSportsData({
        overview: {
          totalSports: 0,
          activeTeams: 0,
          totalPlayers: 0,
          coaches: 0,
          upcomingEvents: 0,
          completedEvents: 0
        },
        sports: [
          { 
            id: '1', 
            name: 'Basketball', 
            category: 'Team', 
            totalPlayers: 0, 
            activePlayers: 0, 
            teams: 0, 
            coach: '', 
            practiceSchedule: '', 
            achievements: [], 
            equipment: [], 
            status: 'active' 
          },
          { 
            id: '2', 
            name: 'Football', 
            category: 'Team', 
            totalPlayers: 0, 
            activePlayers: 0, 
            teams: 0, 
            coach: '', 
            practiceSchedule: '', 
            achievements: [], 
            equipment: [], 
            status: 'active' 
          },
          { 
            id: '3', 
            name: 'Cricket', 
            category: 'Team', 
            totalPlayers: 0, 
            activePlayers: 0, 
            teams: 0, 
            coach: '', 
            practiceSchedule: '', 
            achievements: [], 
            equipment: [], 
            status: 'active' 
          },
          { 
            id: '4', 
            name: 'Athletics', 
            category: 'Individual', 
            totalPlayers: 0, 
            activePlayers: 0, 
            teams: 0, 
            coach: '', 
            practiceSchedule: '', 
            achievements: [], 
            equipment: [], 
            status: 'active' 
          },
          { 
            id: '5', 
            name: 'Swimming', 
            category: 'Individual', 
            totalPlayers: 0, 
            activePlayers: 0, 
            teams: 0, 
            coach: '', 
            practiceSchedule: '', 
            achievements: [], 
            equipment: [], 
            status: 'active' 
          }
        ],
        events: [],
        performance: [
          { sport: 'Basketball', wins: 0, losses: 0, draws: 0, winRate: 0 },
          { sport: 'Football', wins: 0, losses: 0, draws: 0, winRate: 0 },
          { sport: 'Cricket', wins: 0, losses: 0, draws: 0, winRate: 0 },
          { sport: 'Athletics', wins: 0, losses: 0, draws: 0, winRate: 0 },
          { sport: 'Swimming', wins: 0, losses: 0, draws: 0, winRate: 0 }
        ],
        facilities: [
          { name: 'Basketball Court', type: 'Court', capacity: 50, status: 'available', schedule: '' },
          { name: 'Football Field', type: 'Field', capacity: 100, status: 'available', schedule: '' },
          { name: 'Cricket Ground', type: 'Ground', capacity: 120, status: 'available', schedule: '' },
          { name: 'Swimming Pool', type: 'Pool', capacity: 30, status: 'available', schedule: '' },
          { name: 'Athletics Track', type: 'Track', capacity: 80, status: 'available', schedule: '' }
        ]
      });
    } catch (error) {
      console.error('Error fetching sports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSport = () => {
    // Handle sport addition logic
    console.log('Adding new sport...');
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
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Sports</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Management</li>
              <li className="breadcrumb-item active">Sports</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchSportsData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleAddSport}>
            <i className="ti ti-plus me-2"></i>Add Sport
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
                  <h4 className="mb-1">{sportsData?.overview.totalSports}</h4>
                  <p className="mb-0">Total Sports</p>
                  <small>Active sports</small>
                </div>
                <i className="ti ti-ball-basketball fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{sportsData?.overview.activeTeams}</h4>
                  <p className="mb-0">Active Teams</p>
                  <small>Competing teams</small>
                </div>
                <i className="ti ti-users-group fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{sportsData?.overview.totalPlayers}</h4>
                  <p className="mb-0">Total Players</p>
                  <strong>{sportsData?.overview.coaches}</strong> Coaches
                </div>
                <i className="ti ti-trophy fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{sportsData?.overview.upcomingEvents}</h4>
                  <p className="mb-0">Upcoming Events</p>
                  <small>Scheduled events</small>
                </div>
                <i className="ti ti-calendar-event fs-24"></i>
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
              <h5 className="card-title">Sports Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'sports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('sports')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Sports
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'events' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('events')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Events
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'facilities' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('facilities')}
                >
                  <i className="ti ti-building me-2"></i>
                  Facilities
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'performance' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('performance')}
                >
                  <i className="ti ti-chart-line me-2"></i>
                  Performance
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'add' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('add')}
                >
                  <i className="ti ti-plus me-2"></i>
                  Add Sport
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
                    <h5 className="card-title mb-0">Sports Categories</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Team Sports', value: sportsData?.sports.filter(s => s.category === 'Team').length || 0, color: '#3b82f6' },
                            { name: 'Individual', value: sportsData?.sports.filter(s => s.category === 'Individual').length || 0, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            <Cell key="team" fill="#3b82f6" />,
                            <Cell key="individual" fill="#10b981" />
                          ]}
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
                    <h5 className="card-title mb-0">Player Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sportsData?.sports || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalPlayers" fill="#3b82f6" />
                        <Bar dataKey="activePlayers" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Performance Overview</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sportsData?.performance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sport" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="wins" fill="#10b981" />
                        <Bar dataKey="losses" fill="#ef4444" />
                        <Bar dataKey="draws" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Sports */}
          {selectedSection === 'sports' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Sports</h5>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    <option value="all">All Sports</option>
                    <option value="team">Team Sports</option>
                    <option value="individual">Individual Sports</option>
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
                        <th>Sport</th>
                        <th>Category</th>
                        <th>Total Players</th>
                        <th>Active Players</th>
                        <th>Teams</th>
                        <th>Coach</th>
                        <th>Practice Schedule</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sportsData?.sports.map((sport) => (
                        <tr key={sport.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`avatar avatar-sm bg-${
                                sport.category === 'Team' ? 'primary' : 'success'
                              } text-white rounded-circle me-2`}>
                                <i className="ti ti-ball-basketball"></i>
                              </div>
                              <div>
                                <h6 className="mb-0">{sport.name}</h6>
                                <small className="text-muted">{sport.achievements.length} achievements</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge bg-${
                              sport.category === 'Team' ? 'primary' : 'success'
                            }`}>
                              {sport.category}
                            </span>
                          </td>
                          <td>{sport.totalPlayers}</td>
                          <td>
                            <span className="badge bg-info">{sport.activePlayers}</span>
                          </td>
                          <td>{sport.teams}</td>
                          <td>{sport.coach || 'Not Assigned'}</td>
                          <td>{sport.practiceSchedule || 'Not Set'}</td>
                          <td>
                            <span className={`badge ${
                              sport.status === 'active' ? 'bg-success' :
                              sport.status === 'inactive' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {sport.status.charAt(0).toUpperCase() + sport.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="View Details">
                                <i className="ti ti-eye"></i>
                              </button>
                              <button className="btn btn-outline-warning" title="Edit">
                                <i className="ti ti-edit"></i>
                              </button>
                              <button className="btn btn-outline-info" title="Manage Team">
                                <i className="ti ti-users"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Events */}
          {selectedSection === 'events' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Sports Events</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Event
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Sport</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Venue</th>
                        <th>Participants</th>
                        <th>Status</th>
                        <th>Result</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sportsData?.events.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center text-muted">
                            No events scheduled. Click "Add Event" to create your first sports event.
                          </td>
                        </tr>
                      ) : (
                        sportsData?.events.map((event) => (
                          <tr key={event.id}>
                            <td>{event.name}</td>
                            <td>
                              <span className="badge bg-primary">{event.sport}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                event.type === 'tournament' ? 'danger' :
                                event.type === 'match' ? 'warning' :
                                event.type === 'practice' ? 'info' : 'success'
                              }`}>
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </span>
                            </td>
                            <td>{event.date}</td>
                            <td>{event.venue}</td>
                            <td>{event.participants}</td>
                            <td>
                              <span className={`badge ${
                                event.status === 'upcoming' ? 'bg-info' :
                                event.status === 'ongoing' ? 'bg-warning' :
                                event.status === 'completed' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </span>
                            </td>
                            <td>{event.result || '-'}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
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

          {/* Facilities */}
          {selectedSection === 'facilities' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Sports Facilities</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Facility
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Facility Name</th>
                        <th>Type</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Schedule</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sportsData?.facilities.map((facility, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`avatar avatar-sm bg-${
                                facility.type === 'Court' ? 'primary' :
                                facility.type === 'Field' ? 'success' :
                                facility.type === 'Ground' ? 'warning' :
                                facility.type === 'Pool' ? 'info' : 'secondary'
                              } text-white rounded-circle me-2`}>
                                <i className="ti ti-building"></i>
                              </div>
                              {facility.name}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{facility.type}</span>
                          </td>
                          <td>{facility.capacity}</td>
                          <td>
                            <span className={`badge ${
                              facility.status === 'available' ? 'bg-success' :
                              facility.status === 'maintenance' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                            </span>
                          </td>
                          <td>{facility.schedule || 'Not Set'}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="View Details">
                                <i className="ti ti-eye"></i>
                              </button>
                              <button className="btn btn-outline-warning" title="Edit">
                                <i className="ti ti-edit"></i>
                              </button>
                              <button className="btn btn-outline-info" title="View Schedule">
                                <i className="ti ti-calendar"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Performance */}
          {selectedSection === 'performance' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Sports Performance Analysis</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Win Rate Comparison</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sportsData?.performance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sport" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="winRate" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-md-6">
                    <h6>Win/Loss/Draw Analysis</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sportsData?.performance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sport" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="wins" fill="#10b981" />
                        <Bar dataKey="losses" fill="#ef4444" />
                        <Bar dataKey="draws" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-primary">Total Wins</h6>
                        <h4>{sportsData?.performance.reduce((sum, p) => sum + p.wins, 0)}</h4>
                        <small className="text-muted">Across all sports</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-success">Best Win Rate</h6>
                        <h4>{Math.max(...(sportsData?.performance.map(p => p.winRate) || [0]))}%</h4>
                        <small className="text-muted">Highest performing sport</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-info">Total Events</h6>
                        <h4>{sportsData?.overview.completedEvents}</h4>
                        <small className="text-muted">Completed events</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Sport */}
          {selectedSection === 'add' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Add New Sport</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Sport Name</label>
                        <input type="text" className="form-control" placeholder="Enter sport name" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" required>
                          <option value="">Select Category</option>
                          <option value="Team">Team Sport</option>
                          <option value="Individual">Individual Sport</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Coach Name</label>
                        <input type="text" className="form-control" placeholder="Enter coach name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Practice Schedule</label>
                        <input type="text" className="form-control" placeholder="e.g., Mon, Wed, Fri - 4:00 PM" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Equipment Required</label>
                    <input type="text" className="form-control" placeholder="Enter equipment (comma separated)" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Achievements</label>
                    <textarea className="form-control" rows={3} placeholder="Enter achievements (one per line)"></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Max Players</label>
                        <input type="number" className="form-control" placeholder="Maximum players" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select className="form-select">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="seasonal">Seasonal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-plus me-1"></i>Add Sport
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSportsPage;
