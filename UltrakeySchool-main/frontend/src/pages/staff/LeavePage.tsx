import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface StaffLeave {
  _id: string;
  staffId: string;
  leaveType: 'sick' | 'casual' | 'annual' | 'maternity' | 'paternity' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

const LeavePage: React.FC = () => {
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<StaffLeave | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new leave
  const [formData, setFormData] = useState({
    leaveType: 'casual' as StaffLeave['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
    attachments: [] as File[]
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/leaves');
      
      if (response.data.success) {
        setLeaves(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching leaves:', error);
      toast.error(error.response?.data?.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('leaveType', formData.leaveType);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('reason', formData.reason);
      
      formData.attachments.forEach((file, index) => {
        formDataToSend.append(`attachments[${index}]`, file);
      });

      const response = await apiClient.post('/leaves', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Leave application submitted successfully');
        setShowAddModal(false);
        setFormData({
          leaveType: 'casual',
          startDate: '',
          endDate: '',
          reason: '',
          attachments: []
        });
        fetchLeaves();
      }
    } catch (error: any) {
      console.error('Error applying leave:', error);
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    try {
      const response = await apiClient.put(`/leaves/${leaveId}/cancel`);
      
      if (response.data.success) {
        toast.success('Leave cancelled successfully');
        fetchLeaves();
      }
    } catch (error: any) {
      console.error('Error cancelling leave:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const getStatusColor = (status: StaffLeave['status']) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  const getLeaveTypeColor = (type: StaffLeave['leaveType']) => {
    switch (type) {
      case 'sick': return 'bg-danger';
      case 'emergency': return 'bg-danger';
      case 'maternity': return 'bg-info';
      case 'paternity': return 'bg-info';
      case 'annual': return 'bg-primary';
      case 'casual': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
    const matchesType = filterType === 'all' || leave.leaveType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
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
          <h3 className="page-title mb-1">Leave Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/staff">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Leave</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <i className="ti ti-plus me-1" />Apply Leave
          </button>
        </div>
      </div>

      {/* FILTERS AND STATS */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search leaves..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="annual">Annual Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="emergency">Emergency Leave</option>
          </select>
        </div>
        <div className="col-md-4">
          <div className="d-flex gap-2">
            <div className="flex-fill text-center">
              <small className="text-muted d-block">Pending</small>
              <strong className="text-warning">{leaves.filter(l => l.status === 'pending').length}</strong>
            </div>
            <div className="flex-fill text-center">
              <small className="text-muted d-block">Approved</small>
              <strong className="text-success">{leaves.filter(l => l.status === 'approved').length}</strong>
            </div>
            <div className="flex-fill text-center">
              <small className="text-muted d-block">Rejected</small>
              <strong className="text-danger">{leaves.filter(l => l.status === 'rejected').length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* LEAVES LIST */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {filteredLeaves.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-calendar-off fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No leave applications found</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredLeaves.map((leave) => (
                    <div key={leave._id} className="list-group-item">
                      <div className="d-flex align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 me-2">
                              {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                            </h6>
                            <span className={`badge ${getLeaveTypeColor(leave.leaveType)} me-2`}>
                              {leave.leaveType}
                            </span>
                            <span className={`badge ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-muted mb-2">{leave.reason}</p>
                          <div className="d-flex align-items-center text-muted small">
                            <i className="ti ti-calendar me-1"></i>
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            <span className="ms-2">({calculateDays(leave.startDate, leave.endDate)} days)</span>
                            {leave.approvedBy && (
                              <>
                                <i className="ti ti-user-check ms-3 me-1"></i>
                                Approved by: {leave.approvedBy.name}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-1">
                          {leave.status === 'pending' && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleCancelLeave(leave._id)}
                            >
                              <i className="ti ti-x"></i> Cancel
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowViewModal(true);
                            }}
                          >
                            <i className="ti ti-eye"></i>
                          </button>
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

      {/* APPLY LEAVE MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply for Leave</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select
                      className="form-control"
                      value={formData.leaveType}
                      onChange={(e) => setFormData({...formData, leaveType: e.target.value as StaffLeave['leaveType']})}
                      required
                    >
                      <option value="sick">Sick Leave</option>
                      <option value="casual">Casual Leave</option>
                      <option value="annual">Annual Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="emergency">Emergency Leave</option>
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Attachments (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      onChange={(e) => setFormData({...formData, attachments: Array.from(e.target.files || [])})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Apply Leave
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEAVE MODAL */}
      {showViewModal && selectedLeave && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Leave Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Leave Type</label>
                  <p className="form-control-plaintext">
                    {selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1)} Leave
                  </p>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date</label>
                    <p className="form-control-plaintext">
                      {new Date(selectedLeave.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date</label>
                    <p className="form-control-plaintext">
                      {new Date(selectedLeave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Duration</label>
                  <p className="form-control-plaintext">
                    {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days
                  </p>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <span className={`badge ${getStatusColor(selectedLeave.status)}`}>
                      {selectedLeave.status}
                    </span>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Applied On</label>
                    <p className="form-control-plaintext">
                      {new Date(selectedLeave.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <p className="form-control-plaintext">{selectedLeave.reason}</p>
                </div>
                {selectedLeave.approvedBy && (
                  <div className="mb-3">
                    <label className="form-label">Approved By</label>
                    <p className="form-control-plaintext">
                      {selectedLeave.approvedBy.name} ({selectedLeave.approvedBy.email})
                    </p>
                  </div>
                )}
                {selectedLeave.rejectionReason && (
                  <div className="mb-3">
                    <label className="form-label">Rejection Reason</label>
                    <p className="form-control-plaintext text-danger">{selectedLeave.rejectionReason}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                {selectedLeave.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleCancelLeave(selectedLeave._id);
                      setShowViewModal(false);
                    }}
                  >
                    Cancel Leave
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeavePage;
