import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Hostel {
  _id: string;
  hostelId: string;
  name: string;
  type: string;
  address: string;
  intake: number;
  description: string;
}

const HostelListPage: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Boys',
    address: '',
    intake: '',
    description: ''
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hostel/hostels');
      if (response.data.success) {
        setHostels(response.data.data?.hostels || response.data.data || []);
      } else {
        setError(response.data.error?.message || response.data.message || 'Failed to load hostels');
      }
    } catch (err: any) {
      console.error('Error fetching hostels:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/hostel/hostels', {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        intake: parseInt(formData.intake),
        description: formData.description
      });
      if (response.data.success) {
        fetchHostels();
        setShowAddModal(false);
        setFormData({ name: '', type: 'Boys', address: '', intake: '', description: '' });
      }
    } catch (err) {
      console.error('Error adding hostel:', err);
    }
  };

  const handleEditHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel) return;
    try {
      const response = await apiClient.put(`/hostel/hostels/${selectedHostel._id}`, formData);
      if (response.data.success) {
        fetchHostels();
        setShowEditModal(false);
        setSelectedHostel(null);
      }
    } catch (err) {
      console.error('Error updating hostel:', err);
    }
  };

  const handleDeleteHostel = async () => {
    if (!selectedHostel) return;
    try {
      const response = await apiClient.delete(`/hostel/hostels/${selectedHostel._id}`);
      if (response.data.success) {
        fetchHostels();
        setShowDeleteModal(false);
        setSelectedHostel(null);
      }
    } catch (err) {
      console.error('Error deleting hostel:', err);
    }
  };

  const openEditModal = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    setFormData({
      name: hostel.name,
      type: hostel.type,
      address: hostel.address,
      intake: hostel.intake.toString(),
      description: hostel.description
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

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Hostel</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item">Management</li>
              <li className="breadcrumb-item active">Hostel</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={fetchHostels} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary d-flex align-items-center" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-square-rounded-plus me-2"></i>Add Hostel
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body p-0 py-3">
          <div className="table-responsive">
            <table className="table datatable">
              <thead className="thead-light">
                <tr>
                  <th>ID</th>
                  <th>Hostel Name</th>
                  <th>Type</th>
                  <th>Address</th>
                  <th>Intake</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hostels.length > 0 ? hostels.map((hostel) => (
                  <tr key={hostel._id || hostel.hostelId}>
                    <td>{hostel.hostelId || hostel._id}</td>
                    <td>{hostel.name}</td>
                    <td>{hostel.type}</td>
                    <td>{hostel.address}</td>
                    <td>{hostel.intake}</td>
                    <td>{hostel.description}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-primary" onClick={() => openEditModal(hostel)}>
                          <i className="ti ti-edit" />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => { setSelectedHostel(hostel); setShowDeleteModal(true); }}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="text-center">No hostels found. Add one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Hostel</h4>
                <button className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddHostel}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Hostel Name</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Intake</label>
                    <input type="number" className="form-control" value={formData.intake} onChange={e => setFormData({...formData, intake: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input type="text" className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Hostel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedHostel && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Hostel</h4>
                <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditHostel}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Hostel Name</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Intake</label>
                    <input type="number" className="form-control" value={formData.intake} onChange={e => setFormData({...formData, intake: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input type="text" className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <span className="delete-icon mb-3 d-inline-block"><i className="ti ti-trash-x fs-48 text-danger"></i></span>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this hostel?</p>
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-light" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDeleteHostel}>Yes, Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostelListPage;