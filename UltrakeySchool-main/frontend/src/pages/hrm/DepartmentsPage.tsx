import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Department {
  _id: string;
  departmentId: string;
  name: string;
  code: string;
  head?: string;
  description?: string;
  budget?: number;
  employeeCount: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

const DepartmentsPage: React.FC = () => {
  // State management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection states
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    head: '',
    description: '',
    budget: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch departments from backend
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/departments');
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.response?.data?.message || 'Failed to load departments');
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDepartments();
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

  // Handle add department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        head: formData.head || undefined,
        description: formData.description || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        status: formData.status
      };

      await apiClient.post('/hrm/departments', payload);
      toast.success('Department added successfully');
      setShowAddModal(false);
      setFormData({
        name: '',
        code: '',
        head: '',
        description: '',
        budget: '',
        status: 'active'
      });
      fetchDepartments();
    } catch (err: any) {
      console.error('Error adding department:', err);
      toast.error(err.response?.data?.message || 'Failed to add department');
    }
  };

  // Handle edit department
  const handleEditDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      head: dept.head || '',
      description: dept.description || '',
      budget: dept.budget?.toString() || '',
      status: dept.status
    });
    setShowEditModal(true);
  };

  // Handle update department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        head: formData.head || undefined,
        description: formData.description || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        status: formData.status
      };

      await apiClient.put(`/hrm/departments/${selectedDepartment._id}`, payload);
      toast.success('Department updated successfully');
      setShowEditModal(false);
      setSelectedDepartment(null);
      setFormData({
        name: '',
        code: '',
        head: '',
        description: '',
        budget: '',
        status: 'active'
      });
      fetchDepartments();
    } catch (err: any) {
      console.error('Error updating department:', err);
      toast.error(err.response?.data?.message || 'Failed to update department');
    }
  };

  // Handle delete department
  const handleDelete = async () => {
    try {
      if (selectedDepartments.length > 0) {
        // Bulk delete
        await Promise.all(
          selectedDepartments.map(id => apiClient.delete(`/hrm/departments/${id}`))
        );
        toast.success(`${selectedDepartments.length} department(s) deleted successfully`);
        setSelectedDepartments([]);
        setSelectAll(false);
      } else if (selectedDepartment) {
        // Single delete
        await apiClient.delete(`/hrm/departments/${selectedDepartment._id}`);
        toast.success('Department deleted successfully');
        setSelectedDepartment(null);
      }
      setShowDeleteModal(false);
      fetchDepartments();
    } catch (err: any) {
      console.error('Error deleting department:', err);
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedDepartments(departments.map(dept => dept._id));
    } else {
      setSelectedDepartments([]);
    }
  };

  // Toggle department selection
  const toggleDepartmentSelection = (id: string) => {
    if (selectedDepartments.includes(id)) {
      setSelectedDepartments(selectedDepartments.filter(deptId => deptId !== id));
    } else {
      setSelectedDepartments([...selectedDepartments, id]);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Department</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/hrm">HRM</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Department</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchDepartments}
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
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Department
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Department List</h4>
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
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
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
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
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
                    Recently Viewed
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
              <p className="mt-2 text-muted">Loading departments...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button 
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchDepartments}
              >
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && departments.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-building" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No departments found</p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus me-1"></i>Add First Department
              </button>
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && departments.length > 0 && (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Head</th>
                    <th>Employees</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept._id}>
                      <td>
                        <div className="form-check">
                          <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={selectedDepartments.includes(dept._id)}
                            onChange={() => toggleDepartmentSelection(dept._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <a href="#!" className="link-primary" onClick={(e) => e.preventDefault()}>
                          {dept.departmentId}
                        </a>
                      </td>
                      <td>{dept.name}</td>
                      <td><span className="badge badge-soft-info">{dept.code}</span></td>
                      <td>{dept.head || '-'}</td>
                      <td>
                        <span className="badge badge-soft-primary">
                          {dept.employeeCount} {dept.employeeCount === 1 ? 'employee' : 'employees'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-soft-${dept.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {dept.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
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
                                onClick={() => handleEditDepartment(dept)}
                              >
                                <i className="ti ti-edit-circle me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger rounded-1"
                                onClick={() => {
                                  setSelectedDepartment(dept);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="ti ti-trash-x me-2"></i>Delete
                              </button>
                            </li>
                          </ul>
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

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Department</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddDepartment}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter Department Name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department Code <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="Enter Department Code (e.g., ADMIN, FIN)"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department Head</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="head"
                          value={formData.head}
                          onChange={handleInputChange}
                          placeholder="Enter Department Head Name"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter Department Description"
                          rows={3}
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Budget</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          placeholder="Enter Budget Amount"
                          min="0"
                          step="0.01"
                        />
                      </div>
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
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Department</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Department</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateDepartment}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter Department Name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department Code <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="Enter Department Code"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department Head</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="head"
                          value={formData.head}
                          onChange={handleInputChange}
                          placeholder="Enter Department Head Name"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter Department Description"
                          rows={3}
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Budget</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          placeholder="Enter Budget Amount"
                          min="0"
                          step="0.01"
                        />
                      </div>
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
              <div className="modal-body text-center">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Deletion</h4>
                <p className="mb-4">
                  {selectedDepartments.length > 0 
                    ? `You want to delete ${selectedDepartments.length} selected department(s). This can't be undone.`
                    : 'Are you sure you want to delete this department? This action cannot be undone.'
                  }
                </p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
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

export default DepartmentsPage;
