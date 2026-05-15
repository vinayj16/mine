import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { isAuthenticated, isTeacher } from '../utils/auth';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { LoadingSpinner, ErrorMessage, EmptyState } from './common/LoadingSpinner';
import '../styles/teacher-analytics.css';

interface TeacherAnalyticsProps {
  className?: string;
  enableRefresh?: boolean;
  refreshInterval?: number;
  showActions?: boolean;
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
}

const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  className = '',
  enableRefresh = true,
  refreshInterval = 30000, // 30 seconds default
  showActions = true,
  dateRange = 'month',
}) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Memoized API endpoints based on date range
  const apiEndpoints = useMemo(() => {
    const baseEndpoints = {
      performance: API_ENDPOINTS.ANALYTICS.TEACHER.PERFORMANCE,
      attendance: API_ENDPOINTS.ANALYTICS.TEACHER.ATTENDANCE,
      classes: API_ENDPOINTS.ANALYTICS.TEACHER.CLASSES,
      exams: API_ENDPOINTS.ANALYTICS.TEACHER.EXAMS,
    };
    
    // Add date range filtering if specified
    if (dateRange !== 'month') {
      return {
        ...baseEndpoints,
        performance: `${baseEndpoints.performance}?period=${dateRange}`,
        attendance: `${baseEndpoints.attendance}?period=${dateRange}`,
        classes: `${baseEndpoints.classes}?period=${dateRange}`,
        exams: `${baseEndpoints.exams}?period=${dateRange}`,
      };
    }
    
    return baseEndpoints;
  }, [dateRange]);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated and has teacher role
      if (!isAuthenticated()) {
        setError('Please log in to view teacher analytics');
        setIsLoading(false);
        return;
      }

      if (!isTeacher()) {
        setError('Access denied. Teacher privileges required.');
        setIsLoading(false);
        return;
      }

      // Fetch teacher-specific analytics data
      const [performanceData, attendanceData, classesData, examsData] = await Promise.all([
        apiService.get(apiEndpoints.performance),
        apiService.get(apiEndpoints.attendance),
        apiService.get(apiEndpoints.classes),
        apiService.get(API_ENDPOINTS.ANALYTICS.TEACHER.EXAMS),
      ]);

      setAnalyticsData({
        performance: performanceData.success ? performanceData.data : null,
        attendance: attendanceData.success ? attendanceData.data : null,
        classes: classesData.success ? classesData.data : null,
        exams: examsData.success ? examsData.data : null,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setIsLoading(false);
    }
  }, [apiEndpoints]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableRefresh) return;

    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchAnalyticsData, enableRefresh, refreshInterval]);

  // Enhanced loading state with better UX
  if (isLoading) {
    return (
      <div className={`teacher-analytics-loading ${className || ''}`}>
        <LoadingSpinner message="Loading analytics data..." fullPage variant="primary" />
      </div>
    );
  }

  // Enhanced error state with better UX
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => fetchAnalyticsData()}
        variant="danger"
        icon="ti ti-alert-triangle"
        title="Analytics Error"
      />
    );
  }

  // Enhanced empty state
  if (!analyticsData) {
    return (
      <EmptyState
        title="No Analytics Data"
        message="No analytics data available for the selected period"
        icon={<i className="ti ti-chart-bar"></i>}
        action={{
          label: "Refresh Data",
          onClick: () => fetchAnalyticsData(),
        }}
      />
    );
  }

  // Date range selector
  const DateRangeSelector = () => {
    return (
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Date Range</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <button
                  className={`btn btn-sm ${selectedDateRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedDateRange('week')}
                >
                  Week
                </button>
                <button
                  className={`btn btn-sm ${selectedDateRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedDateRange('month')}
                >
                  Month
                </button>
                <button
                  className={`btn btn-sm ${selectedDateRange === 'quarter' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedDateRange('quarter')}
                >
                  Quarter
                </button>
                <button
                  className={`btn btn-sm ${selectedDateRange === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedDateRange('year')}
                >
                  Year
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`teacher-analytics ${className || ''}`}>
      {/* Teacher Analytics Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Teacher Analytics</h2>
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
                  <h6 className="text-muted mb-2">Classes Handled</h6>
                  <h4 className="mb-0">
                    {analyticsData?.classes ? analyticsData.classes.length : '0'}
                  </h4>
                </div>
                <div className="avatar-sm bg-primary rounded-circle">
                  <i className="fas fa-chalkboard-teacher text-white"></i>
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
                  <h6 className="text-muted mb-2">Exams Conducted</h6>
                  <h4 className="mb-0">
                    {analyticsData?.exams ? analyticsData.exams.length : '0'}
                  </h4>
                </div>
                <div className="avatar-sm bg-success rounded-circle">
                  <i className="fas fa-file-alt text-white"></i>
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
                  <h6 className="text-muted mb-2">Class Average</h6>
                  <h4 className="mb-0 text-primary">
                    {analyticsData?.performance ? `${analyticsData.performance.averageScore || 0}%` : '0%'}
                  </h4>
                </div>
                <div className="avatar-sm bg-info rounded-circle">
                  <i className="fas fa-chart-bar text-white"></i>
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
                  <h4 className="mb-0 text-success">
                    {analyticsData?.attendance ? `${analyticsData.attendance.overallRate || 0}%` : '0%'}
                  </h4>
                </div>
                <div className="avatar-sm bg-warning rounded-circle">
                  <i className="fas fa-check-circle text-white"></i>
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
              <h5 className="card-title mb-0">Class Performance</h5>
            </div>
            <div className="card-body">
              <div id="teacher_performance_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Class Attendance</h5>
            </div>
            <div className="card-body">
              <div id="class_attendance_chart" style={{ minHeight: '350px' }}>
                {/* Chart will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Details */}
      {analyticsData && (
        <div className="row mt-4">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Class Performance Details</h5>
              </div>
              <div className="card-body">
                {analyticsData.performance ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Average Score</th>
                          <th>Exam Count</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.performance.classes ? (
                          analyticsData.performance.classes.map((classData: any, index: number) => (
                            <tr key={index}>
                              <td>{classData.className || 'Unknown'}</td>
                              <td>{classData.subject || 'N/A'}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    classData.averageScore >= 70 ? 'bg-success' : 'bg-warning'
                                  }`}
                                >
                                  {classData.averageScore || 0}%
                                </span>
                              </td>
                              <td>{classData.examCount || 0}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    classData.status === 'excellent'
                                      ? 'bg-success'
                                      : classData.status === 'good'
                                      ? 'bg-info'
                                      : 'bg-warning'
                                  }`}
                                >
                                  {classData.status || 'Average'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center text-muted">
                              No performance data available
                            </td>
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
                <h5 className="card-title mb-0">Quick Stats</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <h6 className="text-muted mb-1">Top Performing Class</h6>
                    <h5 className="mb-0">
                      {analyticsData.performance?.topClass || 'N/A'}
                    </h5>
                  </div>

                  <div>
                    <h6 className="text-muted mb-1">Lowest Performing Class</h6>
                    <h5 className="mb-0 text-danger">
                      {analyticsData.performance?.lowestClass || 'N/A'}
                    </h5>
                  </div>

                  <div>
                    <h6 className="text-muted mb-1">Total Students</h6>
                    <h5 className="mb-0">
                      {analyticsData.performance?.totalStudents || 0}
                    </h5>
                  </div>

                  <div>
                    <h6 className="text-muted mb-1">Average Attendance</h6>
                    <h5 className="mb-0">
                      {analyticsData.attendance?.overallRate || 0}%
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && analyticsData && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-plus me-2"></i>
                    Add Exam
                  </button>
                  <button className="btn btn-success btn-sm">
                    <i className="ti ti-chart-line me-2"></i>
                    View Reports
                  </button>
                  <button className="btn btn-info btn-sm">
                    <i className="ti ti-download me-2"></i>
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {DateRangeSelector()}
    </div>
  );
};

export default TeacherAnalytics;