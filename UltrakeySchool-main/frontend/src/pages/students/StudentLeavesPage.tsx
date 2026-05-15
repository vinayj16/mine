import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentService } from '../../services/studentService';
import StudentSelector from '../../components/students/StudentSelector';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  class: string;
  section?: string;
  rollNumber: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveRecord {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  appliedDate: string;
  reviewedDate?: string;
  reviewComments?: string;
}

interface LeaveSummary {
  sick: { total: number; used: number; available: number };
  casual: { total: number; used: number; available: number };
  emergency: { total: number; used: number; available: number };
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day' | 'sick' | 'leave';
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  markedBy: string;
}

interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  halfDay: number;
  sick: number;
  leave: number;
  percentage: number;
  month: string;
  year: string;
}

const StudentLeavesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'leave' | 'attendance'>('leave');
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const student = await studentService.getById(id);
      setStudent(student);
    } catch (err: any) {
      console.error('Error fetching student:', err);
      const errorMessage = err.message || 'Failed to load student details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    if (!id) return;

    try {
      setLeavesLoading(true);

      const leavesData = await studentService.getLeaves(id, {
        status: 'pending',
        limit: 10
      });
      
      setLeaves(leavesData.data || []);
      setLeaveSummary(leavesData.summary || {
        sick: { total: 0, used: 0, available: 0 },
        casual: { total: 0, used: 0, available: 0 },
        emergency: { total: 0, used: 0, available: 0 }
      });
    } catch (err: any) {
      console.error('Error fetching leaves:', err);
      toast.error(err.message || 'Failed to load leave records');
    } finally {
      setLeavesLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!id) return;

    try {
      setAttendanceLoading(true);

      const attendanceData = await studentService.getAttendance(id, {
        limit: 30
      });
      
      setAttendance(attendanceData.data || []);
      setAttendanceSummary(attendanceData.summary || {
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        halfDay: 0,
        sick: 0,
        leave: 0,
        percentage: 0,
        month: '',
        year: ''
      });
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      toast.error(err.message || 'Failed to load attendance records');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (student) {
      fetchLeaves();
      fetchAttendance();
    }
  }, [student]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return 'N/A';
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'rejected':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !student) {
    if (!id && !error) {
      return (
        <StudentSelector
          redirectPath="/students/leaves"
          title="Select Student for Leaves"
          description="Choose a student to view their leave records"
        />
      );
    }
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">{error || 'Student not found'}</h4>
          <button className="btn btn-primary" onClick={fetchStudent}>
            <i className="ti ti-refresh me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const classLabel = [student.class, student.section].filter(Boolean).join(', ') || 'N/A';

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Leaves & Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Students</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Leaves & Attendance
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

      <div className="row">
        {/* Sidebar */}
        <div className="col-xxl-3 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="border-bottom pb-3 mb-3">
                <div className="text-center">
                  <div className="avatar avatar-xxl mb-3">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${fullName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={fullName} 
                    />
                  </div>
                  <h5 className="mb-1">{fullName}</h5>
                  <p className="text-muted mb-2">{classLabel}</p>
                  <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {capitalize(student.status)}
                  </span>
                </div>
              </div>

              <div>
                <h6 className="mb-3">Basic Information</h6>
                <div className="mb-2">
                  <p className="text-muted mb-1">Admission No</p>
                  <p className="fw-medium mb-0">{student.id}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Roll No</p>
                  <p className="fw-medium mb-0">{student.rollNumber || 'N/A'}</p>
                </div>
                {student.email && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Email</p>
                    <p className="fw-medium mb-0">{student.email}</p>
                  </div>
                )}
                {student.phone && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Phone</p>
                    <p className="fw-medium mb-0">{student.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-xxl-9 col-xl-8">
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

          {activeTab === 'leave' ? (
            <div className="tab-pane fade show active">
              {/* Leave Summary */}
              <div className="row gx-3">
                {leaveSummary.map((summary) => (
                  <div className="col-lg-6 col-xxl-3 d-flex" key={summary.leaveType}>
                    <div className="card flex-fill">
                      <div className="card-body">
                        <h5 className="mb-2">
                          {summary.leaveType} ({summary.total})
                        </h5>
                        <div className="d-flex align-items-center flex-wrap">
                          <p className="border-end pe-2 me-2 mb-0">Used: {summary.used}</p>
                          <p className="mb-0">Available: {summary.available}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leave Records */}
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                  <h4 className="mb-3">Leave Records</h4>
                  <button 
                    className="btn btn-primary d-inline-flex align-items-center mb-3" 
                    type="button"
                    onClick={() => setShowApplyLeaveModal(true)}
                  >
                    <i className="ti ti-calendar-event me-2" />
                    Apply Leave
                  </button>
                </div>
                <div className="card-body p-0 py-3">
                  {leavesLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading leaves...</span>
                      </div>
                    </div>
                  ) : leaves.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                      <h5 className="text-muted">No leave records found</h5>
                      <p className="text-muted">No leaves have been applied yet.</p>
                    </div>
                  ) : (
                    <div className="custom-datatable-filter table-responsive">
                      <table className="table">
                        <thead className="thead-light">
                          <tr>
                            <th>Leave Type</th>
                            <th>Leave Date</th>
                            <th>No of Days</th>
                            <th>Applied On</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaves.map((record) => (
                            <tr key={record._id}>
                              <td className="text-dark">{record.leaveType}</td>
                              <td>{formatDateRange(record.startDate, record.endDate)}</td>
                              <td>{record.numberOfDays}</td>
                              <td>{formatDate(record.appliedOn)}</td>
                              <td>
                                <span className={`badge ${getStatusBadge(record.status)} d-inline-flex align-items-center`}>
                                  <i className="ti ti-circle-filled fs-5 me-1" />
                                  {capitalize(record.status)}
                                </span>
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
          ) : (
            <div className="tab-pane fade show active">
              {/* Attendance Summary */}
              <div className="card mb-4">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-1">
                  <h4 className="mb-3">Attendance Summary</h4>
                  <div className="d-flex align-items-center flex-wrap">
                    <p className="text-dark mb-3 me-2">Last Updated: {formatDate(new Date().toISOString())}</p>
                    <button 
                      className="btn btn-primary btn-icon btn-sm rounded-circle p-0 mb-3" 
                      type="button"
                      onClick={fetchAttendance}
                    >
                      <i className="ti ti-refresh-dot" />
                    </button>
                  </div>
                </div>
                <div className="card-body pb-1">
                  {attendanceLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading attendance...</span>
                      </div>
                    </div>
                  ) : attendanceSummary ? (
                    <div className="row">
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill w-100">
                          <span className="avatar avatar-lg bg-primary-transparent rounded me-2 flex-shrink-0 text-primary">
                            <i className="ti ti-calendar fs-24" />
                          </span>
                          <div className="ms-2">
                            <p className="mb-1">Total Days</p>
                            <h5>{attendanceSummary.totalDays}</h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill w-100">
                          <span className="avatar avatar-lg bg-success-transparent rounded me-2 flex-shrink-0 text-success">
                            <i className="ti ti-checks fs-24" />
                          </span>
                          <div className="ms-2">
                            <p className="mb-1">Present</p>
                            <h5>{attendanceSummary.present}</h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill w-100">
                          <span className="avatar avatar-lg bg-danger-transparent rounded me-2 flex-shrink-0 text-danger">
                            <i className="ti ti-x fs-24" />
                          </span>
                          <div className="ms-2">
                            <p className="mb-1">Absent</p>
                            <h5>{attendanceSummary.absent}</h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center rounded border p-3 mb-3 flex-fill w-100">
                          <span className="avatar avatar-lg bg-warning-transparent rounded me-2 flex-shrink-0 text-warning">
                            <i className="ti ti-clock-x fs-24" />
                          </span>
                          <div className="ms-2">
                            <p className="mb-1">Late</p>
                            <h5>{attendanceSummary.late}</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Attendance Records */}
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-1">
                  <h4 className="mb-3">Attendance Records</h4>
                  <div className="dropdown mb-3">
                    <button className="btn btn-outline-light border-white bg-white dropdown-toggle shadow-md" type="button">
                      <i className="ti ti-calendar-due me-2" />
                      This Year
                    </button>
                  </div>
                </div>
                <div className="card-body p-0 py-3">
                  {attendanceLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading attendance...</span>
                      </div>
                    </div>
                  ) : attendance.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="ti ti-calendar-off fs-1 text-muted mb-3"></i>
                      <h5 className="text-muted">No attendance records found</h5>
                      <p className="text-muted">No attendance has been recorded yet.</p>
                    </div>
                  ) : (
                    <div className="custom-datatable-filter table-responsive">
                      <table className="table">
                        <thead className="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.slice(0, 50).map((record) => (
                            <tr key={record._id}>
                              <td>{formatDate(record.date)}</td>
                              <td>
                                <span className={`badge ${getStatusBadge(record.status)} d-inline-flex align-items-center`}>
                                  <i className="ti ti-circle-filled fs-5 me-1" />
                                  {capitalize(record.status)}
                                </span>
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
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyLeaveModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply Leave - {fullName}</h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyLeaveModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Leave Type *</label>
                      <select className="form-select">
                        <option value="">Select Leave Type</option>
                        <option value="sick">Sick Leave</option>
                        <option value="casual">Casual Leave</option>
                        <option value="medical">Medical Leave</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Number of Days *</label>
                      <input type="number" className="form-control" placeholder="Enter number of days" min="1" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date *</label>
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">End Date *</label>
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Reason *</label>
                      <textarea className="form-control" rows={3} placeholder="Enter reason for leave"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyLeaveModal(false)}>
                  <i className="ti ti-x me-2"></i>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="ti ti-check me-2"></i>
                  Apply Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentLeavesPage;
