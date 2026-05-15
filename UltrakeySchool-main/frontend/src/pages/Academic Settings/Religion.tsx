import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { religionService } from '../../services/religionService';
import type { Religion as ReligionType } from '../../services/religionService';

const Religion: React.FC = () => {
  const [religions, setReligions] = useState<ReligionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReligion, setSelectedReligion] = useState<ReligionType | null>(null);

  const [newReligion, setNewReligion] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive',
    description: ''
  });

  useEffect(() => {
    fetchReligions();
  }, []);

  const fetchReligions = async () => {
    try {
      setLoading(true);
      const response = await religionService.getAll({ page: 1, limit: 100 });
      setReligions(response.data);
    } catch (error) {
      console.error('Error fetching religions:', error);
      toast.error('Failed to load religions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewReligion(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (selectedReligion) {
      setSelectedReligion({ ...selectedReligion, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await religionService.create(newReligion);
      toast.success('Religion created successfully');

      setShowAddModal(false);
      resetForm();
      fetchReligions();
    } catch (error) {
      console.error('Error creating religion:', error);
      toast.error('Failed to create religion');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReligion) return;
    try {
      await religionService.update(selectedReligion.id, {
        name: selectedReligion.name,
        status: selectedReligion.status,
        description: selectedReligion.description
      });
      toast.success('Religion updated successfully');
      setShowEditModal(false);
      setSelectedReligion(null);
      fetchReligions();
    } catch (error) {
      console.error('Error updating religion:', error);
      toast.error('Failed to update religion');
    }
  };

  const handleDelete = async () => {
    if (!selectedReligion) return;
    try {
      await religionService.delete(selectedReligion.id);
      toast.success('Religion deleted successfully');
      setShowDeleteModal(false);
      setSelectedReligion(null);
      fetchReligions();
    } catch (error) {
      console.error('Error deleting religion:', error);
      toast.error('Failed to delete religion');
    }
  };

  const handleStatusToggle = async (religion: ReligionType) => {
    try {
      const newStatus = religion.status === 'active' ? 'inactive' : 'active';
      await religionService.updateStatus(religion.id, newStatus);
      toast.success('Status updated successfully');
      fetchReligions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setNewReligion({ name: '', status: 'active', description: '' });
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Academic Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="#">Settings</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Academic Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon" onClick={fetchReligions} title="Refresh">
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <Link to="/school-settings" className="d-block rounded p-2">School Settings</Link>
            <Link to="/religion" className="d-block rounded active p-2">Religion</Link>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
              <div className="mb-3">
                <h5 className="mb-1">Religion</h5>
                <p>Religion Settings Configuration</p>
              </div>
              <div className="mb-3">
                <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={() => setShowAddModal(true)}>
                  <i className="ti ti-plus"></i>
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="d-md-flex">
                <div className="row flex-fill">
                  {religions.length > 0 ? (
                    religions.map((religion) => (
                      <div key={religion.id} className="col-xxl-4 col-md-6">
                        <div className="d-flex align-items-center justify-content-between bg-white p-3 border rounded mb-3">
                          <h5 className="fs-15 fw-normal">{religion.name}</h5>
                          <div className="d-flex align-items-center">
                            <div className="status-toggle modal-status">
                              <input 
                                type="checkbox" 
                                id={`religion-${religion.id}`} 
                                className="check" 
                                checked={religion.status === 'active'}
                                onChange={() => handleStatusToggle(religion)}
                              />
                              <label htmlFor={`religion-${religion.id}`} className="checktoggle"></label>
                            </div>
                            <div className="d-flex align-items-center ms-3">
                              <button type="button" className="btn btn-link p-0 me-2" onClick={() => { setSelectedReligion(religion); setShowEditModal(true); }}>
                                <i className="ti ti-edit"></i>
                              </button>
                              <button type="button" className="btn btn-link p-0" onClick={() => { setSelectedReligion(religion); setShowDeleteModal(true); }}>
                                <i className="ti ti-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <p className="text-center text-muted py-4">No religions found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Religion</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowAddModal(false); resetForm(); }} aria-label="Close">
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Religion Name</label>
                    <input type="text" className="form-control" name="name" value={newReligion.name} onChange={handleInputChange} placeholder="e.g., Hindu, Christian, Islam" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={newReligion.status} onChange={handleInputChange} required>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} name="description" value={newReligion.description} onChange={handleInputChange} placeholder="Optional description"></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Religion</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedReligion && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Religion</h4>
                <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowEditModal(false); setSelectedReligion(null); }} aria-label="Close">
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Religion Name</label>
                    <input type="text" className="form-control" name="name" value={selectedReligion.name} onChange={handleEditInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={selectedReligion.status} onChange={handleEditInputChange} required>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} name="description" value={selectedReligion.description || ''} onChange={handleEditInputChange}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => { setShowEditModal(false); setSelectedReligion(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedReligion && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="delete-icon"><i className="ti ti-trash-x"></i></div>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete {selectedReligion.name}? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button className="btn btn-light me-3" onClick={() => { setShowDeleteModal(false); setSelectedReligion(null); }}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Religion;
