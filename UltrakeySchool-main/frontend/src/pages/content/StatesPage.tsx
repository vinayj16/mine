import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface State {
  _id: string;
  name: string;
  countryId: string;
  countryName?: string;
  isActive: boolean;
  createdAt?: string;
}

interface Country {
  _id: string;
  name: string;
}

const StatesPage = () => {
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentState, setCurrentState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    countryId: '',
    isActive: true
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchStates();
    fetchCountries();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/v1/location/states`);
      setStates(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/location/countries`);
      setCountries(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch countries');
    }
  };

  const handleAddState = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/v1/location/states`, formData);
      toast.success('State added successfully');
      setShowAddModal(false);
      setFormData({ name: '', countryId: '', isActive: true });
      fetchStates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add state');
    }
  };

  const handleUpdateState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentState) return;
    
    try {
      await axios.put(`${API_URL}/api/v1/location/states/${currentState._id}`, formData);
      toast.success('State updated successfully');
      setShowEditModal(false);
      setCurrentState(null);
      fetchStates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update state');
    }
  };

  const handleDelete = async (stateId: string) => {
    try {
      await axios.delete(`${API_URL}/api/v1/location/states/${stateId}`);
      toast.success('State deleted successfully');
      setShowDeleteModal(false);
      setCurrentState(null);
      fetchStates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete state');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedStates.map(id => axios.delete(`${API_URL}/api/v1/location/states/${id}`))
      );
      toast.success(`${selectedStates.length} states deleted successfully`);
      setSelectedStates([]);
      setShowDeleteModal(false);
      fetchStates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete states');
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStates(states.map(state => state._id));
    } else {
      setSelectedStates([]);
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', countryId: '', isActive: true });
    setShowAddModal(true);
  };

  const openEditModal = (state: State) => {
    setCurrentState(state);
    setFormData({
      name: state.name,
      countryId: state.countryId,
      isActive: state.isActive
    });
    setShowEditModal(true);
  };

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">States</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Content</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">States</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchStates}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary"
              onClick={openAddModal}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>
              Add State
            </button>
          </div>
        </div>
      </div>

      {/* States List Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">States List</h4>
          {selectedStates.length > 0 && (
            <button
              className="btn btn-danger mb-3"
              onClick={() => setShowDeleteModal(true)}
            >
              <i className="ti ti-trash me-2"></i>
              Delete Selected ({selectedStates.length})
            </button>
          )}
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : states.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-map-pin fs-1 text-muted mb-3"></i>
              <p className="text-muted">No states found. Add your first state to get started.</p>
            </div>
          ) : (
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="select-all"
                          checked={selectedStates.length === states.length && states.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>State Name</th>
                    <th>Country Name</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((state) => (
                    <tr key={state._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedStates.includes(state._id)}
                            onChange={() => {
                              if (selectedStates.includes(state._id)) {
                                setSelectedStates(selectedStates.filter(id => id !== state._id));
                              } else {
                                setSelectedStates([...selectedStates, state._id]);
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td>{state.name}</td>
                      <td>{state.countryName || 'N/A'}</td>
                      <td>
                        <span
                          className={`badge d-inline-flex align-items-center ${
                            state.isActive ? 'badge-soft-success' : 'badge-soft-danger'
                          }`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {state.isActive ? 'Active' : 'Inactive'}
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
                                  onClick={() => openEditModal(state)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setCurrentState(state);
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
          )}
        </div>
      </div>

      {/* Add State Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add State</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddState}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">State Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <select 
                          className="form-select"
                          value={formData.countryId}
                          onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                          required
                        >
                          <option value="">Select Country</option>
                          {countries.map(country => (
                            <option key={country._id} value={country._id}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch"
                            id="statusSwitch"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add State</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit State Modal */}
      {showEditModal && currentState && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit State</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateState}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">State Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <select 
                          className="form-select"
                          value={formData.countryId}
                          onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                          required
                        >
                          <option value="">Select Country</option>
                          {countries.map(country => (
                            <option key={country._id} value={country._id}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch"
                            id="statusSwitchEdit"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p>
                  {selectedStates.length > 1
                    ? `Are you sure you want to delete ${selectedStates.length} selected states?`
                    : 'Are you sure you want to delete this state?'}
                </p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button 
                    className="btn btn-light"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      if (currentState) {
                        handleDelete(currentState._id);
                      } else if (selectedStates.length > 0) {
                        handleDeleteSelected();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatesPage;
