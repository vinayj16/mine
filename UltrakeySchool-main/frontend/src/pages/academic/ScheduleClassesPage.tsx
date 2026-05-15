import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { classScheduleService } from '../../services/classScheduleService';
import type { ClassSchedule, CreateClassScheduleInput } from '../../services/classScheduleService';

const ScheduleClassesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateClassScheduleInput>({
    classId: '',
    className: '',
    section: '',
    subject: '',
    teacher: '',
    teacherId: '',
    room: '',
    day: 'Monday',
    startTime: '',
    endTime: '',
    academicYear: '2024/2025',
    institutionId: localStorage.getItem('schoolId') || ''
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classScheduleService.getAll({
        institutionId: localStorage.getItem('schoolId') || '',
        page: 1,
        limit: 100
      });
      setSchedules(response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedules';
      console.error('Error fetching schedules:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classScheduleService.create(formData);
      toast.success('Schedule added successfully');
      setShowAddModal(false);
      resetForm();
      await fetchSchedules();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add schedule';
      console.error('Error adding schedule:', err);
      toast.error(errorMessage);
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      await classScheduleService.update(selectedSchedule._id, formData);
      toast.success('Schedule updated successfully');
      setShowEditModal(false);
      setSelectedSchedule(null);
      resetForm();
      await fetchSchedules();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
      console.error('Error updating schedule:', err);
      toast.error(errorMessage);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      await classScheduleService.delete(selectedSchedule._id);
      toast.success('Schedule deleted successfully');
      setShowDeleteModal(false);
      setSelectedSchedule(null);
      await fetchSchedules();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      console.error('Error deleting schedule:', err);
      toast.error(errorMessage);
    }
  };

  const openEditModal = (schedule: ClassSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      classId: schedule.classId,
      className: schedule.className,
      section: schedule.section,
      subject: schedule.subject,
      teacher: schedule.teacher,
      teacherId: schedule.teacherId,
      room: schedule.room,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      academicYear: schedule.academicYear,
      institutionId: schedule.institutionId,
      notes: schedule.notes
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (schedule: ClassSchedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      classId: '',
      className: '',
      section: '',
      subject: '',
      teacher: '',
      teacherId: '',
      room: '',
      day: 'Monday',
      startTime: '',
      endTime: '',
      academicYear: '2024/2025',
      institutionId: localStorage.getItem('schoolId') || ''
    });
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const classes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Schedule Classes</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <span>Academic</span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Schedule Classes</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={() => fetchSchedules()}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Class Schedules</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading schedules...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-calendar-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No schedules found. Add your first schedule to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>ID</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Room</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule._id}>
                      <td>{schedule.scheduleId}</td>
                      <td>{schedule.className}</td>
                      <td>{schedule.section}</td>
                      <td>{schedule.subject}</td>
                      <td>{schedule.teacher}</td>
                      <td>{schedule.room}</td>
                      <td>{schedule.day}</td>
                      <td>{`${schedule.startTime} - ${schedule.endTime}`}</td>
                      <td>
                        <span className={`badge badge-soft-${
                          schedule.status === 'active' ? 'success' : 
                          schedule.status === 'inactive' ? 'warning' : 'danger'
                        } d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button 
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1" 
                                  onClick={() => openEditModal(schedule)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger" 
                                  onClick={() => openDeleteModal(schedule)}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Schedule</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleAddSchedule}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Class</label>
                      <select 
                        className="form-select" 
                        name="className"
                        value={formData.className}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Section</label>
                      <select 
                        className="form-select" 
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Section</option>
                        {sections.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Subject</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teacher</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="teacher"
                        value={formData.teacher}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Room</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Day</label>
                      <select 
                        className="form-select" 
                        name="day"
                        value={formData.day}
                        onChange={handleInputChange}
                        required
                      >
                        {days.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Class ID</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="classId"
                        value={formData.classId}
                        onChange={handleInputChange}
                        placeholder="Enter Class ID"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teacher ID</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="teacherId"
                        value={formData.teacherId}
                        onChange={handleInputChange}
                        placeholder="Enter Teacher ID"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Schedule</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && selectedSchedule && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Schedule</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                />
              </div>
              <form onSubmit={handleEditSchedule}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Class</label>
                      <select 
                        className="form-select" 
                        name="className"
                        value={formData.className}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Section</label>
                      <select 
                        className="form-select" 
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Section</option>
                        {sections.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Subject</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teacher</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="teacher"
                        value={formData.teacher}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Room</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Day</label>
                      <select 
                        className="form-select" 
                        name="day"
                        value={formData.day}
                        onChange={handleInputChange}
                        required
                      >
                        {days.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSchedule && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <i className="ti ti-trash-x fs-1 text-danger mb-3"></i>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this schedule? This action cannot be undone.</p>
                <div className="d-flex justify-content-center mt-4">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteSchedule}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleClassesPage;
