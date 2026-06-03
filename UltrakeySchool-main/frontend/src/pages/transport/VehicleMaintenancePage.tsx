import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/authStore';
import ConfirmModal from '../../components/common/ConfirmModal';

interface VehicleMaintenance {
  _id?: string;
  vehicle: any; // Vehicle object or ID
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'breakdown' | 'other';
  description?: string;
  scheduledDate: string;
  cost?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

const VehicleMaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const instId = user?.institutionId || user?.institution || '';
  const [records, setRecords] = useState<VehicleMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form State
  const [vehicleId, setVehicleId] = useState<string>('');
  const [maintenanceType, setMaintenanceType] = useState<'routine' | 'repair' | 'inspection' | 'breakdown' | 'other'>('routine');
  const [description, setDescription] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [cost, setCost] = useState<number>(0);
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('scheduled');

  const types = [
    { value: 'routine', label: 'Routine Servicing' },
    { value: 'repair', label: 'Mechanical Repair' },
    { value: 'inspection', label: 'Inspection / Permit check' },
    { value: 'breakdown', label: 'Breakdown Fix' },
    { value: 'other', label: 'Other Work' }
  ];

  const statuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response: any = await apiClient.get(`/transport/maintenance?tenant=${instId}&institutionId=${instId}`);
      setRecords(response.data?.data?.maintenanceRecords || response.data?.data || response.data || []);
    } catch (error: any) {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response: any = await apiClient.get(`/transport/vehicles?tenant=${instId}&institutionId=${instId}`);
      setVehicles(response.data?.data?.vehicles || response.data?.data || []);
    } catch (error) {
      console.log('Failed to fetch vehicles');
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setVehicleId('');
    setMaintenanceType('routine');
    setDescription('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setCost(0);
    setStatus('scheduled');
    setShowModal(true);
  };

  const openEditModal = (record: VehicleMaintenance) => {
    setIsEditing(true);
    setCurrentId(record._id || null);
    setVehicleId(record.vehicle?._id || record.vehicle || '');
    setMaintenanceType(record.maintenanceType);
    setDescription(record.description || '');
    setScheduledDate(record.scheduledDate ? record.scheduledDate.split('T')[0] : '');
    setCost(record.cost || 0);
    setStatus(record.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !scheduledDate) {
      toast.warn('Please select vehicle and schedule date');
      return;
    }
    const payload: VehicleMaintenance = {
      vehicleId,
      maintenanceType,
      description,
      scheduledDate,
      cost,
      status
    } as any;

    try {
      if (isEditing && currentId) {
        await apiClient.put(`/transport/maintenance/${currentId}`, payload);
        toast.success('Maintenance record updated successfully');
      } else {
        await apiClient.post('/transport/maintenance', payload);
        toast.success('Maintenance record scheduled successfully');
      }
      setShowModal(false);
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    // Save original data for potential rollback
    const originalData = [...records];

    // Optimistically remove from UI immediately
    setRecords(prev => prev.filter(r => r._id !== deleteTarget));

    try {
      const response = await apiClient.delete(`/transport/maintenance/${deleteTarget}?_t=${Date.now()}`);
      if ((response.data as any)?.success !== false) {
        toast.success('Maintenance record deleted successfully');
      } else {
        throw new Error((response.data as any)?.message || 'Delete failed');
      }
      fetchRecords();
    } catch (error: any) {
      // Rollback optimistic removal on failure
      setRecords(originalData);
      toast.error(error.response?.data?.message || 'Failed to delete maintenance record');
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const getStatusClass = (statusStr: string) => {
    switch (statusStr) {
      case 'completed': return 'bg-success-soft text-success';
      case 'in_progress': return 'bg-primary-soft text-primary';
      case 'scheduled': return 'bg-info-soft text-info';
      case 'cancelled': return 'bg-danger-soft text-danger';
      default: return 'bg-light text-secondary';
    }
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '85vh' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Vehicle Maintenance</h2>
          <p className="text-muted mb-0">Schedule mechanical checks, body repairs, and routine services for the school bus fleet.</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4 py-2"
          style={{ borderRadius: '10px', fontWeight: 500 }}
          onClick={openAddModal}
        >
          <i className="ti ti-plus fs-5"></i> Schedule Maintenance
        </button>
      </div>

      {/* Summary Analytics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 bg-white text-dark" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Total Maintenance Runs</span>
            <h3 className="fw-bold mb-0 text-dark">{records.length}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 bg-white text-dark" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Total Maintenance Cost</span>
            <h3 className="fw-bold mb-0 text-danger">
              ₹{records.reduce((acc, r) => acc + (r.cost || 0), 0).toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 bg-white text-dark" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">In Progress / Active</span>
            <h3 className="fw-bold mb-0 text-primary">
              {records.filter(r => r.status === 'in_progress').length} Buses
            </h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 bg-white text-dark" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Scheduled Runs</span>
            <h3 className="fw-bold mb-0 text-info">
              {records.filter(r => r.status === 'scheduled').length} Runs
            </h3>
          </div>
        </div>
      </div>

      {/* Maintenance Grid List */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-semibold text-dark">Maintenance Catalog</h5>
          <span className="badge bg-indigo-soft text-indigo px-3 py-2 rounded-pill fw-medium">
            Active Catalog
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary uppercase fs-7">
              <tr>
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="py-3">Type</th>
                <th className="py-3">Scheduled Date</th>
                <th className="py-3">Estimated Cost</th>
                <th className="py-3">Status</th>
                <th className="py-3">Reason / Details</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted mb-0">Loading maintenance log...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <i className="ti ti-tool fs-1 d-block mb-3 opacity-40"></i>
                    No vehicle maintenance operations recorded.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-md bg-light-soft text-indigo rounded d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                          <i className="ti ti-bus fs-4"></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-semibold text-dark">
                            {record.vehicle?.vehicleNumber || 'Unknown Vehicle'}
                          </h6>
                          <span className="text-muted fs-7">Model: {record.vehicle?.model || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-capitalize text-dark fw-medium">
                      <span className="badge bg-light text-secondary border px-3 py-1 text-capitalize fs-7">
                        {record.maintenanceType}
                      </span>
                    </td>
                    <td className="text-dark fw-medium">
                      {new Date(record.scheduledDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="fw-semibold text-dark">
                      ₹{(record.cost || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge px-3 py-1.5 rounded-pill fs-7 text-capitalize ${getStatusClass(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-secondary fs-7" style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.description || 'No description provided'}
                    </td>
                    <td className="px-4 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-icon btn-light-soft border-0 rounded-circle"
                          title="Edit"
                          onClick={() => openEditModal(record)}
                        >
                          <i className="ti ti-pencil text-secondary"></i>
                        </button>
                        <button
                          className="btn btn-icon btn-light-soft border-0 rounded-circle"
                          title="Delete"
                          onClick={() => handleDelete(record._id!)}
                        >
                          <i className="ti ti-trash text-danger"></i>
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

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Are you sure you want to delete this maintenance record?" />

      {/* Modern Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">{isEditing ? 'Edit Maintenance Run' : 'Schedule Maintenance Run'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Vehicle select */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Target Vehicle</label>
                      <select
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        required
                      >
                        <option value="">Select Bus / Vehicle...</option>
                        {vehicles.map(v => (
                          <option key={v._id} value={v._id}>
                            {v.vehicleNumber} - {v.model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Maintenance Type */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Job Type</label>
                      <select
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={maintenanceType}
                        onChange={(e) => setMaintenanceType(e.target.value as any)}
                      >
                        {types.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Scheduled Date */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Scheduled Date</label>
                      <input
                        type="date"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        required
                      />
                    </div>

                    {/* Cost */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Estimated / Actual Cost (₹)</label>
                      <input
                        type="number"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        required
                      />
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Status</label>
                      <select
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                      >
                        {statuses.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Job Description / Symptoms</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Engine oil replacement, air filters check and brake tightening"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light shadow-sm px-4 py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary shadow-sm px-4 py-2" style={{ borderRadius: '10px' }}>{isEditing ? 'Save Changes' : 'Schedule Run'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleMaintenancePage;
