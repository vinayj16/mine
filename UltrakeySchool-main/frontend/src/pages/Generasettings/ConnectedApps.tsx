import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface ConnectedApp {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  category: string;
  isConnected: boolean;
  connectedAt: string | null;
}

const ConnectedApps: React.FC = () => {
  const [apps, setApps] = useState<ConnectedApp[]>([])
  const [loading, setLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [connectingAppId, setConnectingAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectedApps();
  }, []);

  const fetchConnectedApps = async () => {
    try {
      setLoading(true)
      
      try {
        const response = await apiClient.get('/settings/connected-apps')
        if (response.data?.success && response.data?.data?.apps) {
          const appsData = response.data.data.apps
          setApps(appsData.map((app: any) => ({
            id: app._id || app.id,
            name: app.name,
            displayName: app.displayName,
            description: app.description,
            logo: app.logo,
            category: app.category || 'other',
            isConnected: app.isConnected || false,
            connectedAt: app.connectedAt || null
          })))
        }
      } catch {
        // Use demo data - already set as initial state
      }
    } catch (err: any) {
      console.error('Error fetching connected apps:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectApp = async (appId: string, appName: string) => {
    try {
      setConnectingAppId(appId);
      const response = await apiClient.post(`/settings/connected-apps/${appId}/connect`, {
        credentials: {} // Add credentials if needed
      });
      
      if (response.data.success) {
        setApps(prev => prev.map(app => 
          app.id === appId 
            ? { ...app, isConnected: true, connectedAt: new Date().toISOString() } 
            : app
        ));
        toast.success(`${appName} connected successfully`);
      } else {
        toast.error(response.data.message || 'Failed to connect app');
      }
    } catch (err: any) {
      console.error('Error connecting app:', err);
      toast.error(err.response?.data?.message || 'Failed to connect app');
    } finally {
      setConnectingAppId(null);
    }
  };

  const handleDisconnectApp = async (appId: string, appName: string) => {
    try {
      setConnectingAppId(appId);
      const response = await apiClient.post(`/settings/connected-apps/${appId}/disconnect`);
      
      if (response.data.success) {
        setApps(prev => prev.map(app => 
          app.id === appId 
            ? { ...app, isConnected: false, connectedAt: null } 
            : app
        ));
        toast.success(`${appName} disconnected successfully`);
      } else {
        toast.error(response.data.message || 'Failed to disconnect app');
      }
    } catch (err: any) {
      console.error('Error disconnecting app:', err);
      toast.error(err.response?.data?.message || 'Failed to disconnect app');
    } finally {
      setConnectingAppId(null);
    }
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">General Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Settings</a>
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
              onClick={fetchConnectedApps}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <a href="/profile-settings" className="d-block rounded p-2">Profile Settings</a>
            <a href="/security-settings" className="d-block rounded p-2">Security Settings</a>
            <a href="/notifications-settings" className="d-block rounded p-2">Notifications</a>
            <a href="/connected-apps" className="d-block rounded active p-2">Connected Apps</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom mb-3 pt-3">
              <div className="mb-3">
                <h5>Connected Apps</h5>
                <p>Manage your third-party app integrations</p>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="ti ti-alert-circle me-2" />
                {error}
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchConnectedApps}
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading connected apps...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-plug-connected-x" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-3 text-muted">No apps available</p>
              </div>
            ) : (
              <div className="d-block">
                {apps.map((app) => (
                  <div 
                    key={app.id} 
                    className="d-flex align-items-center justify-content-between flex-wrap border mb-3 p-3 pb-0 rounded bg-white"
                  >
                    <div>
                      <div className="d-flex align-items-center">
                        <span className="flex-shrink-0 mb-3 me-2 border rounded p-2 d-flex align-items-center justify-content-center">
                          <img src={app.logo} alt={app.displayName} style={{ width: '40px', height: '40px' }} />
                        </span>
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <h6 className="mb-1">{app.displayName}</h6>
                            {app.isConnected && (
                              <span className="badge bg-success ms-2">Connected</span>
                            )}
                          </div>
                          <p className="mb-0">{app.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      {app.isConnected ? (
                        <button 
                          className="btn btn-outline-danger" 
                          onClick={() => handleDisconnectApp(app.id, app.displayName)}
                          disabled={connectingAppId === app.id}
                        >
                          {connectingAppId === app.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Disconnecting...
                            </>
                          ) : (
                            'Disconnect'
                          )}
                        </button>
                      ) : (
                        <button 
                          className="btn btn-outline-primary" 
                          onClick={() => handleConnectApp(app.id, app.displayName)}
                          disabled={connectingAppId === app.id}
                        >
                          {connectingAppId === app.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedApps;
