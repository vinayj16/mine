import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Comment {
  _id: string;
  comment: string;
  createdAt: string;
  rating: number;
  blogId: {
    _id: string;
    title: string;
  };
  userId: {
    _id: string;
    name: string;
  };
  status: 'published' | 'pending';
}

const BlogCommentsPage = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentComment, setCurrentComment] = useState<Comment | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('ascending');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/blog/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch comments');
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedComments(comments.map(comment => comment._id));
    } else {
      setSelectedComments([]);
    }
  };

  const toggleCommentStatus = async (commentId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'published' ? 'pending' : 'published';
      
      await axios.patch(
        `${API_URL}/blog/comments/${commentId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Comment ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update comment status');
      console.error('Error updating comment status:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/blog/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Comment deleted successfully');
      setShowDeleteModal(false);
      setCurrentComment(null);
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedComments.map(id =>
          axios.delete(`${API_URL}/blog/comments/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      toast.success(`${selectedComments.length} comments deleted successfully`);
      setSelectedComments([]);
      setShowDeleteModal(false);
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete comments');
      console.error('Error deleting comments:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <i 
        key={i} 
        className={`ti ti-star-filled ${i < rating ? 'filled' : ''}`}
      ></i>
    ));
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
          <h3 className="page-title mb-1">Comments</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Pages</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Comments</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchComments}
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
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Comments List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="text" 
                className="form-control date-range bookingrange" 
                placeholder="Select"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
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
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-0">
                          <label className="form-label">Date</label>
                          <input
                            type="date"
                            className="form-select"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-light me-3"
                      onClick={() => setFilterDate('')}
                    >
                      Reset
                    </button>
                    <button type="button" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="dropdown mb-3">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-sort-ascending-2 me-2"></i>
                {sortBy === 'ascending' ? 'A-Z' : 'Z-A'}
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <button 
                    className={`dropdown-item rounded-1 ${sortBy === 'ascending' ? 'active' : ''}`}
                    onClick={() => setSortBy('ascending')}
                  >
                    Ascending
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item rounded-1 ${sortBy === 'descending' ? 'active' : ''}`}
                    onClick={() => setSortBy('descending')}
                  >
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
          {comments.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-message-off fs-1 text-muted mb-3"></i>
              <p className="text-muted">No comments found</p>
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
                          checked={selectedComments.length === comments.length && comments.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Review</th>
                    <th>Blog</th>
                    <th>By</th>
                    <th>Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map(comment => (
                    <tr key={comment._id}>
                      <td>
                        <div className="form-check">
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            checked={selectedComments.includes(comment._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedComments([...selectedComments, comment._id]);
                              } else {
                                setSelectedComments(selectedComments.filter(id => id !== comment._id));
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="text-content">
                        {comment.comment.length > 30 
                          ? `${comment.comment.substring(0, 30)}...` 
                          : comment.comment}
                      </td>
                      <td className="text-gray-9">{formatDate(comment.createdAt)}</td>
                      <td>
                        <div className="rating">
                          {renderStars(comment.rating)}
                          <span className="rating-rate">{comment.rating}.0</span>
                        </div>
                      </td>
                      <td className="text-gray-9 text-content">
                        {comment.blogId?.title ? (
                          comment.blogId.title.length > 30 
                            ? `${comment.blogId.title.substring(0, 30)}...` 
                            : comment.blogId.title
                        ) : 'N/A'}
                      </td>
                      <td>{comment.userId?.name || 'Unknown'}</td>
                      <td>
                        <select 
                          className="form-select form-select-sm"
                          value={comment.status}
                          onChange={() => toggleCommentStatus(comment._id, comment.status)}
                        >
                          <option value="published">Publish</option>
                          <option value="pending">Unpublish</option>
                        </select>
                      </td>
                      <td>
                        <button 
                          className="btn btn-link text-danger p-0"
                          onClick={() => {
                            setCurrentComment(comment);
                            setShowDeleteModal(true);
                          }}
                        >
                          <i className="ti ti-trash-x"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
                  {selectedComments.length > 1 
                    ? `Are you sure you want to delete ${selectedComments.length} selected comments?`
                    : 'Are you sure you want to delete this comment?'}
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
                      if (currentComment) {
                        handleDelete(currentComment._id);
                      } else if (selectedComments.length > 0) {
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

export default BlogCommentsPage;
