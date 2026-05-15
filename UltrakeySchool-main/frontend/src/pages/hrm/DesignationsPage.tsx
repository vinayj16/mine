import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import hrmService, { type HrmDesignation } from '../../services/hrmService';

const DesignationsPage = () => {
  const [designations, setDesignations] = useState<HrmDesignation[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<HrmDesignation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isMounted = useRef(true);

  const loadDesignations = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    try {
      const data = await hrmService.listDesignations();
      if (!isMounted.current) return;
      setDesignations(data);
      setSelectedDesignations([]);
      setSelectAll(false);
      setError(null);
    } catch (fetchError: any) {
      if (!isMounted.current) return;
      console.error('DesignationsPage:', fetchError);
      setError(fetchError?.message || 'Failed to load designations.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadDesignations();

    return () => {
      isMounted.current = false;
    };
  }, [loadDesignations]);

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelectedDesignations(next ? designations.map((designation) => designation.designationId) : []);
  };

  const toggleDesignationSelection = (id: string) => {
    setSelectedDesignations((prev) =>
      prev.includes(id) ? prev.filter((designationId) => designationId !== id) : [...prev, id]
    );
  };

  const handleDeleteDesignation = async () => {
    if (!selectedDesignations.length) {
      setShowDeleteModal(false);
      return;
    }

    try {
      setSubmitting(true);
      await Promise.all(selectedDesignations.map((id) => hrmService.deleteDesignation(id)));
      await loadDesignations();
    } catch (deleteError: any) {
      console.error('Failed to delete designation(s):', deleteError);
      setError(deleteError?.message || 'Failed to delete designation(s).');
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
        setShowDeleteModal(false);
      }
    }
  };

  const handleAddDesignation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const level = parseInt(formData.get('level') as string);
    const department = formData.get('department') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') === 'on' ? 'active' : 'inactive';

    try {
      setSubmitting(true);
      await hrmService.createDesignation({ 
        name, 
        code, 
        level, 
        department, 
        description, 
        status 
      });
      await loadDesignations();
      setShowAddModal(false);
    } catch (createError: any) {
      console.error('Failed to create designation:', createError);
      setError(createError?.message || 'Failed to create designation.');
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const handleEditDesignation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDesignation) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const level = formData.get('level') ? parseInt(formData.get('level') as string) : undefined;
    const department = formData.get('department') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') === 'on' ? 'active' : 'inactive';

    const updateData: Partial<HrmDesignation> = { name, status };
    if (code) updateData.code = code;
    if (level) updateData.level = level;
    if (department) updateData.department = department;
    if (description) updateData.description = description;

    try {
      setSubmitting(true);
      await hrmService.updateDesignation(editingDesignation.designationId, updateData);
      await loadDesignations();
      setShowEditModal(false);
      setEditingDesignation(null);
    } catch (updateError: any) {
      console.error('Failed to update designation:', updateError);
      setError(updateError?.message || 'Failed to update designation.');
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const renderBadgeClass = (status: HrmDesignation['status']) =>
    status === 'active' ? 'badge-soft-success' : 'badge-soft-danger';

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Designations</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active">Designations</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              title="Refresh"
              onClick={loadDesignations}
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
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
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Designation
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Designation</h4>
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
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
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
                          <label className="form-label">Designation</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Technical Head</option>
                            <option>Accountant</option>
                            <option>Teacher</option>
                            <option>Librarian</option>
                            <option>Doctor</option>
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
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li><button className="dropdown-item rounded-1">Ascending</button></li>
                <li><button className="dropdown-item rounded-1">Descending</button></li>
                <li><button className="dropdown-item rounded-1">Recently Viewed</button></li>
                <li><button className="dropdown-item rounded-1">Recently Added</button></li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

        <div className="card-body p-0 py-3">
          <div className="table-responsive">
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
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : designations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No designations registered yet.
                    </td>
                  </tr>
                ) : (
                  designations.map((designation) => (
                    <tr key={designation.designationId}>
                      <td>
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedDesignations.includes(designation.designationId)}
                            onChange={() => toggleDesignationSelection(designation.designationId)}
                          />
                        </div>
                      </td>
                      <td>
                        <Link to="#" className="link-primary">{designation.designationId}</Link>
                      </td>
                      <td>{designation.name}</td>
                      <td>
                        <span className={`badge ${renderBadgeClass(designation.status)} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {designation.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button
                                  className="dropdown-item rounded-1"
                                  onClick={() => {
                                    setEditingDesignation(designation);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedDesignations([designation.designationId]);
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Designation Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Designation</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowAddModal(false)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddDesignation}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Designation Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          name="name"
                          className="form-control" 
                          placeholder="Enter Designation Name" 
                          required 
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Code <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          name="code"
                          className="form-control" 
                          placeholder="e.g., TCH, ACC" 
                          required 
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Level <span className="text-danger">*</span></label>
                        <input 
                          type="number" 
                          name="level"
                          className="form-control" 
                          placeholder="e.g., 1, 2, 3" 
                          min="1"
                          required 
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          name="department"
                          className="form-control" 
                          placeholder="Enter Department" 
                          required 
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          name="description"
                          className="form-control" 
                          placeholder="Enter Description"
                          rows={3}
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
                          name="status"
                          role="switch" 
                          id="statusSwitch" 
                          defaultChecked 
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
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Designation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Designation Modal */}
      {showEditModal && editingDesignation && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Designation</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDesignation(null);
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditDesignation}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Designation Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          placeholder="Enter Designation Name"
                          defaultValue={editingDesignation.name}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Code</label>
                        <input
                          type="text"
                          name="code"
                          className="form-control"
                          placeholder="e.g., TCH, ACC"
                          defaultValue={editingDesignation.code}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Level</label>
                        <input
                          type="number"
                          name="level"
                          className="form-control"
                          placeholder="e.g., 1, 2, 3"
                          min="1"
                          defaultValue={editingDesignation.level}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Department</label>
                        <input
                          type="text"
                          name="department"
                          className="form-control"
                          placeholder="Enter Department"
                          defaultValue={editingDesignation.department}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          name="description"
                          className="form-control"
                          placeholder="Enter Description"
                          rows={3}
                          defaultValue={editingDesignation.description}
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
                          name="status"
                          role="switch"
                          id="editStatusSwitch"
                          defaultChecked={editingDesignation.status === 'active'}
                        />
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
                      setEditingDesignation(null);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete all the marked items, this can't be undone once you delete.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    className="btn btn-light me-3" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteDesignation}
                    disabled={submitting}
                  >
                    {submitting ? 'Deleting...' : 'Yes, Delete'}
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

export default DesignationsPage;
