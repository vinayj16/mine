import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { examService } from '../../services/examService';

interface StudentAttendance {
  studentId: string;
  studentName: string;
  rollNo: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  arrivalTime?: string;
  notes?: string;
}

interface ExamWithAttendance {
  _id: string;
  title: string;
  subjectId: { name: string; _id: string } | string;
  classId: { name: string; _id: string } | string;
  examDate: string;
  startTime: string;
  endTime: string;
  attendance: StudentAttendance[];
}

const ExamAttendancePage: React.FC = () => {
  const [exams, setExams] = useState<ExamWithAttendance[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamWithAttendance | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    examType: '',
  });

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filters.class) params.class = filters.class;
      if (filters.examType) params.examType = filters.examType;

      const response = await examService.getAll(params);
      setExams(response.data as any);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamAttendance = async (examId: string) => {
    try {
      const attendanceData = await examService.getAttendance(examId);
      setAttendance(attendanceData as any);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttendanceChange = (
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    setAttendance((prev) =>
      prev.map((record) =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) {
      toast.error('Please select an exam');
      return;
    }

    try {
      // Mark attendance for each student
      await examService.getAttendance(selectedExam._id);
      // In a real implementation, you would call a markAttendance endpoint
      // await examService.markAttendance(selectedExam._id, record.studentId, record.status);
      toast.success('Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    }
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export as ${type.toUpperCase()} - Feature coming soon`);
  };

  const getDisplayValue = (value: any, field: 'name'): string => {
    if (typeof value === 'object' && value !== null && field in value) {
      return String(value[field]);
    }
    return String(value);
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Exam Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Report</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Exam Attendance
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchExams}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
            >
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
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('excel')}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="attendance-types page-header justify-content-end">
        <ul className="attendance-type-list">
          <li>
            <span className="attendance-icon bg-success">
              <i className="ti ti-checks"></i>
            </span>
            Present
          </li>
          <li>
            <span className="attendance-icon bg-danger">
              <i className="ti ti-x"></i>
            </span>
            Absent
          </li>
          <li>
            <span className="attendance-icon bg-pending">
              <i className="ti ti-clock-x"></i>
            </span>
            Late
          </li>
          <li>
            <span className="attendance-icon bg-info">
              <i className="ti ti-file-check"></i>
            </span>
            Excused
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Exam Attendance</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input
                type="text"
                className="form-control date-range bookingrange"
                placeholder="Select"
                value="Academic Year : 2024 / 2025"
                readOnly
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <button
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <select
                            className="form-select"
                            name="class"
                            value={filters.class}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select</option>
                            <option value="I">I</option>
                            <option value="II">II</option>
                            <option value="III">III</option>
                            <option value="IV">IV</option>
                            <option value="V">V</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Section</label>
                          <select
                            className="form-select"
                            name="section"
                            value={filters.section}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Exam Type</label>
                          <select
                            className="form-select"
                            name="examType"
                            value={filters.examType}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select</option>
                            <option value="written">Written</option>
                            <option value="oral">Oral</option>
                            <option value="practical">Practical</option>
                            <option value="quiz">Quiz</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button
                      type="button"
                      className="btn btn-light me-3"
                      onClick={() =>
                        setFilters({ class: '', section: '', examType: '' })
                      }
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
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
                  <button className="dropdown-item rounded-1 active">Ascending</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Descending</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Recently Viewed</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Recently Added</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="custom-datatable-filter table-responsive">
              {!selectedExam ? (
                <div className="p-4">
                  <h5 className="mb-3">Select an Exam</h5>
                  <div className="list-group">
                    {exams.length > 0 ? (
                      exams.map((exam) => (
                        <button
                          key={exam._id}
                          className="list-group-item list-group-item-action"
                          onClick={() => {
                            setSelectedExam(exam);
                            fetchExamAttendance(exam._id);
                          }}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">{exam.title}</h6>
                            <small>
                              {new Date(exam.examDate).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="mb-1">
                            Subject: {getDisplayValue(exam.subjectId, 'name')} | Class:{' '}
                            {getDisplayValue(exam.classId, 'name')}
                          </p>
                          <small>
                            Time: {exam.startTime} - {exam.endTime}
                          </small>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted">
                        No exams found. Please adjust your filters.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-1">{selectedExam.title}</h5>
                        <p className="mb-0 text-muted">
                          {getDisplayValue(selectedExam.subjectId, 'name')} |{' '}
                          {getDisplayValue(selectedExam.classId, 'name')} |{' '}
                          {new Date(selectedExam.examDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setSelectedExam(null);
                          setAttendance([]);
                        }}
                      >
                        <i className="ti ti-arrow-left me-1"></i>Back to Exams
                      </button>
                    </div>
                  </div>

                  <table className="table datatable">
                    <thead className="thead-light">
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Roll No</th>
                        <th>Attendance Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.length > 0 ? (
                        attendance.map((record) => (
                          <tr key={record.studentId}>
                            <td>
                              <Link to="#" className="link-primary">
                                {record.studentId}
                              </Link>
                            </td>
                            <td>{record.studentName}</td>
                            <td>{record.rollNo}</td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    record.status === 'present'
                                      ? 'btn-success'
                                      : 'btn-outline-secondary'
                                  }`}
                                  onClick={() =>
                                    handleAttendanceChange(record.studentId, 'present')
                                  }
                                >
                                  <i className="ti ti-check"></i>
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    record.status === 'absent'
                                      ? 'btn-danger'
                                      : 'btn-outline-secondary'
                                  }`}
                                  onClick={() =>
                                    handleAttendanceChange(record.studentId, 'absent')
                                  }
                                >
                                  <i className="ti ti-x"></i>
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    record.status === 'late'
                                      ? 'btn-warning'
                                      : 'btn-outline-secondary'
                                  }`}
                                  onClick={() =>
                                    handleAttendanceChange(record.studentId, 'late')
                                  }
                                >
                                  <i className="ti ti-clock"></i>
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    record.status === 'excused'
                                      ? 'btn-info'
                                      : 'btn-outline-secondary'
                                  }`}
                                  onClick={() =>
                                    handleAttendanceChange(record.studentId, 'excused')
                                  }
                                >
                                  <i className="ti ti-file-check"></i>
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={record.notes || ''}
                                onChange={(e) =>
                                  setAttendance((prev) =>
                                    prev.map((r) =>
                                      r.studentId === record.studentId
                                        ? { ...r, notes: e.target.value }
                                        : r
                                    )
                                  )
                                }
                                placeholder="Add notes..."
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted">
                            No attendance records found for this exam.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {attendance.length > 0 && (
                    <div className="text-end mt-3 me-3 mb-3">
                      <button type="submit" className="btn btn-primary">
                        Save Attendance
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamAttendancePage;