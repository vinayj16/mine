import React, { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { toast } from 'react-toastify'

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [saving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      try {
        const response = await apiClient.get('/user/profile')
        if (response.data?.success && response.data.data) {
          setProfile(response.data.data)
        }
      } catch {
        // Use demo data - already set as initial state
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like address.street
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      // Handle top-level fields
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const response = await apiClient.put('/user/profile', profile)
      
      if (response.data?.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(response.data?.message || 'Failed to update profile')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG or PNG)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    fetchProfile();
  };

  const handleDeletePhoto = async () => {
    if (window.confirm('Are you sure you want to delete your profile photo?')) {
      setPreviewUrl('/assets/img/profiles/avatar-27.jpg');
    }
  };

  const nameParts = profile.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">General Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">General Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon" 
              data-bs-toggle="tooltip"
              data-bs-placement="top" 
              title="Refresh"
              onClick={fetchProfile}
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <a href="/profile-settings" className="d-block rounded p-2 active">Profile Settings</a>
            <a href="/security-settings" className="d-block rounded p-2">Security Settings</a>
            <a href="/notifications-settings" className="d-block rounded p-2">Notifications</a>
            <a href="/connected-apps" className="d-block rounded p-2">Connected Apps</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            {error && (
              <div className="alert alert-danger mb-3">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                  <div className="mb-3">
                    <h5 className="mb-1">Profile Settings</h5>
                    <p>Upload your photo & personal details here</p>
                  </div>
                  <div className="mb-3">
                    <button 
                      className="btn btn-light me-2" 
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
                <div className="d-md-flex d-block">
                  <div className="flex-fill">
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>Personal Information</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">First Name</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter First Name"
                              value={firstName}
                              onChange={(e) => {
                                const newName = `${e.target.value} ${lastName}`.trim();
                                setProfile(prev => ({ ...prev, name: newName }));
                              }}
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">Last Name</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter Last Name"
                              value={lastName}
                              onChange={(e) => {
                                const newName = `${firstName} ${e.target.value}`.trim();
                                setProfile(prev => ({ ...prev, name: newName }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Email Address</label>
                          <input 
                            type="email" 
                            className="form-control" 
                            placeholder="Enter Email"
                            name="email"
                            value={profile.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">User Name</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter User Name"
                              value={profile.name}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">Phone Number</label>
                            <input 
                              type="tel" 
                              className="form-control" 
                              placeholder="Enter Phone Number"
                              name="phone"
                              value={profile.phone || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>Address Information</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter Address"
                            name="address.street"
                            value={profile.address?.street || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">Country</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter Country"
                              name="address.country"
                              value={profile.address?.country || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">State / Province</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter State"
                              name="address.state"
                              value={profile.address?.state || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="d-block d-xl-flex">
                          <div className="mb-3 flex-fill me-xl-3 me-0">
                            <label className="form-label">City</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="City"
                              name="address.city"
                              value={profile.address?.city || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="mb-3 flex-fill">
                            <label className="form-label">Postal Code</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter Postal Code"
                              name="address.zipCode"
                              value={profile.address?.zipCode || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="settings-right-sidebar ms-md-3">
                    <div className="card">
                      <div className="card-header p-3">
                        <h5>Profile Photo</h5>
                      </div>
                      <div className="card-body p-3 pb-0">
                        <div className="settings-profile-upload">
                          <span className="profile-pic">
                            <img src={previewUrl} alt="Profile" />
                          </span>
                          <div className="title-upload">
                            <h5>Edit Your Photo</h5>
                            <a 
                              href="#" 
                              className="me-2"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeletePhoto();
                              }}
                            >
                              Delete
                            </a>
                            <a 
                              href="#" 
                              className="text-primary"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('image_sign')?.click();
                              }}
                            >
                              Update
                            </a>
                          </div>
                        </div>
                        <div className="profile-uploader profile-uploader-two">
                          <span className="upload-icon"><i className="ti ti-upload"></i></span>
                          <div className="drag-upload-btn mb-0 border-0 pb-0 bg-transparent">
                            <p className="upload-btn"><span>Click to Upload</span> or drag and drop</p>
                            <h6>JPG or PNG</h6>
                            <h6>(Max 450 x 450 px)</h6>
                          </div>
                          <input 
                            type="file" 
                            className="form-control" 
                            id="image_sign"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileChange}
                          />
                          <div id="frames"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
