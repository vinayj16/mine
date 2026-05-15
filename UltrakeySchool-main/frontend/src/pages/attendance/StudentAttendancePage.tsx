import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';

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

const StudentAttendancePage = () => {
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStudents();
  }, [selectedDate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // First try to get existing attendance records
      let data: any[] = [];
      try {
        data = await attendanceService.getStudentAttendance({
          date: selectedDate
        });
      } catch (e) {
        console.log('No attendance records found, fetching students list');
      }
      
      // If we have attendance records, transform them
      let transformedData;
      if (data && data.length > 0) {
        transformedData = data.map((record: any) => ({
          id: record.studentId?._id || record.studentId || record.id || record._id,
          admissionNo: record.admissionNo || record.admissionNumber || 'N/A',
          rollNo: record.rollNo || record.rollNumber || 'N/A',
          name: record.studentName || record.name || record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim(),
          avatar: record.avatar || record.photo || '/assets/img/students/default-avatar.jpg',
          className: record.className || record.class || 'N/A',
          section: record.section || 'N/A',
          attendance: record.attendance || record.status || 'present',
          notes: record.notes || record.remarks || ''
        }));
      } else {
        // Fetch students from students API
        try {
          const studentsResponse = await fetch('/api/v1/students?limit=100', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const studentsData = await studentsResponse.json();
          const studentsList = studentsData.data?.students || studentsData.data || [];
          
          transformedData = studentsList.map((student: any) => ({
            id: student._id,
            admissionNo: student.admissionNumber || student.admissionNo || 'N/A',
            rollNo: student.rollNumber || student.rollNo || 'N/A',
            name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            avatar: student.avatar || student.photo || '/assets/img/students/default-avatar.jpg',
            className: student.class || student.className || 'N/A',
            section: student.section || 'N/A',
            attendance: 'present' as const,
            notes: ''
          }));
        } catch (studentError) {
          console.error('Error fetching students:', studentError);
          transformedData = [];
        }
      }
      
      setStudents(transformedData);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error(error.message || 'Failed to fetch student attendance');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedStudents(students.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const toggleStudentSelection = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Prepare attendance records for submission using bulk API
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
      await fetchStudents();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchStudents();
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Report</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Student Attendance</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              title="Refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
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

      {/* Student List */}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Student Attendance List</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input 
                  type="date" 
                  className="form-control" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              <div className="dropdown mb-3 me-2">
                <button type="button" className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
                <div className="dropdown-menu drop-width">
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Admission No</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Roll No</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Name</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-0">
                          <label className="form-label">Class</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-0">
                          <label className="form-label">Section</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="button" className="btn btn-primary">Apply</button>
                  </div>
                </div>
              </div>
              
              <div className="dropdown mb-3">
                <button type="button" className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li><button type="button" className="dropdown-item rounded-1 active">Ascending</button></li>
                  <li><button type="button" className="dropdown-item rounded-1">Descending</button></li>
                  <li><button type="button" className="dropdown-item rounded-1">Recently Viewed</button></li>
                  <li><button type="button" className="dropdown-item rounded-1">Recently Added</button></li>
                </ul>
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
                <div className="table-responsive">
                  <table className="table datatable">
                    <thead className="thead-light">
                      <tr>
                        <th className="no-sort">
                          <div className="form-check form-check-md">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={selectAll}
                              onChange={toggleSelectAll}
                            />
                          </div>
                        </th>
                        <th>Admission No</th>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Section</th>
                        <th>Attendance</th>
                        <th style={{ minWidth: '200px' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id}>
                          <td>
                            <div className="form-check form-check-md">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                              />
                            </div>
                          </td>
                          <td>
                            <Link to="#" className="link-primary">{student.admissionNo}</Link>
                          </td>
                          <td>{student.rollNo}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-md me-2">
                                <img 
                                  src={student.avatar} 
                                  className="img-fluid rounded-circle" 
                                  alt={student.name} 
                                />
                              </div>
                              <div>
                                <p className="text-dark mb-0">{student.name}</p>
                              </div>
                            </div>
                          </td>
                          <td>{student.className}</td>
                          <td>{student.section}</td>
                          <td>
                            <div className="d-flex align-items-center check-radio-group flex-nowrap">
                              {['present', 'late', 'absent', 'holiday', 'halfday'].map((status) => (
                                <label key={status} className="custom-radio me-2">
                                  <input 
                                    type="radio" 
                                    name={`attendance-${student.id}`}
                                    checked={student.attendance === status}
                                    onChange={() => updateAttendance(student.id, status as any)}
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
                              className="form-control" 
                              placeholder="Enter notes"
                              value={student.notes}
                              onChange={(e) => updateNotes(student.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="d-flex justify-content-end mt-3 px-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving || students.length === 0}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Attendance'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default StudentAttendancePage;
