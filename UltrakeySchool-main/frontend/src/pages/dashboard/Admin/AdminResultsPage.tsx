import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ExaminationsApiService } from '../../../api/adminService';

interface ResultData {
  overview: {
    totalResults: number;
    publishedResults: number;
    pendingResults: number;
    averageScore: number;
    passRate: number;
    topScore: number;
    lowestScore: number;
  };
  results: {
    id: string;
    examId: string;
    examTitle: string;
    examType: string;
    grade: string;
    section: string;
    subject: string;
    totalStudents: number;
    passedStudents: number;
    failedStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    publishDate: string;
    publishedBy: string;
    status: 'published' | 'draft' | 'pending';
  }[];
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  subjectResults: {
    subject: string;
    averageScore: number;
    passRate: number;
    totalStudents: number;
    highestScore: number;
  }[];
  classResults: {
    class: string;
    averageScore: number;
    passRate: number;
    totalStudents: number;
    topPerformer: string;
  }[];
}

const AdminResultsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    fetchResultData();
  }, [selectedGrade, selectedSubject]);

  const fetchResultData = async () => {
    try {
      setLoading(true);
      
      // Fetch all result data in parallel
      const [
        overview,
        results,
        scoreDistribution,
        subjectResults
      ] = await Promise.all([
        ExaminationsApiService.getResultsOverview(),
        ExaminationsApiService.getResultsList(selectedGrade),
        ExaminationsApiService.getGradeDistribution(),
        ExaminationsApiService.getSubjectWiseResults()
      ]);

      setResultData({
        overview: (overview as ResultData['overview']) || {
          totalResults: 0,
          publishedResults: 0,
          pendingResults: 0,
          averageScore: 0,
          passRate: 0,
          topScore: 0,
          lowestScore: 0
        },
        results: (results as any[]) || [],
        scoreDistribution: (scoreDistribution as any[]) || [
          { range: '90-100%', count: 0, percentage: 0, color: '#10b981' },
          { range: '80-89%', count: 0, percentage: 0, color: '#3b82f6' },
          { range: '70-79%', count: 0, percentage: 0, color: '#f59e0b' },
          { range: '60-69%', count: 0, percentage: 0, color: '#ef4444' },
          { range: '50-59%', count: 0, percentage: 0, color: '#6b7280' },
          { range: 'Below 50%', count: 0, percentage: 0, color: '#991b1b' }
        ],
        subjectResults: (subjectResults as any[]) || [
          { subject: 'Mathematics', averageScore: 0, passRate: 0, totalStudents: 0, highestScore: 0 },
          { subject: 'Science', averageScore: 0, passRate: 0, totalStudents: 0, highestScore: 0 },
          { subject: 'English', averageScore: 0, passRate: 0, totalStudents: 0, highestScore: 0 },
          { subject: 'Social Studies', averageScore: 0, passRate: 0, totalStudents: 0, highestScore: 0 },
          { subject: 'Computer Science', averageScore: 0, passRate: 0, totalStudents: 0, highestScore: 0 }
        ],
        classResults: []
      });

    } catch (error: any) {
      console.error('Error fetching result data:', error);
      
      // Set empty data on error
      setResultData({
        overview: {
          totalResults: 0,
          publishedResults: 0,
          pendingResults: 0,
          averageScore: 0,
          passRate: 0,
          topScore: 0,
          lowestScore: 0
        },
        results: [],
        scoreDistribution: [],
        subjectResults: [],
        classResults: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = () => {
    // Handle result publishing logic
    console.log('Publishing results...');
  };

  const filteredResults = resultData?.results.filter(_result => {
    // Add filtering logic based on selected criteria
    return true;
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
          <h3 className="page-title mb-1">Results</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Examinations</li>
              <li className="breadcrumb-item active">Results</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchResultData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handlePublishResults}>
            <i className="ti ti-send me-2"></i>Publish Results
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
                  <h4 className="mb-1">{resultData?.overview.totalResults}</h4>
                  <p className="mb-0">Total Results</p>
                  <small>All examinations</small>
                </div>
                <i className="ti ti-chart-bar fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{resultData?.overview.publishedResults}</h4>
                  <p className="mb-0">Published</p>
                  <small>Results published</small>
                </div>
                <i className="ti ti-send fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{resultData?.overview.averageScore}%</h4>
                  <p className="mb-0">Average Score</p>
                  <strong>{resultData?.overview.passRate}%</strong> Pass rate
                </div>
                <i className="ti ti-chart-line fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{resultData?.overview.pendingResults}</h4>
                  <p className="mb-0">Pending</p>
                  <small>Results pending</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
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
              <h5 className="card-title">Result Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'results' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('results')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Results
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'publish' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('publish')}
                >
                  <i className="ti ti-send me-2"></i>
                  Publish Results
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'analysis' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('analysis')}
                >
                  <i className="ti ti-chart-bar me-2"></i>
                  Result Analysis
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'students' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('students')}
                >
                  <i className="ti ti-users me-2"></i>
                  Student Results
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Result Reports
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
                    <h5 className="card-title mb-0">Score Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={resultData?.scoreDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Subject Performance</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={resultData?.subjectResults || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#10b981" />
                        <Bar dataKey="passRate" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Class Performance</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={resultData?.classResults || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="class" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#10b981" />
                        <Bar dataKey="passRate" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Results */}
          {selectedSection === 'results' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Results</h5>
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
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                    <option value="social-studies">Social Studies</option>
                    <option value="computer">Computer Science</option>
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
                        <th>Grade/Section</th>
                        <th>Subject</th>
                        <th>Total Students</th>
                        <th>Pass Rate</th>
                        <th>Average Score</th>
                        <th>Highest Score</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-muted">
                            No results found. Click "Publish Results" to publish exam results.
                          </td>
                        </tr>
                      ) : (
                        filteredResults.map((result) => (
                          <tr key={result.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`avatar avatar-sm bg-${
                                  result.examType === 'Final Exam' ? 'danger' :
                                  result.examType === 'Mid Term' ? 'warning' :
                                  result.examType === 'Unit Test' ? 'primary' : 'info'
                                } text-white rounded-circle me-2`}>
                                  <i className="ti ti-chart-bar"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{result.examTitle}</h6>
                                  <small className="text-muted">{result.examType}</small>
                                </div>
                              </div>
                            </td>
                            <td>{result.examType}</td>
                            <td>{result.grade} - {result.section}</td>
                            <td>{result.subject}</td>
                            <td>{result.totalStudents}</td>
                            <td>
                              <span className={`badge bg-${
                                result.passRate >= 80 ? 'success' :
                                result.passRate >= 60 ? 'warning' : 'danger'
                              }`}>
                                {result.passRate}%
                              </span>
                            </td>
                            <td>{result.averageScore}%</td>
                            <td>{result.highestScore}%</td>
                            <td>
                              <span className={`badge ${
                                result.status === 'published' ? 'bg-success' :
                                result.status === 'draft' ? 'bg-warning' : 'bg-info'
                              }`}>
                                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                {result.status === 'draft' && (
                                  <button className="btn btn-outline-success" title="Publish">
                                    <i className="ti ti-send"></i>
                                  </button>
                                )}
                                <button className="btn btn-outline-info" title="Download">
                                  <i className="ti ti-download"></i>
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

          {/* Publish Results */}
          {selectedSection === 'publish' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Publish Results</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Select Exam</label>
                        <select className="form-select" required>
                          <option value="">Select exam to publish results</option>
                          <option value="exam1">Mathematics Unit Test</option>
                          <option value="exam2">Science Mid Term</option>
                          <option value="exam3">English Final Exam</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Grade/Section</label>
                        <select className="form-select" required>
                          <option value="">Select grade/section</option>
                          <option value="grade1-a">Grade 1 - A</option>
                          <option value="grade1-b">Grade 1 - B</option>
                          <option value="grade2-a">Grade 2 - A</option>
                          <option value="grade2-b">Grade 2 - B</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Result Preview */}
                  <div className="mb-3">
                    <h6>Result Preview</h6>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Roll No</th>
                            <th>Student Name</th>
                            <th>Marks Obtained</th>
                            <th>Total Marks</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>001</td>
                            <td>John Smith</td>
                            <td>85</td>
                            <td>100</td>
                            <td>85%</td>
                            <td><span className="badge bg-primary">A</span></td>
                            <td><span className="badge bg-success">Pass</span></td>
                          </tr>
                          <tr>
                            <td>002</td>
                            <td>Jane Doe</td>
                            <td>92</td>
                            <td>100</td>
                            <td>92%</td>
                            <td><span className="badge bg-success">A+</span></td>
                            <td><span className="badge bg-success">Pass</span></td>
                          </tr>
                          <tr>
                            <td>003</td>
                            <td>Robert Johnson</td>
                            <td>45</td>
                            <td>100</td>
                            <td>45%</td>
                            <td><span className="badge bg-danger">F</span></td>
                            <td><span className="badge bg-danger">Fail</span></td>
                          </tr>
                          {/* More student rows... */}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Publish Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Publish Time</label>
                        <input type="time" className="form-control" required />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notification Settings</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="notify-students" defaultChecked />
                      <label className="form-check-label" htmlFor="notify-students">
                        Notify students via email/SMS
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="notify-parents" defaultChecked />
                      <label className="form-check-label" htmlFor="notify-parents">
                        Notify parents via email/SMS
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="publish-website" defaultChecked />
                      <label className="form-check-label" htmlFor="publish-website">
                        Publish on student portal
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Additional Message</label>
                    <textarea className="form-control" rows={3} placeholder="Enter message to be sent with result notification"></textarea>
                  </div>

                  <div className="d-flex justify-content-between">
                    <div>
                      <button type="button" className="btn btn-outline-primary">
                        <i className="ti ti-calculator me-1"></i>Calculate Statistics
                      </button>
                      <button type="button" className="btn btn-outline-secondary ms-2">
                        <i className="ti ti-file-upload me-1"></i>Import Results
                      </button>
                    </div>
                    <div>
                      <button type="button" className="btn btn-secondary me-2">Save as Draft</button>
                      <button type="button" className="btn btn-outline-primary me-2">
                        <i className="ti ti-eye me-1"></i>Preview
                      </button>
                      <button type="submit" className="btn btn-success">
                        <i className="ti ti-send me-1"></i>Publish Results
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Result Analysis */}
          {selectedSection === 'analysis' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Result Analysis</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-success">Highest Score</h6>
                        <h4>{resultData?.overview.topScore}%</h4>
                        <small className="text-muted">Top performer</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-primary">Average Score</h6>
                        <h4>{resultData?.overview.averageScore}%</h4>
                        <small className="text-muted">Overall average</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-warning">Lowest Score</h6>
                        <h4>{resultData?.overview.lowestScore}%</h4>
                        <small className="text-muted">Needs improvement</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border">
                      <div className="card-body text-center">
                        <h6 className="text-info">Pass Rate</h6>
                        <h4>{resultData?.overview.passRate}%</h4>
                        <small className="text-muted">Students passed</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <h6>Performance Analysis</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={resultData?.subjectResults || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="averageScore" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="passRate" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="highestScore" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Results */}
          {selectedSection === 'students' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Student Results</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search student..." 
                  />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-search me-1"></i>Search
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll No</th>
                        <th>Grade/Section</th>
                        <th>Latest Exam</th>
                        <th>Score</th>
                        <th>Grade</th>
                        <th>Overall Average</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={10} className="text-center text-muted">
                          Student results will be displayed here.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Result Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Result Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                        <h6>Result Summary</h6>
                        <p className="text-muted small">Complete result analysis</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-users fs-24 text-success mb-2"></i>
                        <h6>Student Report</h6>
                        <p className="text-muted small">Individual performance</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-warning mb-2"></i>
                        <h6>Class Report</h6>
                        <p className="text-muted small">Class-wise performance</p>
                        <button className="btn btn-warning btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-book fs-24 text-info mb-2"></i>
                        <h6>Subject Report</h6>
                        <p className="text-muted small">Subject-wise analysis</p>
                        <button className="btn btn-info btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-trending-up fs-24 text-danger mb-2"></i>
                        <h6>Trend Report</h6>
                        <p className="text-muted small">Performance trends</p>
                        <button className="btn btn-danger btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-circle fs-24 text-secondary mb-2"></i>
                        <h6>Alert Report</h6>
                        <p className="text-muted small">Students at risk</p>
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

export default AdminResultsPage;