import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { timetableService } from '../../services/timetableService';
import type { Timetable, TimetablePeriod } from '../../services/timetableService';
import classService from '../../services/classService';
import type { Class } from '../../services/classService';
import subjectService from '../../services/subjectService';
import type { Subject } from '../../services/subjectService';
import { getInstitutionId } from '../../utils/auth';

type FlattenedRow = {
  id: string;
  timetableId: string;
  className: string;
  section: string;
  teacherName: string;
  subjectName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  periodNumber: number;
  classId: string;
  teacherId: string;
  subjectId: string;
  periodId?: string;
};

const DAY_OPTIONS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const ClassRoutinePage = () => {
  const [routines, setRoutines] = useState<FlattenedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<{ _id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRow, setCurrentRow] = useState<FlattenedRow | null>(null);

  const [formData, setFormData] = useState({
    classId: '',
    dayOfWeek: 'monday',
    periodNumber: 1,
    subjectId: '',
    teacherId: '',
    startTime: '',
    endTime: '',
    roomNumber: '',
    academicYear: '2024-2025'
  });

  const institutionId = getInstitutionId();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [timetablesRes, classesRes, subjectsRes] = await Promise.all([
        timetableService.getAll({ page: 1, limit: 100, institutionId }),
        classService.getAll({ institutionId, limit: 100 }),
        subjectService.getAll({ institutionId, limit: 100 })
      ]);
      setClasses(classesRes.data || []);
      setSubjects((subjectsRes as any).subjects || (subjectsRes as any).data || []);

      let timetables: Timetable[] = [];
      if (Array.isArray(timetablesRes)) {
        timetables = timetablesRes;
      } else if (timetablesRes && Array.isArray((timetablesRes as any).data)) {
        timetables = (timetablesRes as any).data;
      }

      const rows: FlattenedRow[] = [];
      timetables.forEach((tt: Timetable) => {
        const classObj = typeof tt.classId === 'object' ? tt.classId : null;
        const cName = classObj?.name || '';
        const cSection = classObj?.section || '';
        const cId = typeof tt.classId === 'string' ? tt.classId : classObj?._id || '';

        if (tt.periods && Array.isArray(tt.periods)) {
          tt.periods.forEach((period: TimetablePeriod) => {
            const teacherObj = typeof period.teacherId === 'object' ? period.teacherId : null;
            const tName = teacherObj?.name || `${teacherObj?.firstName || ''} ${teacherObj?.lastName || ''}`.trim() || '';
            const tId = typeof period.teacherId === 'string' ? period.teacherId : teacherObj?._id || '';

            rows.push({
              id: `${tt._id}-${period.periodNumber}`,
              timetableId: tt._id,
              className: cName,
              section: cSection,
              teacherName: tName,
              subjectName: period.subjectId || '',
              dayOfWeek: tt.dayOfWeek,
              startTime: period.startTime,
              endTime: period.endTime,
              roomNumber: period.roomNumber || '',
              periodNumber: period.periodNumber,
              classId: cId,
              teacherId: tId,
              subjectId: period.subjectId || '',
              periodId: period._id
            });
          });
        }
      });

      setRoutines(rows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { apiClient } = await import('../../api/client');
      const response = await apiClient.get('/users', {
        params: { role: 'teacher', institutionId }
      });
      if (response.data.success && response.data.data) {
        setTeachers((response.data.data as any[]).map((u: any) => ({ _id: u._id, name: u.name })));
      }
    } catch {
      setTeachers([]);
    }
  };

  useEffect(() => {
    if (showAddModal || showEditModal) {
      fetchTeachers();
    }
  }, [showAddModal, showEditModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'periodNumber' ? parseInt(value) || 1 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      classId: '',
      dayOfWeek: 'monday',
      periodNumber: 1,
      subjectId: '',
      teacherId: '',
      startTime: '',
      endTime: '',
      roomNumber: '',
      academicYear: '2024-2025'
    });
    setCurrentRow(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        classId: formData.classId,
        dayOfWeek: formData.dayOfWeek,
        academicYear: formData.academicYear,
        periods: [{
          periodNumber: formData.periodNumber,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          roomNumber: formData.roomNumber
        }]
      };

      if (currentRow) {
        await timetableService.update(currentRow.timetableId, payload);
        toast.success('Class routine updated successfully');
        setShowEditModal(false);
      } else {
        await timetableService.create(payload);
        toast.success('Class routine added successfully');
        setShowAddModal(false);
      }

      resetForm();
      await fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save routine';
      toast.error(msg);
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!currentRow) return;
    try {
      await timetableService.delete(currentRow.timetableId);
      toast.success('Class routine deleted successfully');
      setShowDeleteModal(false);
      await fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete routine';
      toast.error(msg);
    }
  };

  const openEditModal = (row: FlattenedRow) => {
    setCurrentRow(row);
    setFormData({
      classId: row.classId,
      dayOfWeek: row.dayOfWeek,
      periodNumber: row.periodNumber,
      subjectId: row.subjectId,
      teacherId: row.teacherId,
      startTime: row.startTime,
      endTime: row.endTime,
      roomNumber: row.roomNumber,
      academicYear: '2024-2025'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (row: FlattenedRow) => {
    setCurrentRow(row);
    setShowDeleteModal(true);
  };

  const getClassName = (id: string) => {
    const c = classes.find(x => x._id === id || x.id === id);
    return c ? `${c.name}${c.section ? ' ' + c.section : ''}` : id;
  };

  const getSubjectName = (id: string) => {
    const s = subjects.find(x => x._id === id || x.id === id);
    return s ? s.name : id;
  };

  const getTeacherName = (id: string) => {
    const t = teachers.find(x => x._id === id);
    return t ? t.name : id;
  };

  const getDayLabel = (day: string) => DAY_LABELS[day] || day;

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Class Routine</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><span>Academic</span></li>
              <li className="breadcrumb-item active" aria-current="page">Class Routine</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={() => fetchAllData()}>
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
              <p className="mt-2 text-muted">No class routines found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>#</th>
                    <th>Class</th>
                    <th>Day</th>
                    <th>Period</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Room</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {routines.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td>{row.className || getClassName(row.classId)}</td>
                      <td>{getDayLabel(row.dayOfWeek)}</td>
                      <td>{row.periodNumber}</td>
                      <td>{row.subjectName || getSubjectName(row.subjectId)}</td>
                      <td>{row.teacherName || getTeacherName(row.teacherId)}</td>
                      <td>{row.startTime}</td>
                      <td>{row.endTime}</td>
                      <td>{row.roomNumber || '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-primary me-1" onClick={() => openEditModal(row)}>
                          <i className="ti ti-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(row)}>
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Class Routine</h4>
                <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Class</label>
                      <select className="form-select" name="classId" value={formData.classId} onChange={handleInputChange} required>
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name}{c.section ? ` - ${c.section}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Day</label>
                      <select className="form-select" name="dayOfWeek" value={formData.dayOfWeek} onChange={handleInputChange} required>
                        {DAY_OPTIONS.map(d => (
                          <option key={d} value={d}>{DAY_LABELS[d]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <hr />
                  <h6>Period Details</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Period Number</label>
                      <input type="number" className="form-control" name="periodNumber" value={formData.periodNumber} onChange={handleInputChange} min="1" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Subject</label>
                      <select className="form-select" name="subjectId" value={formData.subjectId} onChange={handleInputChange} required>
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Teacher</label>
                      <select className="form-select" name="teacherId" value={formData.teacherId} onChange={handleInputChange} required>
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-control" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-control" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Room Number</label>
                      <input type="text" className="form-control" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && currentRow && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Class Routine</h4>
                <button type="button" className="btn-close" onClick={() => { setShowEditModal(false); resetForm(); }} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Class</label>
                      <select className="form-select" name="classId" value={formData.classId} onChange={handleInputChange} required>
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name}{c.section ? ` - ${c.section}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Day</label>
                      <select className="form-select" name="dayOfWeek" value={formData.dayOfWeek} onChange={handleInputChange} required>
                        {DAY_OPTIONS.map(d => (
                          <option key={d} value={d}>{DAY_LABELS[d]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <hr />
                  <h6>Period Details</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Period Number</label>
                      <input type="number" className="form-control" name="periodNumber" value={formData.periodNumber} onChange={handleInputChange} min="1" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Subject</label>
                      <select className="form-select" name="subjectId" value={formData.subjectId} onChange={handleInputChange} required>
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Teacher</label>
                      <select className="form-select" name="teacherId" value={formData.teacherId} onChange={handleInputChange} required>
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-control" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-control" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Room Number</label>
                      <input type="text" className="form-control" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && currentRow && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <i className="ti ti-trash-x fs-1 text-danger mb-3"></i>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this class routine?</p>
                <div className="d-flex justify-content-center mt-4">
                  <button type="button" className="btn btn-light me-3" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
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
