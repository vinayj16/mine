import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { examScheduleService } from '../../services/examScheduleService';
import type { ExamSchedule } from '../../services/examScheduleService';

const ExamSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newSchedule, setNewSchedule] = useState({
    subject: '',
    examDate: '',
    startTime: '',
    endTime: '',
    duration: '3 hrs',
    roomNo: '',
    maxMarks: 100,
    minMarks: 35,
    className: 'I',
    section: 'A',
    examName: 'Week Test'
  });

  const [editSchedule, setEditSchedule] = useState<ExamSchedule | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await examScheduleService.getAll({ page: 1, limit: 100 });
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching exam schedules:', error);
      toast.error('Failed to load exam schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editSchedule) {
      setEditSchedule({
        ...editSchedule,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await examScheduleService.create({
        institutionId: localStorage.getItem('schoolId') || '',
        classId: newSchedule.className,
        subject: newSchedule.subject,
        examName: newSchedule.examName,
        examDate: newSchedule.examDate,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        duration: newSchedule.duration,
        roomNo: newSchedule.roomNo,
        maxMarks: newSchedule.maxMarks,
        minMarks: newSchedule.minMarks
      });

      toast.success('Exam schedule created successfully');
      setShowAddModal(false);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error creating exam schedule:', error);
      toast.error('Failed to create exam schedule');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchedule) return;

    try {
      await examScheduleService.update(editSchedule.id, {
        subject: editSchedule.subject,
        examDate: editSchedule.examDate,
        startTime: editSchedule.startTime,
        endTime: editSchedule.endTime,
        duration: editSchedule.duration,
        roomNo: editSchedule.roomNo,
        maxMarks: editSchedule.maxMarks,
        minMarks: editSchedule.minMarks
      });

      toast.success('Exam schedule updated successfully');
      setShowEditModal(false);
      setEditSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error updating exam schedule:', error);
      toast.error('Failed to update exam schedule');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await examScheduleService.delete(deleteId);
      toast.success('Exam schedule deleted successfully');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting exam schedule:', error);
      toast.error('Failed to delete exam schedule');
    }
  };

  const resetForm = () => {
    setNewSchedule({
      subject: '',
      examDate: '',
      startTime: '',
      endTime: '',
      duration: '3 hrs',
      roomNo: '',
      maxMarks: 100,
      minMarks: 35,
      className: 'I',
      section: 'A',
      examName: 'Week Test'
    });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export as ${type.toUpperCase()} - Feature coming soon`);
  };

  const timeOptions = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', 
    '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'
  ];

  const subjectOptions = ['English', 'Spanish', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
  const roomOptions = ['101', '102', '103', '104', '105', '201', '202', '203'];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Exam Schedule</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Academic</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Exam Schedule
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchSchedules}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button 
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('excel')}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Exam Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Exam Schedule</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="text" 
                className="form-control date-range bookingrange" 
                placeholder="Select"
                value="Academic Year : 2024 / 2025"
                readOnly
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>I</option>
                            <option>II</option>
                            <option>III</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Exam Date</label>
                          <input type="date" className="form-control" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">
                      Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="dropdown mb-3">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button className="dropdown-item rounded-1 active">
                    Ascending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Descending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Viewed
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Added
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>Subject</th>
                    <th>Exam Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Room No</th>
                    <th>Max Marks</th>
                    <th>Min Marks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length > 0 ? (
                    schedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td>
                          <Link to="#" className="link-primary">
                            {schedule.subject}
                          </Link>
                        </td>
                        <td>{schedule.examDate}</td>
                        <td>{schedule.startTime}</td>
                        <td>{schedule.endTime}</td>
                        <td>{schedule.duration}</td>
                        <td>{schedule.roomNo}</td>
                        <td>{schedule.maxMarks}</td>
                        <td>{schedule.minMarks}</td>
                        <td>
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
                                  onClick={() => {
                                    setEditSchedule(schedule);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setDeleteId(schedule.id);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        No exam schedules found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Exam Schedule</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Enter Class"
                          name="className"
                          value={newSchedule.className}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <select 
                          className="form-select"
                          name="section"
                          value={newSchedule.section}
                          onChange={handleInputChange}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Exam Name</label>
                        <select 
                          className="form-select"
                          name="examName"
                          value={newSchedule.examName}
                          onChange={handleInputChange}
                        >
                          <option value="Week Test">Week Test</option>
                          <option value="Monthly Test">Monthly Test</option>
                          <option value="Chapter Wise Test">Chapter Wise Test</option>
                          <option value="Unit Test">Unit Test</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <select 
                          className="form-select"
                          name="subject"
                          value={newSchedule.subject}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {subjectOptions.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Exam Date</label>
                        <input 
                          type="date"
                          className="form-control"
                          name="examDate"
                          value={newSchedule.examDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <select 
                          className="form-select"
                          name="startTime"
                          value={newSchedule.startTime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {timeOptions.map(time => (
                            <option key={`start-${time}`} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <select 
                          className="form-select"
                          name="endTime"
                          value={newSchedule.endTime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {timeOptions.map(time => (
                            <option key={`end-${time}`} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Duration</label>
                        <select 
                          className="form-select"
                          name="duration"
                          value={newSchedule.duration}
                          onChange={handleInputChange}
                        >
                          <option value="1 hr">1 hr</option>
                          <option value="1.5 hrs">1.5 hrs</option>
                          <option value="2 hrs">2 hrs</option>
                          <option value="2.5 hrs">2.5 hrs</option>
                          <option value="3 hrs">3 hrs</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Room No</label>
                        <select 
                          className="form-select"
                          name="roomNo"
                          value={newSchedule.roomNo}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {roomOptions.map(room => (
                            <option key={room} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Max Marks</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="maxMarks"
                          value={newSchedule.maxMarks}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Min Marks</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="minMarks"
                          value={newSchedule.minMarks}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Exam Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editSchedule && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Exam Schedule</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditSchedule(null);
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <select 
                          className="form-select"
                          name="subject"
                          value={editSchedule.subject}
                          onChange={handleEditInputChange}
                          required
                        >
                          {subjectOptions.map(subject => (
                            <option key={`edit-${subject}`} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Exam Date</label>
                        <input 
                          type="date"
                          className="form-control"
                          name="examDate"
                          value={editSchedule.examDate}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <select 
                          className="form-select"
                          name="startTime"
                          value={editSchedule.startTime}
                          onChange={handleEditInputChange}
                          required
                        >
                          {timeOptions.map(time => (
                            <option key={`edit-start-${time}`} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <select 
                          className="form-select"
                          name="endTime"
                          value={editSchedule.endTime}
                          onChange={handleEditInputChange}
                          required
                        >
                          {timeOptions.map(time => (
                            <option key={`edit-end-${time}`} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Duration</label>
                        <select 
                          className="form-select"
                          name="duration"
                          value={editSchedule.duration}
                          onChange={handleEditInputChange}
                        >
                          <option value="1 hr">1 hr</option>
                          <option value="1.5 hrs">1.5 hrs</option>
                          <option value="2 hrs">2 hrs</option>
                          <option value="2.5 hrs">2.5 hrs</option>
                          <option value="3 hrs">3 hrs</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Room No</label>
                        <select 
                          className="form-select"
                          name="roomNo"
                          value={editSchedule.roomNo}
                          onChange={handleEditInputChange}
                          required
                        >
                          {roomOptions.map(room => (
                            <option key={`edit-${room}`} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Max Marks</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="maxMarks"
                          value={editSchedule.maxMarks}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Min Marks</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="minMarks"
                          value={editSchedule.minMarks}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => {
                      setShowEditModal(false);
                      setEditSchedule(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this exam schedule? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    Delete
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

export default ExamSchedulePage;