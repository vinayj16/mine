import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Sport {
  _id: string;
  sportId: string;
  name: string;
  category: 'Indoor' | 'Outdoor' | 'Water' | 'Combat' | 'Team' | 'Individual';
  description?: string;
  coach?: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  venue?: string;
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  maxParticipants: number;
  currentParticipants: number;
  equipment?: Array<{
    name: string;
    quantity: number;
    condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  }>;
  status: 'Active' | 'Inactive' | 'Seasonal';
  createdAt: string;
}

const SportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Team' as Sport['category'],
    description: '',
    venue: '',
    maxParticipants: 0,
    status: 'Active' as Sport['status']
  });

  const institutionId = '507f1f77bcf86cd799439011';

  const fetchSports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/sports', {
        params: { institution: institutionId }
      });

      if (response.data.success) {
        setSports(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching sports:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load sports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? Number(value) : value
    }));
  };

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Sport name is required');
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient.post('/sports', {
        ...formData,
        institution: institutionId,
        createdBy: 'current-user-id' // In production, get from auth context
      });

      if (response.data.success) {
        toast.success('Sport added successfully');
        setShowAddModal(false);
        setFormData({
          name: '',
          category: 'Team',
          description: '',
          venue: '',
          maxParticipants: 0,
          status: 'Active'
        });
        fetchSports();
      }
    } catch (err: any) {
      console.error('Error adding sport:', err);
      toast.error(err.response?.data?.message || 'Failed to add sport');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSport = (sport: Sport) => {
    setSelectedSport(sport);
    setFormData({
      name: sport.name,
      category: sport.category,
      description: sport.description || '',
      venue: sport.venue || '',
      maxParticipants: sport.maxParticipants,
      status: sport.status
    });
    setShowEditModal(true);
  };

  const handleUpdateSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport) return;

    try {
      setSaving(true);

      const response = await apiClient.put(`/sports/${selectedSport._id}`, formData);

      if (response.data.success) {
        toast.success('Sport updated successfully');
        setShowEditModal(false);
        setSelectedSport(null);
        setFormData({
          name: '',
          category: 'Team',
          description: '',
          venue: '',
          maxParticipants: 0,
          status: 'Active'
        });
        fetchSports();
      }
    } catch (err: any) {
      console.error('Error updating sport:', err);
      toast.error(err.response?.data?.message || 'Failed to update sport');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSport = async () => {
    if (!selectedSport) return;

    try {
      setSaving(true);

      const response = await apiClient.delete(`/sports/${selectedSport._id}`);

      if (response.data.success) {
        toast.success('Sport deleted successfully');
        setShowDeleteModal(false);
        setSelectedSport(null);
        fetchSports();
      }
    } catch (err: any) {
      console.error('Error deleting sport:', err);
      toast.error(err.response?.data?.message || 'Failed to delete sport');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading sports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">Sports</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item active">Sports</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading Sports</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button className="btn btn-outline-danger ms-3" onClick={fetchSports}>
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Sports</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Management</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Sports</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchSports}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Sport
            </button>
          </div>
        </div>
      </div>

      {/* Sports List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Sports ({sports.length})</h4>
        </div>
        
        <div className="card-body p-0 py-3">
          {sports.length > 0 ? (
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Venue</th>
                    <th>Participants</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sports.map((sport) => (
                    <tr key={sport._id}>
                      <td><a href="#!" className="link-primary">{sport.sportId}</a></td>
                      <td>{sport.name}</td>
                      <td>
                        <span className={`badge ${
                          sport.category === 'Team' ? 'bg-primary' :
                          sport.category === 'Individual' ? 'bg-info' :
                          sport.category === 'Outdoor' ? 'bg-success' :
                          sport.category === 'Indoor' ? 'bg-warning' :
                          'bg-secondary'
                        }`}>
                          {sport.category}
                        </span>
                      </td>
                      <td>{sport.venue || 'N/A'}</td>
                      <td>{sport.currentParticipants} / {sport.maxParticipants || 'Unlimited'}</td>
                      <td>
                        <span className={`badge ${
                          sport.status === 'Active' ? 'bg-success' :
                          sport.status === 'Seasonal' ? 'bg-warning' :
                          'bg-secondary'
                        }`}>
                          {sport.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  onClick={() => handleEditSport(sport)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedSport(sport);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="ti ti-trophy-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No sports found</p>
              <button 
                className="btn btn-primary mt-2"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus me-1"></i>Add First Sport
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Sport Modal */}
      {showAddModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Sport</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleAddSport}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Category <span className="text-danger">*</span></label>
                        <select 
                          className="form-select"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Team">Team</option>
                          <option value="Individual">Individual</option>
                          <option value="Indoor">Indoor</option>
                          <option value="Outdoor">Outdoor</option>
                          <option value="Water">Water</option>
                          <option value="Combat">Combat</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Venue</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="venue"
                          value={formData.venue}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Participants</label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="maxParticipants"
                          value={formData.maxParticipants}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Seasonal">Seasonal</option>
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Sport'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sport Modal */}
      {showEditModal && selectedSport && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Sport</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleUpdateSport}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Category <span className="text-danger">*</span></label>
                        <select 
                          className="form-select"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Team">Team</option>
                          <option value="Individual">Individual</option>
                          <option value="Indoor">Indoor</option>
                          <option value="Outdoor">Outdoor</option>
                          <option value="Water">Water</option>
                          <option value="Combat">Combat</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Venue</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="venue"
                          value={formData.venue}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Participants</label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="maxParticipants"
                          value={formData.maxParticipants}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Seasonal">Seasonal</option>
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSport && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete <strong>{selectedSport.name}</strong>? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteSport}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SportsPage;
