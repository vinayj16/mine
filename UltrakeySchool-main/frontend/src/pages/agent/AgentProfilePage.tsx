import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import userProfileService, { type UserProfile } from '../../services/userProfileService';
import institutionService from '../../services/institutionService';
import commissionService from '../../services/commissionService';
import { useAuth } from '../../store/authStore';

const AgentProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    totalRevenue: 0,
    commissionRate: 10
  });

  const { user } = useAuth();
  const agentId = localStorage.getItem('userId') || user?.id || '';

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile and stats in parallel
      const [profileData, institutionsResponse, commissionSummary] = await Promise.all([
        userProfileService.getProfile().catch(() => null),
        institutionService.getAgentInstitutions(agentId || 'demo-agent').catch(() => ({ institutions: [] })),
        commissionService.getSummary(agentId || 'demo-agent').catch(() => null)
      ]);

      if (profileData) {
        setProfile(profileData);
        setEditForm(profileData);
      }
      
      setStats({
        totalInstitutions: institutionsResponse?.institutions?.length || 0,
        totalRevenue: commissionSummary?.totalCommission || 0,
        commissionRate: commissionSummary?.commissionRate || 10
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(profile || {});
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedProfile = await userProfileService.updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as any),
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-secondary';
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status?: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!profile) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          <i className="ti ti-alert-triangle me-2" />
          Unable to load profile. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">My Profile</h4>
          <p className="text-muted mb-0">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={handleEdit}>
            <i className="ti ti-edit me-2" />Edit Profile
          </button>
        )}
      </div>

      <div className="row">
        {/* Profile Overview Card */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body text-center">
              {/* Profile Picture Section */}
              <div className="position-relative d-inline-block mb-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="avatar avatar-xl rounded-circle"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar avatar-xl bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                    <i className="ti ti-user fs-32" />
                  </div>
                )}
              </div>

              <h5 className="mb-1">{profile.name}</h5>
              <p className="text-muted mb-2">{profile.email}</p>
              <div className="d-flex justify-content-center gap-2 mb-3">
                <span className={`badge ${getStatusBadgeClass(profile.status)} text-white`}>
                  {getStatusText(profile.status)}
                </span>
                <span className="badge bg-info text-white">
                  {profile.role}
                </span>
              </div>
              <div className="text-start">
                <small className="text-muted d-block">Member since: {formatDate(profile.createdAt)}</small>
                <small className="text-muted d-block">Last login: {formatDateTime(profile.lastLogin)}</small>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="ti ti-chart-bar me-2" />Performance Stats
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted">Total Institutions</span>
                  <span className="fw-semibold">{stats.totalInstitutions}</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted">Total Revenue</span>
                  <span className="fw-semibold">₹{stats.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted">Commission Rate</span>
                  <span className="fw-semibold">{stats.commissionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-user me-2" />Personal Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={isEditing ? editForm.name || '' : profile.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={isEditing ? editForm.email || '' : profile.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={isEditing ? editForm.phone || '' : profile.phone || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dateOfBirth"
                    value={isEditing 
                      ? editForm.dateOfBirth?.split('T')[0] || '' 
                      : profile.dateOfBirth?.split('T')[0] || ''
                    }
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Gender</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={isEditing ? editForm.gender || '' : profile.gender || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-check me-2" />Save Changes
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-outline-secondary" 
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <i className="ti ti-x me-2" />Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-map-pin me-2" />Address Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label fw-semibold">Street Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.street"
                    value={isEditing ? editForm.address?.street || '' : profile.address?.street || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-semibold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.city"
                    value={isEditing ? editForm.address?.city || '' : profile.address?.city || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter city"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-semibold">State</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.state"
                    value={isEditing ? editForm.address?.state || '' : profile.address?.state || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter state"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-semibold">Postal Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.zipCode"
                    value={isEditing ? editForm.address?.zipCode || '' : profile.address?.zipCode || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter postal code"
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label fw-semibold">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.country"
                    value={isEditing ? editForm.address?.country || '' : profile.address?.country || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfilePage;
