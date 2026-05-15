import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    bio: ''
  });

  const [address, setAddress] = useState({
    street: '',
    country: '',
    state: '',
    city: '',
    zipCode: ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/profile');
      
      if (response.data.success) {
        const userData = response.data.data;
        setProfile(userData);
        
        // Populate form states
        setPersonalInfo({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          username: userData.username || '',
          phone: userData.phone || '',
          bio: userData.bio || ''
        });
        
        setAddress({
          street: userData.address?.street || '',
          country: userData.address?.country || '',
          state: userData.address?.state || '',
          city: userData.address?.city || '',
          zipCode: userData.address?.zipCode || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const response = await apiClient.put('/auth/profile', personalInfo);
      
      if (response.data.success) {
        toast.success('Personal information updated successfully');
        setShowPersonalInfoModal(false);
        fetchProfile();
      }
    } catch (err: any) {
      console.error('Error updating personal info:', err);
      toast.error(err.response?.data?.message || 'Failed to update personal information');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const response = await apiClient.put('/auth/profile', { address });
      
      if (response.data.success) {
        toast.success('Address information updated successfully');
        setShowAddressModal(false);
        fetchProfile();
      }
    } catch (err: any) {
      console.error('Error updating address:', err);
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    
    try {
      setUpdating(true);
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Profile</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Profile</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon" 
              data-bs-toggle="tooltip"
              data-bs-placement="top" 
              aria-label="Refresh" 
              data-bs-original-title="Refresh"
              onClick={fetchProfile}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="d-md-flex d-block mt-3">
        {/* Left Sidebar */}
        <div className="settings-right-sidebar me-md-3 border-0">
          <div className="card">
            <div className="card-header">
              <h5>Personal Information</h5>
            </div>
            <div className="card-body">
              <div className="settings-profile-upload">
                <span className="profile-pic">
                  <img 
                    src={profile?.avatar || "/assets/img/profiles/avatar-27.jpg"} 
                    alt="Profile" 
                  />
                </span>
                <div className="title-upload">
                  <h5>Edit Your Photo</h5>
                  <button className="btn btn-link p-0 me-2" onClick={() => toast.info('Delete photo coming soon')}>Delete</button>
                  <button className="btn btn-link p-0 text-primary" onClick={() => toast.info('Upload photo coming soon')}>Update</button>
                </div>
              </div>
              <div className="profile-uploader profile-uploader-two mb-0">
                <span className="upload-icon"><i className="ti ti-upload"></i></span>
                <div className="drag-upload-btn bg-transparent me-0 border-0">
                  <p className="upload-btn"><span>Click to Upload</span> or drag and drop</p>
                  <h6>JPG or PNG</h6>
                  <h6>(Max 450 x 450 px)</h6>
                </div>
                <input type="file" className="form-control" multiple id="image_sign" />
                <div id="frames"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-fill ps-0 border-0">
          <form>
            <div className="d-md-flex">
              <div className="flex-fill">
                {/* Personal Information Card */}
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Personal Information</h5>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowPersonalInfoModal(true)}
                    >
                      <i className="ti ti-edit me-2"></i>Edit
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="d-block d-xl-flex">
                      <div className="mb-3 flex-fill me-xl-3 me-0">
                        <label className="form-label">First Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={profile?.firstName || ''}
                          readOnly
                        />
                      </div>
                      <div className="mb-3 flex-fill">
                        <label className="form-label">Last Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={profile?.lastName || ''}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={profile?.email || ''}
                        readOnly
                      />
                    </div>
                    <div className="d-block d-xl-flex">
                      <div className="mb-3 flex-fill me-xl-3 me-0">
                        <label className="form-label">User Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={profile?.username || '-'}
                          readOnly
                        />
                      </div>
                      <div className="mb-3 flex-fill">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control"
                          value={profile?.phone || '-'}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Card */}
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Address Information</h5>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddressModal(true)}
                    >
                      <i className="ti ti-edit me-2"></i>Edit
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={profile?.address?.street || '-'}
                        readOnly
                      />
                    </div>
                    <div className="d-block d-xl-flex">
                      <div className="mb-3 flex-fill me-xl-3 me-0">
                        <label className="form-label">Country</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profile?.address?.country || '-'}
                          readOnly
                        />
                      </div>
                      <div className="mb-3 flex-fill">
                        <label className="form-label">State / Province</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profile?.address?.state || '-'}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="d-block d-xl-flex">
                      <div className="mb-3 flex-fill me-xl-3 me-0">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profile?.address?.city || '-'}
                          readOnly
                        />
                      </div>
                      <div className="mb-3 flex-fill">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={profile?.address?.zipCode || '-'}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Card */}
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Password</h5>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Change
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <div className="pass-group d-flex">
                        <input 
                          type="password" 
                          className="form-control" 
                          value="••••••••" 
                          readOnly
                        />
                        <span className="ti ti-eye-off toggle-password"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Personal Information Modal */}
      {showPersonalInfoModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Personal Information</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPersonalInfoModal(false)}
                  disabled={updating}
                ></button>
              </div>
              <form onSubmit={handlePersonalInfoSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="firstName"
                          value={personalInfo.firstName}
                          onChange={handlePersonalInfoChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="lastName"
                          value={personalInfo.lastName}
                          onChange={handlePersonalInfoChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">User Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="username"
                          value={personalInfo.username}
                          onChange={handlePersonalInfoChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          name="email"
                          value={personalInfo.email}
                          onChange={handlePersonalInfoChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          name="phone"
                          value={personalInfo.phone}
                          onChange={handlePersonalInfoChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Bio</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="bio"
                          value={personalInfo.bio}
                          onChange={handlePersonalInfoChange}
                          disabled={updating}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowPersonalInfoModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {showAddressModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Address Information</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddressModal(false)}
                  disabled={updating}
                ></button>
              </div>
              <form onSubmit={handleAddressSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="street"
                          value={address.street}
                          onChange={handleAddressChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="country"
                          value={address.country}
                          onChange={handleAddressChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">State/Province</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="state"
                          value={address.state}
                          onChange={handleAddressChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          disabled={updating}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="zipCode"
                          value={address.zipCode}
                          onChange={handleAddressChange}
                          disabled={updating}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddressModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Change Password</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPasswordModal(false)}
                  disabled={updating}
                ></button>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Current Password</label>
                        <input 
                          type="password" 
                          className="form-control"
                          name="currentPassword"
                          value={passwords.currentPassword}
                          onChange={handlePasswordChange}
                          disabled={updating}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input 
                          type="password" 
                          className="form-control"
                          name="newPassword"
                          value={passwords.newPassword}
                          onChange={handlePasswordChange}
                          disabled={updating}
                          required
                          minLength={6}
                        />
                        <small className="text-muted">Minimum 6 characters</small>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Confirm Password</label>
                        <input 
                          type="password" 
                          className="form-control"
                          name="confirmPassword"
                          value={passwords.confirmPassword}
                          onChange={handlePasswordChange}
                          disabled={updating}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowPasswordModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Changing...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
