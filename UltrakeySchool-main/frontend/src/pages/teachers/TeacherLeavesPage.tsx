import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import TeacherDetailTabs from '../../components/teachers/TeacherDetailTabs';

interface LeaveRecord {
  _id: string;
  leaveType: 'sick' | 'casual' | 'earned' | 'maternity' | 'paternity' | 'unpaid' | 'emergency' | 'other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedDate?: string;
  reviewComments?: string;
}

interface LeaveStats {
  pending: { count: number; days: number };
  approved: { count: number; days: number };
  rejected: { count: number; days: number };
  cancelled: { count: number; days: number };
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'emergency';
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  emergency: number;
  total: number;
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

const TeacherLeavesPage = () => {
  const { teacherId: urlTeacherId } = useParams<{ teacherId: string }>();
  const [resolvedTeacherId, setResolvedTeacherId] = useState<string | null>(null);
  const teacherId = resolvedTeacherId;
  const isSelfView = !urlTeacherId;
  const [activeTab, setActiveTab] = useState<'leave' | 'attendance'>('leave');
  
  // Leave state
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    pending: { count: 0, days: 0 },
    approved: { count: 0, days: 0 },
    rejected: { count: 0, days: 0 },
    cancelled: { count: 0, days: 0 }
  });
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    emergency: 0,
    total: 0
  });
  
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
  const [applyingLeave, setApplyingLeave] = useState(false);

  // Get institutionId from localStorage user data
  const getInstitutionId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.institutionId || user.institutionId || user.school || user.institutionId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return null;
  };

  const institutionId = getInstitutionId();

  useEffect(() => {
    const resolveId = async () => {
      if (urlTeacherId) {
        setResolvedTeacherId(urlTeacherId);
      } else {
        try {
          const response = await apiClient.get('/dashboard/teacher');
          if (response.data.success && response.data.data?.teacher) {
            const id = response.data.data.teacher.id || response.data.data.teacher._id;
            setResolvedTeacherId(id);
          } else {
            setLoading(false);
          }
        } catch (err: any) {
          setLoading(false);
        }
      }
    };
    resolveId();
  }, [urlTeacherId]);

  useEffect(() => {
    if (teacherId) {
      fetchTeacherProfile();
      if (activeTab === 'leave') {
        fetchLeaveRecords();
      } else {
        fetchAttendanceRecords(calendarMonth, calendarYear);
      }
    }
  }, [teacherId, activeTab]);

  useEffect(() => {
    if (teacherId && activeTab === 'attendance') {
      fetchAttendanceRecords(calendarMonth, calendarYear);
    }
  }, [calendarMonth, calendarYear]);

  const fetchTeacherProfile = async () => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      if (response.data.success) {
        setTeacherProfile(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch teacher profile:', error);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setTeacherProfile({
            _id: user.id || user._id,
            firstName: user.name || user.fullName || '',
            lastName: '',
            email: user.email || '',
            phone: '',
            department: '',
            designation: 'Teacher',
          });
        } catch { /* empty */ }
      }
    }
  };

  const fetchLeaveRecords = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/teachers/${teacherId}/leaves`, {
        params: { institutionId }
      });

      if (response.data.success) {
        setLeaveRecords(response.data.data.leaves || []);
        setLeaveStats(response.data.data.stats || {
          pending: { count: 0, days: 0 },
          approved: { count: 0, days: 0 },
          rejected: { count: 0, days: 0 },
          cancelled: { count: 0, days: 0 }
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch leave records';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async (targetMonth?: number, targetYear?: number) => {
    try {
      setLoading(true);
      const m = targetMonth ?? calendarMonth;
      const y = targetYear ?? calendarYear;
      const startDate = new Date(y, m, 1).toISOString().split('T')[0];
      const endDate = new Date(y, m + 1, 0).toISOString().split('T')[0];
      const response = await apiClient.get(`/teachers/${teacherId}/attendance`, {
        params: { institutionId, startDate, endDate, limit: 31 }
      });

      if (response.data.success) {
        setAttendanceRecords(response.data.data.records || []);
        setAttendanceStats(response.data.data.stats || {
          present: 0,
          absent: 0,
          late: 0,
          emergency: 0,
          total: 0
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch attendance records';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getLeaveTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      sick: 'badge-soft-warning',
      casual: 'badge-soft-info',
      earned: 'badge-soft-success',
      maternity: 'badge-soft-purple',
      paternity: 'badge-soft-purple',
      unpaid: 'badge-soft-danger',
      emergency: 'badge-soft-danger',
      other: 'badge-soft-secondary'
    };
    return typeMap[type] || 'badge-soft-secondary';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'rejected':
        return 'badge-soft-danger';
      case 'cancelled':
        return 'badge-soft-secondary';
      default:
        return 'badge-soft-secondary';
    }
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth, calendarYear]);

  const attendanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const rec of attendanceRecords) {
      const d = new Date(rec.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = rec.status;
    }
    return map;
  }, [attendanceRecords]);

  const getDayStatus = (day: number) => {
    return attendanceMap[`${calendarYear}-${calendarMonth}-${day}`] || null;
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Loading state
  if (loading && (activeTab === 'leave' ? leaveRecords.length === 0 : attendanceRecords.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{isSelfView ? 'My Leaves' : 'Teacher Details'}</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              {!isSelfView && (
                <li className="breadcrumb-item">
                  <Link to="/dashboard/teacher">Teachers</Link>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">
                {isSelfView ? 'Leaves' : 'Teacher Details'}
              </li>
            </ol>
          </nav>
        </div>
        {!isSelfView && (
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <button className="btn btn-light me-2 mb-2" type="button">
              <i className="ti ti-lock me-2" />
              Login Details
            </button>
            <Link to={`/dashboard/teacher/edit/${teacherId}`} className="btn btn-primary d-flex align-items-center mb-2">
              <i className="ti ti-edit-circle me-2" />
              Edit Teacher
            </Link>
          </div>
        )}
      </div>

      <div className="row">
        {teacherProfile && !isSelfView && (
          <div className="col-xxl-3 col-xl-4">
            {/* Teacher Profile Sidebar */}
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
          </div>
        )}
        <div className={isSelfView ? 'col-12' : 'col-xxl-9 col-xl-8'}>
          <TeacherDetailTabs active="leaves" />

          {/* Tab Navigation */}
          <div className="card mb-4">
            <div className="card-body pb-1">
              <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded-fill">
                <li className="me-3 mb-3">
                  <button
                    className={`nav-link rounded fs-12 fw-semibold ${activeTab === 'leave' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('leave')}
                  >
                    Leaves
                  </button>
                </li>
                <li className="mb-3">
                  <button
                    className={`nav-link rounded fs-12 fw-semibold ${activeTab === 'attendance' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab('attendance')}
                  >
                    Attendance
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Leave Tab */}
          {activeTab === 'leave' && (
            <div className="tab-pane fade show active">
              {/* Leave Statistics */}
              <div className="row gx-3">
                <div className="col-lg-6 col-xxl-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <h5 className="mb-2">Approved ({leaveStats.approved.count})</h5>
                      <div className="d-flex align-items-center flex-wrap">
                        <p className="mb-0">Total Days: {leaveStats.approved.days}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <h5 className="mb-2">Pending ({leaveStats.pending.count})</h5>
                      <div className="d-flex align-items-center flex-wrap">
                        <p className="mb-0">Total Days: {leaveStats.pending.days}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <h5 className="mb-2">Rejected ({leaveStats.rejected.count})</h5>
                      <div className="d-flex align-items-center flex-wrap">
                        <p className="mb-0">Total Days: {leaveStats.rejected.days}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <h5 className="mb-2">Cancelled ({leaveStats.cancelled.count})</h5>
                      <div className="d-flex align-items-center flex-wrap">
                        <p className="mb-0">Total Days: {leaveStats.cancelled.days}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Records Table */}
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                  <h4 className="mb-3">Leaves</h4>
                  <button 
                    className="btn btn-primary d-inline-flex align-items-center mb-3" 
                    type="button"
                    onClick={() => setShowApplyLeave(true)}
                  >
                    <i className="ti ti-calendar-event me-2" />
                    Apply Leave
                  </button>
                </div>
                <div className="card-body p-0 py-3">
                  {/* Empty State */}
                  {leaveRecords.length === 0 && !loading && (
                    <div className="text-center py-5">
                      <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                      <h5 className="mb-2">No Leave Records Found</h5>
                      <p className="text-muted mb-4">This teacher has not applied for any leaves yet</p>
                    </div>
                  )}

                  {/* Leave Table */}
                  {leaveRecords.length > 0 && (
                    <div className="custom-datatable-filter table-responsive">
                      <table className="table">
                        <thead className="thead-light">
                          <tr>
                            <th>Leave Type</th>
                            <th>Leave Date</th>
                            <th>No of Days</th>
                            <th>Applied On</th>
                            <th>Status</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveRecords.map((record) => (
                            <tr key={record._id}>
                              <td>
                                <span className={`badge ${getLeaveTypeBadge(record.leaveType)}`}>
                                  {record.leaveType}
                                </span>
                              </td>
                              <td>{formatDateRange(record.startDate, record.endDate)}</td>
                              <td>{record.totalDays}</td>
                              <td>{formatDate(record.appliedDate)}</td>
                              <td>
                                <span className={`badge ${getStatusBadge(record.status)} d-inline-flex align-items-center`}>
                                  <i className="ti ti-circle-filled fs-5 me-1" />
                                  {record.status}
                                </span>
                              </td>
                              <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                {record.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="tab-pane fade show active">
              {/* Attendance Statistics */}
              <div className="card mb-4">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-1">
                  <h4 className="mb-3">Attendance Summary</h4>
                  <button 
                    className="btn btn-outline-light bg-white mb-3"
                    onClick={() => fetchAttendanceRecords()}
                  >
                    <i className="ti ti-refresh me-2" />
                    Refresh
                  </button>
                </div>
                <div className="card-body pb-1">
                  <div className="row">
                    <div className="col-md-6 col-xxl-3 d-flex">
                      <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill">
                        <span className="avatar avatar-lg bg-success-transparent rounded me-2 flex-shrink-0 text-success">
                          <i className="ti ti-checks fs-24" />
                        </span>
                        <div className="ms-2">
                          <p className="mb-1">Present</p>
                          <h5>{attendanceStats.present}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-xxl-3 d-flex">
                      <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill">
                        <span className="avatar avatar-lg bg-danger-transparent rounded me-2 flex-shrink-0 text-danger">
                          <i className="ti ti-x fs-24" />
                        </span>
                        <div className="ms-2">
                          <p className="mb-1">Absent</p>
                          <h5>{attendanceStats.absent}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-xxl-3 d-flex">
                      <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill">
                        <span className="avatar avatar-lg bg-warning-transparent rounded me-2 flex-shrink-0 text-warning">
                          <i className="ti ti-clock-x fs-24" />
                        </span>
                        <div className="ms-2">
                          <p className="mb-1">Late</p>
                          <h5>{attendanceStats.late}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-xxl-3 d-flex">
                      <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill">
                        <span className="avatar avatar-lg bg-info-transparent rounded me-2 flex-shrink-0 text-info">
                          <i className="ti ti-calendar-event fs-24" />
                        </span>
                        <div className="ms-2">
                          <p className="mb-1">Emergency</p>
                          <h5>{attendanceStats.emergency}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Attendance Calendar */}
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <button className="btn btn-outline-light bg-white btn-icon" onClick={() => {
                      if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                      else setCalendarMonth(m => m - 1);
                    }} title="Previous month">
                      <i className="ti ti-chevron-left"></i>
                    </button>
                    <h4 className="mb-0">{monthNames[calendarMonth]} {calendarYear}</h4>
                    <button className="btn btn-outline-light bg-white btn-icon" onClick={() => {
                      if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                      else setCalendarMonth(m => m + 1);
                    }} title="Next month">
                      <i className="ti ti-chevron-right"></i>
                    </button>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge bg-success">Present</span>
                    <span className="badge bg-danger">Absent</span>
                    <span className="badge bg-warning text-dark">Late</span>
                    <span className="badge bg-info">Emergency</span>
                  </div>
                </div>
                <div className="card-body">
                  {attendanceRecords.length === 0 && !loading ? (
                    <div className="text-center py-5">
                      <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                      <h5 className="mb-2">No Attendance Records Found</h5>
                      <p className="text-muted mb-4">No attendance records available for this month</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered text-center mb-0">
                        <thead className="thead-light">
                          <tr>
                            <th className="fw-semibold">Sun</th>
                            <th className="fw-semibold">Mon</th>
                            <th className="fw-semibold">Tue</th>
                            <th className="fw-semibold">Wed</th>
                            <th className="fw-semibold">Thu</th>
                            <th className="fw-semibold">Fri</th>
                            <th className="fw-semibold">Sat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIdx) => (
                            <tr key={weekIdx}>
                              {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => (
                                <td key={dayIdx} className="p-2" style={{ height: '60px', width: '14.28%', verticalAlign: 'middle' }}>
                                  {day !== null && (
                                    <div className={`d-inline-flex align-items-center justify-content-center rounded-circle ${(() => {
                                      const status = getDayStatus(day);
                                      if (!status) return 'bg-light text-muted';
                                      switch (status) {
                                        case 'present': return 'bg-success text-white';
                                        case 'absent': return 'bg-danger text-white';
                                        case 'late': return 'bg-warning text-dark';
                                        case 'emergency': return 'bg-info text-white';
                                        default: return 'bg-light text-muted';
                                      }
                                    })()}`} style={{ width: '36px', height: '36px', fontSize: '14px', fontWeight: 600 }}>
                                      {day}
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyLeave && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply Leave</h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyLeave(false)} disabled={applyingLeave} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm(f => ({ ...f, leaveType: e.target.value }))} disabled={applyingLeave}>
                    <option value="sick">Sick</option>
                    <option value="casual">Casual</option>
                    <option value="earned">Earned</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm(f => ({ ...f, startDate: e.target.value }))} disabled={applyingLeave} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm(f => ({ ...f, endDate: e.target.value }))} disabled={applyingLeave} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea className="form-control" rows={3} value={leaveForm.reason}
                    onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))} disabled={applyingLeave} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyLeave(false)} disabled={applyingLeave}>Cancel</button>
                <button type="button" className="btn btn-primary" disabled={applyingLeave} onClick={async () => {
                  if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
                    toast.error('Please fill all required fields');
                    return;
                  }
                  try {
                    setApplyingLeave(true);
                    const res = await apiClient.post(`/teachers/${teacherId}/leaves`, {
                      leaveType: leaveForm.leaveType,
                      startDate: leaveForm.startDate,
                      endDate: leaveForm.endDate,
                      reason: leaveForm.reason,
                    });
                    if (res.data.success) {
                      toast.success('Leave applied successfully');
                      setShowApplyLeave(false);
                      setLeaveForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
                      fetchLeaveRecords();
                    }
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to apply leave');
                  } finally {
                    setApplyingLeave(false);
                  }
                }}>
                  {applyingLeave ? 'Applying...' : 'Apply Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherLeavesPage;
