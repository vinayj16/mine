import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExaminationsApiService } from '../../../api/adminService';

interface ScheduleData {
  overview: {
    totalScheduled: number;
    thisWeek: number;
    thisMonth: number;
    conflicts: number;
    upcomingExams: number;
    completedExams: number;
  };
  schedules: {
    id: string;
    examTitle: string;
    examType: string;
    grade: string;
    section: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
    venue: string;
    invigilator: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'conflict';
    notes: string;
    createdAt: string;
  }[];
  calendarEvents: {
    date: string;
    exams: {
      title: string;
      time: string;
      grade: string;
      venue: string;
    }[];
  }[];
  venueUtilization: {
    venue: string;
    utilization: number;
    totalExams: number;
    color: string;
  }[];
  weeklySchedule: {
    day: string;
    exams: number;
    students: number;
  }[];
}

const AdminExamSchedulePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate, selectedGrade]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      // Fetch all schedule data in parallel
      const [
        overview,
        schedules,
        calendarEvents,
        weeklySchedule
      ] = await Promise.all([
        ExaminationsApiService.getScheduleOverview(),
        ExaminationsApiService.getScheduleList(selectedDate, selectedGrade),
        ExaminationsApiService.getCalendarEvents(selectedDate),
        ExaminationsApiService.getWeeklySchedule()
      ]);

      setScheduleData({
        overview: (overview as ScheduleData['overview']) || {
          totalScheduled: 0,
          thisWeek: 0,
          thisMonth: 0,
          conflicts: 0,
          upcomingExams: 0,
          completedExams: 0
        },
        schedules: (schedules as any[]) || [],
        calendarEvents: (calendarEvents as any[]) || [],
        venueUtilization: (weeklySchedule as any[]) || [
          { venue: 'Main Hall', utilization: 0, totalExams: 0, color: '#3b82f6' },
          { venue: 'Room A', utilization: 0, totalExams: 0, color: '#10b981' },
          { venue: 'Room B', utilization: 0, totalExams: 0, color: '#f59e0b' },
          { venue: 'Computer Lab', utilization: 0, totalExams: 0, color: '#ef4444' },
          { venue: 'Science Lab', utilization: 0, totalExams: 0, color: '#8b5cf6' }
        ],
        weeklySchedule: (weeklySchedule as any[]) || [
          { day: 'Mon', exams: 0, students: 0 },
          { day: 'Tue', exams: 0, students: 0 },
          { day: 'Wed', exams: 0, students: 0 },
          { day: 'Thu', exams: 0, students: 0 },
          { day: 'Fri', exams: 0, students: 0 },
          { day: 'Sat', exams: 0, students: 0 }
        ]
      });

    } catch (error: any) {
      console.error('Error fetching schedule data:', error);
      
      // Set empty data on error
      setScheduleData({
        overview: {
          totalScheduled: 0,
          thisWeek: 0,
          thisMonth: 0,
          conflicts: 0,
          upcomingExams: 0,
          completedExams: 0
        },
        schedules: [],
        calendarEvents: [],
        venueUtilization: [],
        weeklySchedule: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = () => {
    // Handle exam scheduling logic
    console.log('Scheduling new exam...');
  };

  const filteredSchedules = scheduleData?.schedules.filter(schedule => {
    const matchesGrade = selectedGrade === 'all' || schedule.grade === selectedGrade;
    return matchesGrade;
  }) || [];

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
          <h3 className="page-title mb-1">Exam Schedule</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Examinations</li>
              <li className="breadcrumb-item active">Schedule</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchScheduleData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleScheduleExam}>
            <i className="ti ti-calendar-plus me-2"></i>Schedule Exam
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
                  <h4 className="mb-1">{scheduleData?.overview.totalScheduled}</h4>
                  <p className="mb-0">Total Scheduled</p>
                  <small>All exams</small>
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
                  <h4 className="mb-1">{scheduleData?.overview.thisWeek}</h4>
                  <p className="mb-0">This Week</p>
                  <small>Upcoming exams</small>
                </div>
                <i className="ti ti-calendar-week fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{scheduleData?.overview.conflicts}</h4>
                  <p className="mb-0">Conflicts</p>
                  <small>Scheduling conflicts</small>
                </div>
                <i className="ti ti-alert-triangle fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{scheduleData?.overview.upcomingExams}</h4>
                  <p className="mb-0">Upcoming</p>
                  <small>Scheduled exams</small>
                </div>
                <i className="ti ti-calendar-time fs-24"></i>
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
              <h5 className="card-title">Schedule Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'calendar' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('calendar')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Calendar View
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'schedule' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('schedule')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Schedules
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'venues' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('venues')}
                >
                  <i className="ti ti-building me-2"></i>
                  Venues
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'conflicts' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('conflicts')}
                >
                  <i className="ti ti-alert-triangle me-2"></i>
                  Conflicts
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'create' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('create')}
                >
                  <i className="ti ti-calendar-plus me-2"></i>
                  Schedule Exam
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
                    <h5 className="card-title mb-0">Weekly Schedule</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={scheduleData?.weeklySchedule || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="exams" fill="#3b82f6" />
                        <Bar dataKey="students" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Venue Utilization</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={scheduleData?.venueUtilization || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="utilization"
                        >
                          {scheduleData?.venueUtilization.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Schedule Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Scheduled', value: scheduleData?.overview.upcomingExams || 0, color: '#3b82f6' },
                            { name: 'In Progress', value: 0, color: '#f59e0b' },
                            { name: 'Completed', value: scheduleData?.overview.completedExams || 0, color: '#10b981' },
                            { name: 'Conflicts', value: scheduleData?.overview.conflicts || 0, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {selectedSection === 'calendar' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Calendar View</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="date" 
                    className="form-control form-control-sm" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-calendar me-1"></i>View Month
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="calendar-view">
                  {/* Calendar Grid */}
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Sunday</th>
                          <th>Monday</th>
                          <th>Tuesday</th>
                          <th>Wednesday</th>
                          <th>Thursday</th>
                          <th>Friday</th>
                          <th>Saturday</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Calendar days would be rendered here */}
                        <tr>
                          <td className="calendar-day">
                            <div className="day-number">1</div>
                            <div className="exam-indicator bg-primary"></div>
                            <small>Math Test</small>
                          </td>
                          <td className="calendar-day">
                            <div className="day-number">2</div>
                          </td>
                          <td className="calendar-day">
                            <div className="day-number">3</div>
                            <div className="exam-indicator bg-success"></div>
                            <small>Science Exam</small>
                          </td>
                          <td className="calendar-day">
                            <div className="day-number">4</div>
                          </td>
                          <td className="calendar-day">
                            <div className="day-number">5</div>
                            <div className="exam-indicator bg-warning"></div>
                            <small>English Test</small>
                          </td>
                          <td className="calendar-day">
                            <div className="day-number">6</div>
                          </td>
                          <td className="calendar-day">
                            <div className="day-number">7</div>
                          </td>
                        </tr>
                        {/* More calendar rows... */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Schedules */}
          {selectedSection === 'schedule' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Schedules</h5>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="all">All Grades</option>
                    <option value="grade1">Grade 1</option>
                    <option value="grade2">Grade 2</option>
                    <option value="grade3">Grade 3</option>
                    <option value="grade4">Grade 4</option>
                    <option value="grade5">Grade 5</option>
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
                        <th>Exam Title</th>
                        <th>Grade/Section</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Duration</th>
                        <th>Venue</th>
                        <th>Invigilator</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedules.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-muted">
                            No schedules found. Click "Schedule Exam" to create your first exam schedule.
                          </td>
                        </tr>
                      ) : (
                        filteredSchedules.map((schedule) => (
                          <tr key={schedule.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`avatar avatar-sm bg-${
                                  schedule.examType === 'Final Exam' ? 'danger' :
                                  schedule.examType === 'Mid Term' ? 'warning' :
                                  schedule.examType === 'Unit Test' ? 'primary' : 'info'
                                } text-white rounded-circle me-2`}>
                                  <i className="ti ti-calendar-event"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{schedule.examTitle}</h6>
                                  <small className="text-muted">{schedule.examType}</small>
                                </div>
                              </div>
                            </td>
                            <td>{schedule.grade} - {schedule.section}</td>
                            <td>{schedule.subject}</td>
                            <td>{schedule.date}</td>
                            <td>{schedule.startTime} - {schedule.endTime}</td>
                            <td>{schedule.duration}</td>
                            <td>{schedule.venue}</td>
                            <td>{schedule.invigilator}</td>
                            <td>
                              <span className={`badge ${
                                schedule.status === 'scheduled' ? 'bg-info' :
                                schedule.status === 'in-progress' ? 'bg-warning' :
                                schedule.status === 'completed' ? 'bg-success' :
                                schedule.status === 'conflict' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1).replace('-', ' ')}
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
                                <button className="btn btn-outline-success" title="Start Exam">
                                  <i className="ti ti-play"></i>
                                </button>
                                {schedule.status === 'conflict' && (
                                  <button className="btn btn-outline-danger" title="Resolve Conflict">
                                    <i className="ti ti-alert-triangle"></i>
                                  </button>
                                )}
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

          {/* Venues */}
          {selectedSection === 'venues' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Venue Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Venue
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  {scheduleData?.venueUtilization.map((venue, index) => (
                    <div className="col-md-4 mb-3" key={index}>
                      <div className="card border">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">{venue.venue}</h6>
                            <span className={`badge bg-${venue.utilization > 80 ? 'danger' : venue.utilization > 50 ? 'warning' : 'success'}`}>
                              {venue.utilization}% Used
                            </span>
                          </div>
                          <div className="progress mb-2" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar bg-${venue.utilization > 80 ? 'danger' : venue.utilization > 50 ? 'warning' : 'success'}`}
                              style={{ width: `${venue.utilization}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">{venue.totalExams} exams scheduled</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conflicts */}
          {selectedSection === 'conflicts' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Scheduling Conflicts</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Conflict Type</th>
                        <th>Exams Involved</th>
                        <th>Date/Time</th>
                        <th>Venue</th>
                        <th>Severity</th>
                        <th>Suggested Solution</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No scheduling conflicts found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Exam */}
          {selectedSection === 'create' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Schedule New Exam</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Select Exam</label>
                        <select className="form-select" required>
                          <option value="">Select exam to schedule</option>
                          <option value="exam1">Mathematics Unit Test</option>
                          <option value="exam2">Science Mid Term</option>
                          <option value="exam3">English Final Exam</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Grade/Section</label>
                        <select className="form-select" required>
                          <option value="">Select grade/section</option>
                          <option value="grade1-a">Grade 1 - A</option>
                          <option value="grade1-b">Grade 1 - B</option>
                          <option value="grade2-a">Grade 2 - A</option>
                          <option value="grade2-b">Grade 2 - B</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Exam Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <input type="time" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <input type="time" className="form-control" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Venue</label>
                        <select className="form-select" required>
                          <option value="">Select venue</option>
                          <option value="main-hall">Main Hall</option>
                          <option value="room-a">Room A</option>
                          <option value="room-b">Room B</option>
                          <option value="computer-lab">Computer Lab</option>
                          <option value="science-lab">Science Lab</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Invigilator</label>
                        <select className="form-select" required>
                          <option value="">Select invigilator</option>
                          <option value="teacher1">John Smith</option>
                          <option value="teacher2">Jane Doe</option>
                          <option value="teacher3">Robert Johnson</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Special Instructions</label>
                    <textarea className="form-control" rows={3} placeholder="Enter any special instructions for the exam"></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Required Materials</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="answer-sheets" />
                      <label className="form-check-label" htmlFor="answer-sheets">
                        Answer Sheets
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="question-papers" />
                      <label className="form-check-label" htmlFor="question-papers">
                        Question Papers
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="stationery" />
                      <label className="form-check-label" htmlFor="stationery">
                        Stationery Items
                      </label>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-outline-primary">
                      <i className="ti ti-search me-1"></i>Check Availability
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-calendar-plus me-1"></i>Schedule Exam
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

export default AdminExamSchedulePage;
