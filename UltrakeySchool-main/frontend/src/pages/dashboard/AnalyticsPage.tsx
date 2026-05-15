import React, { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  trafficBySource: Array<{ source: string; visitors: number }>;
}

interface InstitutionAnalytics {
  totalInstitutions: number;
  activeInstitutions: number;
  institutionsByType: Record<string, number>;
  institutionsByPlan: Record<string, number>;
  recentInstitutions: Array<{
    name: string;
    code: string;
    type: string;
    createdAt: string;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [institutionData, setInstitutionData] = useState<InstitutionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch institution analytics
      try {
        const response = await apiClient.get('/analytics/institution')
        if (response.data?.success && response.data?.data) {
          const apiData = response.data.data
          setInstitutionData({
            totalInstitutions: apiData.totalInstitutions || 0,
            activeInstitutions: apiData.activeInstitutions || 0,
            institutionsByType: apiData.institutionsByType || {},
            institutionsByPlan: apiData.institutionsByPlan || {},
            recentInstitutions: Array.isArray(apiData.recentInstitutions) ? apiData.recentInstitutions : []
          })
        }
      } catch (err) {
        console.error('Error fetching institution analytics:', err)
      }

      // Fetch growth data
      try {
        const growthResponse = await apiClient.get('/analytics/institution-growth')
        if (growthResponse.data?.success && growthResponse.data?.data?.growth) {
          const growth = growthResponse.data.data.growth
          const totalViews = growth.reduce((sum: number, m: { institutions: number }) => sum + m.institutions, 0) * 100
          setData(prev => prev ? { ...prev, totalViews } : {
            totalViews,
            uniqueVisitors: totalViews * 0.3,
            pageViews: totalViews * 0.7,
            bounceRate: 32.4,
            avgSessionDuration: 245,
            topPages: [
              { page: 'Dashboard', views: Math.floor(totalViews * 0.3) },
              { page: 'User Directory', views: Math.floor(totalViews * 0.2) },
              { page: 'Student List', views: Math.floor(totalViews * 0.15) },
              { page: 'Fee Collection', views: Math.floor(totalViews * 0.1) },
              { page: 'Attendance', views: Math.floor(totalViews * 0.08) }
            ],
            trafficBySource: [
              { source: 'Direct', visitors: Math.floor(totalViews * 0.4) },
              { source: 'Search', visitors: Math.floor(totalViews * 0.3) },
              { source: 'Referral', visitors: Math.floor(totalViews * 0.2) },
              { source: 'Social', visitors: Math.floor(totalViews * 0.1) }
            ]
          })
        }
      } catch (err) {
        console.error('Error fetching growth data:', err)
      }
    } catch (err: any) {
      console.error('Error fetching analytics data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return value.toLocaleString()
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Analytics</h4>
          <p className="text-muted mb-0">
            {institutionData ? 'Live analytics data from your institution' : 'View detailed analytics and reports'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => fetchAnalyticsData()}
            disabled={loading}
          >
            <i className="ti ti-refresh me-1"></i>
            Refresh Data
          </button>
          {institutionData && (
            <span className="badge bg-success ms-2">
              <i className="ti ti-database me-1"></i>
              Live Data
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-4">
          <i className="ti ti-alert-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Institution Stats */}
        <div className="col-md-3">
          <div className="card border-0 bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Institution Types</h5>
                  <h3 className="mb-0">{Object.keys(institutionData?.institutionsByType || {}).length}</h3>
                </div>
                <div className="avatar avatar-lg bg-white text-warning rounded-3">
                  <i className="ti ti-category"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Subscription Plans</h5>
                  <h3 className="mb-0">{Object.keys(institutionData?.institutionsByPlan || {}).length}</h3>
                </div>
                <div className="avatar avatar-lg bg-white text-info rounded-3">
                  <i className="ti ti-credit-card"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
      {/* Institution Type Distribution */}
      {institutionData && Object.keys(institutionData.institutionsByType).length > 0 && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Institutions by Type</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(institutionData.institutionsByType).map(([type, count]) => (
                        <tr key={type}>
                          <td>{type}</td>
                          <td><span className="badge bg-primary">{count}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Institutions by Plan</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(institutionData.institutionsByPlan).map(([plan, count]) => (
                        <tr key={plan}>
                          <td className="text-capitalize">{plan}</td>
                          <td><span className="badge bg-success">{count}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Institutions */}
      {institutionData && institutionData.recentInstitutions.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Recent Institutions</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {institutionData.recentInstitutions.map((inst, index) => (
                    <tr key={index}>
                      <td>{inst.name}</td>
                      <td><code>{inst.code}</code></td>
                      <td><span className="badge bg-info">{inst.type}</span></td>
                      <td>{new Date(inst.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fallback when no data */}
      {(!institutionData || institutionData.totalInstitutions === 0) && (
        <div className="alert alert-info">
          <i className="ti ti-info-circle me-2"></i>
          No institution data found. The analytics will show real data once institutions are created in the system.
        </div>
      )}
    </div>
}

export default AnalyticsPage