import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { examScheduleService } from '../../services/examScheduleService';
import { classService, type Class } from '../../services/classService';
import { subjectService, type Subject } from '../../services/subjectService';
import type { ExamSchedule } from '../../services/examScheduleService';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const institutionExamNames: Record<string, string[]> = {
  School: ['Unit Test', 'Mid Term', 'Final Exam', 'Weekly Test', 'Monthly Test', 'Chapter Wise Test'],
  Inter: ['Quarterly', 'Half Yearly', 'Pre-Final', 'Annual', 'IPE'],
  Degree: ['Internal Assessment 1', 'Internal Assessment 2', 'Semester End', 'University Exam'],
  Engineering: ['Mid Sem 1', 'Mid Sem 2', 'End Sem', 'Internal Test'],
  default: ['Week Test', 'Monthly Test', 'Chapter Wise Test', 'Unit Test']
};

const ExamSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [institutionType, setInstitutionType] = useState('default');
  const [institutionId, setInstitutionId] = useState('');

  const [newSchedule, setNewSchedule] = useState({
    classId: '',
    className: '',
    section: '',
    subject: '',
    examDate: '',
    startTime: '',
    endTime: '',
    duration: '3 hrs',
    roomNo: '',
    maxMarks: 100,
    minMarks: 35,
    examName: ''
  });

  const [editSchedule, setEditSchedule] = useState<ExamSchedule | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let instType = 'default';
    let instId = localStorage.getItem('institutionId') || '';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.institutionData?.type) {
          instType = user.institutionData.type;
        }
        if (user?.institutionId || user?.institution) {
          instId = user.institutionId || user.institution || instId;
        }
      } catch (e) {
        console.warn('Failed to parse user data:', e);
      }
    }
    setInstitutionType(instType);
    setInstitutionId(instId);
    fetchSchedules();
    // Load classes first, then subjects (so fallback 2 in fetchSubjects has access to loaded classes)
    fetchClasses(instId).then(loadedClasses => {
      fetchSubjects(instId, loadedClasses);
    });
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const result = await examScheduleService.getAll({ page: 1, limit: 100 });
      setSchedules(result?.data || result || []);
    } catch (error) {
      console.error('Error fetching exam schedules:', error);
      toast.error('Failed to load exam schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (instId: string): Promise<Class[]> => {
    try {
      setLoadingClasses(true);
      const response = await classService.getAll({ institutionId: instId, limit: 100 });
      const fetchedClasses = response?.data || [];
      setClasses(fetchedClasses);
      return fetchedClasses;
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async (instId: string, loadedClasses: Class[] = []) => {
    try {
      setLoadingSubjects(true);
      // Primary fetch with institutionId
      const response = await subjectService.getAll({ institutionId: instId, limit: 100 });
      const fetched = response?.subjects || [];
      if (fetched.length) {
        setSubjects(fetched);
        return;
      }
      
      // Fallback 1: try fetching with just the localStorage institutionId (in case parameter was wrong)
      const lsId = localStorage.getItem('institutionId');
      if (lsId && lsId !== instId) {
        const fb1 = await subjectService.getAll({ institutionId: lsId, limit: 100 });
        const fb1Subjects = fb1?.subjects || [];
        if (fb1Subjects.length) {
          setSubjects(fb1Subjects);
          return;
        }
      }
      
      // Fallback 2: try the class-specific subjects endpoint using the first class
      // (loadedClasses is passed in to avoid race condition with fetchClasses)
      if (loadedClasses.length > 0) {
        const firstClassId = loadedClasses[0]._id || loadedClasses[0].id;
        if (firstClassId) {
          try {
            const byClassResponse = await subjectService.getByClass(firstClassId);
            if (byClassResponse && byClassResponse.length) {
              setSubjects(byClassResponse);
              return;
            }
          } catch (fallbackError) {
            console.warn('Fallback subject fetch failed:', fallbackError);
          }
        }
      }
      
      toast.warning('No subjects found. Please add subjects first from the Subjects page.');
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects. Check your connection or add subjects first.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const examNameOptions = institutionExamNames[institutionType] || institutionExamNames.default;

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedClass = classes.find(c => (c._id || c.id) === selectedId);
    setNewSchedule(prev => ({
      ...prev,
      classId: selectedId,
      className: selectedClass?.name || '',
      section: selectedClass?.section || ''
    }));
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
        institutionId,
        classId: newSchedule.classId || undefined,
        className: newSchedule.className,
        section: newSchedule.section,
        subject: newSchedule.subject,
        examName: newSchedule.examName,
        examDate: newSchedule.examDate,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        duration: newSchedule.duration,
        roomNo: newSchedule.roomNo,
        maxMarks: newSchedule.maxMarks,
        minMarks: newSchedule.minMarks,
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
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
      classId: '',
      className: '',
      section: '',
      subject: '',
      examDate: '',
      startTime: '',
      endTime: '',
      duration: '3 hrs',
      roomNo: '',
      maxMarks: 100,
      minMarks: 35,
      examName: ''
    });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!schedules.length) { toast.error('No data to export'); return; }
    const exportData = schedules.map(s => ({ Subject: s.subject, Date: s.examDate, Start: s.startTime, End: s.endTime, Duration: s.duration, Room: s.roomNo, MaxMarks: s.maxMarks, MinMarks: s.minMarks }));
    if (type === 'pdf') {
      exportToPDF(exportData, 'exam-schedules', [
        { key: 'Subject', label: 'Subject' }, { key: 'Date', label: 'Exam Date' }, { key: 'Start', label: 'Start Time' }, { key: 'End', label: 'End Time' }, { key: 'Duration', label: 'Duration' }, { key: 'Room', label: 'Room No' }, { key: 'MaxMarks', label: 'Max Marks' }, { key: 'MinMarks', label: 'Min Marks' }
      ]);
    } else {
      exportToExcel(exportData, 'exam-schedules');
    }
  };

  const timeOptions = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', 
    '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'
  ];

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
                value={'Academic Year : ' + (new Date().getFullYear()) + ' / ' + (new Date().getFullYear() + 1)}
                readOnly
              />
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
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Exam Name</th>
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
                        <td>{schedule.className || '-'}</td>
                        <td>
                          <Link to="#" className="link-primary">
                            {schedule.subject}
                          </Link>
                        </td>
                        <td>{schedule.examName}</td>
                        <td>{new Date(schedule.examDate).toLocaleDateString()}</td>
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
                      <td colSpan={12} className="text-center py-4">
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
                        <select 
                          className="form-select"
                          name="classId"
                          value={newSchedule.classId}
                          onChange={handleClassChange}
                          required
                        >
                          <option value="">Select Class</option>
                          {loadingClasses ? (
                            <option disabled>Loading...</option>
                          ) : (
                            classes.map(cls => (
                              <option key={cls._id || cls.id} value={cls._id || cls.id}>
                                {cls.name} - {cls.section}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <input 
                          type="text"
                          className="form-control"
                          name="section"
                          value={newSchedule.section}
                          readOnly
                          placeholder="Auto from class"
                        />
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
                          required
                        >
                          <option value="">Select</option>
                          {examNameOptions.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
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
                          {loadingSubjects ? (
                            <option disabled>Loading...</option>
                          ) : (
                            subjects.map(sub => (
                              <option key={sub._id} value={sub.name}>{sub.name}</option>
                            ))
                          )}
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
                        <input 
                          type="text"
                          className="form-control"
                          name="roomNo"
                          value={newSchedule.roomNo}
                          onChange={handleInputChange}
                          placeholder="Enter room number"
                          required
                        />
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
                          <option value="">Select</option>
                          {subjects.map(sub => (
                            <option key={sub._id} value={sub.name}>{sub.name}</option>
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
                        <input
                          type="text"
                          className="form-control"
                          name="roomNo"
                          value={editSchedule.roomNo}
                          onChange={handleEditInputChange}
                          required
                        />
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
