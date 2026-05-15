import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Page {
  _id: string;
  name: string;
  slug: string;
  content?: string;
  active: boolean;
  createdAt: string;
}

const PagesPage = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    content: '',
    active: true
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/content/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch pages');
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPages(pages.map(page => page._id));
    } else {
      setSelectedPages([]);
    }
  };

  const toggleSelectPage = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const togglePageStatus = async (pageId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/content/pages/${pageId}`,
        { active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Page ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchPages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update page status');
      console.error('Error updating page status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Page name and slug are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (currentPage) {
        // Update existing page
        await axios.put(
          `${API_URL}/content/pages/${currentPage._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Page updated successfully');
        setShowEditModal(false);
      } else {
        // Create new page
        await axios.post(
          `${API_URL}/content/pages`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Page created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchPages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save page');
      console.error('Error saving page:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedPages.length > 0) {
        await Promise.all(
          selectedPages.map(id =>
            axios.delete(`${API_URL}/content/pages/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        toast.success(`${selectedPages.length} page(s) deleted successfully`);
      }

      setShowDeleteModal(false);
      setSelectedPages([]);
      fetchPages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete page(s)');
      console.error('Error deleting page(s):', error);
    }
  };

  const handleEdit = (page: Page) => {
    setCurrentPage(page);
    setFormData({
      name: page.name,
      slug: page.slug,
      content: page.content || '',
      active: page.active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      content: '',
      active: true
    });
    setCurrentPage(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
          <h3 className="page-title mb-1">Pages</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Content</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Pages</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchPages}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add Page
            </button>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Pages List</h4>
        </div>

        <div className="card-body p-0 py-3">
          {pages.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-file-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No pages found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="select-all"
                          checked={selectedPages.length === pages.length && pages.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Page</th>
                    <th>Page Slug</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedPages.includes(page._id)}
                            onChange={() => toggleSelectPage(page._id)}
                          />
                        </div>
                      </td>
                      <td>{page.name}</td>
                      <td>{page.slug}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`toggle-${page._id}`}
                            checked={page.active}
                            onChange={() => togglePageStatus(page._id, page.active)}
                          />
                        </div>
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
                                onClick={() => handleEdit(page)}
                              >
                                <i className="ti ti-edit-circle me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item rounded-1 text-danger"
                                onClick={() => {
                                  setSelectedPages([page._id]);
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

      {/* Add Page Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Page</h4>
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
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Page Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setFormData({ 
                              ...formData, 
                              name,
                              slug: generateSlug(name)
                            });
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Page Slug</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          required
                        />
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
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeSwitch"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="activeSwitch">
                          Active
                        </label>
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
                  <button type="submit" className="btn btn-primary">Add Page</button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}

      {/* Edit Page Modal */}
      {showEditModal && currentPage && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Page</h4>
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
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Page Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Page Slug</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          required
                        />
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
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeSwitchEdit"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="activeSwitchEdit">
                          Active
                        </label>
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
          <div className="modal-backdrop fade show"></div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleDelete();
              }}>
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>You want to delete {selectedPages.length > 1 ? 'all the marked items' : 'this page'}, this can't be undone once you delete.</p>
                  <div className="d-flex justify-content-center">
                    <button 
                      type="button" 
                      className="btn btn-light me-3"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger">Yes, Delete</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </>
  );
};

export default PagesPage;
