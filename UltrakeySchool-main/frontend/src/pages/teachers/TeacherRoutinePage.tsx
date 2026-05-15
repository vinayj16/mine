import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import TeacherDetailTabs from '../../components/teachers/TeacherDetailTabs';

interface Period {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: {
    _id: string;
    name: string;
    code: string;
  };
  classId?: {
    _id: string;
    name: string;
    grade: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  roomNumber?: string;
  periodType: 'lecture' | 'lab' | 'tutorial' | 'break' | 'free';
}

interface RoutineDay {
  _id: string;
  dayOfWeek: number;
  periods: Period[];
  academicYear: string;
  term: string;
}

interface TeacherProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: string;
}

const TeacherRoutinePage = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [routine, setRoutine] = useState<RoutineDay[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedTerm, setSelectedTerm] = useState('1');

  // Get schoolId from localStorage user data
  const getSchoolId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.schoolId || user.school || user.schoolID || user.institutionId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return null;
  };

  const schoolId = getSchoolId();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (teacherId && schoolId) {
      fetchTeacherProfile();
      fetchRoutine();
    }
  }, [teacherId, selectedYear, selectedTerm, schoolId]);

  const fetchTeacherProfile = async () => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      if (response.data.success) {
        setTeacherProfile(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch teacher profile:', error);
    }
  };

  const fetchRoutine = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/teachers/${teacherId}/routine`, {
        params: {
          schoolId,
          academicYear: selectedYear,
          term: selectedTerm
        }
      });

      if (response.data.success) {
        setRoutine(response.data.data || []);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch routine';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodTypeBadge = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-transparent-primary text-primary';
      case 'lab':
        return 'bg-transparent-success text-success';
      case 'tutorial':
        return 'bg-transparent-info text-info';
      case 'break':
        return 'bg-transparent-warning text-warning';
      case 'free':
        return 'bg-transparent-secondary text-secondary';
      default:
        return 'bg-transparent-danger text-danger';
    }
  };

  const groupByDay = () => {
    const grouped: { [key: number]: RoutineDay } = {};
    routine.forEach((day) => {
      grouped[day.dayOfWeek] = day;
    });
    return grouped;
  };

  const routineByDay = groupByDay();

  // Loading state
  if (loading && routine.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && routine.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Routine</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchRoutine}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Teacher Routine</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/teachers">Teachers</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Routine
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button">
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/teachers/${teacherId}/edit`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Teacher
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-3 col-xl-4">
          {/* Teacher Profile Sidebar */}
          {teacherProfile && (
            <div className="card border-white">
              <div className="card-header">
                <div className="d-flex align-items-center flex-wrap row-gap-3">
                  <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0">
                    <img 
                      src={teacherProfile.photo || `https://ui-avatars.com/api/?name=${teacherProfile.firstName}+${teacherProfile.lastName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={`${teacherProfile.firstName} ${teacherProfile.lastName}`} 
                    />
                  </div>
                  <div>
                    <h5 className="mb-1 text-truncate">{teacherProfile.firstName} {teacherProfile.lastName}</h5>
                    <p className="text-primary mb-1">{teacherProfile._id.slice(-6)}</p>
                    <p className="mb-0">{teacherProfile.designation}</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <h5 className="mb-3">Contact Information</h5>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-phone" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.phone}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-mail" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.email}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-0">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-building" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.department}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="col-xxl-9 col-xl-8">
          <TeacherDetailTabs active="routine" />

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Time Table</h4>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <select 
                  className="form-select mb-3" 
                  style={{ width: 'auto' }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2022-2023">2022-2023</option>
                </select>
                <select 
                  className="form-select mb-3" 
                  style={{ width: 'auto' }}
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                  <option value="annual">Annual</option>
                </select>
                <button 
                  className="btn btn-outline-light bg-white mb-3"
                  onClick={fetchRoutine}
                >
                  <i className="ti ti-refresh me-2" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Empty State */}
              {routine.length === 0 && !loading && (
                <div className="text-center py-5">
                  <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                  <h5 className="mb-2">No Routine Found</h5>
                  <p className="text-muted mb-4">No timetable has been created for this teacher yet</p>
                </div>
              )}

              {/* Routine Display */}
              {routine.length > 0 && (
                <div className="row flex-nowrap overflow-auto">
                  {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                    const dayRoutine = routineByDay[dayNum];
                    if (!dayRoutine) return null;

                    return (
                      <div className="col-md-4 min-w-300" key={dayNum}>
                        <h6 className="mb-3">{dayNames[dayNum]}</h6>
                        {dayRoutine.periods
                          .sort((a, b) => a.periodNumber - b.periodNumber)
                          .map((period, index) => (
                            <div className="rounded border p-3 mb-4" key={`${dayNum}-${index}`}>
                              <div className="pb-3 border-bottom mb-2">
                                <span className={`badge ${getPeriodTypeBadge(period.periodType)} text-nowrap`}>
                                  {period.roomNumber || 'Room N/A'}
                                </span>
                                <span className="badge bg-light text-dark ms-2">
                                  Period {period.periodNumber}
                                </span>
                              </div>
                              <p className="text-dark mb-2 fw-medium">
                                {period.classId?.name || 'N/A'} {period.sectionId?.name ? `(${period.sectionId.name})` : ''}
                              </p>
                              <p className="text-dark mb-2">
                                {period.subjectId?.name || period.periodType.charAt(0).toUpperCase() + period.periodType.slice(1)}
                              </p>
                              <p className="text-dark mb-0">
                                <i className="ti ti-clock me-1" />
                                {period.startTime} - {period.endTime}
                              </p>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherRoutinePage;
