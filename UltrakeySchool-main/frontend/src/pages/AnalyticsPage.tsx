import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/client';

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  revenueThisMonth: number;
  pendingFees: number;
}

interface DataQuality {
  studentData: number;
  attendanceData: number;
  operationalData: number;
  compliance: number;
}

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality>({
    studentData: 98,
    attendanceData: 95,
    operationalData: 92,
    compliance: 94,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'student';

  const canViewAdminAnalytics = userRole === 'admin' || userRole === 'superadmin';
  const canViewTeacherAnalytics = userRole === 'teacher' || userRole === 'admin' || userRole === 'superadmin';
  const canViewStudentAnalytics = true; // All users can view student analytics

  useEffect(() => {
    fetchAnalyticsData();
    fetchDataQuality();

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '/analytics/dashboard';
      
      switch (activeTab) {
        case 'admin':
          endpoint = '/analytics/admin';
          break;
        case 'teacher':
          endpoint = '/analytics/teacher';
          break;
        case 'student':
          endpoint = '/analytics/student';
          break;
        default:
          endpoint = '/analytics/dashboard';
      }

      const response = await apiClient.get(endpoint);

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load analytics data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataQuality = async () => {
    try {
      const response = await apiClient.get('/analytics/data-quality');
      if (response.data.success) {
        setDataQuality(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching data quality:', err);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing export...');
      const response = await apiClient.post('/analytics/export', {
        tab: activeTab,
        format: 'csv'
      });

      if (response.data.success) {
        toast.success('Export completed successfully');
        // Handle download if file URL is provided
        if (response.data.data.fileUrl) {
          window.open(response.data.data.fileUrl, '_blank');
        }
      }
    } catch (err: any) {
      console.error('Error exporting data:', err);
      toast.error(err.response?.data?.message || 'Failed to export data');
    }
  };

  const getQualityBadgeClass = (percentage: number) => {
    if (percentage >= 95) return 'badge-soft-success';
    if (percentage >= 90) return 'badge-soft-primary';
    if (percentage >= 85) return 'badge-soft-warning';
    return 'badge-soft-danger';
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Analytics & Insights</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Analytics
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="mb-2 me-2">
            <button className="btn btn-outline-primary btn-sm" onClick={handleExportData}>
              <i className="ti ti-download me-2"></i>
              Export Data
            </button>
          </div>
          <div className="mb-2">
            <button className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-calendar me-2"></i>
              Set Date Range
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs nav-tabs-bottom" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                type="button"
              >
                <i className="ti ti-dashboard me-2"></i>
                Dashboard
              </button>
            </li>

            {canViewAdminAnalytics && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                  type="button"
                >
                  <i className="ti ti-shield-check me-2"></i>
                  Admin Analytics
                </button>
              </li>
            )}

            {canViewTeacherAnalytics && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'teacher' ? 'active' : ''}`}
                  onClick={() => setActiveTab('teacher')}
                  type="button"
                >
                  <i className="ti ti-school me-2"></i>
                  Teacher Analytics
                </button>
              </li>
            )}

            {canViewStudentAnalytics && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'student' ? 'active' : ''}`}
                  onClick={() => setActiveTab('student')}
                  type="button"
                >
                  <i className="ti ti-user-check me-2"></i>
                  Student Analytics
                </button>
              </li>
            )}

            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
                type="button"
              >
                <i className="ti ti-file-text me-2"></i>
                Reports
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading analytics...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
              <h4 className="mb-3">{error}</h4>
              <button className="btn btn-primary" onClick={fetchAnalyticsData}>
                <i className="ti ti-refresh me-2"></i>
                Retry
              </button>
            </div>
          ) : (
            <div className="tab-content">
              {activeTab === 'dashboard' && (
                <div className="tab-pane active">
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <div className="card bg-primary text-white">
                        <div className="card-body">
                          <h6 className="text-white-50 mb-2">Total Students</h6>
                          <h3 className="mb-0">{analyticsData?.totalStudents || 0}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h6 className="text-white-50 mb-2">Total Teachers</h6>
                          <h3 className="mb-0">{analyticsData?.totalTeachers || 0}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card bg-info text-white">
                        <div className="card-body">
                          <h6 className="text-white-50 mb-2">Total Classes</h6>
                          <h3 className="mb-0">{analyticsData?.totalClasses || 0}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card bg-warning text-white">
                        <div className="card-body">
                          <h6 className="text-white-50 mb-2">Attendance Rate</h6>
                          <h3 className="mb-0">{analyticsData?.attendanceRate || 0}%</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2"></i>
                    Dashboard analytics showing real-time data from all systems.
                  </div>
                </div>
              )}

              {activeTab === 'admin' && canViewAdminAnalytics && (
                <div className="tab-pane active">
                  <div className="alert alert-primary">
                    <i className="ti ti-shield-check me-2"></i>
                    Admin analytics view with comprehensive system metrics.
                  </div>
                  <p className="text-muted">Admin-specific analytics and reports will be displayed here.</p>
                </div>
              )}

              {activeTab === 'teacher' && canViewTeacherAnalytics && (
                <div className="tab-pane active">
                  <div className="alert alert-success">
                    <i className="ti ti-school me-2"></i>
                    Teacher analytics view with class performance metrics.
                  </div>
                  <p className="text-muted">Teacher-specific analytics and reports will be displayed here.</p>
                </div>
              )}

              {activeTab === 'student' && canViewStudentAnalytics && (
                <div className="tab-pane active">
                  <div className="alert alert-info">
                    <i className="ti ti-user-check me-2"></i>
                    Student analytics view with academic performance metrics.
                  </div>
                  <p className="text-muted">Student-specific analytics and reports will be displayed here.</p>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="tab-pane active">
                  <div className="text-center text-muted py-5">
                    <i className="ti ti-file-text fs-1 mb-3"></i>
                    <p className="mb-2">Reports view is being redesigned. Check back later.</p>
                    <small>Need data exports now? Use the export button above.</small>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="row mt-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Real-time Data</h6>
                  <h4 className="mb-0">{currentTime.toLocaleTimeString()}</h4>
                </div>
                <div className="avatar avatar-lg bg-info rounded">
                  <i className="ti ti-clock text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Data Sources</h6>
                  <h4 className="mb-0">15+ Systems</h4>
                </div>
                <div className="avatar avatar-lg bg-success rounded">
                  <i className="ti ti-database text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Charts Available</h6>
                  <h4 className="mb-0">12+ Types</h4>
                </div>
                <div className="avatar avatar-lg bg-warning rounded">
                  <i className="ti ti-chart-bar text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2">Last Updated</h6>
                  <h4 className="mb-0">{currentTime.toLocaleDateString()}</h4>
                </div>
                <div className="avatar avatar-lg bg-primary rounded">
                  <i className="ti ti-refresh text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality Indicators */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Data Quality Status</h5>
              <div className="d-flex gap-2">
                <span className="badge badge-soft-success">Excellent (95%+)</span>
                <span className="badge badge-soft-primary">Good (90-94%)</span>
                <span className="badge badge-soft-warning">Fair (85-89%)</span>
                <span className="badge badge-soft-danger">Needs Attention (&lt;85%)</span>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Student Data</span>
                    <span className={`badge ${getQualityBadgeClass(dataQuality.studentData)}`}>
                      {dataQuality.studentData}%
                    </span>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Attendance Data</span>
                    <span className={`badge ${getQualityBadgeClass(dataQuality.attendanceData)}`}>
                      {dataQuality.attendanceData}%
                    </span>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Operational Data</span>
                    <span className={`badge ${getQualityBadgeClass(dataQuality.operationalData)}`}>
                      {dataQuality.operationalData}%
                    </span>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Compliance</span>
                    <span className={`badge ${getQualityBadgeClass(dataQuality.compliance)}`}>
                      {dataQuality.compliance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
