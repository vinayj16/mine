import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import StudentDetailTabs from '../../components/students/StudentDetailTabs';
import StudentSidebar from '../../components/students/StudentSidebar';
import StudentSelector from '../../components/students/StudentSelector';
import type { StudentProfile } from '../../data/students';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
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

interface Student {
  id?: string;
  _id?: string;
  aadharNumber?: string;
  passportNumber?: string;
  country?: string;
  pincode?: string;
  city?: string;
  state?: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality?: string;
  classId?: {
    _id: string;
    name: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  admissionDate?: string;
  status: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  bloodGroup?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    pincode?: string;
  } | string;
  religion?: string;
  caste?: string;
  height?: string;
  weight?: string;
  medicalHistory?: string[];
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  category?: string;
  motherTongue?: string;
  languages?: string[];
  documents?: any[];
  achievements?: any[];
  attendance?: any;
  session?: any;
}

const StudentTimeTablePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);

  const fetchStudentData = async () => {
    if (!id) {
      // No ID provided - will show student selector
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch student details
      const studentResponse = await apiClient.get(`/students/${id}`);
      if (studentResponse.data.success) {
        setStudent(studentResponse.data.data);
      }

      // Fetch student timetable
      const timetableResponse = await apiClient.get(`/students/${id}/timetable`);
      if (timetableResponse.data.success) {
        const timetableData = timetableResponse.data.data || [];
        
        // Group sessions by day
        const groupedByDay = groupSessionsByDay(timetableData);
        setTimetable(groupedByDay);
      }
    } catch (err: any) {
      console.error('Error fetching student data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load student data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const groupSessionsByDay = (sessions: TimetableSession[]): DaySchedule[] => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const grouped: { [key: string]: TimetableSession[] } = {};

    // Initialize all days
    daysOfWeek.forEach(day => {
      grouped[day] = [];
    });

    // Group sessions by day
    sessions.forEach(session => {
      if (grouped[session.day]) {
        grouped[session.day].push(session);
      }
    });

    // Sort sessions by start time for each day
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    });

    // Convert to array format
    return daysOfWeek.map(day => ({
      day,
      sessions: grouped[day]
    }));
  };

  const mapStudentToProfile = (student: Student): StudentProfile => {
    const fullName = `${student.firstName} ${student.lastName}`;
    const classLabel = student.classId?.name || 'N/A';
    const section = student.sectionId?.name || 'N/A';
    const avatar = student.profilePhoto || `https://ui-avatars.com/api/?name=${fullName}&background=random`;

    return {
  admissionNo: student.admissionNumber,
  rollNo: student.rollNumber || 'N/A',
  name: fullName,
  classLabel: `${classLabel}, ${section}`,
  status: (student.status === 'active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
  avatar,
  email: student.email || '',
  phone: student.phone || '',
  gender: student.gender || '',
  dateOfBirth: student.dateOfBirth || '',
  religion: student.religion || '',
  caste: student.caste || '',
  bloodGroup: student.bloodGroup || '',
  height: student.height,
  weight: student.weight,
  medicalHistory: student.medicalHistory || [],
  address: typeof student.address === 'string'
    ? { current: student.address, permanent: student.address, street: '', city: '', state: '', country: '', postalCode: '', pincode: '' }
    : student.address
      ? { current: `${student.address.street || ''}, ${student.address.city || ''}, ${student.address.state || ''} ${student.address.postalCode || student.address.pincode || ''}`.trim(), permanent: '', street: student.address.street || '', city: student.address.city || '', state: student.address.state || '', country: student.address.country || '', postalCode: student.address.postalCode || '', pincode: student.address.pincode || '' }
      : { current: '', permanent: '', street: '', city: '', state: '', country: '', postalCode: '', pincode: '' },
  parentName: student.parentName || 'N/A',
  parentPhone: student.parentPhone || '',
  parentEmail: student.parentEmail || '',
  documents: student.documents || [],
  personalInfo: {
    bloodGroup: '',
    religion: '',
    caste: '',
    category: '',
    motherTongue: '',
    languages: [],
    nationality: '',
    aadharNumber: undefined,
    passportNumber: undefined,
    state: '',
    city: '',
    pincode: '',
    country: ''
  },
  family: {
    father: {
      name: '',
      occupation: '',
      phone: '',
      email: '',
      avatar: ''
    },
    mother: {
      name: '',
      occupation: '',
      phone: '',
      email: '',
      avatar: ''
    },
    guardians: [],
    siblings: []
  },
  section: student.sectionId?.name || 'N/A',
  joinedOn: student.admissionDate || '',
  dob: student.dateOfBirth || ''
};
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    // Assuming time is in HH:mm format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSessionColorClass = (index: number) => {
    const colors = [
      'bg-light-300',
      'bg-light-200',
      'bg-light-100',
      'bg-info-transparent',
      'bg-success-transparent',
      'bg-warning-transparent'
    ];
    return colors[index % colors.length];
  };

  const getTeacherAvatar = (teacher?: Teacher) => {
    if (!teacher) return 'https://ui-avatars.com/api/?name=Teacher&background=random';
    
    if (teacher.avatar) return teacher.avatar;
    
    const fullName = `${teacher.firstName} ${teacher.lastName}`;
    return `https://ui-avatars.com/api/?name=${fullName}&background=random`;
  };

  const getTeacherName = (teacher?: Teacher) => {
    if (!teacher) return 'Not Assigned';
    return `${teacher.firstName} ${teacher.lastName}`;
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Student</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Student Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button">
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/students/edit/${id}`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Student
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading student data...</span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
            <h4 className="mb-3">{error}</h4>
            <button className="btn btn-primary" onClick={fetchStudentData}>
              <i className="ti ti-refresh me-2"></i>
              Retry
            </button>
          </div>
        </div>
      ) : !student ? (
        !id ? (
          <StudentSelector
            redirectPath="/students/timetable"
            title="Select Student for Timetable"
            description="Choose a student to view their class timetable"
          />
        ) : (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="ti ti-user-off fs-1 text-muted mb-3"></i>
              <h4 className="mb-3">Student not found</h4>
              <Link to="/students" className="btn btn-primary">
                <i className="ti ti-arrow-left me-2"></i>
                Back to Students
              </Link>
            </div>
          </div>
        )
      ) : (
        <div className="row">
          <div className="col-xxl-3 col-xl-4">
            <StudentSidebar profile={mapStudentToProfile(student)} />
          </div>
          <div className="col-xxl-9 col-xl-8">
            <StudentDetailTabs active="timetable" />

            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Time Table</h4>
                <div className="dropdown mb-3">
                  <button className="btn btn-outline-light border-white bg-white dropdown-toggle shadow-md" type="button">
                    <i className="ti ti-calendar-due me-2" />
                    This Year
                  </button>
                </div>
              </div>
              <div className="card-body">
                {timetable.length === 0 || timetable.every(day => day.sessions.length === 0) ? (
                  <div className="text-center py-5">
                    <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                    <h4 className="mb-3">No timetable available</h4>
                    <p className="text-muted">The timetable for this student has not been set up yet.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-nowrap overflow-auto">
                    {timetable.map((daySchedule) => (
                      <div className="d-flex flex-column me-4 flex-fill min-w-300" key={daySchedule.day}>
                        <div className="mb-3">
                          <h6>{daySchedule.day}</h6>
                        </div>
                        {daySchedule.sessions.length === 0 ? (
                          <div className="bg-light rounded p-3 mb-4">
                            <p className="text-muted mb-0">No classes scheduled</p>
                          </div>
                        ) : (
                          daySchedule.sessions.map((session, idx) => (
                            <div className={`${getSessionColorClass(idx)} rounded p-3 mb-4`} key={session._id}>
                              <p className="d-flex align-items-center text-nowrap mb-1">
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
                              <div className="bg-white rounded p-1 mt-3">
                                <Link 
                                  to={session.teacherId ? `/teachers/details/${session.teacherId._id}` : '#'} 
                                  className="text-muted d-flex align-items-center"
                                  onClick={(e) => !session.teacherId && e.preventDefault()}
                                >
                                  <span className="avatar avatar-sm me-2">
                                    <img 
                                      src={getTeacherAvatar(session.teacherId)} 
                                      alt={getTeacherName(session.teacherId)} 
                                    />
                                  </span>
                                  {getTeacherName(session.teacherId)}
                                </Link>
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
          </div>
        </div>
      )}
    </>
  );
};

export default StudentTimeTablePage;
