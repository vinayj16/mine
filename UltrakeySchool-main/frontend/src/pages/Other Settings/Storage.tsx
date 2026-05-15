import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface StorageProvider {
  _id: string;
  provider: string;
  displayName: string;
  isEnabled: boolean;
  isDefault: boolean;
  configuration: {
    localPath?: string;
    awsRegion?: string;
    awsBucket?: string;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    publicAccess?: boolean;
  };
  status: string;
  metadata?: {
    icon?: string;
    description?: string;
  };
}

const Storage: React.FC = () => {
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<StorageProvider | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/storage-settings');
      if (response.data.success) {
        const fetchedProviders = response.data.data.providers || [];
        setProviders(fetchedProviders);
        
        // Initialize default providers if none exist
        if (fetchedProviders.length === 0) {
          await initializeProviders();
        }
      }
    } catch (err: any) {
      console.error('Error fetching storage providers:', err);
      setError(err.response?.data?.message || 'Failed to load storage providers');
      toast.error('Failed to load storage providers');
    } finally {
      setLoading(false);
    }
  };

  const initializeProviders = async () => {
    try {
      const response = await apiClient.post('/storage-settings/initialize');
      if (response.data.success) {
        toast.success('Default storage providers initialized');
        fetchProviders();
      }
    } catch (err: any) {
      console.error('Error initializing providers:', err);
      toast.error('Failed to initialize providers');
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleRefresh = () => {
    fetchProviders();
  };

  const handleToggleProvider = async (provider: StorageProvider) => {
    try {
      const response = await apiClient.put(`/storage-settings/${provider._id}/toggle`, {
        isEnabled: !provider.isEnabled
      });
      
      if (response.data.success) {
        toast.success(`${provider.displayName} ${!provider.isEnabled ? 'enabled' : 'disabled'} successfully`);
        fetchProviders();
      }
    } catch (err: any) {
      console.error('Error toggling provider:', err);
      toast.error(err.response?.data?.message || 'Failed to toggle provider');
    }
  };

  const handleTestConnection = async (provider: StorageProvider) => {
    try {
      const response = await apiClient.post(`/storage-settings/${provider._id}/test`);
      
      if (response.data.success) {
        toast.success(`Connection to ${provider.displayName} successful`);
      }
    } catch (err: any) {
      console.error('Error testing connection:', err);
      toast.error(err.response?.data?.message || 'Connection test failed');
    }
  };

  const handleConfigureProvider = (provider: StorageProvider) => {
    setSelectedProvider(provider);
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider) return;

    try {
      const response = await apiClient.post('/storage-settings', {
        provider: selectedProvider.provider,
        displayName: selectedProvider.displayName,
        isEnabled: selectedProvider.isEnabled,
        isDefault: selectedProvider.isDefault,
        configuration: selectedProvider.configuration
      });
      
      if (response.data.success) {
        toast.success('Storage provider configuration saved successfully');
        fetchProviders();
        closeModal();
      }
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const closeModal = () => {
    setSelectedProvider(null);
    const modal = document.getElementById('connect_storage');
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
    modalInstance?.hide();
  };

  return (
    <>
      <div className="content bg-white">
        <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Other Settings</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/settings">Settings</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Other Settings</li>
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
              <Link to="/storage" className="d-block rounded active p-2">Storage</Link>
              <Link to="/ban-ip-address" className="d-block rounded p-2">Ban IP Address</Link>
            </div>
          </div>
          <div className="col-xxl-10 col-xl-9">
            <div className="border-start ps-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                <div className="mb-3">
                  <h5 className="mb-1">Storage</h5>
                  <p>Storage Settings Configuration</p>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading storage providers...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="alert alert-danger" role="alert">
                  <i className="ti ti-alert-circle me-2"></i>
                  {error}
                  <button
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={fetchProviders}
                  >
                    <i className="ti ti-refresh me-1"></i>Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && providers.length === 0 && (
                <div className="text-center py-5">
                  <i className="ti ti-database" style={{ fontSize: '48px', color: '#ccc' }}></i>
                  <p className="mt-2 text-muted">No storage providers found</p>
                  <button className="btn btn-primary mt-2" onClick={initializeProviders}>
                    Initialize Default Providers
                  </button>
                </div>
              )}

              {/* Storage Providers */}
              {!loading && !error && providers.length > 0 && (
                <div className="card">
                  <div className="card-body p-3 pb-0">
                    <div className="row">
                      {providers.map((provider) => (
                        <div className="col-xxl-4 col-md-6" key={provider._id}>
                          <div className="d-flex align-items-center justify-content-between bg-white p-3 border rounded mb-3">
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-md rounded bg-light p-2 me-2">
                                {provider.metadata?.icon ? (
                                  <img src={provider.metadata.icon} alt={provider.displayName} />
                                ) : (
                                  <i className="ti ti-database"></i>
                                )}
                              </span>
                              <div>
                                <h6 className="mb-0">{provider.displayName}</h6>
                                {provider.isDefault && (
                                  <span className="badge badge-soft-success badge-xs">Default</span>
                                )}
                              </div>
                            </div>
                            <div className="d-flex align-items-center">
                              <div className="status-toggle modal-status">
                                <input 
                                  type="checkbox" 
                                  id={`provider-${provider._id}`} 
                                  className="check"
                                  checked={provider.isEnabled}
                                  onChange={() => handleToggleProvider(provider)}
                                />
                                <label htmlFor={`provider-${provider._id}`} className="checktoggle"></label>
                              </div>
                              <button 
                                className="btn btn-outline-light bg-white btn-icon ms-2" 
                                data-bs-toggle="modal" 
                                data-bs-target="#connect_storage"
                                onClick={() => handleConfigureProvider(provider)}
                                title="Configure"
                              >
                                <i className="ti ti-settings-cog"></i>
                              </button>
                              {provider.isEnabled && (
                                <button 
                                  className="btn btn-outline-light bg-white btn-icon ms-2"
                                  onClick={() => handleTestConnection(provider)}
                                  title="Test Connection"
                                >
                                  <i className="ti ti-plug"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configure Storage Modal */}
      <div className="modal fade" id="connect_storage">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSaveConfiguration}>
              <div className="modal-header">
                <h4>Configure {selectedProvider?.displayName}</h4>
                <button className="btn-close" data-bs-dismiss="modal" type="button" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {selectedProvider && (
                  <>
                    {selectedProvider.provider === 'local' && (
                      <div className="mb-3">
                        <label className="form-label">Local Storage Path</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={selectedProvider.configuration.localPath || './uploads'}
                          onChange={(e) => setSelectedProvider({
                            ...selectedProvider,
                            configuration: { ...selectedProvider.configuration, localPath: e.target.value }
                          })}
                        />
                        <small className="text-muted">Path where files will be stored on the server</small>
                      </div>
                    )}

                    {selectedProvider.provider === 'aws' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">AWS Region</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="us-east-1"
                            value={selectedProvider.configuration.awsRegion || ''}
                            onChange={(e) => setSelectedProvider({
                              ...selectedProvider,
                              configuration: { ...selectedProvider.configuration, awsRegion: e.target.value }
                            })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">S3 Bucket Name</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="my-bucket"
                            value={selectedProvider.configuration.awsBucket || ''}
                            onChange={(e) => setSelectedProvider({
                              ...selectedProvider,
                              configuration: { ...selectedProvider.configuration, awsBucket: e.target.value }
                            })}
                          />
                        </div>
                      </>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Max File Size (bytes)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={selectedProvider.configuration.maxFileSize || 10485760}
                        onChange={(e) => setSelectedProvider({
                          ...selectedProvider,
                          configuration: { ...selectedProvider.configuration, maxFileSize: parseInt(e.target.value) }
                        })}
                      />
                      <small className="text-muted">Default: 10MB (10485760 bytes)</small>
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="publicAccess"
                          checked={selectedProvider.configuration.publicAccess || false}
                          onChange={(e) => setSelectedProvider({
                            ...selectedProvider,
                            configuration: { ...selectedProvider.configuration, publicAccess: e.target.checked }
                          })}
                        />
                        <label className="form-check-label" htmlFor="publicAccess">
                          Enable Public Access
                        </label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="setDefault"
                          checked={selectedProvider.isDefault || false}
                          onChange={(e) => setSelectedProvider({
                            ...selectedProvider,
                            isDefault: e.target.checked
                          })}
                        />
                        <label className="form-check-label" htmlFor="setDefault">
                          Set as Default Provider
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" data-bs-dismiss="modal" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Storage;
