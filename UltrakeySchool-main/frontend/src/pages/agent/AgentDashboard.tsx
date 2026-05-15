import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import institutionService, { type Institution } from '../../services/institutionService';
import commissionService, { type CommissionSummary } from '../../services/commissionService';
import agentService from '../../services/agentService';
import { useAuth } from '../../store/authStore';

interface DashboardStats {
  totalInstitutions: number;
  activeInstitutions: number;
  pendingInstitutions: number;
  totalRevenue: number;
  globalCount: number;
}

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalInstitutions: 0,
    activeInstitutions: 0,
    pendingInstitutions: 0,
    totalRevenue: 0,
    globalCount: 0
  });
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  const userName = localStorage.getItem('userName') || user?.name || 'Agent User';
  const userEmail = localStorage.getItem('userEmail') || user?.email || 'agent@system.com';
  const agentId = localStorage.getItem('userId') || user?.id || '';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch agent profile to check if complete
      try {
        const profileData = await agentService.getMyProfile();
        setProfileComplete(profileData?.profileComplete === true);
      } catch (profileError: any) {
        console.log('Profile fetch error:', profileError?.message || 'Could not fetch profile');
        setProfileComplete(true);
      }
      
      // Fetch agent's own institutions and commissions using the new endpoint
      let institutionsData = { institutions: [], summary: { totalInstitutions: 0, totalCommission: 0, pendingCommission: 0, paidCommission: 0 } };
      let commissionData = null;
      
      try {
        const myData = await agentService.getMyInstitutions();
        institutionsData = {
          institutions: myData.institutions || [],
          summary: myData.summary || { totalInstitutions: 0, totalCommission: 0, pendingCommission: 0, paidCommission: 0 }
        };
        commissionData = myData.summary;
      } catch (instError: any) {
        console.log('Could not fetch agent institutions:', instError?.message || 'Error');
      }

      setInstitutions(institutionsData.institutions || []);
      setAllInstitutions(institutionsData.institutions || []);
      setCommissionSummary(commissionData);

      // Calculate stats
      const instList = institutionsData.institutions || [];
      const totalInstitutions = instList.length;
      const activeInstitutions = instList.filter(
        i => i.status === 'active'
      ).length;
      const pendingInstitutions = instList.filter(
        i => i.status === 'pending'
      ).length;
      
      // Calculate total revenue from commission summary or institutions
      const totalRevenue = commissionData?.totalCommission || 0;

      setStats({
        totalInstitutions,
        activeInstitutions,
        pendingInstitutions,
        totalRevenue,
        globalCount: totalInstitutions
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalInstitutions: 0,
        activeInstitutions: 0,
        pendingInstitutions: 0,
        totalRevenue: 0,
        globalCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'pending': return 'bg-warning';
      case 'suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show profile completion prompt if not complete
  if (!loading && !profileComplete) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg">
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <div className="avatar avatar-xl bg-warning rounded-circle mx-auto">
                    <i className="ti ti-user-exclamation fs-36 text-white" />
                  </div>
                </div>
                <h4 className="fw-bold mb-3">Complete Your Profile</h4>
                <p className="text-muted mb-4">
                  Please complete your agent profile to access all features and start adding institutions.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/agent/profile')}
                  >
                    <i className="ti ti-user me-2" />
                    Complete Profile Now
                  </button>
                </div>
                <div className="mt-4 pt-3 border-top">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="text-muted small">Step 1</div>
                      <div className="fw-semibold">Personal Info</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted small">Step 2</div>
                      <div className="fw-semibold">Documents</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted small">Step 3</div>
                      <div className="fw-semibold">Bank Details</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Agent Dashboard</h4>
          <p className="text-muted mb-0">Manage your institutions and track performance</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/agent/institutions/add" className="btn btn-primary">
            <i className="ti ti-plus me-2" />Add Institution
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">My Institutions</h5>
                  <h3 className="mb-0">{stats.totalInstitutions}</h3>
                  <small className="text-white-50">Your created</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-building fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-dark text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">System Total</h5>
                  <h3 className="mb-0">{stats.globalCount}</h3>
                  <small className="text-white-50">All institutions</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-database fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Active</h5>
                  <h3 className="mb-0">{stats.activeInstitutions}</h3>
                  <small className="text-white-50">Active status</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Pending</h5>
                  <h3 className="mb-0">{stats.pendingInstitutions}</h3>
                  <small className="text-white-50">Pending approval</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-clock fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Total Commission</h5>
                  <h3 className="mb-0">₹{stats.totalRevenue.toLocaleString()}</h3>
                  <small className="text-white-50">All time earnings</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutions Tables */}
      <div className="row">
        {/* My Institutions */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between bg-light">
              <h5 className="card-title mb-0">
                <i className="ti ti-user-check me-2" />My Institutions
              </h5>
              <Link to="/agent/institutions" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {institutions.slice(0, 5).map((institution) => (
                      <tr key={institution._id}>
                        <td className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>{institution.name}</td>
                        <td>{institution.type}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(institution.status)} text-white`}>
                            {getStatusText(institution.status)}
                          </span>
                        </td>
                        <td>
                          <Link to={`/agent/institutions/${institution._id}`} className="btn btn-sm btn-icon">
                            <i className="ti ti-eye" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {institutions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No institutions created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Institutions */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between bg-light">
              <h5 className="card-title mb-0">
                <i className="ti ti-building me-2" />System Institutions
              </h5>
              <span className="badge bg-dark text-white">{stats.globalCount} Total</span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>City</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInstitutions.slice(0, 5).map((institution) => (
                      <tr key={institution._id}>
                        <td className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>{institution.name}</td>
                        <td>{institution.type}</td>
                        <td>{institution.contact?.address?.city || 'N/A'}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(institution.status)} text-white`}>
                            {getStatusText(institution.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {allInstitutions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No system institutions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-bolt me-2" />Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <Link 
                    to="/agent/institutions/add" 
                    className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4"
                  >
                    <i className="ti ti-plus fs-24 mb-2" />
                    <span>Add Institution</span>
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link 
                    to="/agent/performance" 
                    className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4"
                  >
                    <i className="ti ti-chart-line fs-24 mb-2" />
                    <span>View Performance</span>
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link 
                    to="/agent/commissions" 
                    className="btn btn-outline-info w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4"
                  >
                    <i className="ti ti-receipt fs-24 mb-2" />
                    <span>My Commissions</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-user me-2" />Profile
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar avatar-lg bg-primary text-white rounded-circle me-3">
                  <i className="ti ti-user fs-20" />
                </div>
                <div>
                  <h6 className="mb-0">{userName}</h6>
                  <p className="text-muted mb-0">{userEmail}</p>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  <small className="text-muted">Institutions</small>
                  <p className="mb-0 fw-semibold">{stats.totalInstitutions}</p>
                </div>
                <div>
                  <small className="text-muted">Commission Rate</small>
                  <p className="mb-0 fw-semibold">{commissionSummary?.commissionRate || 10}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
