import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  studentId?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
}

interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  avatar?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  holiday: number;
  total: number;
  percentage: number;
  records: AttendanceRecord[];
}

const AttendanceReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('attendance-report');
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceSummary[]>([]);
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    name: '',
    gender: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        schoolId,
        userType: 'student',
        limit: 100
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await apiClient.get('/attendance/staff', { 
        params: {
          schoolId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          format: 'json'
        }
      });

      if (response.data.success) {
        const records = response.data.data.attendance || [];
        
        // Group by student and calculate summary
        const studentMap = new Map<string, StudentAttendanceSummary>();
        
        records.forEach((record: AttendanceRecord) => {
          const studentId = record.userId._id;
          
          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              studentId,
              studentName: record.userId.name,
              avatar: record.userId.avatar,
              present: 0,
              absent: 0,
              late: 0,
              halfDay: 0,
              holiday: 0,
              total: 0,
              percentage: 0,
              records: []
            });
          }
          
          const summary = studentMap.get(studentId)!;
          summary.records.push(record);
          summary.total++;
          
          switch (record.status) {
            case 'present':
              summary.present++;
              break;
            case 'absent':
              summary.absent++;
              break;
            case 'late':
              summary.late++;
              break;
            case 'half-day':
              summary.halfDay++;
              break;
            case 'holiday':
              summary.holiday++;
              break;
          }
          
          // Calculate percentage (excluding holidays)
          const workingDays = summary.total - summary.holiday;
          if (workingDays > 0) {
            summary.percentage = Math.round(
              ((summary.present + summary.late + summary.halfDay * 0.5) / workingDays) * 100
            );
          }
        });
        
        setAttendanceData(Array.from(studentMap.values()));
      }
    } catch (err: any) {
      console.error('Error fetching attendance report:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load attendance report';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceReport();
  }, []);

  const handleRefresh = () => {
    fetchAttendanceReport();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttendanceReport();
  };

  const resetFilters = () => {
    setFilters({
      class: '',
      section: '',
      name: '',
      gender: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    fetchAttendanceReport();
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success';
      case 'absent': return 'bg-danger';
      case 'late': return 'bg-pending';
      case 'half-day': return 'bg-dark';
      case 'holiday': return 'bg-info';
      default: return 'bg-light';
    }
  };

  const getDaysInMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getAttendanceForDate = (records: AttendanceRecord[], day: number) => {
    const date = new Date();
    date.setDate(day);
    const dateStr = date.toISOString().split('T')[0];
    
    return records.find(r => r.date.startsWith(dateStr));
  };

  return (
    <>

        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Attendance Report</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Report</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Attendance Report</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={() => window.print()}
                title="Print"
              >
                <i className="ti ti-printer"></i>
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <button
                className="btn btn-light fw-medium d-inline-flex align-items-center"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-file-export me-2"></i>Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* /Page Header */}

        {/* Filter Section */}
        <div className="filter-wrapper">
          {/* List Tab */}
          <div className="list-tab">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <Link
                  to="#"
                  className={`nav-link ${activeTab === 'attendance-report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance-report')}
                >
                  Attendance Report
                </Link>
              </li>
              <li className="nav-item">
                <Link to="#" className="nav-link">Students Attendance Type</Link>
              </li>
              <li className="nav-item">
                <Link to="#" className="nav-link">Student Day Wise</Link>
              </li>
               <li className="nav-item">
                <Link to="#" className="nav-link">Teacher Day Wise</Link>
              </li>
               <li className="nav-item">
                <Link to="#" className="nav-link">Teacher Report</Link>
              </li>
               <li className="nav-item">
                <Link to="#" className="nav-link">Staff Day Wise</Link>
               </li>
               <li className="nav-item">
                <Link to="#" className="nav-link">Staff Report </Link>
              </li>
              
              {/* Add more tabs as needed */}
            </ul>
          </div>
          {/* /List Tab */}
        </div>
        {/* /Filter Section */}

        {/* Attendance Types */}
        <div className="attendance-types page-header justify-content-end mb-4">
          <ul className="attendance-type-list d-flex flex-wrap gap-3">
            <li className="d-flex align-items-center">
              <span className="attendance-icon bg-success me-1"><i className="ti ti-checks"></i></span>
              Present
            </li>
            <li className="d-flex align-items-center">
              <span className="attendance-icon bg-danger me-1"><i className="ti ti-x"></i></span>
              Absent
            </li>
            <li className="d-flex align-items-center">
              <span className="attendance-icon bg-pending me-1"><i className="ti ti-clock-x"></i></span>
              Late
            </li>
            <li className="d-flex align-items-center">
              <span className="attendance-icon bg-dark me-1"><i className="ti ti-calendar-event"></i></span>
              Halfday
            </li>
            <li className="d-flex align-items-center">
              <span className="attendance-icon bg-info me-1"><i className="ti ti-clock-up"></i></span>
              Holiday
            </li>
          </ul>
        </div>

        {/* Attendance List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Attendance Report</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control date-range bookingrange" 
                  placeholder="Select"
                  defaultValue="Academic Year : 2024 / 2025" 
                />
              </div>
              <div className="dropdown mb-3 me-2">
                <button
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
              </div>
              <div className="dropdown mb-3">
                <button
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <button className="dropdown-item rounded-1 active">
                      Ascending
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Descending
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filter Dropdown */}
          {showFilter && (
            <div className="p-3 border-bottom">
              <form onSubmit={handleApplyFilters}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">End Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <select 
                        className="form-select"
                        name="class"
                        value={filters.class}
                        onChange={handleFilterChange}
                      >
                        <option value="">Select</option>
                        <option>I</option>
                        <option>II</option>
                        <option>III</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Section</label>
                      <select 
                        className="form-select"
                        name="section"
                        value={filters.section}
                        onChange={handleFilterChange}
                      >
                        <option value="">Select</option>
                        <option>A</option>
                        <option>B</option>
                        <option>C</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <select 
                        className="form-select"
                        name="gender"
                        value={filters.gender}
                        onChange={handleFilterChange}
                      >
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select 
                        className="form-select"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                      >
                        <option value="">Select</option>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button 
                    type="button" 
                    className="btn btn-light me-2"
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary">Apply</button>
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading attendance report...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
                <button
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchAttendanceReport}
                >
                  <i className="ti ti-refresh me-1"></i>Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && attendanceData.length === 0 && (
            <div className="card-body text-center py-5">
              <i className="ti ti-calendar-stats" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No attendance records found</p>
            </div>
          )}

          {/* Attendance Table */}
          {!loading && !error && attendanceData.length > 0 && (
          <div className="card-body">
  <div className="table-responsive">
    <table className="table datatable">
      <thead className="thead-light">
        <tr>
          <th>Student / Date</th>
          <th>%</th>
          <th className="no-sort">P</th>
          <th className="no-sort">L</th>
          <th className="no-sort">A</th>
          <th className="no-sort">H</th>
          <th className="no-sort">Hol</th>
          {Array.from({ length: Math.min(getDaysInMonth(), 23) }, (_, i) => {
            const date = new Date();
            date.setDate(i + 1);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
            return (
              <th key={i} className="no-sort">
                <div className="text-center">
                  <span className="day-num d-block">{String(i + 1).padStart(2, '0')}</span>
                  <span>{day}</span>
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {attendanceData.map((student) => (
          <tr key={student.studentId}>
            <td>
              <div className="d-flex align-items-center">
                {student.avatar ? (
                  <img 
                    src={student.avatar} 
                    className="avatar avatar-md rounded-circle me-2" 
                    alt={student.studentName} 
                  />
                ) : (
                  <div className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center">
                    <i className="ti ti-user fs-16 text-muted"></i>
                  </div>
                )}
                <span>{student.studentName}</span>
              </div>
            </td>
            <td>
              <span className={`badge ${student.percentage >= 90 ? 'badge-soft-success' : student.percentage >= 75 ? 'badge-soft-info' : 'badge-soft-warning'}`}>
                {student.percentage}%
              </span>
            </td>
            <td>{student.present}</td>
            <td>{student.late}</td>
            <td>{student.absent}</td>
            <td>{student.halfDay}</td>
            <td>{student.holiday}</td>
            {Array.from({ length: Math.min(getDaysInMonth(), 23) }, (_, i) => {
              const att = getAttendanceForDate(student.records, i + 1);
              return (
                <td key={i}>
                  {att ? (
                    <span 
                      className={`attendance-range ${getStatusClass(att.status)}`}
                      title={`${att.date}: ${att.status}`}
                    ></span>
                  ) : (
                    <span className="attendance-range bg-light"></span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
          )}
        </div>
        {/* /Attendance List */}

    </>
  );
};

export default AttendanceReportPage;