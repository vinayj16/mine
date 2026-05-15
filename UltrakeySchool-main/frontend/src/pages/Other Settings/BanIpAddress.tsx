import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface BannedIP {
  _id: string;
  ipAddress: string;
  reason: string;
  bannedBy?: {
    _id: string;
    name: string;
  };
  bannedAt: string;
  expiresAt?: string;
  isPermanent: boolean;
  status: string;
  attempts: number;
}

const BanIpAddress: React.FC = () => {
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIP, setEditingIP] = useState<BannedIP | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    ipAddress: '',
    reason: '',
    isPermanent: true,
    expiresAt: '',
    notes: ''
  });

  const fetchBannedIPs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/banned-ips');
      if (response.data.success) {
        setBannedIPs(response.data.data.bannedIPs || []);
      }
    } catch (err: any) {
      console.error('Error fetching banned IPs:', err);
      setError(err.response?.data?.message || 'Failed to load banned IPs');
      toast.error('Failed to load banned IPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannedIPs();
  }, []);

  const handleRefresh = () => {
    fetchBannedIPs();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ipAddress.trim() || !formData.reason.trim()) {
      toast.error('Please enter IP address and reason');
      return;
    }

    try {
      if (editingIP) {
        const response = await apiClient.put(`/banned-ips/${editingIP._id}`, formData);
        if (response.data.success) {
          toast.success('Banned IP updated successfully');
          resetForm();
          fetchBannedIPs();
          closeModal('edit_ban_ip');
        }
      } else {
        const response = await apiClient.post('/banned-ips', formData);
        if (response.data.success) {
          toast.success('IP address banned successfully');
          resetForm();
          fetchBannedIPs();
          closeModal('add_ban_ip');
        }
      }
    } catch (err: any) {
      console.error('Error saving banned IP:', err);
      toast.error(err.response?.data?.message || 'Failed to save banned IP');
    }
  };

  const handleEdit = (ip: BannedIP) => {
    setEditingIP(ip);
    setFormData({
      ipAddress: ip.ipAddress,
      reason: ip.reason,
      isPermanent: ip.isPermanent,
      expiresAt: ip.expiresAt ? new Date(ip.expiresAt).toISOString().split('T')[0] : '',
      notes: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to unban this IP address?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/banned-ips/${id}`);
      if (response.data.success) {
        toast.success('IP address unbanned successfully');
        fetchBannedIPs();
      }
    } catch (err: any) {
      console.error('Error unbanning IP:', err);
      toast.error(err.response?.data?.message || 'Failed to unban IP address');
    }
  };

  const resetForm = () => {
    setEditingIP(null);
    setFormData({
      ipAddress: '',
      reason: '',
      isPermanent: true,
      expiresAt: '',
      notes: ''
    });
  };

  const closeModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
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
              <Link to="/storage" className="d-block rounded p-2">Storage</Link>
              <Link to="/ban-ip-address" className="d-block active rounded p-2">Ban IP Address</Link>
            </div>
          </div>
          <div className="col-xxl-10 col-xl-9">
            <div className="border-start ps-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                <div className="mb-3">
                  <h5 className="mb-1">Ban IP Address</h5>
                  <p>Ban IP Address Configuration</p>
                </div>
                <div className="mb-3">
                  <button 
                    className="btn btn-outline-light bg-white btn-icon me-2" 
                    data-bs-toggle="modal" 
                    data-bs-target="#add_ban_ip"
                    onClick={resetForm}
                  >
                    <i className="ti ti-plus"></i>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading banned IPs...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="alert alert-danger" role="alert">
                  <i className="ti ti-alert-circle me-2"></i>
                  {error}
                  <button
                    className="btn btn-sm btn-outline-danger ms-3"
                    onClick={fetchBannedIPs}
                  >
                    <i className="ti ti-refresh me-1"></i>Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && bannedIPs.length === 0 && (
                <div className="text-center py-5">
                  <i className="ti ti-ban" style={{ fontSize: '48px', color: '#ccc' }}></i>
                  <p className="mt-2 text-muted">No banned IP addresses found</p>
                </div>
              )}

              {/* Banned IPs List */}
              {!loading && !error && bannedIPs.length > 0 && (
                <div className="row">
                  {bannedIPs.map((ip) => (
                    <div className="col-xxl-4 col-md-6 d-flex" key={ip._id}>
                      <div className="card flex-fill">
                        <div className="card-header p-3 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-sm rounded p-1 text-danger bg-soft-danger me-2">
                              <i className="ti ti-ban"></i>
                            </span>
                            <h6>{ip.ipAddress}</h6>
                          </div>
                          <div className="d-flex align-items-center">
                            <button 
                              className="btn btn-link p-0 me-2" 
                              data-bs-toggle="modal" 
                              data-bs-target="#edit_ban_ip"
                              onClick={() => handleEdit(ip)}
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button 
                              className="btn btn-link p-0"
                              onClick={() => handleDelete(ip._id)}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </div>
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="flex-shrink-0 d-block me-2">
                              <i className="ti ti-info-square-rounded"></i>
                            </span>
                            <p className="mb-0">{ip.reason}</p>
                          </div>
                          <div className="d-flex justify-content-between text-muted small">
                            <span>{ip.isPermanent ? 'Permanent' : 'Temporary'}</span>
                            <span className={`badge ${ip.status === 'active' ? 'badge-soft-danger' : 'badge-soft-secondary'}`}>
                              {ip.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Ban IP Modal */}
      <div className="modal fade" id="add_ban_ip">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h4>Ban IP Address</h4>
                <button className="btn-close" data-bs-dismiss="modal" type="button" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">IP Address *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g., 192.168.1.1"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason *</label>
                  <textarea 
                    className="form-control"
                    rows={3}
                    placeholder="Enter reason for banning this IP"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox"
                      id="isPermanent"
                      checked={formData.isPermanent}
                      onChange={(e) => setFormData({ ...formData, isPermanent: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="isPermanent">
                      Permanent Ban
                    </label>
                  </div>
                </div>
                {!formData.isPermanent && (
                  <div className="mb-3">
                    <label className="form-label">Expires At</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-control"
                    rows={2}
                    placeholder="Additional notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" data-bs-dismiss="modal" type="button" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Ban IP Address
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Ban IP Modal */}
      <div className="modal fade" id="edit_ban_ip">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h4>Edit Banned IP</h4>
                <button className="btn-close" data-bs-dismiss="modal" type="button" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">IP Address *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    required
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason *</label>
                  <textarea 
                    className="form-control"
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox"
                      id="isPermanentEdit"
                      checked={formData.isPermanent}
                      onChange={(e) => setFormData({ ...formData, isPermanent: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="isPermanentEdit">
                      Permanent Ban
                    </label>
                  </div>
                </div>
                {!formData.isPermanent && (
                  <div className="mb-3">
                    <label className="form-label">Expires At</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" data-bs-dismiss="modal" type="button" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BanIpAddress;
