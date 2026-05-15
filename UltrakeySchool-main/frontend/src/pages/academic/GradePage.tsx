import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { gradeService } from '../../services/gradeService';
import type { Grade } from '../../services/gradeService';

const GradePage: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newGrade, setNewGrade] = useState({
    grade: '',
    marksFrom: 90,
    marksTo: 100,
    points: 0,
    status: 'Active' as 'Active' | 'Inactive',
    description: ''
  });

  const [editGrade, setEditGrade] = useState<Grade | null>(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradeService.getAll({ page: 1, limit: 100 });
      // Handle both direct array and paginated response
      const gradesArray = Array.isArray(response) ? response : (response.data || []);
      setGrades(gradesArray);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setGrades([]);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewGrade(prev => ({
      ...prev,
      [name]: name === 'marksFrom' || name === 'marksTo' || name === 'points' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editGrade) {
      setEditGrade({
        ...editGrade,
        [name]: name === 'marksFrom' || name === 'marksTo' || name === 'points'
          ? parseInt(value) || 0
          : value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await gradeService.create(newGrade);
      toast.success('Grade created successfully');
      setShowAddModal(false);
      resetForm();
      fetchGrades();
    } catch (error) {
      console.error('Error creating grade:', error);
      toast.error('Failed to create grade');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGrade) return;

    try {
      await gradeService.update(editGrade.id, {
        grade: editGrade.grade,
        marksFrom: editGrade.marksFrom,
        marksTo: editGrade.marksTo,
        points: editGrade.points,
        status: editGrade.status,
        description: editGrade.description
      });

      toast.success('Grade updated successfully');
      setShowEditModal(false);
      setEditGrade(null);
      fetchGrades();
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update grade');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await gradeService.delete(deleteId);
      toast.success('Grade deleted successfully');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchGrades();
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error('Failed to delete grade');
    }
  };

  const resetForm = () => {
    setNewGrade({
      grade: '',
      marksFrom: 90,
      marksTo: 100,
      points: 0,
      status: 'Active',
      description: ''
    });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export as ${type.toUpperCase()} - Feature coming soon`);
  };

  const pointsOptions = Array.from({ length: 11 }, (_, i) => i);

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Grade</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Academic</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Grade
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchGrades}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
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
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('excel')}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Grade
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Grade List</h4>
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
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
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
                    <button type="button" className="btn btn-light me-3">
                      Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="dropdown mb-3">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
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
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Grade</th>
                    <th>Percentage</th>
                    <th>Grade Points</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length > 0 ? (
                    grades.map((grade) => (
                      <tr key={grade.id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td>
                          <Link to="#" className="link-primary">
                            {grade.id}
                          </Link>
                        </td>
                        <td>{grade.grade}</td>
                        <td>{grade.percentage}</td>
                        <td>{grade.points}</td>
                        <td>
                          <span 
                            className={`badge badge-soft-${
                              grade.status === 'Active' ? 'success' : 'danger'
                            } d-inline-flex align-items-center`}
                          >
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {grade.status}
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
                                  onClick={() => {
                                    setEditGrade(grade);
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
                                    setDeleteId(grade.id);
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No grades found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Grade</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Grade</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="grade"
                          value={newGrade.grade}
                          onChange={handleInputChange}
                          placeholder="e.g., A+, O, B"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Marks From (%)</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="marksFrom"
                          value={newGrade.marksFrom}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Marks Upto (%)</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="marksTo"
                          value={newGrade.marksTo}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Grade Points</label>
                        <select 
                          className="form-select"
                          name="points"
                          value={newGrade.points}
                          onChange={handleInputChange}
                          required
                        >
                          {pointsOptions.map(point => (
                            <option key={`point-${point}`} value={point}>
                              {point}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={newGrade.status}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          name="description"
                          value={newGrade.description}
                          onChange={handleInputChange}
                          placeholder="Optional description"
                        ></textarea>
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
                  <button type="submit" className="btn btn-primary">
                    Add Grade
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editGrade && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Grade</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditGrade(null);
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Grade</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="grade"
                          value={editGrade.grade}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Marks From (%)</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="marksFrom"
                          value={editGrade.marksFrom}
                          onChange={handleEditInputChange}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Marks Upto (%)</label>
                        <input 
                          type="number"
                          className="form-control"
                          name="marksTo"
                          value={editGrade.marksTo}
                          onChange={handleEditInputChange}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Grade Points</label>
                        <select 
                          className="form-select"
                          name="points"
                          value={editGrade.points}
                          onChange={handleEditInputChange}
                          required
                        >
                          {pointsOptions.map(point => (
                            <option key={`edit-point-${point}`} value={point}>
                              {point}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={editGrade.status}
                          onChange={handleEditInputChange}
                          required
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          name="description"
                          value={editGrade.description || ''}
                          onChange={handleEditInputChange}
                        ></textarea>
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
                      setEditGrade(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this grade? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-light me-3" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDelete}
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

export default GradePage;