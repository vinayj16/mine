import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface OAuthProvider {
  provider: string;
  name: string;
  description: string;
  icon: string;
  isLinked: boolean;
  isEnabled: boolean;
  linkedAt?: string;
}

const SocialAuthentication: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<OAuthProvider[]>([
    {
      provider: 'google',
      name: 'Google',
      description: 'Google has many special features to help you find exactly what you\'re looking for.',
      icon: '/assets/img/icons/google-icon.svg',
      isLinked: false,
      isEnabled: false,
    },
    {
      provider: 'microsoft',
      name: 'Microsoft',
      description: 'Microsoft account for seamless integration with Office 365 and other Microsoft services.',
      icon: '/assets/img/icons/microsoft-icon.svg',
      isLinked: false,
      isEnabled: false,
    },
    {
      provider: 'facebook',
      name: 'Facebook',
      description: 'Connect with friends, family and other people you know.',
      icon: '/assets/img/icons/fb-icon.svg',
      isLinked: false,
      isEnabled: false,
    },
  ]);

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/oauth/linked');

      if (response.data.success && response.data.data) {
        const linkedAccounts = response.data.data;
        
        setProviders(prev => prev.map(provider => {
          const linked = linkedAccounts.find((acc: any) => acc.provider === provider.provider);
          return {
            ...provider,
            isLinked: !!linked,
            isEnabled: !!linked,
            linkedAt: linked?.linkedAt,
          };
        }));
      }
    } catch (err: any) {
      console.error('Error fetching linked accounts:', err);
      // Don't show error toast on initial load if user hasn't linked any accounts yet
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load linked accounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetAuthUrl = async (provider: string) => {
    try {
      const response = await apiClient.get(`/oauth/${provider}/url`);

      if (response.data.success && response.data.data?.url) {
        // Open OAuth URL in new window
        window.open(response.data.data.url, '_blank', 'width=600,height=700');
        toast.info(`Opening ${provider} authentication window...`);
      }
    } catch (err: any) {
      console.error(`Error getting ${provider} auth URL:`, err);
      toast.error(err.response?.data?.message || `Failed to get ${provider} authentication URL`);
    }
  };

  const handleUnlink = async (provider: string) => {
    if (!window.confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/oauth/unlink/${provider}`);

      if (response.data.success) {
        toast.success(`${provider} account unlinked successfully`);
        
        setProviders(prev => prev.map(p => 
          p.provider === provider 
            ? { ...p, isLinked: false, isEnabled: false, linkedAt: undefined }
            : p
        ));
      }
    } catch (err: any) {
      console.error(`Error unlinking ${provider}:`, err);
      toast.error(err.response?.data?.message || `Failed to unlink ${provider} account`);
    }
  };

  const handleToggle = async (provider: string, currentStatus: boolean) => {
    const providerData = providers.find(p => p.provider === provider);
    
    if (!providerData?.isLinked && !currentStatus) {
      // If not linked and trying to enable, open auth URL
      handleGetAuthUrl(provider);
    } else if (providerData?.isLinked && currentStatus) {
      // If linked and trying to disable, unlink
      handleUnlink(provider);
    }
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Website Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Website Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchLinkedAccounts}
              disabled={loading}
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
            <Link to="/company-settings" className="d-block rounded p-2">
              Company Settings
            </Link>
            <Link to="/localization" className="d-block rounded p-2">
              Localization
            </Link>
            <Link to="/prefixes" className="d-block rounded p-2">
              Prefixes
            </Link>
            <Link to="/preferences" className="d-block rounded p-2">
              Preferences
            </Link>
            <Link to="/social-authentication" className="d-block rounded p-2 active">
              Social Authentication
            </Link>
            <Link to="/language" className="d-block rounded p-2">
              Language
            </Link>
          </div>
        </div>

        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
              <div className="mb-3">
                <h5 className="mb-1">Social Authentication</h5>
                <p>Connect your social media accounts for seamless authentication</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="d-md-flex d-block">
                <div className="flex-fill">
                  <div className="row">
                    {providers.map((provider) => (
                      <div className="col-xxl-4 col-xl-6" key={provider.provider}>
                        <div className="card">
                          <div className="card-header d-flex align-items-center justify-content-between border-0 mb-3 pb-0">
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-lg p-2 rounded bg-gray flex-shrink-0 me-2">
                                <img src={provider.icon} alt={provider.name} />
                              </span>
                              <h6>{provider.name}</h6>
                            </div>
                            <span
                              className={`badge ${
                                provider.isLinked
                                  ? 'bg-transparent-success text-success'
                                  : 'bg-transparent-dark text-dark'
                              }`}
                            >
                              {provider.isLinked ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                          <div className="card-body pt-0">
                            <p>{provider.description}</p>
                            {provider.isLinked && provider.linkedAt && (
                              <small className="text-muted">
                                Linked on {new Date(provider.linkedAt).toLocaleDateString()}
                              </small>
                            )}
                          </div>
                          <div className="card-footer d-flex justify-content-between align-items-center">
                            <div>
                              <button
                                className="btn btn-outline-light"
                                onClick={() => handleGetAuthUrl(provider.provider)}
                                disabled={provider.provider === 'facebook'}
                                title={provider.provider === 'facebook' ? 'Coming soon' : 'View Integration'}
                              >
                                <i className="ti ti-tool me-2"></i>
                                {provider.isLinked ? 'Reauthorize' : 'Connect'}
                              </button>
                            </div>
                            <div className="status-toggle modal-status">
                              <input
                                type="checkbox"
                                id={`provider-${provider.provider}`}
                                className="check"
                                checked={provider.isEnabled}
                                onChange={() => handleToggle(provider.provider, provider.isEnabled)}
                                disabled={provider.provider === 'facebook'}
                              />
                              <label
                                htmlFor={`provider-${provider.provider}`}
                                className="checktoggle"
                              ></label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="alert alert-info mt-3">
                    <i className="ti ti-info-circle me-2"></i>
                    <strong>Note:</strong> OAuth integration allows users to sign in using their social media accounts. 
                    Currently, Google and Microsoft authentication are supported. Facebook integration is coming soon.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthentication;
