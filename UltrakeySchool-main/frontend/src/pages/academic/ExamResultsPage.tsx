import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { examService } from '../../services/examService';
import type { Exam } from '../../services/examService';

interface StudentResult {
  id: string;
  studentId: string;
  admissionNo: string;
  name: string;
  rollNo: string;
  subjects: {
    [key: string]: number;
  };
  total: number;
  percentage: number;
  grade: string;
  result: 'pass' | 'fail';
}

const ExamResultsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    examType: ''
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await examService.getAll({ page: 1, limit: 100 });
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    }
  };

  const fetchResults = async (examId: string) => {
    try {
      setLoading(true);
      const response: any = await examService.getResults(examId);
      // Handle both array and object response formats
      const data = Array.isArray(response) ? response : (response?.data || []);
      // Transform backend data to match our interface
      const transformedResults: StudentResult[] = (data as any[]).map((item: any) => ({
        id: item.id || item._id,
        studentId: item.studentId,
        admissionNo: item.admissionNo || 'N/A',
        name: item.studentName || item.name,
        rollNo: item.rollNo || 'N/A',
        subjects: item.subjects || {},
        total: item.totalMarksObtained || 0,
        percentage: item.percentage || 0,
        grade: item.overallGrade || 'N/A',
        result: (item.percentage >= 35 ? 'pass' : 'fail') as 'pass' | 'fail'
      }));
      setResults(transformedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load exam results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    if (examId) {
      fetchResults(examId);
    } else {
      setResults([]);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export as ${type.toUpperCase()} - Feature coming soon`);
  };

  const isFailMark = (mark: number) => mark < 35;

  // Get unique subject names from results
  const subjects = results.length > 0 && results[0]?.subjects
    ? Object.keys(results[0].subjects).map(key => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1)
      }))
    : [];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Exam Result</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Academic</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Exam Result
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

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Exam Results</h4>
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
                            <option value="mid_term">Mid Term</option>
                            <option value="final">Final</option>
                            <option value="practical">Practical</option>
                            <option value="assignment">Assignment</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-light me-3"
                      onClick={() => setFilters({ class: '', section: '', examType: '' })}
                    >
                      Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Apply
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
                  <button className="dropdown-item rounded-1 active">
                    Ascending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Descending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Viewed
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Added
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Select Exam</label>
            <select 
              className="form-select"
              value={selectedExam}
              onChange={handleExamChange}
            >
              <option value="">Choose an exam to view results</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} - {exam.class} ({new Date(exam.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : selectedExam && results.length > 0 ? (
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                  <thead className="thead-light">
                   <tr>
                     <th className="no-sort">
                       <div className="form-check form-check-md">
                         <input type="checkbox" className="form-check-input" id="select-all" />
                       </div>
                     </th>
                     <th>Admission No</th>
                     <th>Student Name</th>
                     {subjects && subjects.length > 0 && subjects.map(subject => (
                      <th key={subject.key}>{subject.name}</th>
                    ))}
                     <th>Total</th>
                     <th>Percent(%)</th>
                     <th>Grade</th>
                     <th>Result</th>
                   </tr>
                 </thead>
                <tbody>
                  {results.map(student => (
                    <tr key={student.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input type="checkbox" className="form-check-input" />
                        </div>
                      </td>
                      <td>
                        <Link to="#" className="link-primary">
                          {student.admissionNo}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="ms-2">
                            <p className="text-dark mb-0">
                              <Link to="#">{student.name}</Link>
                            </p>
                            <span className="fs-12">Roll No: {student.rollNo}</span>
                          </div>
                        </div>
                      </td>
                      {subjects.map(subject => {
                        const mark = student.subjects[subject.key] || 0;
                        return (
                          <td key={`${student.id}-${subject.key}`}>
                            <span className={isFailMark(mark) ? 'text-danger' : ''}>
                              {mark}
                            </span>
                          </td>
                        );
                      })}
                      <td>{student.total}</td>
                      <td>{student.percentage}%</td>
                      <td>{student.grade}</td>
                      <td>
                        <span 
                          className={`badge badge-soft-${
                            student.result === 'pass' ? 'success' : 'danger'
                          } d-inline-flex align-items-center`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {student.result === 'pass' ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedExam ? (
            <div className="text-center py-4">
              <p className="text-muted">No results found for this exam</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">Please select an exam to view results</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamResultsPage;