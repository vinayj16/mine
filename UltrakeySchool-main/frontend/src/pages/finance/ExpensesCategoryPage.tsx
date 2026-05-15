import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

const ExpensesCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedCategories(categories.map(cat => cat.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const toggleCategorySelection = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(catId => catId !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/finance/expenses/categories');
        if (response.data.success) {
          const payload = response.data.data?.categories ?? [];
          setCategories(payload.map((category: any) => ({
            id: category._id ?? category.id,
            name: category.name ?? category.category,
            description: category.description ?? '',
            status: category.status ?? 'active'
          })));
        } else {
          setError(response.data.message || 'Failed to load expense categories');
        }
      } catch (err: any) {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load expense categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategories(prev => prev.filter(id => categories.some(cat => cat.id === id)));
  }, [categories]);

  useEffect(() => {
    setSelectAll(categories.length > 0 && selectedCategories.length === categories.length);
  }, [categories, selectedCategories]);

  const filteredCategoriesForFilter = categories.map(cat => cat.name);

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Expense Category</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Finance & Accounts</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Expense Category</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={() => window.location.reload()}
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
              data-bs-toggle="modal"
              data-bs-target="#add_expenses_category"
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Expense Category List</h4>
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
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 pb-0 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <select className="form-select">
                            <option value="">Select</option>
                            {Array.from(new Set(filteredCategoriesForFilter)).map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
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
          {error && (
            <div className="alert alert-danger m-3">
              <i className="ti ti-alert-circle me-2" />
              {error}
            </div>
          )}
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
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <p className="text-muted mb-0">No expense categories found</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => toggleCategorySelection(category.id)}
                          />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary">{category.id.slice(-6)}</a></td>
                      <td>{category.name}</td>
                      <td>{category.description || 'No description'}</td>
                      <td>
                        <span className={`badge badge-soft-${category.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1" />
                          {category.status === 'active' ? 'Active' : 'Inactive'}
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
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  data-bs-toggle="modal" 
                                  data-bs-target="#edit_expenses_category"
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  data-bs-toggle="modal" 
                                  data-bs-target="#delete-modal"
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

      {/* Add Category Modal */}
      <div className="modal fade" id="add_expenses_category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Category</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <input type="text" className="form-control" placeholder="Enter category name" />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Description</label>
                      <textarea rows={4} className="form-control" placeholder="Enter category description"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <div className="modal fade" id="edit_expenses_category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Category</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter category name" 
                        defaultValue="Utilities" 
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Description</label>
                      <textarea 
                        rows={4} 
                        className="form-control" 
                        placeholder="Enter category description"
                        defaultValue="Expenses related to electricity, water, and gas"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="delete-icon">
                <i className="ti ti-trash-x"></i>
              </span>
              <h4>Confirm Deletion</h4>
              <p>You want to delete all the marked items, this can't be undone once you delete.</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpensesCategoryPage;
