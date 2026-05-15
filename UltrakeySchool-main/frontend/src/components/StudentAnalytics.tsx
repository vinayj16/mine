import React, { useEffect, useState } from 'react';
import ChartLoader from '../utils/chartLoader';
import { isAuthenticated, isStudent } from '../utils/auth';
import { apiService } from '../services/api';

interface StudentAnalyticsProps {
  className?: string;
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const initializeStudentAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated and has student role
        if (!isAuthenticated()) {
          setError('Please log in to view student analytics');
          setIsLoading(false);
          return;
        }

        if (!isStudent()) {
          setError('Access denied. Student privileges required.');
          setIsLoading(false);
          return;
        }

        // Fetch student-specific analytics data
        const [performanceData, attendanceData, homeworkData, examData] = await Promise.all([
          apiService.get('/analytics/student/performance', { period: 'monthly' }),
          apiService.get('/analytics/student/attendance'),
          apiService.get('/analytics/student/homework'),
          apiService.get('/analytics/student/exams')
        ]);

        setAnalyticsData({
          performance: performanceData.success ? performanceData.data : null,
          attendance: attendanceData.success ? attendanceData.data : null,
          homework: homeworkData.success ? homeworkData.data : null,
          exams: examData.success ? examData.data : null
        });

        // Initialize student-specific charts
        await ChartLoader.loadStudentCharts();
        setIsLoading(false);

      } catch (err) {
        console.error('Failed to initialize student analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load student analytics');
        setIsLoading(false);
      }
    };

    initializeStudentAnalytics();

    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`student-analytics-loading ${className || ''}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading student analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`student-analytics-error ${className || ''}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
          <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
          <h5 className="text-danger mb-2">Error Loading Analytics</h5>
          <p className="text-muted text-center mb-4">{error}</p>
          <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`student-analytics ${className || ''}`}>
      {/* Student Analytics Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Your Academic Analytics</h2>
            <div className="text-muted">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Overall Grade</h6>
                  <h4 className="mb-0">
                    {analyticsData?.performance ? analyticsData.performance.overallGrade || 'N/A' : 'N/A'}
                  </h4>
                </div>
                <div className="avatar-sm bg-primary rounded-circle">
                  <i className="fas fa-graduation-cap text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Attendance Rate</h6>
                  <h4 className="mb-0">
                    {analyticsData?.attendance ? `${analyticsData.attendance.rate || 0}%` : '0%'}
                  </h4>
                </div>
                <div className="avatar-sm bg-success rounded-circle">
                  <i className="fas fa-check-circle text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Homework Completed</h6>
                  <h4 className="mb-0 text-primary">
                    {analyticsData?.homework ? analyticsData.homework.completedCount || 0 : '0'}
                  </h4>
                </div>
                <div className="avatar-sm bg-info rounded-circle">
                  <i className="fas fa-book text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Exams Taken</h6>
                  <h4 className="mb-0 text-success">
                    {analyticsData?.exams ? analyticsData.exams.length : '0'}
                  </h4>
                </div>
                <div className="avatar-sm bg-warning rounded-circle">
                  <i className="fas fa-file-alt text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Your Performance</h5>
            </div>
            <div className="card-body">
              <div id="student_performance_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Your Attendance</h5>
            </div>
            <div className="card-body">
              <div id="student_attendance_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Details */}
      {analyticsData && (
        <div className="row mt-4">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Detailed Performance</h5>
              </div>
              <div className="card-body">
                {analyticsData.performance ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Average Score</th>
                          <th>Best Score</th>
                          <th>Worst Score</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.performance.subjects ? (
                          analyticsData.performance.subjects.map((subjectData: any, index: number) => (
                            <tr key={index}>
                              <td>{subjectData.subject || 'Unknown'}</td>
                              <td>
                                <span className={`badge ${subjectData.averageScore >= 70 ? 'bg-success' : subjectData.averageScore >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                  {subjectData.averageScore || 0}%
                                </span>
                              </td>
                              <td>{subjectData.bestScore || 0}%</td>
                              <td>{subjectData.worstScore || 0}%</td>
                              <td>
                                <span className={`badge ${subjectData.status === 'excellent' ? 'bg-success' : subjectData.status === 'good' ? 'bg-info' : subjectData.status === 'average' ? 'bg-warning' : 'bg-danger'}`}>
                                  {subjectData.status || 'Needs Improvement'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center text-muted">No performance data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No performance data available</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Study Insights</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <h6 className="text-muted mb-1">Strongest Subject</h6>
                    <h5 className="mb-0 text-success">
                      {analyticsData.performance?.strongestSubject || 'N/A'}
                    </h5>
                  </div>
                  
                  <div>
                    <h6 className="text-muted mb-1">Weakest Subject</h6>
                    <h5 className="mb-0 text-danger">
                      {analyticsData.performance?.weakestSubject || 'N/A'}
                    </h5>
                  </div>
                  
                  <div>
                    <h6 className="text-muted mb-1">Total Assignments</h6>
                    <h5 className="mb-0">
                      {analyticsData.homework?.totalCount || 0}
                    </h5>
                  </div>
                  
                  <div>
                    <h6 className="text-muted mb-1">Assignment Completion</h6>
                    <h5 className="mb-0">
                      {analyticsData.homework?.completionRate || 0}%
                    </h5>
                  </div>
                  
                  <div>
                    <h6 className="text-muted mb-1">Average Exam Score</h6>
                    <h5 className="mb-0">
                      {analyticsData.performance?.averageExamScore || 0}%
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analyticsData && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Personalized Recommendations</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-6">
                    <h6>Study Suggestions</h6>
                    {analyticsData.performance?.recommendations ? (
                      <ul className="list-unstyled">
                        {analyticsData.performance.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="mb-2">
                            <i className="fas fa-lightbulb text-warning me-2"></i>
                            <span className="text-muted">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No specific recommendations at this time. Keep up the good work!</p>
                    )}
                  </div>
                  
                  <div className="col-lg-6">
                    <h6>Goals to Work On</h6>
                    {analyticsData.performance?.goals ? (
                      <ul className="list-unstyled">
                        {analyticsData.performance.goals.map((goal: any, index: number) => (
                          <li key={index} className="mb-2">
                            <span className={`badge ${goal.priority === 'high' ? 'bg-danger' : goal.priority === 'medium' ? 'bg-warning' : 'bg-info'} me-2`}>
                              {goal.priority.toUpperCase()}
                            </span>
                            <span className="text-muted">{goal.description}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No specific goals identified. Continue maintaining your performance!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Quick Actions</h6>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary btn-sm">
                    <i className="fas fa-book me-2"></i>View Assignments
                  </button>
                  <button className="btn btn-success btn-sm">
                    <i className="fas fa-chart-line me-2"></i>Download Report
                  </button>
                  <button className="btn btn-info btn-sm">
                    <i className="fas fa-trophy me-2"></i>Set Goals
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;