import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Testimonial {
  _id: string;
  author: string;
  role: string;
  content: string;
  isActive: boolean;
  createdAt?: string;
}

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    role: '',
    content: '',
    isActive: true
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/v1/content/testimonials`);
      setTestimonials(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/v1/content/testimonials`, formData);
      toast.success('Testimonial added successfully');
      setShowAddModal(false);
      setFormData({ author: '', role: '', content: '', isActive: true });
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add testimonial');
    }
  };

  const handleUpdateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTestimonial) return;
    
    try {
      await axios.put(`${API_URL}/api/v1/content/testimonials/${currentTestimonial._id}`, formData);
      toast.success('Testimonial updated successfully');
      setShowEditModal(false);
      setCurrentTestimonial(null);
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update testimonial');
    }
  };

  const handleDelete = async (testimonialId: string) => {
    try {
      await axios.delete(`${API_URL}/api/v1/content/testimonials/${testimonialId}`);
      toast.success('Testimonial deleted successfully');
      setShowDeleteModal(false);
      setCurrentTestimonial(null);
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete testimonial');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedTestimonials.map(id => axios.delete(`${API_URL}/api/v1/content/testimonials/${id}`))
      );
      toast.success(`${selectedTestimonials.length} testimonials deleted successfully`);
      setSelectedTestimonials([]);
      setShowDeleteModal(false);
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete testimonials');
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTestimonials(testimonials.map(testimonial => testimonial._id));
    } else {
      setSelectedTestimonials([]);
    }
  };

  const openAddModal = () => {
    setFormData({ author: '', role: '', content: '', isActive: true });
    setShowAddModal(true);
  };

  const openEditModal = (testimonial: Testimonial) => {
    setCurrentTestimonial(testimonial);
    setFormData({
      author: testimonial.author,
      role: testimonial.role,
      content: testimonial.content,
      isActive: testimonial.isActive
    });
    setShowEditModal(true);
  };

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Testimonials</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Content</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Testimonials</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchTestimonials}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={openAddModal}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Testimonial
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Testimonials List</h4>
          {selectedTestimonials.length > 0 && (
            <button
              className="btn btn-danger mb-3"
              onClick={() => setShowDeleteModal(true)}
            >
              <i className="ti ti-trash me-2"></i>
              Delete Selected ({selectedTestimonials.length})
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
          ) : testimonials.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-message-2 fs-1 text-muted mb-3"></i>
              <p className="text-muted">No testimonials found. Add your first testimonial to get started.</p>
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
                          checked={selectedTestimonials.length === testimonials.length && testimonials.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Author</th>
                    <th>Role</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((testimonial) => (
                    <tr key={testimonial._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedTestimonials.includes(testimonial._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTestimonials([...selectedTestimonials, testimonial._id]);
                              } else {
                                setSelectedTestimonials(selectedTestimonials.filter(id => id !== testimonial._id));
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td>{testimonial.author}</td>
                      <td>{testimonial.role}</td>
                      <td>{testimonial.content.length > 50 ? `${testimonial.content.substring(0, 50)}...` : testimonial.content}</td>
                      <td>
                        <span
                          className={`badge d-inline-flex align-items-center ${
                            testimonial.isActive ? 'badge-soft-success' : 'badge-soft-danger'
                          }`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {testimonial.isActive ? 'Active' : 'Inactive'}
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
                                  onClick={() => openEditModal(testimonial)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setCurrentTestimonial(testimonial);
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

      {/* Add Testimonial Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Testimonial</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddTestimonial}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Author</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select 
                          className="form-select"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Parent">Parent</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Content</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          required
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
                  <button type="submit" className="btn btn-primary">Add Testimonial</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Testimonial Modal */}
      {showEditModal && currentTestimonial && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Testimonial</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateTestimonial}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Author</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select 
                          className="form-select"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Parent">Parent</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Content</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          required
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
                  {selectedTestimonials.length > 1
                    ? `Are you sure you want to delete ${selectedTestimonials.length} selected testimonials?`
                    : 'Are you sure you want to delete this testimonial?'}
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
                      if (currentTestimonial) {
                        handleDelete(currentTestimonial._id);
                      } else if (selectedTestimonials.length > 0) {
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

export default TestimonialsPage;
