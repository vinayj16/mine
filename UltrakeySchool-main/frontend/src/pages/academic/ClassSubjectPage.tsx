import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { subjectService } from '../../services/subjectService';
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '../../services/subjectService';

const ClassSubjectPage: React.FC = () => {
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedSchoolId = localStorage.getItem('schoolId');
    console.log('Stored user:', storedUser); 
    console.log('Stored schoolId:', storedSchoolId);
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserFromStorage(parsed);
    }
  }, []);
  
  const schoolId = userFromStorage?.schoolId || userFromStorage?.institutionId || localStorage.getItem('schoolId') || localStorage.getItem('institutionId') || '';
  const institutionId = userFromStorage?.institutionId || localStorage.getItem('institutionId') || '';
  
  // State management
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateSubjectInput>({
    name: '',
    code: '',
    description: '',
    class: '',
    teacher: '',
    credits: 0,
    semester: '',
    schoolId: '',
    department: '',
    institutionId: ''
  });
  
  // Update form when schoolId and institutionId are available
  useEffect(() => {
    if (schoolId || institutionId) {
      setFormData(prev => ({ 
        ...prev, 
        schoolId: schoolId || prev.schoolId,
        institutionId: institutionId || prev.institutionId
      }));
    }
  }, [schoolId, institutionId]);

  // Fetch subjects from backend
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      // Include institutionId to filter subjects for the correct institution
      const response = await subjectService.getAll({
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        institutionId: institutionId
      });
      console.log('[ClassSubjectPage] Institution ID used:', institutionId);
      console.log('[ClassSubjectPage] Fetched subjects response:', response);
      // Extract subjects array from response
      const subjectsArray = response?.subjects || [];
      setSubjects(subjectsArray);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subjects';
      console.error('Error fetching subjects:', err);
      setError(errorMessage);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'credits' ? parseInt(value) || 0 : value
    });
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('SchoolId from component:', schoolId);
      console.log('User from storage:', userFromStorage);
      const subjectData = {
        ...formData,
        schoolId: schoolId,
        department: formData.department || ''
      };
      console.log('Subject data being sent:', JSON.stringify(subjectData));
      await subjectService.create(subjectData);
      toast.success('Subject added successfully');
      setFormData({
        name: '',
        code: '',
        description: '',
        class: '',
        teacher: '',
        credits: 0,
        semester: '',
        schoolId,
        department: '',
        institutionId
      });
      setShowAddModal(false);
      await fetchSubjects();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add subject';
      console.error('Error adding subject:', err);
      toast.error(errorMessage);
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      const updateData: UpdateSubjectInput = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        class: formData.class,
        teacher: formData.teacher,
        credits: formData.credits,
        semester: formData.semester
      };
      
      await subjectService.update(selectedSubject._id, updateData);
      toast.success('Subject updated successfully');
      setShowEditModal(false);
      setSelectedSubject(null);
      await fetchSubjects();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subject';
      console.error('Error updating subject:', err);
      toast.error(errorMessage);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;

    try {
      await subjectService.delete(selectedSubject._id);
      toast.success('Subject deleted successfully');
      setShowDeleteModal(false);
      setSelectedSubject(null);
      await fetchSubjects();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete subject';
      console.error('Error deleting subject:', err);
      toast.error(errorMessage);
    }
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      class: subject.class,
      teacher: subject.teacher,
      credits: subject.credits,
      semester: subject.semester,
      schoolId,
      department: '',
      institutionId
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Subjects</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <span>Academic</span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Subjects</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={() => fetchSubjects()}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setFormData({
                  name: '',
                  code: '',
                  description: '',
                  class: '',
                  teacher: '',
                  credits: 0,
                  semester: '',
                  schoolId,
                  department: '',
                  institutionId
                });
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Subject
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Class Subjects</h4>
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading subjects...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-book-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No subjects found. Add your first subject to get started.</p>
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
                    <th>Name</th>
                    <th>Code</th>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Credits</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>{subject.name}</td>
                      <td>{subject.code}</td>
                      <td>{subject.class}</td>
                      <td>{subject.teacher}</td>
                      <td>{subject.credits}</td>
                      <td>{subject.semester}</td>
                      <td>
                        <span className={`badge badge-soft-${subject.isActive ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {subject.isActive ? 'Active' : 'Inactive'}
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
                                  onClick={() => openEditModal(subject)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger" 
                                  onClick={() => openDeleteModal(subject)}
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

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Subject</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleAddSubject}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-control" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="class"
                      value={formData.class}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teacher</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Credits</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      name="credits"
                      value={formData.credits}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Semester</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="department"
                      value={formData.department || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Science, Arts, Commerce"
                    />
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
                  <button type="submit" className="btn btn-primary">Add Subject</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && selectedSubject && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Subject</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                />
              </div>
              <form onSubmit={handleEditSubject}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-control" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="class"
                      value={formData.class}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teacher</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Credits</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      name="credits"
                      value={formData.credits}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Semester</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                    />
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
      {showDeleteModal && selectedSubject && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <i className="ti ti-trash-x fs-1 text-danger mb-3"></i>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete <strong>{selectedSubject.name}</strong>? This action cannot be undone.</p>
                <div className="d-flex justify-content-center mt-4">
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
                    onClick={handleDeleteSubject}
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


export default ClassSubjectPage;
