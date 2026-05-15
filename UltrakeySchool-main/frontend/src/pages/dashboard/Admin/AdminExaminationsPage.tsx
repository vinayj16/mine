import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ExaminationData {
  overview: {
    totalExams: number;
    upcomingExams: number;
    completedExams: number;
    ongoingExams: number;
  };
  exams: {
    id: string;
    name: string;
    type: string;
    grade: string;
    subject: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    totalStudents: number;
    submittedStudents: number;
  }[];
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
  subjectPerformance: {
    subject: string;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }[];
}

const AdminExaminationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<ExaminationData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      // Set empty data for now
      setExamData({
        overview: {
          totalExams: 0,
          upcomingExams: 0,
          completedExams: 0,
          ongoingExams: 0
        },
        exams: [],
        gradeDistribution: [
          { grade: 'A+', count: 0, percentage: 0 },
          { grade: 'A', count: 0, percentage: 0 },
          { grade: 'B', count: 0, percentage: 0 },
          { grade: 'C', count: 0, percentage: 0 },
          { grade: 'D', count: 0, percentage: 0 },
          { grade: 'F', count: 0, percentage: 0 }
        ],
        subjectPerformance: [
          { subject: 'Mathematics', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { subject: 'Science', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { subject: 'English', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const examStatusData = examData ? [
    { name: 'Upcoming', value: examData.overview.upcomingExams, color: '#3b82f6' },
    { name: 'Ongoing', value: examData.overview.ongoingExams, color: '#f59e0b' },
    { name: 'Completed', value: examData.overview.completedExams, color: '#10b981' }
  ] : [];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Examinations</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Examinations</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchExamData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-file-plus me-2"></i>Create Exam
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{examData?.overview.totalExams}</h4>
                  <p className="mb-0">Total Exams</p>
                  <small>All examinations</small>
                </div>
                <i className="ti ti-file-text fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{examData?.overview.upcomingExams}</h4>
                  <p className="mb-0">Upcoming</p>
                  <small>Scheduled exams</small>
                </div>
                <i className="ti ti-calendar fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{examData?.overview.ongoingExams}</h4>
                  <p className="mb-0">Ongoing</p>
                  <small>In progress</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{examData?.overview.completedExams}</h4>
                  <p className="mb-0">Completed</p>
                  <small>Finished exams</small>
                </div>
                <i className="ti ti-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Examination Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'exam' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('exam')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Exam Management
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'schedule' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('schedule')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Exam Schedule
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'grades' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('grades')}
                >
                  <i className="ti ti-star me-2"></i>
                  Grades
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'results' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('results')}
                >
                  <i className="ti ti-receipt me-2"></i>
                  Results
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Exam Status Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={examStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {examStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Grade Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={examData?.gradeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Subject Performance</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={examData?.subjectPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#10b981" />
                        <Bar dataKey="passRate" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exam Management */}
          {selectedSection === 'exam' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Exam Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Create New Exam
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Type</th>
                        <th>Grade</th>
                        <th>Subject</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Students</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examData?.exams.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted">
                            No exams found. Click "Create New Exam" to schedule your first examination.
                          </td>
                        </tr>
                      ) : (
                        examData?.exams.map((exam) => (
                          <tr key={exam.id}>
                            <td>{exam.name}</td>
                            <td>
                              <span className="badge bg-primary">{exam.type}</span>
                            </td>
                            <td>{exam.grade}</td>
                            <td>{exam.subject}</td>
                            <td>{exam.startDate}</td>
                            <td>{exam.endDate}</td>
                            <td>
                              <span className={`badge ${
                                exam.status === 'upcoming' ? 'bg-info' :
                                exam.status === 'ongoing' ? 'bg-warning' : 'bg-success'
                              }`}>
                                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              {exam.submittedStudents}/{exam.totalStudents}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning">
                                  <i className="ti ti-edit"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Exam Schedule */}
          {selectedSection === 'schedule' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Exam Schedule</h5>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm">
                    <option value="">All Grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-calendar-plus me-1"></i>Add Schedule
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Exam Type</th>
                        <th>Duration</th>
                        <th>Room</th>
                        <th>Invigilator</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No exam schedules found. Add exam schedules to view the timetable.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Grades */}
          {selectedSection === 'grades' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Grade Management</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <div className="card-body">
                        <h6 className="text-success">A+</h6>
                        <h4>{examData?.gradeDistribution.find(g => g.grade === 'A+')?.count || 0}</h4>
                        <small className="text-muted">Excellent</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <div className="card-body">
                        <h6 className="text-primary">A</h6>
                        <h4>{examData?.gradeDistribution.find(g => g.grade === 'A')?.count || 0}</h4>
                        <small className="text-muted">Very Good</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <div className="card-body">
                        <h6 className="text-info">B</h6>
                        <h4>{examData?.gradeDistribution.find(g => g.grade === 'B')?.count || 0}</h4>
                        <small className="text-muted">Good</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <div className="card-body">
                        <h6 className="text-warning">C</h6>
                        <h4>{examData?.gradeDistribution.find(g => g.grade === 'C')?.count || 0}</h4>
                        <small className="text-muted">Average</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <div className="card-body">
                        <h6 className="text-danger">D</h6>
                        <h4>{examData?.gradeDistribution.find(g => g.grade === 'D')?.count || 0}</h4>
                        <small className="text-muted">Below Average</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <div className="card-body">
                        <h6 className="text-danger">F</h6>
                        <h4>{examData?.gradeDistribution.find(g => g.grade === 'F')?.count || 0}</h4>
                        <small className="text-muted">Fail</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <h6>Grade Settings</h6>
                  <p className="text-muted">Configure grade ranges and grading criteria for different examinations.</p>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-settings me-1"></i>Configure Grades
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {selectedSection === 'results' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Exam Results</h5>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm">
                    <option value="">Select Exam</option>
                  </select>
                  <select className="form-select form-select-sm">
                    <option value="">All Grades</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-search me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Percentage</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No results found. Select an exam to view results.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExaminationsPage;
