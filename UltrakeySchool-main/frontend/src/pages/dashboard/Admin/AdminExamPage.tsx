import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExaminationsApiService } from '../../../api/adminService';

interface ExamData {
  overview: {
    totalExams: number;
    upcomingExams: number;
    ongoingExams: number;
    completedExams: number;
    thisMonthExams: number;
    averageScore: number;
    passRate: number;
  };
  exams: {
    id: string;
    title: string;
    description: string;
    type: string;
    grade: string;
    subject: string;
    examDate: string;
    startTime: string;
    endTime: string;
    duration: string;
    totalMarks: number;
    passingMarks: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    createdBy: string;
    createdAt: string;
    participants: number;
    resultsPublished: boolean;
  }[];
  examTypes: {
    type: string;
    count: number;
    color: string;
  }[];
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

const AdminExamPage = () => {
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchExamData();
  }, [selectedGrade, selectedStatus]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      
      // Fetch all exam data in parallel
      const [
        overview,
        exams,
        examTypes
      ] = await Promise.all([
        ExaminationsApiService.getExamOverview(),
        ExaminationsApiService.getExamList({ grade: selectedGrade, status: selectedStatus }),
        ExaminationsApiService.getExamTypes()
      ]);

      setExamData({
        overview: (overview as ExamData['overview']) || {
          totalExams: 0,
          upcomingExams: 0,
          ongoingExams: 0,
          completedExams: 0,
          thisMonthExams: 0,
          averageScore: 0,
          passRate: 0
        },
        exams: (exams as any[]) || [],
        examTypes: (examTypes as any[]) || [
          { type: 'Unit Test', count: 0, color: '#3b82f6' },
          { type: 'Mid Term', count: 0, color: '#10b981' },
          { type: 'Final Exam', count: 0, color: '#f59e0b' },
          { type: 'Practical', count: 0, color: '#ef4444' },
          { type: 'Assignment', count: 0, color: '#8b5cf6' }
        ],
        gradeDistribution: []
      });

    } catch (error: any) {
      console.error('Error fetching exam data:', error);
      setExamData({
        overview: {
          totalExams: 0,
          upcomingExams: 0,
          ongoingExams: 0,
          completedExams: 0,
          thisMonthExams: 0,
          averageScore: 0,
          passRate: 0
        },
        exams: [],
        examTypes: [
          { type: 'Unit Test', count: 0, color: '#3b82f6' },
          { type: 'Mid Term', count: 0, color: '#10b981' },
          { type: 'Final Exam', count: 0, color: '#f59e0b' },
          { type: 'Practical', count: 0, color: '#ef4444' },
          { type: 'Assignment', count: 0, color: '#8b5cf6' }
        ],
        gradeDistribution: []
      });
    } finally {
      setLoading(false);
    }
  };
      
  const handleCreateExam = () => {
    // Handle exam creation logic
    console.log('Creating new exam...');
  };

  const filteredExams = examData?.exams.filter(exam => {
    const matchesGrade = selectedGrade === 'all' || exam.grade === selectedGrade;
    const matchesStatus = selectedStatus === 'all' || exam.status === selectedStatus;
    return matchesGrade && matchesStatus;
  }) || [];

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
          <h3 className="page-title mb-1">Exams</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Examinations</li>
              <li className="breadcrumb-item active">Exam</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchExamData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleCreateExam}>
            <i className="ti ti-plus me-2"></i>Create Exam
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
                <i className="ti ti-calendar-time fs-24"></i>
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
                <i className="ti ti-check-circle fs-24"></i>
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
              <h5 className="card-title">Exam Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'exams' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('exams')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Exams
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'create' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('create')}
                >
                  <i className="ti ti-plus me-2"></i>
                  Create Exam
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'results' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('results')}
                >
                  <i className="ti ti-chart-bar me-2"></i>
                  Results Analysis
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Reports
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
                          data={[
                            { name: 'Upcoming', value: examData?.overview.upcomingExams || 0, color: '#3b82f6' },
                            { name: 'Ongoing', value: examData?.overview.ongoingExams || 0, color: '#f59e0b' },
                            { name: 'Completed', value: examData?.overview.completedExams || 0, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
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
                    <h5 className="card-title mb-0">Exam Types</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={examData?.examTypes || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
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
                    <h5 className="card-title mb-0">Grade Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={examData?.gradeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Exams */}
          {selectedSection === 'exams' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Exams</h5>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="all">All Grades</option>
                    <option value="grade1">Grade 1</option>
                    <option value="grade2">Grade 2</option>
                    <option value="grade3">Grade 3</option>
                    <option value="grade4">Grade 4</option>
                    <option value="grade5">Grade 5</option>
                  </select>
                  <select 
                    className="form-select form-select-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Exam Title</th>
                        <th>Type</th>
                        <th>Grade</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Total Marks</th>
                        <th>Status</th>
                        <th>Participants</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-muted">
                            No exams found. Click "Create Exam" to schedule your first exam.
                          </td>
                        </tr>
                      ) : (
                        filteredExams.map((exam) => (
                          <tr key={exam.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`avatar avatar-sm bg-${
                                  exam.type === 'Final Exam' ? 'danger' :
                                  exam.type === 'Mid Term' ? 'warning' :
                                  exam.type === 'Unit Test' ? 'primary' : 'info'
                                } text-white rounded-circle me-2`}>
                                  <i className="ti ti-file-text"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{exam.title}</h6>
                                  <small className="text-muted">{exam.description.substring(0, 50)}...</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                exam.type === 'Final Exam' ? 'danger' :
                                exam.type === 'Mid Term' ? 'warning' :
                                exam.type === 'Unit Test' ? 'primary' : 'info'
                              }`}>
                                {exam.type}
                              </span>
                            </td>
                            <td>{exam.grade}</td>
                            <td>{exam.subject}</td>
                            <td>{exam.examDate}</td>
                            <td>{exam.duration}</td>
                            <td>{exam.totalMarks}</td>
                            <td>
                              <span className={`badge ${
                                exam.status === 'upcoming' ? 'bg-info' :
                                exam.status === 'ongoing' ? 'bg-warning' :
                                exam.status === 'completed' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                              </span>
                            </td>
                            <td>{exam.participants}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                {exam.status === 'upcoming' && (
                                  <button className="btn btn-outline-success" title="Start Exam">
                                    <i className="ti ti-play"></i>
                                  </button>
                                )}
                                {exam.status === 'completed' && !exam.resultsPublished && (
                                  <button className="btn btn-outline-info" title="Publish Results">
                                    <i className="ti ti-chart-bar"></i>
                                  </button>
                                )}
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

          {/* Create Exam */}
          {selectedSection === 'create' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Create New Exam</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Exam Title</label>
                        <input type="text" className="form-control" placeholder="Enter exam title" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Exam Type</label>
                        <select className="form-select" required>
                          <option value="">Select Type</option>
                          <option value="unit-test">Unit Test</option>
                          <option value="mid-term">Mid Term</option>
                          <option value="final-exam">Final Exam</option>
                          <option value="practical">Practical</option>
                          <option value="assignment">Assignment</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Grade</label>
                        <select className="form-select" required>
                          <option value="">Select Grade</option>
                          <option value="grade1">Grade 1</option>
                          <option value="grade2">Grade 2</option>
                          <option value="grade3">Grade 3</option>
                          <option value="grade4">Grade 4</option>
                          <option value="grade5">Grade 5</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <select className="form-select" required>
                          <option value="">Select Subject</option>
                          <option value="mathematics">Mathematics</option>
                          <option value="science">Science</option>
                          <option value="english">English</option>
                          <option value="social-studies">Social Studies</option>
                          <option value="computer">Computer Science</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Exam Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <input type="time" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <input type="time" className="form-control" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Total Marks</label>
                        <input type="number" className="form-control" placeholder="Enter total marks" required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Passing Marks</label>
                        <input type="number" className="form-control" placeholder="Enter passing marks" required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Duration (minutes)</label>
                        <input type="number" className="form-control" placeholder="Enter duration" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} placeholder="Enter exam description"></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Instructions</label>
                    <textarea className="form-control" rows={3} placeholder="Enter exam instructions"></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Exam Materials</label>
                    <input type="file" className="form-control" multiple />
                    <small className="text-muted">Upload question papers, answer sheets, etc.</small>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-outline-primary">
                      <i className="ti ti-eye me-1"></i>Preview
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-plus me-1"></i>Create Exam
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Results Analysis */}
          {selectedSection === 'results' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Results Analysis</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-primary">Average Score</h6>
                        <h4>{examData?.overview.averageScore}%</h4>
                        <small className="text-muted">Across all exams</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-success">Pass Rate</h6>
                        <h4>{examData?.overview.passRate}%</h4>
                        <small className="text-muted">Students passed</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-info">Highest Score</h6>
                        <h4>95%</h4>
                        <small className="text-muted">Top performer</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-warning">Lowest Score</h6>
                        <h4>42%</h4>
                        <small className="text-muted">Needs improvement</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <h6>Grade Distribution Analysis</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={examData?.gradeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                        <Bar dataKey="percentage" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Exam Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                        <h6>Exam Schedule Report</h6>
                        <p className="text-muted small">Complete exam calendar</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-success mb-2"></i>
                        <h6>Results Report</h6>
                        <p className="text-muted small">Performance analysis</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-users fs-24 text-warning mb-2"></i>
                        <h6>Participation Report</h6>
                        <p className="text-muted small">Student participation</p>
                        <button className="btn btn-warning btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar fs-24 text-info mb-2"></i>
                        <h6>Monthly Report</h6>
                        <p className="text-muted small">Monthly exam summary</p>
                        <button className="btn btn-info btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-circle fs-24 text-danger mb-2"></i>
                        <h6>Performance Report</h6>
                        <p className="text-muted small">Detailed performance</p>
                        <button className="btn btn-danger btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-trending-up fs-24 text-secondary mb-2"></i>
                        <h6>Trend Analysis</h6>
                        <p className="text-muted small">Performance trends</p>
                        <button className="btn btn-secondary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExamPage;