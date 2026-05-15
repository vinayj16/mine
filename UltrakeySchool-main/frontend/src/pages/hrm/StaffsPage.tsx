import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Staff {
  _id: string;
  employeeId?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  status?: string;
}

const StaffsPage = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStaffs, setSelectedStaffs] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hrm/staff');
      
      if (response.data.success) {
        setStaffs(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch staff members';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedStaffs(staffs.map(staff => staff._id));
    } else {
      setSelectedStaffs([]);
    }
  };

  const toggleStaffSelection = (id: string) => {
    if (selectedStaffs.includes(id)) {
      setSelectedStaffs(selectedStaffs.filter(staffId => staffId !== id));
    } else {
      setSelectedStaffs([...selectedStaffs, id]);
    }
  };

  const handleDeleteClick = (id?: string) => {
    if (id) {
      setDeleteTarget(id);
    } else {
      setDeleteTarget(null);
    }
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const idsToDelete = deleteTarget ? [deleteTarget] : selectedStaffs;
      
      if (idsToDelete.length === 0) {
        toast.warning('No staff members selected');
        return;
      }

      // Delete each selected staff
      for (const id of idsToDelete) {
        await apiClient.delete(`/hrm/staff/${id}`);
      }

      toast.success(`Successfully deleted ${idsToDelete.length} staff member(s)`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setSelectedStaffs([]);
      setSelectAll(false);
      fetchStaffs();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast.error(error.response?.data?.message || 'Failed to delete staff member(s)');
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h4 className="mb-3">Error Loading Staff</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchStaffs}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Staffs</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">HRM</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Staffs</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1" 
                data-bs-toggle="tooltip" 
                title="Refresh"
                onClick={fetchStaffs}
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button className="btn btn-outline-light bg-white btn-icon me-1" data-bs-toggle="tooltip" title="Print">
                <i className="ti ti-printer"></i>
              </button>
            </div>    
            <div className="dropdown me-2 mb-2">
              <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
                <i className="ti ti-file-export me-2"></i>Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </a>
                </li>
              </ul>
            </div>                  
            <div className="mb-2">
              <Link to="/add-staff" className="btn btn-primary d-flex align-items-center">
                <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Staff
              </Link>
            </div>
          </div>
        </div>
        {/* /Page Header */}

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Staff List</h4>
            <div className="d-flex align-items-center flex-wrap">       
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input type="text" className="form-control date-range bookingrange" placeholder="Select" value="Academic Year : 2024 / 2025" readOnly />
              </div>
              
              {/* Filter Dropdown */}
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
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Name</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Kevin</option>
                              <option>Jacquelin</option>
                              <option>Edward</option>
                              <option>Elizabeth</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Department</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Admin</option>
                              <option>Management</option>
                              <option>Finance</option>
                              <option>Transport</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-0">
                            <label className="form-label">Designation</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Technical Head</option>
                              <option>Receptionist</option>
                              <option>Admin</option>
                              <option>Accounts Manager</option>
                              <option>Driver</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-0">
                            <label className="form-label">More Filter</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>ID</option>
                              <option>Name</option>
                              <option>Department</option>
                              <option>Designation</option>
                              <option>Phone</option>
                              <option>Email</option>
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
              
              {/* Sort Dropdown */}
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
            {/* Staff List Table */}
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
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Date of Join</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        <p className="text-muted mb-0">No staff members found</p>
                      </td>
                    </tr>
                  ) : (
                    staffs.map((staff) => (
                      <tr key={staff._id}>
                        <td>
                          <div className="form-check">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              checked={selectedStaffs.includes(staff._id)}
                              onChange={() => toggleStaffSelection(staff._id)}
                            />
                          </div>
                        </td>
                        <td>
                          <Link to={`/staff-details/${staff._id}`} className="link-primary">
                            {staff.employeeId || staff._id.slice(-6)}
                          </Link>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Link to={`/staff-details/${staff._id}`} className="avatar avatar-md me-2">
                              {staff.avatar ? (
                                <img 
                                  src={staff.avatar} 
                                  className="img-fluid rounded-circle" 
                                  alt={staff.name} 
                                />
                              ) : (
                                <div className="avatar-title bg-primary rounded-circle">
                                  {staff.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </Link>
                            <div>
                              <Link to={`/staff-details/${staff._id}`} className="text-dark fw-medium">
                                {staff.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td>{staff.department || 'N/A'}</td>
                        <td>{staff.designation || 'N/A'}</td>
                        <td>{staff.phone || 'N/A'}</td>
                        <td>{staff.email}</td>
                        <td>{formatDate(staff.joiningDate)}</td>
                        <td>
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-icon" 
                              type="button" 
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <Link 
                                  to={`/staff-details/${staff._id}`}
                                  className="dropdown-item rounded-1"
                                >
                                  <i className="ti ti-menu me-2"></i>View Staff
                                </Link>
                              </li>
                              <li>
                                <Link 
                                  to={`/edit-staff/${staff._id}`}
                                  className="dropdown-item rounded-1"
                                >
                                  <i className="ti ti-edit me-2"></i>Edit
                                </Link>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item text-danger rounded-1"
                                  onClick={() => handleDeleteClick(staff._id)}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
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
            {/* /Staff List Table */}
          </div>
        </div>


      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Deletion</h4>
                <p className="mb-4">
                  {deleteTarget 
                    ? 'Are you sure you want to delete this staff member? This action cannot be undone.'
                    : selectedStaffs.length > 0 
                      ? `You want to delete ${selectedStaffs.length} selected staff member(s). This can't be undone.`
                      : 'Please select staff members to delete.'
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

export default StaffsPage;
