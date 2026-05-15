import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

const FaqPage = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaqs, setSelectedFaqs] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/content/faqs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch FAQs');
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFaqs(faqs.map(faq => faq._id));
    } else {
      setSelectedFaqs([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
      toast.error('All fields are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (currentFaq) {
        // Update existing FAQ
        await axios.put(
          `${API_URL}/content/faqs/${currentFaq._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('FAQ updated successfully');
        setShowEditModal(false);
      } else {
        // Create new FAQ
        await axios.post(
          `${API_URL}/content/faqs`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('FAQ created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchFaqs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save FAQ');
      console.error('Error saving FAQ:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/content/faqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('FAQ deleted successfully');
      setShowDeleteModal(false);
      setCurrentFaq(null);
      fetchFaqs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete FAQ');
      console.error('Error deleting FAQ:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedFaqs.map(id =>
          axios.delete(`${API_URL}/content/faqs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      toast.success(`${selectedFaqs.length} FAQs deleted successfully`);
      setSelectedFaqs([]);
      setShowDeleteModal(false);
      fetchFaqs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete FAQs');
      console.error('Error deleting FAQs:', error);
    }
  };

  const handleEdit = (faq: FaqItem) => {
    setCurrentFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: ''
    });
    setCurrentFaq(null);
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
          <h3 className="page-title mb-1">FAQ</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Content</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">FAQ</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchFaqs}
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
              <i className="ti ti-square-rounded-plus me-2"></i>Add FAQ
            </button>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">FAQ List</h4>
        </div>

        <div className="card-body p-0 py-3">
          {faqs.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-help-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No FAQs found</p>
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
                          checked={selectedFaqs.length === faqs.length && faqs.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Questions</th>
                    <th>Answers</th>
                    <th>Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedFaqs.includes(faq._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFaqs([...selectedFaqs, faq._id]);
                              } else {
                                setSelectedFaqs(selectedFaqs.filter(id => id !== faq._id));
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td>{faq.question}</td>
                      <td>{faq.answer.length > 50 ? `${faq.answer.substring(0, 50)}...` : faq.answer}</td>
                      <td>{faq.category}</td>
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
                                  onClick={() => handleEdit(faq)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setCurrentFaq(faq);
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

      {/* Add FAQ Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add FAQ</h4>
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
                        <label className="form-label">Category</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Question</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Answer</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={formData.answer}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
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
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add FAQ</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit FAQ Modal */}
      {showEditModal && currentFaq && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit FAQ</h4>
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
                        <label className="form-label">Category</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Question</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Answer</label>
                        <textarea 
                          className="form-control" 
                          rows={4}
                          value={formData.answer}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
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
                  {selectedFaqs.length > 1
                    ? `Are you sure you want to delete ${selectedFaqs.length} selected FAQs?`
                    : 'Are you sure you want to delete this FAQ?'}
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
                      if (currentFaq) {
                        handleDelete(currentFaq._id);
                      } else if (selectedFaqs.length > 0) {
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

export default FaqPage;
