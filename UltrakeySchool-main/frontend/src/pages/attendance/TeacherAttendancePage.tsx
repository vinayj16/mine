import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';

interface Teacher {
  id: string;
  name: string;
  class: string;
  avatar: string;
  attendance: 'present' | 'late' | 'absent' | 'holiday' | 'halfday';
  notes: string;
}

const TeacherAttendancePage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTeachers();
  }, [selectedDate]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAll({
        userType: 'teacher',
        date: selectedDate
      });
      
      // Transform backend data to match frontend structure
      const transformedData = data.map((record: any) => ({
        id: record.id || record._id,
        name: record.fullName || record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim(),
        class: record.className || record.class || 'N/A',
        avatar: record.avatar || record.photo || '/assets/img/teachers/default-avatar.jpg',
        attendance: record.status || 'present',
        notes: record.remarks || record.notes || ''
      }));
      
      setTeachers(transformedData);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast.error(error.message || 'Failed to fetch teacher attendance');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (teacherId: string, status: Teacher['attendance']) => {
    setTeachers(teachers.map(teacher => 
      teacher.id === teacherId ? { ...teacher, attendance: status } : teacher
    ));
  };

  const handleNoteChange = (teacherId: string, note: string) => {
    setTeachers(teachers.map(teacher => 
      teacher.id === teacherId ? { ...teacher, notes: note } : teacher
    ));
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedTeachers(teachers.map(teacher => teacher.id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      setSelectedTeachers(selectedTeachers.filter(id => id !== teacherId));
    } else {
      setSelectedTeachers([...selectedTeachers, teacherId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Save attendance for each teacher
      for (const teacher of teachers) {
        await attendanceService.create({
          id: teacher.id,
          studentId: teacher.id,
          date: selectedDate,
          status: teacher.attendance,
          remarks: teacher.notes || undefined
        });
      }

      toast.success('Teacher attendance saved successfully');
      await fetchTeachers();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(error.message || 'Failed to save teacher attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchTeachers();
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Teacher Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Report</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Teacher Attendance</li>
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
            <button type="button" className="btn btn-outline-light bg-white btn-icon me-1" title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
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

      {/* Teacher Attendance List */}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Teacher Attendance List</h4>
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
                <button 
                  type="button"
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown" 
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
                <div className="dropdown-menu drop-width">
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">ID</label>
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
                          <label className="form-label">Attendance</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Present</option>
                            <option>Absent</option>
                            <option>Late</option>
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
                <button 
                  type="button"
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <button type="button" className="dropdown-item rounded-1 active">
                      Ascending
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item rounded-1">
                      Descending
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item rounded-1">
                      Recently Viewed
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item rounded-1">
                      Recently Added
                    </button>
                  </li>
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
            ) : teachers.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No teachers found for the selected date</p>
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
                              id="select-all"
                              checked={selectAll}
                              onChange={toggleSelectAll}
                            />
                          </div>
                        </th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Attendance</th>
                        <th style={{ minWidth: '200px' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher) => (
                        <tr key={teacher.id}>
                          <td>
                            <div className="form-check form-check-md">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={selectedTeachers.includes(teacher.id)}
                                onChange={() => toggleTeacherSelection(teacher.id)}
                              />
                            </div>
                          </td>
                          <td><Link to="#" className="link-primary">{teacher.id}</Link></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link to="#" className="avatar avatar-md">
                                <img
                                  src={teacher.avatar}
                                  className="img-fluid rounded-circle"
                                  alt={teacher.name}
                                />
                              </Link>
                              <div className="ms-2">
                                <p className="text-dark mb-0">
                                  <Link to="#">{teacher.name}</Link>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>{teacher.class}</td>
                          <td>
                            <div className="d-flex align-items-center check-radio-group flex-nowrap">
                              {(['present', 'late', 'absent', 'holiday', 'halfday'] as const).map((status) => (
                                <label key={status} className="custom-radio me-2">
                                  <input
                                    type="radio"
                                    name={`teacher-${teacher.id}`}
                                    checked={teacher.attendance === status}
                                    onChange={() => handleAttendanceChange(teacher.id, status)}
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
                              value={teacher.notes}
                              onChange={(e) => handleNoteChange(teacher.id, e.target.value)}
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
                    disabled={saving || teachers.length === 0}
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

export default TeacherAttendancePage;
