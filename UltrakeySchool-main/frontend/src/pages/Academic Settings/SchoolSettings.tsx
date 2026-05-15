import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import schoolSettingsService, { type BasicInfo } from '../../services/schoolSettingsService';

const SchoolSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BasicInfo>({
    schoolName: '',
    phoneNumber: '',
    email: '',
    fax: '',
    address: '',
    website: ''
  });

  const institutionId = localStorage.getItem('institutionId') || '';

  useEffect(() => {
    if (institutionId) {
      fetchSettings();
    }
  }, [institutionId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await schoolSettingsService.getByInstitution(institutionId);
      if (data.basicInfo) {
        setFormData(data.basicInfo);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Settings don't exist yet, keep empty form
        console.log('No settings found, will create new');
      } else {
        toast.error('Failed to load school settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.schoolName.trim()) {
      toast.error('School name is required');
      return;
    }

    try {
      setSaving(true);
      await schoolSettingsService.updateBasicInfo(institutionId, formData);
      toast.success('School settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Try creating new settings
        try {
          await schoolSettingsService.create({
            institutionId,
            basicInfo: formData
          });
          toast.success('School settings created successfully');
          fetchSettings();
        } catch (createError) {
          toast.error('Failed to create school settings');
        }
      } else {
        toast.error('Failed to save school settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchSettings();
  };

  const handleRefresh = () => {
    fetchSettings();
  };

  if (loading) {
    return (
      <div className="content bg-white">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Academic Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Academic Settings</li>
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
              onClick={handleRefresh}
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
            <a href="/school-settings" className="d-block rounded active p-2">School Settings</a>
            <a href="/religion" className="d-block rounded p-2">Religion</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3">
            <form onSubmit={handleSubmit}>
              <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                <div className="mb-3">
                  <h5 className="mb-1">School Settings</h5>
                  <p>School Settings Configuration</p>
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
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
              <div className="d-md-flex">
                <div className="row flex-fill">
                  <div className="col-xl-10">
                    <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                      <div className="row align-items-center flex-fill">
                        <div className="col-xxl-8 col-lg-6">
                          <div className="mb-3">
                            <h6>School Name <span className="text-danger">*</span></h6>
                            <p>Shows name of your school</p>
                          </div>
                        </div>
                        <div className="col-xxl-4 col-lg-6">
                          <div className="mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Enter School Name"
                              name="schoolName"
                              value={formData.schoolName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                      <div className="row align-items-center flex-fill">
                        <div className="col-xxl-8 col-lg-6">
                          <div className="mb-3">
                            <h6>Phone Number</h6>
                            <p>Shows phone number of your school</p>
                          </div>
                        </div>
                        <div className="col-xxl-4 col-lg-6">
                          <div className="mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Enter Phone Number"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                      <div className="row align-items-center flex-fill">
                        <div className="col-xxl-8 col-lg-6">
                          <div className="mb-3">
                            <h6>Email</h6>
                            <p>Shows email of your school</p>
                          </div>
                        </div>
                        <div className="col-xxl-4 col-lg-6">
                          <div className="mb-3">
                            <input 
                              type="email" 
                              className="form-control"
                              placeholder="Enter Email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                      <div className="row align-items-center flex-fill">
                        <div className="col-xxl-8 col-lg-6">
                          <div className="mb-3">
                            <h6>Fax</h6>
                            <p>Shows fax of your school</p>
                          </div>
                        </div>
                        <div className="col-xxl-4 col-lg-6">
                          <div className="mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Enter Fax"
                              name="fax"
                              value={formData.fax}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                      <div className="row align-items-center flex-fill">
                        <div className="col-xxl-8 col-lg-6">
                          <div className="mb-3">
                            <h6>Address</h6>
                            <p>Shows address of your school</p>
                          </div>
                        </div>
                        <div className="col-xxl-4 col-lg-6">
                          <div className="mb-3">
                            <textarea 
                              rows={4} 
                              className="form-control"
                              placeholder="Enter Address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
     </div>
   );
 };

 export default SchoolSettings;
