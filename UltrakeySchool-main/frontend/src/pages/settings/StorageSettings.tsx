import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface StorageProvider {
  _id: string;
  provider: 'local' | 'aws' | 'azure' | 'gcp' | 'cloudinary';
  displayName: string;
  isEnabled: boolean;
  isDefault: boolean;
  configuration: {
    localPath?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsRegion?: string;
    awsBucket?: string;
    azureAccountName?: string;
    azureAccountKey?: string;
    azureContainerName?: string;
    gcpProjectId?: string;
    gcpKeyFilePath?: string;
    gcpBucketName?: string;
    cloudinaryCloudName?: string;
    cloudinaryApiKey?: string;
    cloudinaryApiSecret?: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    publicAccess: boolean;
  };
  status: 'active' | 'inactive' | 'error';
  lastTested?: string;
  testResult?: {
    success: boolean;
    message: string;
    testedAt: string;
  };
  usage?: {
    totalFiles: number;
    totalSize: number;
    lastUpdated: string;
  };
  metadata?: {
    icon?: string;
    description?: string;
    documentationUrl?: string;
  };
}

const StorageSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<StorageProvider[]>([]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/storage-settings');

      if (response.data.success) {
        setProviders(response.data.data.providers || []);
      }
    } catch (err: any) {
      console.error('Error fetching storage providers:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load storage providers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleProvider = async (id: string, isEnabled: boolean) => {
    try {
      const response = await apiClient.put(`/storage-settings/${id}/toggle`, { isEnabled });

      if (response.data.success) {
        fetchProviders();
        toast.success(`Provider ${isEnabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle provider');
    }
  };

  const handleSetDefault = async (provider: StorageProvider) => {
    try {
      setSaving(true);
      const response = await apiClient.post('/storage-settings', {
        provider: provider.provider,
        isDefault: true,
        isEnabled: true
      });

      if (response.data.success) {
        fetchProviders();
        toast.success(`${provider.displayName} set as default`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set default provider');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (id: string, displayName: string) => {
    try {
      setTesting(id);
      const response = await apiClient.post(`/storage-settings/${id}/test`);

      if (response.data.success) {
        toast.success(`${displayName} connection test successful`);
        fetchProviders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setSaving(true);
      const response = await apiClient.post('/storage-settings/initialize');

      if (response.data.success) {
        fetchProviders();
        toast.success('Default providers initialized');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize providers');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'local': 'ti-server',
      'aws': 'ti-brand-aws',
      'azure': 'ti-brand-azure',
      'gcp': 'ti-brand-google',
      'cloudinary': 'ti-cloud'
    };
    return icons[provider] || 'ti-database';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading storage settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Storage Settings</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">Storage</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Storage Settings</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button className="btn btn-outline-danger ms-3" onClick={fetchProviders}>
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">Storage Settings</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">Storage</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
        <p className="text-muted mb-0">Configure file storage providers for your institution</p>
        {providers.length === 0 && (
          <button
            className="btn btn-primary"
            onClick={handleInitializeDefaults}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Initializing...
              </>
            ) : (
              <>
                <i className="ti ti-plus me-1"></i>Initialize Providers
              </>
            )}
          </button>
        )}
      </div>

      <div className="row">
        {providers && providers.length > 0 ? (
          providers.map((provider) => (
            <div key={provider._id} className="col-xl-4 col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      <div className={`avatar avatar-lg rounded me-3 ${
                        provider.status === 'active' ? 'bg-success-transparent' :
                        provider.status === 'error' ? 'bg-danger-transparent' :
                        'bg-secondary-transparent'
                      }`}>
                        <i className={`${getProviderIcon(provider.provider)} fs-24`}></i>
                      </div>
                      <div>
                        <h5 className="mb-1">{provider.displayName}</h5>
                        <small className="text-muted">{provider.metadata?.description || provider.provider}</small>
                      </div>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={provider.isEnabled}
                        onChange={(e) => handleToggleProvider(provider._id, e.target.checked)}
                        id={`toggle-${provider._id}`}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Status:</span>
                      <span className={`badge ${
                        provider.status === 'active' ? 'bg-success' :
                        provider.status === 'error' ? 'bg-danger' :
                        'bg-secondary'
                      }`}>
                        {provider.status}
                      </span>
                    </div>
                    {provider.isDefault && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Default:</span>
                        <span className="badge bg-primary">Yes</span>
                      </div>
                    )}
                    {provider.usage && (
                      <>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Files:</span>
                          <span>{provider.usage.totalFiles || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Size:</span>
                          <span>{formatFileSize(provider.usage.totalSize || 0)}</span>
                        </div>
                      </>
                    )}
                    {provider.configuration.maxFileSize && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Max File Size:</span>
                        <span>{formatFileSize(provider.configuration.maxFileSize)}</span>
                      </div>
                    )}
                    {provider.lastTested && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Last Tested:</span>
                        <span>{new Date(provider.lastTested).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    {provider.isEnabled && (
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={() => handleTestConnection(provider._id, provider.displayName)}
                        disabled={testing === provider._id}
                      >
                        {testing === provider._id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Testing...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-plug me-1"></i>Test
                          </>
                        )}
                      </button>
                    )}
                    {provider.isEnabled && !provider.isDefault && (
                      <button
                        className="btn btn-sm btn-outline-success flex-fill"
                        onClick={() => handleSetDefault(provider)}
                        disabled={saving}
                      >
                        <i className="ti ti-star me-1"></i>Set Default
                      </button>
                    )}
                    {provider.isDefault && (
                      <button className="btn btn-sm btn-success flex-fill" disabled>
                        <i className="ti ti-check me-1"></i>Default
                      </button>
                    )}
                  </div>

                  {provider.metadata?.documentationUrl && (
                    <div className="mt-2">
                      <a
                        href={provider.metadata.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-link w-100"
                      >
                        <i className="ti ti-external-link me-1"></i>Documentation
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-database-off fs-48 text-muted"></i>
                <p className="mt-2 text-muted">No storage providers configured</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={handleInitializeDefaults}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Initializing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-plus me-1"></i>Initialize Default Providers
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INFO ALERT */}
      <div className="alert alert-info mt-3">
        <h6 className="alert-heading">
          <i className="ti ti-info-circle me-1"></i>Storage Provider Information
        </h6>
        <ul className="mb-0">
          <li><strong>Local Storage:</strong> Files stored on the server's file system</li>
          <li><strong>AWS S3:</strong> Amazon Simple Storage Service for scalable cloud storage</li>
          <li><strong>Azure Blob:</strong> Microsoft Azure's object storage solution</li>
          <li><strong>Google Cloud Storage:</strong> Google's unified object storage</li>
          <li><strong>Cloudinary:</strong> Media management platform with image/video optimization</li>
        </ul>
      </div>
    </div>
  );
};

export default StorageSettings;
