import { useState, useEffect } from 'react';
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
  const { teacherId } = useParams<{ teacherId: string }>();
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
  
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const schoolId = '507f1f77bcf86cd799439011'; // This should come from auth context

  useEffect(() => {
    if (teacherId) {
      fetchTeacherProfile();
      if (activeTab === 'leave') {
        fetchLeaveRecords();
      } else {
        fetchAttendanceRecords();
      }
    }
  }, [teacherId, activeTab]);

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

  const fetchLeaveRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/teachers/${teacherId}/leaves`, {
        params: { schoolId }
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
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/teachers/${teacherId}/attendance`, {
        params: { schoolId, limit: 100 }
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
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'danger';
      case 'late':
        return 'warning';
      case 'emergency':
        return 'info';
      default:
        return 'secondary';
    }
  };

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
          <h3 className="page-title mb-1">Teacher Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/teachers">Teachers</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Teacher Details
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
                    onClick={() => toast.info('Apply leave functionality coming soon')}
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
                    onClick={fetchAttendanceRecords}
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

              {/* Attendance Records */}
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                  <h4 className="mb-3">Attendance Records</h4>
                </div>
                <div className="card-body p-0 py-3">
                  {/* Empty State */}
                  {attendanceRecords.length === 0 && !loading && (
                    <div className="text-center py-5">
                      <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                      <h5 className="mb-2">No Attendance Records Found</h5>
                      <p className="text-muted mb-4">No attendance records available for this teacher</p>
                    </div>
                  )}

                  {/* Attendance Table */}
                  {attendanceRecords.length > 0 && (
                    <div className="custom-datatable-filter table-responsive">
                      <table className="table">
                        <thead className="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map((record) => (
                            <tr key={record._id}>
                              <td>{formatDate(record.date)}</td>
                              <td>
                                <span className={`badge badge-soft-${getAttendanceColor(record.status)} d-inline-flex align-items-center`}>
                                  <i className="ti ti-circle-filled fs-5 me-1" />
                                  {record.status}
                                </span>
                              </td>
                              <td>{record.checkIn || 'N/A'}</td>
                              <td>{record.checkOut || 'N/A'}</td>
                              <td>{record.remarks || '-'}</td>
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
    </>
  );
};

export default TeacherLeavesPage;
