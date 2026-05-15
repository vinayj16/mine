import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { homeworkService, type Homework, type CreateHomeworkInput, type HomeworkFilters } from '../../services/homeworkService';
import apiClient from '../../api/client';

interface Subject {
  _id?: string;
  id?: string;
  name: string;
}

interface ClassData {
  _id?: string;
  id?: string;
  name: string;
  section?: string;
}

const ClassHomeWorkPage: React.FC = () => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filters, setFilters] = useState<any>({
    classId: '',
    subject: '',
    status: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('desc');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newHomework, setNewHomework] = useState<CreateHomeworkInput>({
    title: '',
    description: '',
    subject: '',
    classId: '',
    dueDate: '',
    assignedDate: new Date().toISOString().split('T')[0],
    totalMarks: 0
  });

  const [editHomework, setEditHomework] = useState<CreateHomeworkInput>({
    title: '',
    description: '',
    subject: '',
    classId: '',
    dueDate: '',
    assignedDate: '',
    totalMarks: 0
  });

  useEffect(() => {
    fetchHomework();
    fetchSubjects();
    fetchClasses();
  }, [filters, sortBy]);

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get('/subjects');
      console.log('Subject response:', response);
      let subjectsData = [];
      if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        subjectsData = response.data.data;
      } else if (response.data?.data?.subjects) {
        subjectsData = response.data.data.subjects;
      }
      console.log('Subjects data:', subjectsData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setSubjects([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      const classesData = response.data?.data?.classes || response.data?.data || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClasses([]);
    }
  };

  const fetchHomework = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: HomeworkFilters = {
        ...filters,
        sortBy: 'assignedDate',
        sortOrder: sortBy,
        limit: 100
      };
      if (!params.classId) delete params.classId;
      if (!params.subject) delete params.subject;
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      
      const response = await homeworkService.getAll(params);
      setHomeworks(response.homeworks || []);
    } catch (err: any) {
      console.error('Error fetching homework:', err);
      setError(err.message || 'Failed to fetch homework');
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewHomework(prev => ({
      ...prev,
      [name]: name === 'totalMarks' ? Number(value) : value
    }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditHomework(prev => ({
      ...prev,
      [name]: name === 'totalMarks' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await homeworkService.create(newHomework);
      toast.success('Homework added successfully');
      setIsAddModalOpen(false);
      setNewHomework({
        title: '',
        description: '',
        subject: '',
        classId: '',
        dueDate: '',
        assignedDate: new Date().toISOString().split('T')[0],
        totalMarks: 0
      });
      await fetchHomework();
    } catch (err: any) {
      console.error('Error adding homework:', err);
      toast.error(err.message || 'Failed to add homework');
    }
  };

  const handleEdit = (homework: Homework) => {
    setSelectedHomework(homework);
    setEditHomework({
      title: homework.title,
      description: homework.description,
      subject: homework.subject,
      classId: homework.classId,
      dueDate: homework.dueDate.split('T')[0],
      assignedDate: homework.assignedDate.split('T')[0],
      totalMarks: homework.totalMarks || 0
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework) return;
    try {
      await homeworkService.update(selectedHomework.id, editHomework);
      toast.success('Homework updated successfully');
      setIsEditModalOpen(false);
      setSelectedHomework(null);
      await fetchHomework();
    } catch (err: any) {
      console.error('Error updating homework:', err);
      toast.error(err.message || 'Failed to update homework');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await homeworkService.delete(deleteId);
      toast.success('Homework deleted successfully');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      await fetchHomework();
    } catch (err: any) {
      console.error('Error deleting homework:', err);
      toast.error(err.message || 'Failed to delete homework');
    }
  };

   const handleFilterChange = (key: string, value: string) => {
     setFilters((prev: any) => ({ ...prev, [key]: value }));
   };

  const resetFilters = () => {
    setFilters({ classId: '', subject: '', status: '', search: '' });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'bg-success',
      inactive: 'bg-danger',
      assigned: 'bg-info',
      submitted: 'bg-warning',
      graded: 'bg-success',
      overdue: 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Class Work</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Class Work</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button className="btn btn-outline-light bg-white btn-icon" onClick={() => fetchHomework()}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <i className="ti ti-plus me-1"></i>Add Home Work
          </button>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <div className="input-group" style={{ maxWidth: '200px' }}>
                  <span className="input-group-text"><i className="ti ti-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search homework..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <select 
                  className="form-select"
                  value={filters.classId || ''}
                  onChange={(e) => handleFilterChange('classId', e.target.value)}
                  style={{ width: '150px' }}
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name} {cls.section}</option>
                  ))}
                </select>
                <select 
                  className="form-select"
                  value={filters.subject || ''}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  style={{ width: '150px' }}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                <select 
                  className="form-select"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="overdue">Overdue</option>
                </select>
                {(filters.classId || filters.subject || filters.status || filters.search) && (
                  <button className="btn btn-sm btn-light" onClick={resetFilters}>Reset</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="mb-0">Class Home Work</h4>
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'asc' | 'desc')}
              style={{ width: '120px' }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading homework...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
              <button className="btn btn-sm btn-danger ms-2" onClick={fetchHomework}>Retry</button>
            </div>
          ) : homeworks.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-clipboard-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No homework found. Add your first homework to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Assigned Date</th>
                    <th>Due Date</th>
                    <th>Marks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {homeworks.map((homework) => (
                    <tr key={homework.id || homework._id}>
                      <td><span className="text-muted">{(homework.id || homework._id || 'N/A').toString().slice(0, 8)}</span></td>
                      <td className="fw-semibold">{homework.title || 'Untitled Homework'}</td>
                      <td>{homework.className || homework.classId}</td>
                      <td>{homework.subjectName || homework.subject}</td>
                      <td>{new Date(homework.assignedDate).toLocaleDateString()}</td>
                      <td>{new Date(homework.dueDate).toLocaleDateString()}</td>
                      <td>{homework.totalMarks || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(homework.status)}`}>
                          {homework.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-icon btn-light"
                            onClick={() => handleEdit(homework)}
                            title="Edit"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-icon btn-light text-danger"
                            onClick={() => handleDeleteClick(homework.id)}
                            title="Delete"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
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

      {/* Add Homework Modal */}
      {isAddModalOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Home Work</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsAddModalOpen(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="title"
                          value={newHomework.title}
                          onChange={handleInputChange}
                          placeholder="Enter homework title"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Class *</label>
                        <select 
                          className="form-select"
                          name="classId"
                          value={newHomework.classId}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name} {cls.section}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Subject *</label>
                        <select 
                          className="form-select"
                          name="subject"
                          value={newHomework.subject}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(sub => (
                            <option key={sub._id || sub.id} value={sub._id || sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Assigned Date *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          name="assignedDate"
                          value={newHomework.assignedDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Due Date *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          name="dueDate"
                          value={newHomework.dueDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Total Marks</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="totalMarks"
                          value={newHomework.totalMarks || ''}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter total marks"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          name="description"
                          value={newHomework.description}
                          onChange={handleInputChange}
                          placeholder="Enter homework description"
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light" 
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Homework</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Homework Modal */}
      {isEditModalOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Home Work</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsEditModalOpen(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="title"
                          value={editHomework.title}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Class *</label>
                        <select 
                          className="form-select"
                          name="classId"
                          value={editHomework.classId}
                          onChange={handleEditChange}
                          required
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name} {cls.section}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Subject *</label>
                        <select 
                          className="form-select"
                          name="subject"
                          value={editHomework.subject}
                          onChange={handleEditChange}
                          required
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Assigned Date *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          name="assignedDate"
                          value={editHomework.assignedDate}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Due Date *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          name="dueDate"
                          value={editHomework.dueDate}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Total Marks</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="totalMarks"
                          value={editHomework.totalMarks || ''}
                          onChange={handleEditChange}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          name="description"
                          value={editHomework.description}
                          onChange={handleEditChange}
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light" 
                    onClick={() => setIsEditModalOpen(false)}
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
      {isDeleteModalOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="ti ti-trash-x" style={{ fontSize: '48px', color: '#dc3545' }}></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p className="text-muted">Are you sure you want to delete this homework? This action cannot be undone.</p>
                <div className="d-flex justify-content-center gap-2">
                  <button 
                    type="button" 
                    className="btn btn-light" 
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for modals */}
      {(isAddModalOpen || isEditModalOpen || isDeleteModalOpen) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default ClassHomeWorkPage;
