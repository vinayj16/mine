import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface City {
  _id: string;
  name: string;
  stateId: {
    _id: string;
    name: string;
  };
  countryId: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

interface State {
  _id: string;
  name: string;
}

interface Country {
  _id: string;
  name: string;
}

const CitiesPage = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    stateId: '',
    countryId: '',
    status: 'active' as 'active' | 'inactive'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchCities();
    fetchStates();
    fetchCountries();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/location/cities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCities(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch cities');
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/location/states`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStates(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/location/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCountries(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching countries:', error);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCities(cities.map(city => city._id));
    } else {
      setSelectedCities([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.stateId || !formData.countryId) {
      toast.error('City name, state, and country are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (currentCity) {
        // Update existing city
        await axios.put(
          `${API_URL}/location/cities/${currentCity._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('City updated successfully');
        setShowEditModal(false);
      } else {
        // Create new city
        await axios.post(
          `${API_URL}/location/cities`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('City created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchCities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save city');
      console.error('Error saving city:', error);
    }
  };

  const handleDelete = async (cityId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/location/cities/${cityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('City deleted successfully');
      setShowDeleteModal(false);
      setCurrentCity(null);
      fetchCities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete city');
      console.error('Error deleting city:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedCities.map(id =>
          axios.delete(`${API_URL}/location/cities/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      toast.success(`${selectedCities.length} cities deleted successfully`);
      setSelectedCities([]);
      setShowDeleteModal(false);
      fetchCities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete cities');
      console.error('Error deleting cities:', error);
    }
  };

  const handleEdit = (city: City) => {
    setCurrentCity(city);
    setFormData({
      name: city.name,
      stateId: city.stateId?._id || '',
      countryId: city.countryId?._id || '',
      status: city.status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      stateId: '',
      countryId: '',
      status: 'active'
    });
    setCurrentCity(null);
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
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Cities</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Content</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Cities</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchCities}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add City
            </button>
          </div>
        </div>
      </div>

      {/* Cities List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Cities List</h4>
        </div>

        <div className="card-body p-0 py-3">
          {cities.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-building-community fs-1 text-muted mb-3"></i>
              <p className="text-muted">No cities found</p>
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
                          checked={selectedCities.length === cities.length && cities.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>City Name</th>
                    <th>State Name</th>
                    <th>Country Name</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((city) => (
                    <tr key={city._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={selectedCities.includes(city._id)}
                            onChange={() => {
                              if (selectedCities.includes(city._id)) {
                                setSelectedCities(selectedCities.filter(id => id !== city._id));
                              } else {
                                setSelectedCities([...selectedCities, city._id]);
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td>{city.name}</td>
                      <td>{city.stateId?.name || 'N/A'}</td>
                      <td>{city.countryId?.name || 'N/A'}</td>
                      <td>
                        <span 
                          className={`badge d-inline-flex align-items-center ${
                            city.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger'
                          }`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {city.status.charAt(0).toUpperCase() + city.status.slice(1)}
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
                                  onClick={() => handleEdit(city)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setCurrentCity(city);
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

      {/* Add City Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add City</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">City Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country Name</label>
                        <select 
                          className="form-select"
                          value={formData.countryId}
                          onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                          required
                        >
                          <option value="">Select</option>
                          {countries.map(country => (
                            <option key={country._id} value={country._id}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">State Name</label>
                        <select 
                          className="form-select"
                          value={formData.stateId}
                          onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                          required
                        >
                          <option value="">Select</option>
                          {states.map(state => (
                            <option key={state._id} value={state._id}>{state.name}</option>
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
                            checked={formData.status === 'active'}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              status: e.target.checked ? 'active' : 'inactive' 
                            })}
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
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add City</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit City Modal */}
      {showEditModal && currentCity && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit City</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">City Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country Name</label>
                        <select 
                          className="form-select"
                          value={formData.countryId}
                          onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                          required
                        >
                          <option value="">Select</option>
                          {countries.map(country => (
                            <option key={country._id} value={country._id}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">State Name</label>
                        <select 
                          className="form-select"
                          value={formData.stateId}
                          onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                          required
                        >
                          <option value="">Select</option>
                          {states.map(state => (
                            <option key={state._id} value={state._id}>{state.name}</option>
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
                            checked={formData.status === 'active'}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              status: e.target.checked ? 'active' : 'inactive' 
                            })}
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
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
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
                  {selectedCities.length > 1
                    ? `Are you sure you want to delete ${selectedCities.length} selected cities?`
                    : 'Are you sure you want to delete this city?'}
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
                      if (currentCity) {
                        handleDelete(currentCity._id);
                      } else if (selectedCities.length > 0) {
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
    </>
  );
};

export default CitiesPage;
