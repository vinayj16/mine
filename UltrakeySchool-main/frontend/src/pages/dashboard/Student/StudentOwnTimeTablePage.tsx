import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getInstitutionId } from '../../../utils/auth';
import apiClient from '../../../api/client';

interface Teacher {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface TimetableSession {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId?: Teacher;
  roomNumber?: string;
}

interface DaySchedule {
  day: string;
  sessions: TimetableSession[];
}

const StudentOwnTimeTablePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [studentName, setStudentName] = useState<string>('');
  const [className, setClassName] = useState<string>('');

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      const institutionId = getInstitutionId();
      
      // Get student profile
      const profileResponse = await apiClient.get('/students/me');
      if (profileResponse.data.success && profileResponse.data.data) {
        const student = profileResponse.data.data;
        setStudentName(`${student.firstName || student.name || ''} ${student.lastName || ''}`.trim() || 'Student');
        setClassName(student.classId?.name ? `${student.classId.name}${student.sectionId?.name ? ' - ' + student.sectionId.name : ''}` : 'N/A');
        
        // Fetch timetable using student ID
        const studentId = student._id;
        const timetableResponse = await apiClient.get(`/students/${studentId}/timetable`, {
          params: { institutionId }
        });
        
        if (timetableResponse.data.success) {
          const timetableData = timetableResponse.data.data || [];
          const groupedByDay = groupSessionsByDay(timetableData);
          setTimetable(groupedByDay);
        }
      } else {
        // If no student data, try to get from user context
        setError('Unable to load student information');
      }
    } catch (err: any) {
      console.error('Error fetching timetable:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load timetable';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const groupSessionsByDay = (sessions: TimetableSession[]): DaySchedule[] => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped: { [key: string]: TimetableSession[] } = {};

    daysOfWeek.forEach(day => {
      grouped[day] = [];
    });

    sessions.forEach(session => {
      if (grouped[session.day]) {
        grouped[session.day].push(session);
      }
    });

    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    });

    return daysOfWeek.map(day => ({
      day,
      sessions: grouped[day]
    }));
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSessionColorClass = (index: number) => {
    const colors = [
      'bg-primary-transparent',
      'bg-info-transparent',
      'bg-success-transparent',
      'bg-warning-transparent',
      'bg-danger-transparent',
      'bg-secondary-transparent'
    ];
    return colors[index % colors.length];
  };

  const getTeacherAvatar = (teacher?: Teacher) => {
    if (!teacher) return 'https://ui-avatars.com/api/?name=Teacher&background=random';
    if (teacher.avatar) return teacher.avatar;
    const fullName = teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher';
    return `https://ui-avatars.com/api/?name=${fullName}&background=random`;
  };

  const getTeacherName = (teacher?: Teacher) => {
    if (!teacher) return 'Not Assigned';
    return teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher';
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">My Timetable</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                My Timetable
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading timetable...</span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
            <h4 className="mb-3">{error}</h4>
            <button className="btn btn-primary" onClick={fetchTimetable}>
              <i className="ti ti-refresh me-2"></i>
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xl me-3">
                  <div className="avatar-initial rounded-circle bg-primary text-white">
                    {studentName.charAt(0)}
                  </div>
                </div>
                <div>
                  <h5 className="mb-1">{studentName}</h5>
                  <p className="text-muted mb-0">{className}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Weekly Schedule</h4>
              <div className="dropdown mb-3">
                <button className="btn btn-outline-light border-white bg-white dropdown-toggle shadow-md" type="button">
                  <i className="ti ti-calendar-due me-2" />
                  This Week
                </button>
              </div>
            </div>
            <div className="card-body">
              {timetable.length === 0 || timetable.every(day => day.sessions.length === 0) ? (
                <div className="text-center py-5">
                  <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                  <h4 className="mb-3">No timetable available</h4>
                  <p className="text-muted">Your class timetable has not been set up yet. Please contact your school administration.</p>
                </div>
              ) : (
                <div className="d-flex flex-nowrap overflow-auto pb-3">
                  {timetable.map((daySchedule) => (
                    <div className="d-flex flex-column me-4 flex-fill min-w-280" key={daySchedule.day}>
                      <div className="mb-3">
                        <h6 className="text-primary fw-semibold">{daySchedule.day}</h6>
                      </div>
                      {daySchedule.sessions.length === 0 ? (
                        <div className="bg-light rounded p-3 mb-3">
                          <p className="text-muted mb-0 small">No classes scheduled</p>
                        </div>
                      ) : (
                        daySchedule.sessions.map((session, idx) => (
                          <div className={`${getSessionColorClass(idx)} rounded p-3 mb-3 border`} key={session._id}>
                            <p className="d-flex align-items-center text-nowrap mb-1 small text-muted">
                              <i className="ti ti-clock me-1" />
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </p>
                            <p className="text-dark fw-semibold mb-1">{session.subject}</p>
                            {session.roomNumber && (
                              <p className="text-muted small mb-2">
                                <i className="ti ti-door me-1" />
                                Room {session.roomNumber}
                              </p>
                            )}
                            <div className="bg-white rounded p-2 mt-2">
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-sm me-2">
                                  <img 
                                    src={getTeacherAvatar(session.teacherId)} 
                                    alt={getTeacherName(session.teacherId)} 
                                    className="rounded-circle"
                                  />
                                </span>
                                <span className="text-muted small">{getTeacherName(session.teacherId)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default StudentOwnTimeTablePage;
