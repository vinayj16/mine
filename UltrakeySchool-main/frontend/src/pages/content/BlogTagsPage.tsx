import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Tag {
  _id: string;
  name: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

const BlogTagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/blog/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch tags');
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTags(tags.map(tag => tag._id));
    } else {
      setSelectedTags([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (currentTag) {
        // Update existing tag
        await axios.put(
          `${API_URL}/blog/tags/${currentTag._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Tag updated successfully');
        setShowEditModal(false);
      } else {
        // Create new tag
        await axios.post(
          `${API_URL}/blog/tags`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Tag created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchTags();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save tag');
      console.error('Error saving tag:', error);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/blog/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Tag deleted successfully');
      setShowDeleteModal(false);
      setCurrentTag(null);
      fetchTags();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete tag');
      console.error('Error deleting tag:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedTags.map(id =>
          axios.delete(`${API_URL}/blog/tags/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      toast.success(`${selectedTags.length} tags deleted successfully`);
      setSelectedTags([]);
      setShowDeleteModal(false);
      fetchTags();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete tags');
      console.error('Error deleting tags:', error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setCurrentTag(tag);
    setFormData({
      name: tag.name,
      status: tag.status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'active'
    });
    setCurrentTag(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Tags</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Blog</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Tags</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchTags}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Tag
            </button>
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Tags List</h4>
        </div>

        <div className="card-body p-0 py-3">
          {tags.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-tag-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No tags found</p>
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
                          checked={selectedTags.length === tags.length && tags.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Tags</th>
                    <th>Added on</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={selectedTags.includes(tag._id)}
                            onChange={() => {
                              if (selectedTags.includes(tag._id)) {
                                setSelectedTags(selectedTags.filter(id => id !== tag._id));
                              } else {
                                setSelectedTags([...selectedTags, tag._id]);
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="text-gray-9">{tag.name}</td>
                      <td className="text-gray-9">{formatDate(tag.createdAt)}</td>
                      <td>
                        <span 
                          className={`badge d-inline-flex align-items-center ${
                            tag.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger'
                          }`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {tag.status.charAt(0).toUpperCase() + tag.status.slice(1)}
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
                                  onClick={() => handleEdit(tag)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setCurrentTag(tag);
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

      {/* Add Tag Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Tag</h4>
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
                        <label className="form-label">Tag Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <button type="submit" className="btn btn-primary">Add Tag</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {showEditModal && currentTag && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Tag</h4>
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
                        <label className="form-label">Tag Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  {selectedTags.length > 1
                    ? `Are you sure you want to delete ${selectedTags.length} selected tags?`
                    : 'Are you sure you want to delete this tag?'}
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
                      if (currentTag) {
                        handleDelete(currentTag._id);
                      } else if (selectedTags.length > 0) {
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

export default BlogTagsPage;
