import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ProfileData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    phone: string;
    role: string;
  };
  addressInfo: {
    address: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
  };
  profilePhoto: string | null;
  lastUpdated: string;
}

const AdminProfileSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setProfileData({
        personalInfo: {
          firstName: 'School',
          lastName: 'Admin',
          email: 'admin@school.edu',
          username: 'admin',
          phone: '+1234567890',
          role: 'School Administrator'
        },
        addressInfo: {
          address: '123 Education Street',
          country: 'USA',
          state: 'IL',
          city: 'Springfield',
          postalCode: '62701'
        },
        profilePhoto: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    // Handle profile save logic
    console.log('Saving profile...');
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle photo upload logic
      console.log('Uploading photo:', file.name);
    }
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
          <h3 className="page-title mb-1">Profile Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Settings</li>
              <li className="breadcrumb-item active">Profile</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchProfileData}>
            <i className="ti ti-refresh"></i>
          </button>
          {isEditing ? (
            <>
              <button className="btn btn-secondary me-2" onClick={() => setIsEditing(false)}>
                <i className="ti ti-x me-2"></i>Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <i className="ti ti-check me-2"></i>Save Changes
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <i className="ti ti-edit me-2"></i>Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="row">
        {/* Left Column - Profile Photo */}
        <div className="col-xl-4 col-lg-5">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title mb-4">Profile Photo</h5>
              <div className="mb-4">
                {profileData?.profilePhoto ? (
                  <img 
                    src={profileData.profilePhoto} 
                    alt="Profile" 
                    className="rounded-circle" 
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white"
                    style={{ width: '150px', height: '150px', margin: '0 auto', fontSize: '3rem' }}
                  >
                    {profileData?.personalInfo.firstName?.charAt(0)}{profileData?.personalInfo.lastName?.charAt(0)}
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="mb-3">
                  <input 
                    type="file" 
                    id="photoUpload" 
                    className="d-none" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photoUpload" className="btn btn-outline-primary">
                    <i className="ti ti-upload me-2"></i>Upload Photo
                  </label>
                  <button className="btn btn-outline-danger ms-2">
                    <i className="ti ti-trash me-2"></i>Delete
                  </button>
                </div>
              )}
              <div className="text-muted small">
                <p>JPG or PNG (Max 450 x 450)</p>
                <p>Click to Upload or drag and drop</p>
              </div>
              <hr />
              <div className="text-start">
                <h6 className="mb-3">Account Information</h6>
                <div className="mb-2">
                  <strong>Username:</strong> {profileData?.personalInfo.username}
                </div>
                <div className="mb-2">
                  <strong>Role:</strong> {profileData?.personalInfo.role}
                </div>
                <div className="mb-2">
                  <strong>Email:</strong> {profileData?.personalInfo.email}
                </div>
                <div className="mb-2">
                  <strong>Member Since:</strong> January 2024
                </div>
                <div className="mb-2">
                  <strong>Last Updated:</strong> {new Date(profileData?.lastUpdated || '').toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="col-xl-8 col-lg-7">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                  >
                    <i className="ti ti-user me-2"></i>Personal Information
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'address' ? 'active' : ''}`}
                    onClick={() => setActiveTab('address')}
                  >
                    <i className="ti ti-map-pin me-2"></i>Address Information
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <i className="ti ti-lock me-2"></i>Security
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div>
                  <h5 className="card-title mb-4">Personal Information</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.personalInfo.firstName || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.personalInfo.lastName || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          value={profileData?.personalInfo.email || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={profileData?.personalInfo.phone || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">User Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.personalInfo.username || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.personalInfo.role || ''}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Information Tab */}
              {activeTab === 'address' && (
                <div>
                  <h5 className="card-title mb-4">Address Information</h5>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profileData?.addressInfo.address || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <select className="form-select" disabled={!isEditing}>
                          <option value="USA" selected={profileData?.addressInfo.country === 'USA'}>USA</option>
                          <option value="UK">UK</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">State / Province</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.addressInfo.state || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.addressInfo.city || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileData?.addressInfo.postalCode || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h5 className="card-title mb-4">Security Settings</h5>
                  <div className="mb-4">
                    <h6>Change Password</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Current Password</label>
                          <input type="password" className="form-control" disabled={!isEditing} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">New Password</label>
                          <input type="password" className="form-control" disabled={!isEditing} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Confirm New Password</label>
                          <input type="password" className="form-control" disabled={!isEditing} />
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <button className="btn btn-primary">
                        <i className="ti ti-lock me-2"></i>Update Password
                      </button>
                    )}
                  </div>
                  <hr />
                  <div className="mb-4">
                    <h6>Two-Factor Authentication</h6>

                  </div>
                  <hr />
                  <div>
                    <h6>Login Activity</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>IP Address</th>
                            <th>Device</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{new Date().toLocaleDateString()}</td>
                            <td>{new Date().toLocaleTimeString()}</td>
                            <td>192.168.1.1</td>
                            <td>Chrome / Windows</td>
                            <td>Springfield, IL</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileSettingsPage;
