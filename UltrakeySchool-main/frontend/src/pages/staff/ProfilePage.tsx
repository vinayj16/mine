import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import { useAuth, useAuthStore } from '../../store/authStore';

const StaffProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [institutionData, setInstitutionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const aadharRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const passbookRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInstitutionData();
    fetchProfile();
  }, []);

  const fetchInstitutionData = async () => {
    try {
      const response = await apiClient.get('/institutions/my');
      
      if (response.data.success) {
        setInstitutionData(response.data.data);
        console.log('Institution data:', response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching institution data:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/profile');
      
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setFormData(profileData);
        
        // Log the real data structure for debugging
        console.log('Real staff profile data from DB:', profileData);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await apiClient.put('/auth/profile', formData);
      
      if (response.data.success) {
        setProfile(formData);
        setEditMode(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDocumentUpload = (documentType: string) => {
    if (documentType === 'Aadhar Card') aadharRef.current?.click();
    else if (documentType === 'PAN Card') panRef.current?.click();
    else if (documentType === 'Bank Passbook') passbookRef.current?.click();
  };

  const handleDocumentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);
      const res = await apiClient.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success(`${documentType} uploaded successfully`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to upload ${documentType}`);
    }
    e.target.value = '';
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
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">My Profile</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/staff">Dashboard</Link></li>
              <li className="breadcrumb-item active">Profile</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          {editMode ? (
            <>
              <button 
                className="btn btn-success"
                onClick={handleUpdateProfile}
              >
                <i className="ti ti-check me-1" />Save Changes
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setEditMode(false)}
              >
                <i className="ti ti-x me-1" />Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-primary"
                onClick={() => setEditMode(true)}
              >
                <i className="ti ti-edit me-1" />Edit Profile
              </button>
              <button 
                className="btn btn-warning"
                onClick={handlePasswordChange}
              >
                <i className="ti ti-lock me-1" />Change Password
              </button>
            </>
          )}
        </div>
      </div>

      {/* WELCOME SECTION WITH INSTITUTION INFO */}
      {institutionData && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-gradient-success text-white">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h4 className="mb-2">
                      <span>Welcome to {institutionData.name || 'Your Institution'}! <i className="ti ti-school"></i></span>
                    </h4>
                    <p className="mb-0">
                      <i className="ti ti-user me-2"></i>
                      {user?.name || 'Staff Member'} - {user?.role || 'staff'}
                    </p>
                    <div className="d-flex align-items-center gap-3 mt-2">
                      <span className="badge bg-light text-dark me-2">
                        <i className="ti ti-building me-1"></i>
                        {institutionData.type || 'Educational Institution'}
                      </span>
                      <span className="badge bg-light text-dark">
                        <i className="ti ti-id me-1"></i>
                        {institutionData.code || institutionData.schoolCode || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <div className="d-flex flex-column align-items-end h-100">
                      <div className="mb-2">
                        <img 
                          src={institutionData.logo || "/assets/img/logo.png"} 
                          alt={institutionData.name}
                          style={{ height: '50px', width: 'auto' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/assets/img/logo.png";
                          }}
                        />
                      </div>
                      <div className="mt-auto">
                        <small className="opacity-75">
                          Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* PROFILE CARD */}
        <div className="col-xl-4">
          <div className="card">
            <div className="card-body text-center">
              {/* ULTRAKEY LOGO */}
              <div className="mb-3">
                <img 
                  src="/assets/img/logo.png" 
                  alt="Ultrakey" 
                  style={{ height: '60px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iOCIgZmlsbD0iIzAwNjZmZiIvPgo8dGV4dCB4PSIzMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlU8L3RleHQ+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
              
              {/* PROFILE PICTURE */}
              <div className="avatar avatar-xxl mx-auto mb-3 position-relative" style={{cursor: profile?.avatar ? 'pointer' : 'default'}} onClick={() => { if (profile?.avatar) setShowPhotoModal(true); }}>
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="rounded-circle" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  <div className="avatar-title rounded-circle bg-primary">
                    {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                )}
                <label htmlFor="avatar-upload" className="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle p-1" style={{width:'32px',height:'32px',lineHeight:'1',cursor:'pointer'}} onClick={(e) => e.stopPropagation()}>
                  <i className="ti ti-camera"></i>
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  style={{display:'none'}}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append('image', file);
                      const res = await apiClient.post('/upload/profile', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      if (res.data?.success) {
                        const imageUrl = res.data.data?.imageUrl || res.data.data?.avatar || res.data.data?.url;
                        if (imageUrl) {
                          setProfile((prev: any) => ({ ...prev, avatar: imageUrl }));
                          // Sync with auth store using central setAvatar (sets both avatar and photo)
                          useAuthStore.getState().setAvatar(imageUrl);
                          toast.success('Profile photo updated');
                        }
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.error?.message || 'Failed to upload photo');
                    }
                    e.target.value = '';
                  }}
                />
              </div>
              
              <h4 className="mb-1">{profile?.name || user?.name || 'Staff Member'}</h4>
              <p className="text-muted mb-3">{profile?.email || user?.email || 'staff@example.com'}</p>
              
              {/* Display real database fields */}
              {profile?.employeeId && (
                <p className="text-muted mb-1">
                  <small>Employee ID:</small> {profile.employeeId}
                </p>
              )}
              {profile?.department && (
                <p className="text-muted mb-1">
                  <small>Department:</small> {profile.department}
                </p>
              )}
              {profile?.designation && (
                <p className="text-muted mb-1">
                  <small>Designation:</small> {profile.designation}
                </p>
              )}
              
              <div className="d-flex gap-2 justify-content-center mb-3">
                <span className="badge bg-success">Active</span>
                <span className="badge bg-info">{user?.role || 'staff'}</span>
              </div>

              {/* QUICK STATS */}
              <div className="row g-2 text-center">
                <div className="col-4">
                  <small className="text-muted d-block">Employee ID</small>
                  <strong className="d-block">{profile?.employeeId || user?.id?.slice(-6) || 'N/A'}</strong>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block">Department</small>
                  <strong className="d-block">{profile?.department || 'General'}</strong>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block">Status</small>
                  <strong className="d-block text-success">Active</strong>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="border-top pt-3 mt-3">
                <div className="d-grid gap-2">
                  <Link to="/dashboard/staff/leaves" className="btn btn-sm btn-outline-success">
                    <i className="ti ti-calendar-off me-1" />Apply Leave
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION CARD */}
          <div className="card mt-3">
            <div className="card-body">
              <h6 className="mb-3">Quick Navigation</h6>
              <div className="list-group list-group-flush">
                <Link to="/dashboard/staff" className="list-group-item list-group-item-action">
                  <i className="ti ti-home me-2"></i>Dashboard
                </Link>
                <Link to="/attendance/staff" className="list-group-item list-group-item-action">
                  <i className="ti ti-clock me-2"></i>Attendance
                </Link>
                <Link to="/dashboard/staff/tasks" className="list-group-item list-group-item-action">
                  <i className="ti ti-list me-2"></i>My Tasks
                </Link>
                <Link to="/dashboard/staff/leaves" className="list-group-item list-group-item-action">
                  <i className="ti ti-calendar-off me-2"></i>Leaves
                </Link>
                <Link to="/dashboard/staff/notifications" className="list-group-item list-group-item-action">
                  <i className="ti ti-bell me-2"></i>Notifications
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                  >
                    <i className="ti ti-user me-1"></i>Personal Info
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'professional' ? 'active' : ''}`}
                    onClick={() => setActiveTab('professional')}
                  >
                    <i className="ti ti-briefcase me-1"></i>Professional
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                  >
                    <i className="ti ti-file me-1"></i>Documents
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'personal' && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      className="form-control" 
                      value={editMode ? formData.name : (profile?.name || user?.name || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-control" 
                      value={editMode ? formData.email : (profile?.email || user?.email || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="form-control" 
                      value={editMode ? formData.phone : (profile?.phone || user?.phone || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      className="form-control" 
                      value={editMode ? formData.dateOfBirth : (profile?.dateOfBirth || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Gender</label>
                    <select 
                      name="gender"
                      className="form-control" 
                      value={editMode ? formData.gender : (profile?.gender || '')} 
                      onChange={handleInputChange}
                      disabled={!editMode}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Blood Group</label>
                    <select 
                      name="bloodGroup"
                      className="form-control" 
                      value={editMode ? formData.bloodGroup : (profile?.bloodGroup || '')} 
                      onChange={handleInputChange}
                      disabled={!editMode}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea 
                      name="address"
                      className="form-control" 
                      rows={3} 
                      value={editMode ? formData.address : (profile?.address || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Bio</label>
                    <textarea 
                      name="bio"
                      className="form-control" 
                      rows={3} 
                      value={editMode ? formData.bio : (profile?.bio || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              )}
              {activeTab === 'professional' && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Employee ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profile?.employeeId || user?.id?.slice(-6) || ''} 
                      readOnly 
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Role</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={user?.role || 'staff'} 
                      readOnly 
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      name="department"
                      className="form-control" 
                      value={editMode ? formData.department : (profile?.department || 'General')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Designation</label>
                    <input 
                      type="text" 
                      name="designation"
                      className="form-control" 
                      value={editMode ? formData.designation : (profile?.designation || 'Staff')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Salary</label>
                    <input 
                      type="number" 
                      name="salary"
                      className="form-control" 
                      value={editMode ? formData.salary : (profile?.salary || 0)} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Joining Date</label>
                    <input 
                      type="date" 
                      name="joiningDate"
                      className="form-control" 
                      value={editMode ? formData.joiningDate : (profile?.joiningDate || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Skills</label>
                    <input 
                      type="text" 
                      name="skills"
                      className="form-control" 
                      value={editMode ? formData.skills : (profile?.skills || [])} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      placeholder="e.g., Communication, Organization, Problem Solving"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Qualification</label>
                    <input 
                      type="text" 
                      name="qualification"
                      className="form-control" 
                      value={editMode ? formData.qualification : (profile?.qualification || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Experience</label>
                    <input 
                      type="text" 
                      name="experience"
                      className="form-control" 
                      value={editMode ? formData.experience : (profile?.experience || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      placeholder="e.g., 2-5 years"
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">LinkedIn Profile</label>
                    <input 
                      type="url" 
                      name="linkedinProfile"
                      className="form-control" 
                      value={editMode ? formData.linkedinProfile : (profile?.linkedinProfile || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              )}
              {activeTab === 'documents' && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Aadhar Card Number</label>
                    <input 
                      type="text" 
                      name="aadharCard"
                      className="form-control" 
                      value={editMode ? formData.aadharCard : (profile?.aadharCard || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">PAN Card Number</label>
                    <input 
                      type="text" 
                      name="panCard"
                      className="form-control" 
                      value={editMode ? formData.panCard : (profile?.panCard || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Bank Account Number</label>
                    <input 
                      type="text" 
                      name="bankAccount"
                      className="form-control" 
                      value={editMode ? formData.bankAccount : (profile?.bankAccount || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Bank IFSC Code</label>
                    <input 
                      type="text" 
                      name="bankIfsc"
                      className="form-control" 
                      value={editMode ? formData.bankIfsc : (profile?.bankIfsc || '')} 
                      onChange={handleInputChange}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-12">
                    <h6 className="mb-3">Document Uploads</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <button 
                          className="btn btn-outline-primary w-100"
                          onClick={() => handleDocumentUpload('Aadhar Card')}
                        >
                          <i className="ti ti-upload me-2" />Upload Aadhar
                        </button>
                        <input ref={aadharRef} type="file" style={{display:'none'}} accept=".pdf,.jpg,.png" onChange={(e) => handleDocumentFileSelect(e, 'Aadhar Card')} />
                      </div>
                      <div className="col-md-4">
                        <button 
                          className="btn btn-outline-success w-100"
                          onClick={() => handleDocumentUpload('PAN Card')}
                        >
                          <i className="ti ti-upload me-2" />Upload PAN
                        </button>
                        <input ref={panRef} type="file" style={{display:'none'}} accept=".pdf,.jpg,.png" onChange={(e) => handleDocumentFileSelect(e, 'PAN Card')} />
                      </div>
                      <div className="col-md-4">
                        <button 
                          className="btn btn-outline-info w-100"
                          onClick={() => handleDocumentUpload('Bank Passbook')}
                        >
                          <i className="ti ti-upload me-2" />Upload Passbook
                        </button>
                        <input ref={passbookRef} type="file" style={{display:'none'}} accept=".pdf,.jpg,.png" onChange={(e) => handleDocumentFileSelect(e, 'Bank Passbook')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {/* Profile Photo Modal */}
      {showPhotoModal && profile?.avatar && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPhotoModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Profile Photo</h5>
                <button type="button" className="btn-close" onClick={() => setShowPhotoModal(false)} />
              </div>
              <div className="modal-body text-center p-4">
                <img 
                  src={profile.avatar} 
                  alt="Profile" 
                  className="img-fluid rounded"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handlePasswordSubmit}>Change Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffProfilePage;

