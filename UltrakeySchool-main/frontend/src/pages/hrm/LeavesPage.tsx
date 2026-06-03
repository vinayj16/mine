import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import { getInstitutionId } from '../../utils/auth';
import { exportToPDF, exportToExcel, type ExportColumn } from '../../utils/exportUtils';
import ConfirmModal from '../../components/common/ConfirmModal';

interface Leave {
  _id: string;
  leaveId?: string;
  staffId?: string;
  staffName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days?: number;
  totalDays?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedOn: string;
  appliedDate?: string;
  approvedBy?: string;
  approvedOn?: string;
}

const LeavesPage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ leave: Leave; type: 'cancel' | 'delete' } | null>(null);
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    staffId: '',
    staffName: '',
  });

  useEffect(() => {
    fetchLeaves();
    const stored = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setFormData(prev => ({ ...prev, staffName: u.name || u.firstName + ' ' + (u.lastName || '') || 'Teacher', staffId: userId || u._id || u.id || '' }));
      } catch {
        if (userId) setFormData(prev => ({ ...prev, staffId: userId }));
      }
    } else if (userId) {
      setFormData(prev => ({ ...prev, staffId: userId }));
    }
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/leaves');
      if (response.data.success) {
        setLeaves(response.data.data || []);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leave requests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const diff = new Date(formData.endDate || '').getTime() - new Date(formData.startDate || '').getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
      const payload = {
        staffId: formData.staffId,
        staffName: formData.staffName || 'Teacher',
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
        status: 'pending',
        appliedOn: new Date().toISOString(),
        institutionId: getInstitutionId(),
      };
      await apiClient.post('/hrm/leaves', payload);
      toast.success('Leave applied successfully');
      setShowApplyModal(false);
      setFormData(prev => ({ ...prev, leaveType: 'casual', startDate: '', endDate: '', reason: '' }));
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to apply leave');
    }
  };

  const handleEditLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;
    try {
      const diff = new Date(formData.endDate || '').getTime() - new Date(formData.startDate || '').getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
      const payload = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
      };
      await apiClient.put(`/hrm/leaves/${selectedLeave._id}`, payload);
      toast.success('Leave updated successfully');
      setShowEditModal(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update leave');
    }
  };

  const handleCancelLeave = (leave: Leave) => {
    setDeleteTarget({ leave, type: 'cancel' });
    setShowDeleteModal(true);
  };

  const handleDeleteLeave = (leave: Leave) => {
    setDeleteTarget({ leave, type: 'delete' });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { leave, type } = deleteTarget;
    try {
      if (type === 'cancel') {
        await apiClient.put(`/hrm/leaves/${leave._id || leave.leaveId}`, { status: 'cancelled' });
        toast.success('Leave cancelled');
      } else {
        await apiClient.delete(`/hrm/leaves/${leave._id || leave.leaveId}`);
        toast.success('Leave deleted');
      }
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${type} leave`);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!leaves.length) { toast.error('No data to export'); return; }
    const exportData = leaves.map(leave => ({
      'Leave ID': leave.leaveId || leave._id.slice(-6),
      'Staff': leave.staffName || 'Unknown',
      'Leave Type': leave.leaveType?.charAt(0)?.toUpperCase() + leave.leaveType?.slice(1),
      'Start Date': formatDate(leave.startDate),
      'End Date': formatDate(leave.endDate),
      'Days': leave.days || leave.totalDays || '-',
      'Status': leave.status?.charAt(0)?.toUpperCase() + leave.status?.slice(1)
    }));
    const columns: ExportColumn[] = [
      { key: 'Leave ID', label: 'Leave ID' },
      { key: 'Staff', label: 'Staff' },
      { key: 'Leave Type', label: 'Leave Type' },
      { key: 'Start Date', label: 'Start Date' },
      { key: 'End Date', label: 'End Date' },
      { key: 'Days', label: 'Days' },
      { key: 'Status', label: 'Status' }
    ];
    if (type === 'pdf') {
      exportToPDF(exportData, 'leaves', columns, 'Leave Requests');
    } else {
      exportToExcel(exportData, 'leaves', columns);
    }
  };

  const openEditModal = (leave: Leave) => {
    setSelectedLeave(leave);
    setFormData({
      leaveType: leave.leaveType,
      startDate: leave.startDate?.split('T')[0] || '',
      endDate: leave.endDate?.split('T')[0] || '',
      reason: leave.reason || '',
      staffId: leave.staffId || '',
      staffName: leave.staffName || '',
    });
    setShowEditModal(true);
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

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Leaves</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchLeaves}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Leave Requests</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item">HRM</li>
              <li className="breadcrumb-item active">Leaves</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-success me-2" onClick={() => setShowApplyModal(true)}>
            <i className="ti ti-plus me-2"></i>Apply Leave
          </button>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchLeaves} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <Link to="/settings/hrm/leave-types" className="btn btn-primary">
            <i className="ti ti-plus me-2"></i>Manage Leave Types
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">All Leave Requests</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Leave ID</th>
                  <th>Staff</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <p className="text-muted mb-0">No leave requests found</p>
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>{leave.leaveId || leave._id.slice(-6)}</td>
                      <td>
                        <div className="fw-medium">{leave.staffName || 'Unknown'}</div>
                        <small className="text-muted">{leave.staffId || '-'}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {leave.leaveType?.charAt(0)?.toUpperCase() + leave.leaveType?.slice(1)}
                        </span>
                      </td>
                      <td>{formatDate(leave.startDate)}</td>
                      <td>{formatDate(leave.endDate)}</td>
                      <td>{leave.days || leave.totalDays || '-'}</td>
                      <td>{formatDate(leave.appliedOn || leave.appliedDate || '')}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(leave.status)}`}>
                          {leave.status?.charAt(0)?.toUpperCase() + leave.status?.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {leave.status === 'pending' && (
                            <>
                              <button className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEditModal(leave)}>
                                <i className="ti ti-edit"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-warning" title="Cancel" onClick={() => handleCancelLeave(leave)}>
                                <i className="ti ti-x"></i>
                              </button>
                            </>
                          )}
                          <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDeleteLeave(leave)}>
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply Leave</h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)}></button>
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select className="form-select" name="leaveType" value={formData.leaveType} onChange={handleInputChange} required>
                      <option value="casual">Casual</option>
                      <option value="sick">Sick</option>
                      <option value="annual">Annual</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <textarea className="form-control" name="reason" rows={3} value={formData.reason} onChange={handleInputChange} required></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message={deleteTarget?.type === 'cancel' ? 'Cancel this leave request?' : 'Delete this leave request permanently?'} />

      {/* Edit Leave Modal */}
      {showEditModal && selectedLeave && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Leave</h5>
                <button type="button" className="btn-close" onClick={() => { setShowEditModal(false); setSelectedLeave(null); }}></button>
              </div>
              <form onSubmit={handleEditLeave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select className="form-select" name="leaveType" value={formData.leaveType} onChange={handleInputChange} required>
                      <option value="casual">Casual</option>
                      <option value="sick">Sick</option>
                      <option value="annual">Annual</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <textarea className="form-control" name="reason" rows={3} value={formData.reason} onChange={handleInputChange} required></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedLeave(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;

