import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface GdprSettings {
  enabled: boolean;
  cookieText: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  agreeButtonText: string;
  declineButtonText: string;
  showDeclineButton: boolean;
  cookiePolicyLink: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
}

const GdprCookiesPage = () => {
  const [settings, setSettings] = useState<GdprSettings>({
    enabled: true,
    cookieText: 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.',
    position: 'bottom',
    agreeButtonText: 'Accept',
    declineButtonText: 'Decline',
    showDeclineButton: true,
    cookiePolicyLink: '/privacy-policy',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    buttonColor: '#4CAF50'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGdprSettings();
  }, []);

  const fetchGdprSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/gdpr');

      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          enabled: data.enabled !== false,
          cookieText: data.cookieText || settings.cookieText,
          position: data.position || 'bottom',
          agreeButtonText: data.agreeButtonText || 'Accept',
          declineButtonText: data.declineButtonText || 'Decline',
          showDeclineButton: data.showDeclineButton !== false,
          cookiePolicyLink: data.cookiePolicyLink || '/privacy-policy',
          backgroundColor: data.backgroundColor || '#000000',
          textColor: data.textColor || '#ffffff',
          buttonColor: data.buttonColor || '#4CAF50'
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch GDPR settings:', error);
      toast.error('Failed to load GDPR settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await apiClient.put('/settings/gdpr', settings);

      if (response.data.success) {
        toast.success('GDPR settings saved successfully');
      } else {
        toast.error('Failed to save GDPR settings');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save GDPR settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof GdprSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">System Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                GDPR Cookies
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchGdprSettings}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <Link to="/settings/email" className="d-block rounded p-2">
              Email Settings
            </Link>
            <Link to="/settings/email-templates" className="d-block rounded p-2">
              Email Templates
            </Link>
            <Link to="/settings/sms" className="d-block rounded p-2">
              SMS Settings
            </Link>
            <Link to="/settings/otp" className="d-block rounded p-2">
              OTP
            </Link>
            <Link to="/settings/gdpr" className="d-block rounded active p-2">
              GDPR Cookies
            </Link>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            <form onSubmit={handleSubmit}>
              <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                <div className="mb-3">
                  <h5 className="mb-1">GDPR Cookie Consent</h5>
                  <p className="mb-0">Configure cookie consent banner for GDPR compliance</p>
                </div>
                <div className="mb-3">
                  <button 
                    className="btn btn-light me-2" 
                    type="button"
                    onClick={() => fetchGdprSettings()}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
              <div className="d-md-flex">
                <div className="row flex-fill">
                  <div className="col-xl-10">
                    <div>
                      {/* Enable Cookie Consent */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Enable Cookie Consent Banner</h6>
                              <p className="mb-0">Show cookie consent banner to visitors</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <div className="status-toggle">
                                <input 
                                  type="checkbox" 
                                  id="enableCookies"
                                  className="check"
                                  checked={settings.enabled}
                                  onChange={(e) => handleChange('enabled', e.target.checked)}
                                />
                                <label htmlFor="enableCookies" className="checktoggle"></label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cookie Content Text */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Cookie Consent Text</h6>
                              <p className="mb-0">Message displayed in the cookie banner</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <textarea 
                                rows={3} 
                                className="form-control"
                                value={settings.cookieText}
                                onChange={(e) => handleChange('cookieText', e.target.value)}
                                placeholder="Enter cookie consent message"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cookie Position */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Banner Position</h6>
                              <p className="mb-0">Where to display the cookie banner</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <select 
                                className="form-select"
                                value={settings.position}
                                onChange={(e) => handleChange('position', e.target.value as 'top' | 'bottom' | 'left' | 'right')}
                              >
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Agree Button Text */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Accept Button Text</h6>
                              <p className="mb-0">Text for the accept button</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <input 
                                type="text" 
                                className="form-control"
                                value={settings.agreeButtonText}
                                onChange={(e) => handleChange('agreeButtonText', e.target.value)}
                                placeholder="Accept"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Decline Button Text */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Decline Button Text</h6>
                              <p className="mb-0">Text for the decline button</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <input 
                                type="text" 
                                className="form-control"
                                value={settings.declineButtonText}
                                onChange={(e) => handleChange('declineButtonText', e.target.value)}
                                placeholder="Decline"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show Decline Button */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Show Decline Button</h6>
                              <p className="mb-0">Display decline button in the banner</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <div className="status-toggle">
                                <input 
                                  type="checkbox" 
                                  id="showDecline"
                                  className="check"
                                  checked={settings.showDeclineButton}
                                  onChange={(e) => handleChange('showDeclineButton', e.target.checked)}
                                />
                                <label htmlFor="showDecline" className="checktoggle"></label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cookie Policy Link */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Cookie Policy Page Link</h6>
                              <p className="mb-0">Link to your cookie policy page</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <input 
                                type="text" 
                                className="form-control"
                                value={settings.cookiePolicyLink}
                                onChange={(e) => handleChange('cookiePolicyLink', e.target.value)}
                                placeholder="/privacy-policy"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Background Color */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Background Color</h6>
                              <p className="mb-0">Banner background color</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <input 
                                type="color" 
                                className="form-control form-control-color"
                                value={settings.backgroundColor}
                                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Text Color */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Text Color</h6>
                              <p className="mb-0">Banner text color</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <input 
                                type="color" 
                                className="form-control form-control-color"
                                value={settings.textColor}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Button Color */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded">
                        <div className="row align-items-center flex-fill">
                          <div className="col-xxl-8 col-lg-6">
                            <div className="mb-3">
                              <h6>Button Color</h6>
                              <p className="mb-0">Accept button color</p>
                            </div>
                          </div>
                          <div className="col-xxl-4 col-lg-6">
                            <div className="mb-3">
                              <input 
                                type="color" 
                                className="form-control form-control-color"
                                value={settings.buttonColor}
                                onChange={(e) => handleChange('buttonColor', e.target.value)}
                              />
                            </div>
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

export default GdprCookiesPage;
