import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Holiday {
  _id: string;
  holidayId: string;
  title: string;
  date: string;
  description?: string;
  type: 'national' | 'religious' | 'school' | 'other';
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

const HolidaysPage: React.FC = () => {
  // State management
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectAll, setSelectAll] = useState(false);
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    type: 'school' as 'national' | 'religious' | 'school' | 'other',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch holidays from backend
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/holidays');
      if (response.data.success) {
        setHolidays(response.data.data.holidays || []);
      }
    } catch (err: any) {
      console.error('Error fetching holidays:', err);
      setError(err.response?.data?.message || 'Failed to load holidays');
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle status toggle
  const handleStatusToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      status: checked ? 'active' : 'inactive'
    }));
  };

  // Handle add holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post('/hrm/holidays', formData);
      toast.success('Holiday added successfully');
      setShowAddModal(false);
      setFormData({
        title: '',
        date: '',
        description: '',
        type: 'school',
        status: 'active'
      });
      fetchHolidays();
    } catch (err: any) {
      console.error('Error adding holiday:', err);
      toast.error(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  // Handle edit holiday
  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      title: holiday.title,
      date: holiday.date.split('T')[0], // Format date for input
      description: holiday.description || '',
      type: holiday.type,
      status: holiday.status
    });
    setShowEditModal(true);
  };

  // Handle update holiday
  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHoliday) return;

    if (!formData.title.trim() || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.put(`/hrm/holidays/${selectedHoliday._id}`, formData);
      toast.success('Holiday updated successfully');
      setShowEditModal(false);
      setSelectedHoliday(null);
      setFormData({
        title: '',
        date: '',
        description: '',
        type: 'school',
        status: 'active'
      });
      fetchHolidays();
    } catch (err: any) {
      console.error('Error updating holiday:', err);
      toast.error(err.response?.data?.message || 'Failed to update holiday');
    }
  };

  // Handle delete holiday
  const handleDelete = async () => {
    try {
      if (selectedHolidays.length > 0) {
        // Bulk delete
        await Promise.all(
          selectedHolidays.map(id => apiClient.delete(`/hrm/holidays/${id}`))
        );
        toast.success(`${selectedHolidays.length} holiday(s) deleted successfully`);
        setSelectedHolidays([]);
        setSelectAll(false);
      } else if (selectedHoliday) {
        // Single delete
        await apiClient.delete(`/hrm/holidays/${selectedHoliday._id}`);
        toast.success('Holiday deleted successfully');
        setSelectedHoliday(null);
      }
      setShowDeleteModal(false);
      fetchHolidays();
    } catch (err: any) {
      console.error('Error deleting holiday:', err);
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedHolidays(holidays.map(holiday => holiday._id));
    } else {
      setSelectedHolidays([]);
    }
  };

  // Toggle holiday selection
  const toggleHolidaySelection = (id: string) => {
    if (selectedHolidays.includes(id)) {
      setSelectedHolidays(selectedHolidays.filter(holidayId => holidayId !== id));
    } else {
      setSelectedHolidays([...selectedHolidays, id]);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'badge-soft-success' : 'badge-soft-danger';
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Holidays</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/hrm">HRM</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Holidays</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchHolidays}
              title="Refresh"
              disabled={loading}
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
                <a href="#!" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </a>
              </li>
              <li>
                <a href="#!" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </a>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Holiday
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Holidays List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input
                type="text"
                className="form-control date-range bookingrange"
                placeholder="Select"
                value="Academic Year : 2024 / 2025"
                readOnly
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <button
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Type</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>National</option>
                            <option>Religious</option>
                            <option>School</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-0">
                          <label className="form-label">Status</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="dropdown mb-3">
              <button
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by Date
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button className="dropdown-item rounded-1 active">
                    Ascending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Descending
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    Recently Added
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading holidays...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchHolidays}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && holidays.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-calendar-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No holidays found</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus me-1"></i>Add First Holiday
              </button>
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && holidays.length > 0 && (
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Holiday Title</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday) => (
                    <tr key={holiday._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedHolidays.includes(holiday._id)}
                            onChange={() => toggleHolidaySelection(holiday._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <a href="#!" className="link-primary" onClick={(e) => e.preventDefault()}>
                          {holiday.holidayId}
                        </a>
                      </td>
                      <td>{holiday.title}</td>
                      <td>{formatDate(holiday.date)}</td>
                      <td>
                        <span className="badge badge-soft-info">
                          {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={holiday.description}>
                          {holiday.description || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(holiday.status)} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {holiday.status.charAt(0).toUpperCase() + holiday.status.slice(1)}
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
                                  onClick={() => handleEditHoliday(holiday)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedHoliday(holiday);
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

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Holiday</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddHoliday}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Holiday Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter Holiday Title"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="school">School</option>
                          <option value="national">National</option>
                          <option value="religious">Religious</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          rows={4}
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter Description"
                        ></textarea>
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
                            checked={formData.status === 'active'}
                            onChange={(e) => handleStatusToggle(e.target.checked)}
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
                  <button type="submit" className="btn btn-primary">Add Holiday</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditModal && selectedHoliday && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Holiday</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateHoliday}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Holiday Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter Holiday Title"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="school">School</option>
                          <option value="national">National</option>
                          <option value="religious">Religious</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          rows={4}
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter Description"
                        ></textarea>
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
                            checked={formData.status === 'active'}
                            onChange={(e) => handleStatusToggle(e.target.checked)}
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  {selectedHolidays.length > 0
                    ? `You want to delete ${selectedHolidays.length} selected holiday(s). This can't be undone once you delete.`
                    : 'Are you sure you want to delete this holiday? This action cannot be undone.'}
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn btn-light me-3"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    Yes, Delete
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

export default HolidaysPage;
