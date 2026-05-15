import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { timetableService } from '../../services/timetableService';
import type { Timetable } from '../../services/timetableService';

// Flattened routine type for display
type ClassRoutine = {
  id: string;
  timetableId: string;
  class: string;
  section?: string;
  teacher: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  classRoom?: string;
  periodNumber: number;
};

const ClassRoutinePage = () => {
  // State management
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRoutine, setCurrentRoutine] = useState<ClassRoutine | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    class: '',
    section: '',
    teacher: '',
    subject: '',
    day: '',
    startTime: '',
    endTime: '',
    classRoom: '',
    periodNumber: 1
  });

  // Fetch timetables from backend
  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timetableService.getAll({
        page: 1,
        limit: 100
      });
      
      // Handle various response formats
      let timetables: Timetable[] = [];
      const responseAny = response as any;
      if (Array.isArray(response)) {
        timetables = response;
      } else if (responseAny && Array.isArray(responseAny.data)) {
        timetables = responseAny.data;
      } else if (responseAny?.data?.data) {
        timetables = responseAny.data.data;
      }
      
      if (!timetables || !Array.isArray(timetables)) {
        console.warn('Unexpected timetable response format:', response);
        setRoutines([]);
        setLoading(false);
        return;
      }
      
      // Flatten timetables into routines for display
      const flattenedRoutines: ClassRoutine[] = [];
      timetables.forEach((timetable: Timetable) => {
        if (timetable.periods && Array.isArray(timetable.periods)) {
          timetable.periods.forEach((period) => {
            flattenedRoutines.push({
              id: `${timetable._id}-${period.periodNumber}`,
              timetableId: timetable._id,
              class: timetable.class,
              section: timetable.section,
              teacher: period.teacher,
              subject: period.subject,
              day: timetable.day,
              startTime: period.startTime,
              endTime: period.endTime,
              classRoom: period.room,
              periodNumber: period.periodNumber
            });
          });
        }
      });
      
      setRoutines(flattenedRoutines);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch routines';
      console.error('Error fetching routines:', err);
      setError(errorMessage);
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'periodNumber' ? parseInt(value) || 1 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create timetable structure from form data
      const timetableData: Partial<Timetable> = {
        class: formData.class,
        section: formData.section,
        day: formData.day,
        periods: [{
          periodNumber: formData.periodNumber,
          subject: formData.subject,
          teacher: formData.teacher,
          startTime: formData.startTime,
          endTime: formData.endTime,
          room: formData.classRoom
        }],
        academicYear: '2024-2025'
      };

      if (currentRoutine) {
        // Update existing routine
        await timetableService.update(currentRoutine.timetableId, timetableData);
        toast.success('Class routine updated successfully');
        setShowEditModal(false);
      } else {
        // Add new routine
        await timetableService.create(timetableData);
        toast.success('Class routine added successfully');
        setShowAddModal(false);
      }
      
      resetForm();
      await fetchRoutines();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save routine';
      console.error('Error saving routine:', err);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!currentRoutine) return;
    
    try {
      await timetableService.delete(currentRoutine.timetableId);
      toast.success('Class routine deleted successfully');
      setShowDeleteModal(false);
      await fetchRoutines();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete routine';
      console.error('Error deleting routine:', err);
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      class: '',
      section: '',
      teacher: '',
      subject: '',
      day: '',
      startTime: '',
      endTime: '',
      classRoom: '',
      periodNumber: 1
    });
    setCurrentRoutine(null);
  };

  const openEditModal = (routine: ClassRoutine) => {
    setCurrentRoutine(routine);
    setFormData({
      class: routine.class,
      section: routine.section || '',
      teacher: routine.teacher,
      subject: routine.subject,
      day: routine.day,
      startTime: routine.startTime,
      endTime: routine.endTime,
      classRoom: routine.classRoom || '',
      periodNumber: routine.periodNumber
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (routine: ClassRoutine) => {
    setCurrentRoutine(routine);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Class Routine</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <span>Academic</span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Class Routine
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={() => fetchRoutines()}
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
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Class Routine
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Class Routine</h4>
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading class routines...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-calendar-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No class routines found. Add your first routine to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Period</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Day</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Room</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {routines.map((routine) => (
                    <tr key={routine.id}>
                      <td>{routine.periodNumber}</td>
                      <td>{routine.class}</td>
                      <td>{routine.section || '-'}</td>
                      <td>{routine.teacher}</td>
                      <td>{routine.subject}</td>
                      <td>{routine.day}</td>
                      <td>{routine.startTime}</td>
                      <td>{routine.endTime}</td>
                      <td>{routine.classRoom || '-'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary me-1"
                          onClick={() => openEditModal(routine)}
                        >
                          <i className="ti ti-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => openDeleteModal(routine)}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Class Routine</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="class" 
                      value={formData.class}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Section</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="section" 
                      value={formData.section}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
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
                  <div className="mb-3">
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
                  <div className="mb-3">
                    <label className="form-label">Day</label>
                    <select 
                      className="form-select" 
                      name="day" 
                      value={formData.day}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Period Number</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      name="periodNumber" 
                      value={formData.periodNumber}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
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
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
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
                  <div className="mb-3">
                    <label className="form-label">Class Room</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="classRoom" 
                      value={formData.classRoom}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && currentRoutine && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Class Routine</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="class" 
                      value={formData.class}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Section</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="section" 
                      value={formData.section}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
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
                  <div className="mb-3">
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
                  <div className="mb-3">
                    <label className="form-label">Day</label>
                    <select 
                      className="form-select" 
                      name="day" 
                      value={formData.day}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Period Number</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      name="periodNumber" 
                      value={formData.periodNumber}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
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
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
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
                  <div className="mb-3">
                    <label className="form-label">Class Room</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="classRoom" 
                      value={formData.classRoom}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && currentRoutine && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <i className="ti ti-trash-x fs-1 text-danger mb-3"></i>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this class routine?</p>
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

export default ClassRoutinePage;
