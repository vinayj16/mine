import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Country {
  _id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const CountriesPage = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'active' as 'active' | 'inactive'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/location/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCountries(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch countries');
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCountries(countries.map(country => country._id));
    } else {
      setSelectedCountries([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Country name and code are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (currentCountry) {
        // Update existing country
        await axios.put(
          `${API_URL}/location/countries/${currentCountry._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Country updated successfully');
        setShowEditModal(false);
      } else {
        // Create new country
        await axios.post(
          `${API_URL}/location/countries`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Country created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchCountries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save country');
      console.error('Error saving country:', error);
    }
  };

  const handleDelete = async (countryId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/location/countries/${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Country deleted successfully');
      setShowDeleteModal(false);
      setCurrentCountry(null);
      fetchCountries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete country');
      console.error('Error deleting country:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedCountries.map(id =>
          axios.delete(`${API_URL}/location/countries/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      toast.success(`${selectedCountries.length} countries deleted successfully`);
      setSelectedCountries([]);
      setShowDeleteModal(false);
      fetchCountries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete countries');
      console.error('Error deleting countries:', error);
    }
  };

  const handleEdit = (country: Country) => {
    setCurrentCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      status: country.status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      status: 'active'
    });
    setCurrentCountry(null);
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
          <h3 className="page-title mb-1">Countries</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Content</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Countries</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchCountries}
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
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Country
            </button>
          </div>
        </div>
      </div>

      {/* Country List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Country List</h4>
        </div>

        <div className="card-body p-0 py-3">
          {countries.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-world-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No countries found</p>
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
                          checked={selectedCountries.length === countries.length && countries.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Country Name</th>
                    <th>Country Code</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country) => (
                    <tr key={country._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={selectedCountries.includes(country._id)}
                            onChange={() => {
                              if (selectedCountries.includes(country._id)) {
                                setSelectedCountries(selectedCountries.filter(id => id !== country._id));
                              } else {
                                setSelectedCountries([...selectedCountries, country._id]);
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td>{country.name}</td>
                      <td>{country.code}</td>
                      <td>
                        <span 
                          className={`badge d-inline-flex align-items-center ${
                            country.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger'
                          }`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {country.status.charAt(0).toUpperCase() + country.status.slice(1)}
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
                                  onClick={() => handleEdit(country)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setCurrentCountry(country);
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

      {/* Add Country Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Country</h4>
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
                        <label className="form-label">Country Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country Code</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          maxLength={3}
                          required 
                        />
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
                  <button type="submit" className="btn btn-primary">Add Country</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Country Modal */}
      {showEditModal && currentCountry && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Country</h4>
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
                        <label className="form-label">Country Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Country Code</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          maxLength={3}
                          required 
                        />
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
                  {selectedCountries.length > 1
                    ? `Are you sure you want to delete ${selectedCountries.length} selected countries?`
                    : 'Are you sure you want to delete this country?'}
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
                      if (currentCountry) {
                        handleDelete(currentCountry._id);
                      } else if (selectedCountries.length > 0) {
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

export default CountriesPage;
