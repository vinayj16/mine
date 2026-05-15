import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../api/client';

interface Category {
  id: string;
  name: string;
  date: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

const BlogCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', status: true });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/blog/categories');
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/blog/categories', {
        name: formData.name,
        status: formData.status ? 'Active' : 'Inactive'
      });
      
      if (response.data.success) {
        toast.success('Category added successfully');
        setShowAddModal(false);
        setFormData({ name: '', status: true });
        fetchCategories();
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    try {
      const response = await apiClient.put(`/blog/categories/${currentCategory.id}`, {
        name: formData.name,
        status: formData.status ? 'Active' : 'Inactive'
      });
      
      if (response.data.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        setCurrentCategory(null);
        setFormData({ name: '', status: true });
        fetchCategories();
      }
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!currentCategory) return;

    try {
      const response = await apiClient.delete(`/blog/categories/${currentCategory.id}`);
      
      if (response.data.success) {
        toast.success('Category deleted successfully');
        setShowDeleteModal(false);
        setCurrentCategory(null);
        fetchCategories();
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(categories.map(cat => cat.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    toast.info('Excel export feature coming soon');
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
          <h3 className="page-title mb-1">Categories</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/blog">Blog</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Categories</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchCategories}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
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
                <button className="dropdown-item rounded-1" onClick={exportToPDF}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToExcel}>
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center"
              onClick={() => {
                setFormData({ name: '', status: true });
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Categories List</h4>
        </div>
        <div className="card-body p-0 py-3">
          {categories.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-category" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="text-muted mt-3">No categories found</p>
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
                          onChange={toggleSelectAll}
                          checked={selectedCategories.length === categories.length && categories.length > 0}
                        />
                      </div>
                    </th>
                    <th>Category</th>
                    <th>Added on</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="text-gray-9">{category.name}</td>
                      <td className="text-gray-9">{category.date || new Date(category.createdAt || '').toLocaleDateString()}</td>
                      <td>
                        <span 
                          className={`badge d-inline-flex align-items-center ${
                            category.status === 'Active' ? 'badge-soft-success' : 'badge-soft-danger'
                          }`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {category.status}
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
                                  onClick={() => {
                                    setCurrentCategory(category);
                                    setFormData({ 
                                      name: category.name, 
                                      status: category.status === 'Active' 
                                    });
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
                                    setCurrentCategory(category);
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Category</h4>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleAddCategory}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Category Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="modal-satus-toggle d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch"
                            checked={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
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
                  <button type="submit" className="btn btn-primary">Add Category</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && currentCategory && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Category</h4>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                />
              </div>
              <form onSubmit={handleUpdateCategory}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Category Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="modal-satus-toggle d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch"
                            checked={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
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
      {showDeleteModal && currentCategory && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete the category "{currentCategory.name}"? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button 
                    className="btn btn-light me-3"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
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

export default BlogCategoriesPage;
