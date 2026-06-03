import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { getUser } from '../../utils/auth';
import attendanceService from '../../services/attendanceService';
import apiClient from '../../api/client';

interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  avatar: string;
  className: string;
  section: string;
  attendance: 'present' | 'late' | 'absent' | 'holiday' | 'halfday';
  notes: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  attendance: string;
  status: string;
  notes: string;
  studentName?: string;
  className?: string;
  section?: string;
}

interface ClassGroup {
  className: string;
  section: string;
  students: Student[];
  collapsed: boolean;
}

const ATTENDANCE_OPTIONS = ['present', 'late', 'absent', 'holiday', 'halfday'] as const;

const StudentAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const urlStudentId = searchParams.get('studentId') || '';
  const user = getUser();
  const isStudentRole = user?.role === 'student';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyTotal, setHistoryTotal] = useState(0);

  const targetStudentId = urlStudentId || '';
  const isSingleStudent = !!(targetStudentId || isStudentRole);

  useEffect(() => {
    if (isSingleStudent) {
      fetchSingleStudentAttendance();
    } else {
      fetchBulkAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetStudentId, isStudentRole, selectedDate, historyDateFrom, historyDateTo]);

  const fetchSingleStudentAttendance = async () => {
    try {
      setLoading(true);
      let sid = targetStudentId;

      if (!sid && isStudentRole) {
        const profileRes = await apiClient.get('/students/me');
        const studentData = profileRes.data.data;
        setHistoryStudent(studentData);
        sid = studentData._id;
      }

      const params: any = { limit: 100 };
      if (historyDateFrom && historyDateTo) {
        params.dateFrom = historyDateFrom;
        params.dateTo = historyDateTo;
      }

      const res = await apiClient.get(`/student-attendance/student/${sid}`, { params });
      const result = res.data?.data || { records: [], pagination: { total: 0 } };
      setHistoryRecords(result.records || []);
      setHistoryTotal(result.pagination?.total || 0);
    } catch (error: any) {
      console.error('Error fetching student attendance history:', error);
      toast.error(error.message || 'Failed to fetch attendance history');
      setHistoryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkAttendance = async () => {
    try {
      setLoading(true);

      const user = getUser();
      const institutionId = user?.institutionId || '';

      let assignedClassNames: Set<string> | null = null;

      if (user?.role === 'teacher') {
        try {
          const teacherRes = await apiClient.get(`/teachers/${user.id}`);
          const teacherData = teacherRes.data?.data || teacherRes.data;
          assignedClassNames = new Set<string>();
          for (const entry of teacherData?.classes || []) {
            const cn = entry.classId?.name || entry.classId?.toString() || '';
            if (cn) assignedClassNames.add(cn);
          }
          if (assignedClassNames.size === 0) assignedClassNames = null;
        } catch {
          console.log('Could not fetch teacher assignments');
        }
      }

      const { default: apiService } = await import('../../services/api');
      const studentsRes = await apiService.get('/students/institution', { institutionId, limit: 500 }) as any;
      const studentsData = studentsRes.data || studentsRes;
      let freshStudents: any[] = Array.isArray(studentsData) ? studentsData : (studentsData.data || []);

      if (assignedClassNames) {
        freshStudents = freshStudents.filter((s: any) =>
          assignedClassNames!.has(s.class || s.className || '')
        );
      }

      const attendanceMap: Record<string, any> = {};
      try {
        const attRes = await apiClient.get('/student-attendance', { params: { date: selectedDate } });
        const attResult = attRes.data?.data || { records: [] };
        const attRecords = attResult.records || attResult || [];
        for (const rec of attRecords) {
          const sid = rec.studentId?._id || rec.studentId || rec.id || rec._id;
          if (sid) attendanceMap[sid.toString()] = rec;
        }
      } catch {
        // No existing attendance records for this date
      }

      const transformedData: Student[] = freshStudents.map((student: any) => {
        const studentId = student._id?.toString() || '';
        const existing = attendanceMap[studentId];
        return {
          id: studentId,
          admissionNo: student.admissionNumber || student.admissionNo || 'N/A',
          rollNo: student.rollNumber || student.rollNo || 'N/A',
          name: (() => {
            const n = student.fullName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '';
            if (!n || n === 'Student' || n === 'Unknown Student') return student.admissionNumber || student.admissionNo || 'N/A';
            return n;
          })(),
          avatar: student.avatar || student.photo || '/assets/img/students/default-avatar.jpg',
          className: student.class || student.className || 'N/A',
          section: student.section || 'N/A',
          attendance: existing ? (existing.attendance || existing.status || 'present') : 'present',
          notes: existing ? (existing.notes || existing.remarks || '') : ''
        };
      });

      setStudents(transformedData);
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      toast.error(error.message || 'Failed to fetch student attendance');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const classGroups = useMemo(() => {
    const groups: Record<string, ClassGroup> = {};
    for (const student of students) {
      const key = `${student.className}|${student.section}`;
      if (!groups[key]) {
        groups[key] = {
          className: student.className,
          section: student.section,
          students: [],
          collapsed: expandedClasses[key] === undefined ? false : expandedClasses[key]
        };
      }
      groups[key].students.push(student);
    }
    return Object.values(groups).sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));
  }, [students, expandedClasses]);

  const toggleClass = (key: string) => {
    setExpandedClasses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateAttendance = (studentId: string, status: Student['attendance']) => {
    setStudents(students.map(student =>
      student.id === studentId ? { ...student, attendance: status } : student
    ));
  };

  const updateNotes = (studentId: string, notes: string) => {
    setStudents(students.map(student =>
      student.id === studentId ? { ...student, notes } : student
    ));
  };

  const setAllInClass = (classKey: string, status: Student['attendance']) => {
    const group = classGroups.find(g => `${g.className}|${g.section}` === classKey);
    if (!group) return;
    const ids = new Set(group.students.map(s => s.id));
    setStudents(students.map(student =>
      ids.has(student.id) ? { ...student, attendance: status } : student
    ));
  };

  const getStudentAttendanceExportRows = () => students.map((student) => ({
    ID: student.id,
    Name: student.name || student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
    Class: student.className,
    Section: student.section,
    AdmissionNo: student.admissionNo,
    RollNo: student.rollNo,
    Attendance: student.attendance,
    Notes: student.notes,
  }));

  const handleStudentExportPDF = () => {
    exportToPDF(getStudentAttendanceExportRows(), 'student-attendance', [
      { key: 'ID', label: 'ID' },
      { key: 'Name', label: 'Name' },
      { key: 'Class', label: 'Class' },
      { key: 'Section', label: 'Section' },
      { key: 'AdmissionNo', label: 'Admission No' },
      { key: 'RollNo', label: 'Roll No' },
      { key: 'Attendance', label: 'Attendance' },
      { key: 'Notes', label: 'Notes' },
    ], 'Student Attendance');
  };

  const handleStudentExportExcel = () => {
    exportToExcel(getStudentAttendanceExportRows(), 'student-attendance');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        status: student.attendance,
        notes: student.notes || undefined
      }));

      await attendanceService.bulkMarkAttendance({
        date: selectedDate,
        records: attendanceRecords
      });

      toast.success('Attendance saved successfully');
      await fetchBulkAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      const detail = error.response?.data?.error?.details?.[0] || error.response?.data?.error?.message || error.response?.data?.message || '';
      toast.error(detail || error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    if (targetStudentId || isStudentRole) {
      fetchSingleStudentAttendance();
    } else {
      fetchBulkAttendance();
    }
  };

  const renderStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      present: 'success',
      late: 'warning',
      absent: 'danger',
      holiday: 'info',
      halfday: 'secondary'
    };
    const s = status || 'unknown';
    return (
      <span className={`badge bg-${colors[s] || 'secondary'}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  return (
    <>
      {isSingleStudent ? (
        <>
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">
                {historyStudent ? `${historyStudent.name || 'Student'}'s Attendance` : 'Attendance History'}
              </h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                  <li className="breadcrumb-item"><Link to="#">Attendance</Link></li>
                  <li className="breadcrumb-item active" aria-current="page">History</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="pe-1 mb-2">
                <button className="btn btn-outline-light bg-white btn-icon me-1" title="Refresh" onClick={handleRefresh} disabled={loading}>
                  <i className="ti ti-refresh"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Attendance Records ({historyTotal})</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="input-icon-start mb-3 me-2 position-relative">
                  <span className="icon-addon"><i className="ti ti-calendar"></i></span>
                  <input type="date" className="form-control" value={historyDateFrom} onChange={(e) => setHistoryDateFrom(e.target.value)} placeholder="From" />
                </div>
                <div className="input-icon-start mb-3 me-2 position-relative">
                  <span className="icon-addon"><i className="ti ti-calendar"></i></span>
                  <input type="date" className="form-control" value={historyDateTo} onChange={(e) => setHistoryDateTo(e.target.value)} placeholder="To" />
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No attendance records found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table datatable">
                    <thead className="thead-light">
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRecords.map((rec) => (
                        <tr key={rec._id}>
                          <td>{new Date(rec.date).toLocaleDateString()}</td>
                          <td>{renderStatusBadge(rec.attendance || rec.status)}</td>
                          <td>{rec.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Student Attendance</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Attendance</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Student Attendance</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="pe-1 mb-2">
                <button className="btn btn-outline-light bg-white btn-icon me-1" title="Refresh" onClick={handleRefresh} disabled={loading}>
                  <i className="ti ti-refresh"></i>
                </button>
              </div>
              <div className="dropdown me-2 mb-2">
                <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
                  <i className="ti ti-file-export me-2"></i>Export
                </button>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <button type="button" className="dropdown-item rounded-1" onClick={handleStudentExportPDF}>
                      <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item rounded-1" onClick={handleStudentExportExcel}>
                      <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Student Attendance List</h4>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="input-icon-start mb-3 me-2 position-relative">
                    <span className="icon-addon"><i className="ti ti-calendar"></i></span>
                    <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="card-body p-0 py-3">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">No students found for the selected date</p>
                  </div>
                ) : (
                  <>
                    <div className="px-3 pb-3 d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted fw-medium">{students.length} students across {classGroups.length} classes</span>
                    </div>

                    {classGroups.map((group) => {
                      const classKey = `${group.className}|${group.section}`;
                      const isExpanded = expandedClasses[classKey] !== false;
                      const presentCount = group.students.filter(s => s.attendance === 'present').length;
                      const absentCount = group.students.filter(s => s.attendance === 'absent').length;
                      const lateCount = group.students.filter(s => s.attendance === 'late').length;
                      const holidayCount = group.students.filter(s => s.attendance === 'holiday').length;
                      const halfdayCount = group.students.filter(s => s.attendance === 'halfday').length;

                      return (
                        <div key={classKey} className="border-top">
                          <div
                            className="d-flex align-items-center justify-content-between px-3 py-3 bg-light bg-opacity-50 cursor-pointer"
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleClass(classKey)}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <i className={`ti ti-chevron-${isExpanded ? 'down' : 'right'} fs-5`}></i>
                              <h5 className="mb-0 fw-semibold">
                                {group.className} {group.section && `- ${group.section}`}
                              </h5>
                              <span className="badge bg-primary rounded-pill">{group.students.length} students</span>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              <span className="small text-success"><i className="ti ti-circle-filled me-1 fs-10"></i>{presentCount}</span>
                              <span className="small text-warning"><i className="ti ti-circle-filled me-1 fs-10"></i>{lateCount}</span>
                              <span className="small text-danger"><i className="ti ti-circle-filled me-1 fs-10"></i>{absentCount}</span>
                              <span className="small text-info"><i className="ti ti-circle-filled me-1 fs-10"></i>{holidayCount}</span>
                              <span className="small text-secondary"><i className="ti ti-circle-filled me-1 fs-10"></i>{halfdayCount}</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="table-responsive">
                              <table className="table mb-0">
                                <thead className="thead-light">
                                  <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th>Admission No</th>
                                    <th>Roll No</th>
                                    <th>Name</th>
                                    <th>Attendance</th>
                                    <th style={{ minWidth: '180px' }}>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.students.map((student, idx) => (
                                    <tr key={student.id}>
                                      <td>{idx + 1}</td>
                                      <td><Link to="#" className="link-primary">{student.admissionNo}</Link></td>
                                      <td>{student.rollNo}</td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <div className="avatar avatar-md me-2">
                                            <img src={student.avatar} className="img-fluid rounded-circle" alt={student.name || student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'} />
                                          </div>
                                          <div><p className="text-dark mb-0">{student.name || student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim()}</p></div>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center check-radio-group flex-nowrap">
                                          {ATTENDANCE_OPTIONS.map((status) => (
                                            <label key={status} className="custom-radio me-2">
                                              <input
                                                type="radio"
                                                name={`attendance-${student.id}`}
                                                checked={student.attendance === status}
                                                onChange={() => updateAttendance(student.id, status)}
                                              />
                                              <span className="checkmark"></span>
                                              {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </label>
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Enter notes"
                                          value={student.notes}
                                          onChange={(e) => updateNotes(student.id, e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="d-flex align-items-center gap-2 px-3 py-2 border-top bg-light bg-opacity-25">
                                <span className="text-muted small me-2">Mark all as:</span>
                                {ATTENDANCE_OPTIONS.map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setAllInClass(classKey, status)}
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="d-flex justify-content-end mt-3 px-3 pb-3">
                      <button type="submit" className="btn btn-primary" disabled={saving || students.length === 0}>
                        {saving ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>
                        ) : 'Save Attendance'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
};

export default StudentAttendancePage;
