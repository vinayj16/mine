import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { timetableService, type Timetable } from '../../services/timetableService';
import apiClient from '../../api/client';

interface ClassData {
  id: string;
  name: string;
  section: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  // Assuming a 'name' property, adjust if the API returns something different
}

interface Period {
  periodNumber: number;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room?: string;
}

const ClassTimeTablePage: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [selectedClass, setSelectedClass] = useState('');

  // State for fetched data
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // State for Add/Edit Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState<Omit<Period & { day: string, classId: string }, 'id'>>({
    day: 'Monday',
    classId: '',
    periodNumber: 1,
    subject: '',
    teacher: '',
    startTime: '',
    endTime: '',
    room: '',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { label: '09:00 - 09:45 AM', start: '09:00', end: '09:45' },
    { label: '09:45 - 10:30 AM', start: '09:45', end: '10:30' },
    { label: '10:45 - 11:30 AM', start: '10:45', end: '11:30' },
    { label: '11:30 - 12:15 PM', start: '11:30', end: '12:15' },
    { label: '01:30 - 02:15 PM', start: '13:30', end: '14:15' },
    { label: '02:15 - 03:00 PM', start: '14:15', end: '15:00' },
    { label: '03:15 - 04:00 PM', start: '15:15', end: '16:00' },
  ];
  const breakTimes = [
    { type: 'Morning Break', time: '10:30 to 10:45 AM', color: 'primary' },
    { type: 'Lunch', time: '12:15 to 01:30 PM', color: 'warning' },
    { type: 'Evening Break', time: '03:00 to 03:15 PM', color: 'info' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      // Using Promise.all to fetch concurrently
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/subjects'),
        apiClient.get('/users?role=teacher'), // Assuming an endpoint for teachers
      ]);
      if (classesRes.data?.data) setClasses(classesRes.data.data);
      if (subjectsRes.data?.data) setSubjects(subjectsRes.data.data);
      if (teachersRes.data?.data) setTeachers(teachersRes.data.data);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      toast.error('Failed to load necessary data. Please refresh.');
    }
  };

  const fetchTimetables = async () => {
    if (!selectedClass) {
      setTimetables([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await timetableService.getAll({ classId: selectedClass });
      setTimetables(response.data || []);
    } catch (error) {
      console.error('Error fetching timetables:', error);
      toast.error('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: name === 'periodNumber' ? parseInt(value) : value,
    }));
  };

  const handleOpenAddModal = () => {
    setAddFormData({
      classId: selectedClass,
      day: 'Monday',
      periodNumber: 1,
      subject: '',
      teacher: '',
      startTime: '',
      endTime: '',
      room: '',
    });
    setShowAddModal(true);
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.classId || !addFormData.subject || !addFormData.teacher) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { classId, day, ...periodData } = addFormData;
      const selectedCls = classes.find(c => c.id === classId);

      const timetableData = {
        class: classId,
        section: selectedCls?.section || '',
        day: day.toLowerCase(),
        periods: [periodData],
        academicYear: '2024-2025', // This should likely be dynamic
      };

      await timetableService.create(timetableData);
      setShowAddModal(false);
      toast.success('Period added successfully');
      fetchTimetables(); // Refetch to show the new period
    } catch (error) {
      console.error('Error adding period:', error);
      toast.error('Failed to add period');
    }
  };

  const getPeriodForSlot = (day: string, startTime: string, endTime: string) => {
    const dayTimetable = timetables.find(
      (tt) => tt.day.toLowerCase() === day.toLowerCase()
    );
    if (!dayTimetable) return null;
    return dayTimetable.periods.find(
      (period) => period.startTime === startTime && period.endTime === endTime
    );
  };

  const getColorForPeriod = (index: number) => {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary', 'dark'];
    return colors[index % colors.length];
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Class Timetable</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item">Academic</li>
              <li className="breadcrumb-item active" aria-current="page">Timetable</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button className="btn btn-outline-light bg-white btn-icon" onClick={fetchTimetables} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary d-flex align-items-center" onClick={handleOpenAddModal} disabled={!selectedClass}>
            <i className="ti ti-square-rounded-plus me-2"></i>Add Period
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h4 className="mb-0">Timetable</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="me-2" style={{minWidth: '200px'}}>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select a Class to View Timetable</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>
          ) : !selectedClass ? (
            <div className="text-center py-5 text-muted">Please select a class to view its timetable.</div>
          ) : timetables.length === 0 ? (
            <div className="text-center py-5 text-muted">No timetable found for the selected class.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Time</th>
                    {days.map((day) => (<th key={day}>{day}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, index) => (
                    <tr key={index}>
                      <td className="text-nowrap"><i className="ti ti-clock me-1"></i>{slot.label}</td>
                      {days.map((day) => {
                        const period = getPeriodForSlot(day, slot.start, slot.end);
                        const color = getColorForPeriod(index);
                        const teacherName = teachers.find(t => t.id === period?.teacher)?.name || period?.teacher;
                        const subjectName = subjects.find(s => s.id === period?.subject)?.name || period?.subject;
                        
                        return (
                          <td key={`${day}-${index}`}>
                            {period ? (
                              <div className={`p-2 bg-${color}-light rounded`}>
                                <div className="fw-medium"><span className="text-muted small">Subject: </span>{subjectName}</div>
                                <div className="mt-1"><span className="text-muted small"><i className="ti ti-user me-1"></i>{teacherName}</span></div>
                                {period.room && (<div className="mt-1"><span className="text-muted small"><i className="ti ti-door me-1"></i>Room {period.room}</span></div>)}
                              </div>
                            ) : (<div className="p-2 text-muted text-center">-</div>)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer border-0 pb-0">
          <div className="row">
            {breakTimes.map((breakTime, index) => (
              <div key={index} className="col-lg-4 d-flex mb-3">
                <div className="card flex-fill"><div className="card-body p-3"><span className={`bg-${breakTime.color} badge badge-sm mb-2`}>{breakTime.type}</span><p className="text-dark mb-0"><i className="ti ti-clock me-1"></i>{breakTime.time}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Period</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddPeriod}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Class</label>
                      <select className="form-select" name="classId" value={addFormData.classId} onChange={handleAddFormChange} required>
                        <option value="">Select Class</option>
                        {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name} {cls.section}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Day</label>
                      <select className="form-select" name="day" value={addFormData.day} onChange={handleAddFormChange} required>
                        {days.map((day) => (<option key={day} value={day}>{day}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Subject</label>
                      <select className="form-select" name="subject" value={addFormData.subject} onChange={handleAddFormChange} required>
                        <option value="">Select Subject</option>
                        {subjects.map((sub) => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teacher</label>
                      <select className="form-select" name="teacher" value={addFormData.teacher} onChange={handleAddFormChange} required>
                        <option value="">Select Teacher</option>
                        {teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Period Number</label>
                      <input type="number" className="form-control" name="periodNumber" value={addFormData.periodNumber} onChange={handleAddFormChange} min="1" required/>
                    </div>
                     <div className="col-md-6 mb-3">
                      <label className="form-label">Room (Optional)</label>
                      <input type="text" className="form-control" name="room" value={addFormData.room || ''} onChange={handleAddFormChange}/>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-control" name="startTime" value={addFormData.startTime} onChange={handleAddFormChange} required/>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-control" name="endTime" value={addFormData.endTime} onChange={handleAddFormChange} required/>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Period</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClassTimeTablePage;
