import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import institutionService from '../../services/institutionService';
import commissionService from '../../services/commissionService';
import { useAuth } from '../../store/authStore';

interface PerformanceMetrics {
  totalInstitutions: number;
  activeInstitutions: number;
  totalRevenue: number;
  averageRevenue: number;
  monthlyGrowth: number;
  globalCount: number;
  completionRate: number;
  topPerformingInstitution: string;
  recentActivity: Activity[];
  monthlyData: MonthlyData[];
}

interface MonthlyData {
  month: string;
  revenue: number;
}

interface Activity {
  id: string;
  type: 'institution_added' | 'institution_updated' | 'revenue_generated';
  institutionName: string;
  date: string;
  description: string;
  amount?: number;
}

const AgentPerformancePage = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { user } = useAuth();
  const agentId = localStorage.getItem('userId') || user?.id || '';

  // Chart colors
  const C = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

  useEffect(() => {
    if (agentId) {
      fetchPerformanceData();
    } else {
      setLoading(false);
      toast.error('Agent ID not found. Please log in again.');
    }
  }, [agentId, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Fetch agent-specific institutions and commissions in parallel
      const [institutionsResponse, commissions] = await Promise.all([
        institutionService.getAgentInstitutions(agentId),
        commissionService.getByAgent(agentId).catch(() => [])
      ]);

      const institutions = institutionsResponse.institutions || [];
      const globalCount = institutionsResponse.globalCount || 0;

      // Calculate metrics
      const totalInstitutions = institutions.length;
      const activeInstitutions = institutions.filter(i => i.status.toLowerCase() === 'active').length;
      
      // Calculate total revenue from commissions
      const totalRevenue = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const averageRevenue = totalInstitutions > 0 ? totalRevenue / totalInstitutions : 0;

      // Calculate monthly growth (compare last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentInstitutions = institutions.filter(i => 
        new Date(i.createdAt) >= thirtyDaysAgo
      ).length;
      const previousInstitutions = institutions.filter(i => 
        new Date(i.createdAt) >= sixtyDaysAgo && new Date(i.createdAt) < thirtyDaysAgo
      ).length;

      const monthlyGrowth = previousInstitutions > 0 
        ? ((recentInstitutions - previousInstitutions) / previousInstitutions) * 100 
        : recentInstitutions > 0 ? 100 : 0;

      // Calculate completion rate (active institutions / total institutions)
      const completionRate = totalInstitutions > 0 
        ? (activeInstitutions / totalInstitutions) * 100 
        : 0;

      // Find top performing institution (highest revenue from commissions)
      const institutionRevenue = new Map<string, number>();
      commissions.forEach(c => {
        const current = institutionRevenue.get(c.institutionName) || 0;
        institutionRevenue.set(c.institutionName, current + c.commissionAmount);
      });

      let topPerformingInstitution = 'N/A';
      let maxRevenue = 0;
      institutionRevenue.forEach((revenue, name) => {
        if (revenue > maxRevenue) {
          maxRevenue = revenue;
          topPerformingInstitution = name;
        }
      });

      // Generate monthly data for chart (last 6 months)
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthRevenue = commissions
          .filter(c => {
            const commissionDate = new Date(c.createdAt);
            return commissionDate >= monthStart && commissionDate <= monthEnd;
          })
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        monthlyData.push({
          month: monthName,
          revenue: monthRevenue
        });
      }

      // Generate recent activity from institutions and commissions
      const recentActivity: Activity[] = [];

      // Add recent institutions
      institutions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .forEach(inst => {
          recentActivity.push({
            id: `inst-${inst._id}`,
            type: 'institution_added',
            institutionName: inst.name,
            date: new Date(inst.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }),
            description: 'New institution added successfully'
          });
        });

      // Add recent commissions
      commissions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2)
        .forEach(comm => {
          recentActivity.push({
            id: `comm-${comm._id}`,
            type: 'revenue_generated',
            institutionName: comm.institutionName,
            date: new Date(comm.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }),
            description: 'Commission generated',
            amount: comm.commissionAmount
          });
        });

      // Sort by date
      recentActivity.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMetrics({
        totalInstitutions,
        activeInstitutions,
        totalRevenue,
        averageRevenue,
        monthlyGrowth,
        completionRate,
        globalCount,
        topPerformingInstitution,
        recentActivity: recentActivity.slice(0, 5),
        monthlyData
      });
    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'institution_added': return 'ti-building-plus text-success';
      case 'institution_updated': return 'ti-edit text-warning';
      case 'revenue_generated': return 'ti-currency-dollar text-info';
      default: return 'ti-info-circle text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          <i className="ti ti-alert-triangle me-2" />
          Unable to load performance data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Performance Dashboard</h4>
          <p className="text-muted mb-0">Track your performance and achievements</p>
        </div>
        <div className="btn-group" role="group">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '1y', label: '1 Year' }
          ].map(range => (
            <button
              key={range.value}
              type="button"
              className={`btn ${timeRange === range.value ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTimeRange(range.value as any)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Total Institutions</h5>
                  <h3 className="mb-0">{metrics.totalInstitutions}</h3>
                  <small className="text-white-50">
                    <i className={`ti ti-arrow-${metrics.monthlyGrowth >= 0 ? 'up' : 'down'}-right`} /> 
                    {' '}{Math.abs(metrics.monthlyGrowth).toFixed(1)}% growth
                  </small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-building fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Active Institutions</h5>
                  <h3 className="mb-0">{metrics.activeInstitutions}</h3>
                  <small className="text-white-50">
                    {metrics.totalInstitutions > 0 
                      ? Math.round((metrics.activeInstitutions / metrics.totalInstitutions) * 100)
                      : 0}% of total
                  </small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check fs-20" />
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
                  <h5 className="card-title mb-0">Total Revenue</h5>
                  <h3 className="mb-0">₹{metrics.totalRevenue.toLocaleString()}</h3>
                  <small className="text-white-50">
                    Avg: ₹{Math.round(metrics.averageRevenue).toLocaleString()}/institution
                  </small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Completion Rate</h5>
                  <h3 className="mb-0">{metrics.completionRate.toFixed(1)}%</h3>
                  <small className="text-white-50">
                    {metrics.completionRate >= 80 ? 'Above' : 'Below'} target (80%)
                  </small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-chart-line fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Top Performing Institution */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-trophy me-2" />Top Performing Institution
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg bg-primary text-white rounded-circle me-3">
                  <i className="ti ti-building fs-24" />
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1">{metrics.topPerformingInstitution}</h6>
                  <p className="text-muted mb-0">Highest revenue generator</p>
                  <div className="progress mt-2" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                      role="progressbar"
                    />
                  </div>
                  <small className="text-muted">Performance Score: {metrics.completionRate.toFixed(1)}%</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-chart-line me-2" />Revenue Trend
              </h5>
            </div>
            <div className="card-body pb-0">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{fontSize:11,fill:'#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{fontSize:11,fill:'#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v: any) => `₹${(v/1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} 
                    contentStyle={{borderRadius:10,fontSize:12}} 
                  />
                  <Legend 
                    iconType="circle" 
                    iconSize={8} 
                    wrapperStyle={{fontSize:12}} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    stroke={C[0]} 
                    strokeWidth={2.5} 
                    dot={{fill:C[0],r:4}} 
                    activeDot={{r:6}} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="ti ti-clock me-2" />Recent Activity
          </h5>
        </div>
        <div className="card-body">
          {metrics.recentActivity.length > 0 ? (
            <div className="timeline">
              {metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="timeline-item mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-sm bg-light rounded-circle me-3 flex-shrink-0">
                      <i className={`ti ${getActivityIcon(activity.type)} fs-16`} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{activity.description}</h6>
                          <p className="text-muted mb-0">
                            <strong>{activity.institutionName}</strong>
                            {activity.amount && (
                              <span className="ms-2">
                                <span className="badge bg-success">
                                  ₹{activity.amount.toLocaleString()}
                                </span>
                              </span>
                            )}
                          </p>
                        </div>
                        <small className="text-muted">{activity.date}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="ti ti-clock-off fs-48 text-muted mb-3 d-block" />
              <h6 className="text-muted">No recent activity</h6>
              <p className="text-muted mb-0">Start adding institutions to see activity here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentPerformancePage;
