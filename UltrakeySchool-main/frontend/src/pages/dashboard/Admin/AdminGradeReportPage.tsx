import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface GradeReportData {
  overview: {
    totalGrades: number;
    averageGPA: number;
    highestGPA: number;
    lowestGPA: number;
    studentsAboveAverage: number;
    studentsBelowAverage: number;
  };
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  subjectPerformance: {
    subject: string;
    averageGrade: string;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }[];
  classPerformance: {
    className: string;
    averageGPA: number;
    totalStudents: number;
    topPerformers: number;
    needsImprovement: number;
  }[];
  gradeTrend: {
    exam: string;
    averageGPA: number;
    improvementRate: number;
  }[];
}

const AdminGradeReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<GradeReportData | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, [selectedExam, selectedClass, selectedSubject]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setReportData({
        overview: {
          totalGrades: 0,
          averageGPA: 0,
          highestGPA: 0,
          lowestGPA: 0,
          studentsAboveAverage: 0,
          studentsBelowAverage: 0
        },
        gradeDistribution: [
          { grade: 'A+', count: 0, percentage: 0, color: '#10b981' },
          { grade: 'A', count: 0, percentage: 0, color: '#3b82f6' },
          { grade: 'B', count: 0, percentage: 0, color: '#f59e0b' },
          { grade: 'C', count: 0, percentage: 0, color: '#ef4444' },
          { grade: 'D', count: 0, percentage: 0, color: '#8b5cf6' },
          { grade: 'F', count: 0, percentage: 0, color: '#6b7280' }
        ],
        subjectPerformance: [
          { subject: 'Mathematics', averageGrade: 'B', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { subject: 'Science', averageGrade: 'B', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { subject: 'English', averageGrade: 'B', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { subject: 'Social Studies', averageGrade: 'B', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 },
          { subject: 'Computer', averageGrade: 'B', averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 }
        ],
        classPerformance: [
          { className: 'Grade 1-A', averageGPA: 0, totalStudents: 0, topPerformers: 0, needsImprovement: 0 },
          { className: 'Grade 2-A', averageGPA: 0, totalStudents: 0, topPerformers: 0, needsImprovement: 0 },
          { className: 'Grade 3-A', averageGPA: 0, totalStudents: 0, topPerformers: 0, needsImprovement: 0 },
          { className: 'Grade 4-A', averageGPA: 0, totalStudents: 0, topPerformers: 0, needsImprovement: 0 },
          { className: 'Grade 5-A', averageGPA: 0, totalStudents: 0, topPerformers: 0, needsImprovement: 0 }
        ],
        gradeTrend: [
          { exam: 'Mid Term', averageGPA: 0, improvementRate: 0 },
          { exam: 'Final Exam', averageGPA: 0, improvementRate: 0 },
          { exam: 'Quiz 1', averageGPA: 0, improvementRate: 0 },
          { exam: 'Quiz 2', averageGPA: 0, improvementRate: 0 },
          { exam: 'Assignment', averageGPA: 0, improvementRate: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching grade report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Handle export logic
    console.log('Exporting grade report...');
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

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Grade Report</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active">Grade Report</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchReportData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleExportReport}>
            <i className="ti ti-download me-2"></i>Export Report
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
                  <h4 className="mb-1">{reportData?.overview.averageGPA.toFixed(2)}</h4>
                  <p className="mb-0">Average GPA</p>
                  <small>School average</small>
                </div>
                <i className="ti ti-chart-line fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.highestGPA.toFixed(2)}</h4>
                  <p className="mb-0">Highest GPA</p>
                  <small>Top performer</small>
                </div>
                <i className="ti ti-trophy fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.studentsAboveAverage}</h4>
                  <p className="mb-0">Above Average</p>
                  <strong>{reportData?.overview.studentsBelowAverage}</strong> Below
                </div>
                <i className="ti ti-chart-bar fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.totalGrades}</h4>
                  <p className="mb-0">Total Grades</p>
                  <small>All assessments</small>
                </div>
                <i className="ti ti-file-text fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">Exam Type</label>
              <select 
                className="form-select"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <option value="all">All Exams</option>
                <option value="midterm">Mid Term</option>
                <option value="final">Final Exam</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Class</label>
              <select 
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                <option value="grade1">Grade 1</option>
                <option value="grade2">Grade 2</option>
                <option value="grade3">Grade 3</option>
                <option value="grade4">Grade 4</option>
                <option value="grade5">Grade 5</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Subject</label>
              <select 
                className="form-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">All Subjects</option>
                <option value="math">Mathematics</option>
                <option value="science">Science</option>
                <option value="english">English</option>
                <option value="social">Social Studies</option>
                <option value="computer">Computer</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary w-100">Apply Filters</button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Grade Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={reportData?.gradeDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData?.gradeDistribution.map((entry, index) => (
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
              <h5 className="card-title mb-0">Grade Performance Trend</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData?.gradeTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="exam" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="averageGPA" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Subject Performance Analysis</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.subjectPerformance || []}>
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

      {/* Class Performance */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Class-wise GPA Performance</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.classPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageGPA" fill="#3b82f6" />
              <Bar dataKey="topPerformers" fill="#10b981" />
              <Bar dataKey="needsImprovement" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Grade Summary Details</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm">
              <i className="ti ti-printer me-1"></i>Print
            </button>
            <button className="btn btn-outline-success btn-sm">
              <i className="ti ti-download me-1"></i>Excel
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Count</th>
                  <th>Percentage</th>
                  <th>GPA Range</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.gradeDistribution.map((gradeData, index) => (
                  <tr key={index}>
                    <td>
                      <span className="badge" style={{ backgroundColor: gradeData.color, color: 'white' }}>
                        {gradeData.grade}
                      </span>
                    </td>
                    <td>{gradeData.count}</td>
                    <td>{gradeData.percentage}%</td>
                    <td>
                      {gradeData.grade === 'A+' && '4.0'}
                      {gradeData.grade === 'A' && '3.7-3.9'}
                      {gradeData.grade === 'B' && '3.0-3.6'}
                      {gradeData.grade === 'C' && '2.0-2.9'}
                      {gradeData.grade === 'D' && '1.0-1.9'}
                      {gradeData.grade === 'F' && '0.0-0.9'}
                    </td>
                    <td>
                      {gradeData.grade === 'A+' && 'Outstanding'}
                      {gradeData.grade === 'A' && 'Excellent'}
                      {gradeData.grade === 'B' && 'Good'}
                      {gradeData.grade === 'C' && 'Average'}
                      {gradeData.grade === 'D' && 'Below Average'}
                      {gradeData.grade === 'F' && 'Fail'}
                    </td>
                    <td>
                      <span className={`badge ${
                        gradeData.grade === 'A+' || gradeData.grade === 'A' ? 'bg-success' :
                        gradeData.grade === 'B' ? 'bg-primary' :
                        gradeData.grade === 'C' ? 'bg-warning' :
                        gradeData.grade === 'D' ? 'bg-info' : 'bg-danger'
                      }`}>
                        {gradeData.grade === 'A+' || gradeData.grade === 'A' ? 'Excellent' :
                         gradeData.grade === 'B' ? 'Good' :
                         gradeData.grade === 'C' ? 'Average' :
                         gradeData.grade === 'D' ? 'Needs Work' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGradeReportPage;
