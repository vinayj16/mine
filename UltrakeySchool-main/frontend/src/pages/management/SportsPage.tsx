import { useState, useEffect } from 'react';
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
    email: string;
  };
  venue?: string;
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  maxParticipants: number;
  currentParticipants: number;
  status: 'Active' | 'Inactive' | 'Seasonal';
}

const SportsPage: React.FC = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Team',
    description: '',
    venue: '',
    maxParticipants: '0',
    status: 'Active'
  });

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/sports');
      
      if (response.data.success) {
        setSports(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching sports:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch sports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Team',
      description: '',
      venue: '',
      maxParticipants: '0',
      status: 'Active'
    });
  };

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sportData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants)
      };

      const response = await apiClient.post('/sports', sportData);
      
      if (response.data.success) {
        toast.success('Sport added successfully');
        setShowAddModal(false);
        resetForm();
        fetchSports();
      }
    } catch (error: any) {
      console.error('Error adding sport:', error);
      toast.error(error.response?.data?.message || 'Failed to add sport');
    }
  };

  const handleEditSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport) return;

    try {
      const sportData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants)
      };

      const response = await apiClient.put(`/sports/${selectedSport._id}`, sportData);
      
      if (response.data.success) {
        toast.success('Sport updated successfully');
        setShowEditModal(false);
        setSelectedSport(null);
        resetForm();
        fetchSports();
      }
    } catch (error: any) {
      console.error('Error updating sport:', error);
      toast.error(error.response?.data?.message || 'Failed to update sport');
    }
  };

  const handleDeleteSport = async () => {
    if (!selectedSport) return;

    try {
      const response = await apiClient.delete(`/sports/${selectedSport._id}`);
      
      if (response.data.success) {
        toast.success('Sport deleted successfully');
        setShowDeleteModal(false);
        setSelectedSport(null);
        fetchSports();
      }
    } catch (error: any) {
      console.error('Error deleting sport:', error);
      toast.error(error.response?.data?.message || 'Failed to delete sport');
    }
  };

  const openEditModal = (sport: Sport) => {
    setSelectedSport(sport);
    setFormData({
      name: sport.name,
      category: sport.category,
      description: sport.description || '',
      venue: sport.venue || '',
      maxParticipants: sport.maxParticipants.toString(),
      status: sport.status
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Inactive':
        return 'bg-secondary';
      case 'Seasonal':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Indoor':
        return 'bg-primary';
      case 'Outdoor':
        return 'bg-success';
      case 'Water':
        return 'bg-info';
      case 'Combat':
        return 'bg-danger';
      case 'Team':
        return 'bg-warning';
      case 'Individual':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
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
          <h4 className="mb-3">Error Loading Sports</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchSports}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Sports Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item">Management</li>
              <li className="breadcrumb-item active">Sports</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchSports} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-plus me-2"></i>Add Sport
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Sports List</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Sport ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Venue</th>
                  <th>Coach</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <p className="text-muted mb-0">No sports found</p>
                    </td>
                  </tr>
                ) : (
                  sports.map((sport) => (
                    <tr key={sport._id}>
                      <td>{sport.sportId}</td>
                      <td className="fw-medium">{sport.name}</td>
                      <td>
                        <span className={`badge ${getCategoryBadge(sport.category)}`}>
                          {sport.category}
                        </span>
                      </td>
                      <td>{sport.venue || 'N/A'}</td>
                      <td>{sport.coach?.name || 'Not Assigned'}</td>
                      <td>
                        {sport.currentParticipants} / {sport.maxParticipants}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(sport.status)}`}>
                          {sport.status}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <button className="dropdown-item rounded-1" onClick={() => openEditModal(sport)}>
                                <i className="ti ti-edit me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger rounded-1" 
                                onClick={() => {
                                  setSelectedSport(sport);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="ti ti-trash me-2"></i>Delete
                              </button>
                            </li>
                          </ul>
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


      {/* Add Sport Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleAddSport}>
                <div className="modal-header">
                  <h4 className="modal-title">Add Sport</h4>
                  <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sport Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category <span className="text-danger">*</span></label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="Team">Team</option>
                        <option value="Individual">Individual</option>
                        <option value="Indoor">Indoor</option>
                        <option value="Outdoor">Outdoor</option>
                        <option value="Water">Water</option>
                        <option value="Combat">Combat</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Venue</label>
                      <input type="text" className="form-control" name="venue" value={formData.venue} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Max Participants</label>
                      <input type="number" className="form-control" name="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} min="0" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Seasonal">Seasonal</option>
                      </select>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows={3}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Sport</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sport Modal */}
      {showEditModal && selectedSport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleEditSport}>
                <div className="modal-header">
                  <h4 className="modal-title">Edit Sport</h4>
                  <button type="button" className="btn-close" onClick={() => { setShowEditModal(false); setSelectedSport(null); resetForm(); }}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sport Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category <span className="text-danger">*</span></label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="Team">Team</option>
                        <option value="Individual">Individual</option>
                        <option value="Indoor">Indoor</option>
                        <option value="Outdoor">Outdoor</option>
                        <option value="Water">Water</option>
                        <option value="Combat">Combat</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Venue</label>
                      <input type="text" className="form-control" name="venue" value={formData.venue} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Max Participants</label>
                      <input type="number" className="form-control" name="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} min="0" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Seasonal">Seasonal</option>
                      </select>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows={3}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => { setShowEditModal(false); setSelectedSport(null); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Deletion</h4>
                <p className="mb-4">Are you sure you want to delete "{selectedSport.name}"? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button type="button" className="btn btn-light me-3" onClick={() => { setShowDeleteModal(false); setSelectedSport(null); }}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteSport}>Yes, Delete</button>
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
