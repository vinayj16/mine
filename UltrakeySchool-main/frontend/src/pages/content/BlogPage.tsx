import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Blog {
  _id: string;
  title: string;
  featuredImage?: string;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  likes?: number;
  views?: number;
  status: 'draft' | 'published' | 'archived';
  excerpt?: string;
  content: string;
}

interface FormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: string;
  featuredImage: string;
}

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    status: 'draft',
    featuredImage: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/blog/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (selectedBlogId) {
        // Update existing blog
        await axios.put(
          `${API_URL}/blog/posts/${selectedBlogId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Blog updated successfully');
        setShowEditModal(false);
      } else {
        // Create new blog
        await axios.post(
          `${API_URL}/blog/posts`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Blog created successfully');
        setShowAddModal(false);
      }
      
      resetForm();
      fetchBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save blog');
      console.error('Error saving blog:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedBlogId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/blog/posts/${selectedBlogId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Blog deleted successfully');
      setShowDeleteModal(false);
      setSelectedBlogId(null);
      fetchBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete blog');
      console.error('Error deleting blog:', error);
    }
  };

  const handleEdit = (blog: Blog) => {
    setSelectedBlogId(blog._id);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      category: blog.category?._id || '',
      tags: [],
      status: blog.status,
      featuredImage: blog.featuredImage || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: [],
      status: 'draft',
      featuredImage: ''
    });
    setSelectedBlogId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'danger';
      default:
        return 'secondary';
    }
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
          <h3 className="page-title mb-1">Blogs</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Pages</li>
              <li className="breadcrumb-item active" aria-current="page">Blogs</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchBlogs}
              title="Refresh"
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Blog
            </button>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="row">
        <div className="col-md-12">
          {blogs.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-article-off fs-1 text-muted mb-3"></i>
                <p className="text-muted">No blogs found</p>
              </div>
            </div>
          ) : (
            blogs.map(blog => (
              <div className="card mb-3" key={blog._id}>
                <div className="card-body p-3 pb-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div className="blog-content d-flex align-items-center mb-3 me-3 w-40">
                      <div className="avatar avatar-xxl rounded flex-shrink-0 me-3">
                        <img 
                          src={blog.featuredImage || '/assets/img/blogs/blog-placeholder.jpg'} 
                          alt="blog" 
                          className="img-fluid"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/img/blogs/blog-placeholder.jpg';
                          }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <ul className="d-flex align-items-center flex-wrap row-gap-2">
                          <li className="pe-2 me-2 border-end">
                            <i className="ti ti-calendar me-1"></i>{formatDate(blog.createdAt)}
                          </li>
                          <li className="d-flex align-items-center">
                            <span className="avatar avatar-xs me-1">
                              <img 
                                src={blog.author?.avatar || '/assets/img/profiles/avatar-default.jpg'} 
                                alt={blog.author?.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/img/profiles/avatar-default.jpg';
                                }}
                              />
                            </span>
                            {blog.author?.name || 'Unknown'}
                          </li>
                        </ul>
                        <h5 className="text-truncate my-2">
                          {blog.title}
                        </h5>
                        {blog.category && (
                          <span className="badge badge-soft-primary fs-12">{blog.category.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center flex-wrap">
                      <div className="pe-4 me-4 mb-3 border-end text-center">
                        <h6>{blog.likes || 0}</h6>
                        <p className="fs-12">Likes</p>
                      </div>
                      <div className="pe-4 me-4 mb-3 border-end text-center">
                        <h6>{blog.views || 0}</h6>
                        <p className="fs-12">Views</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span className={`badge badge-soft-${getStatusBadgeClass(blog.status)} d-inline-flex align-items-center me-2`}>
                        <i className="ti ti-circle-filled fs-6 me-1"></i>
                        {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                      </span>
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
                              onClick={() => handleEdit(blog)}
                            >
                              <i className="ti ti-edit-circle me-2"></i>Edit
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item rounded-1 text-danger"
                              onClick={() => {
                                setSelectedBlogId(blog._id);
                                setShowDeleteModal(true);
                              }}
                            >
                              <i className="ti ti-trash-x me-2"></i>Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Blog Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{showEditModal ? 'Edit Blog' : 'New Blog'}</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => {
                    setShowAddModal(false);
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
                        <label className="form-label">Blog Title</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Excerpt</label>
                        <textarea 
                          className="form-control"
                          rows={2}
                          value={formData.excerpt}
                          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Content</label>
                        <textarea 
                          className="form-control"
                          rows={6}
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          required
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
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {showEditModal ? 'Update Blog' : 'Add Blog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div 
            className="modal-backdrop fade show" 
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          ></div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete this blog? This action cannot be undone.</p>
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
          <div className="modal-backdrop fade show" onClick={() => setShowDeleteModal(false)}></div>
        </div>
      )}
    </>
  );
};

export default BlogPage;
