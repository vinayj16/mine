import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface ReturnBook {
  _id: string;
  book: {
    _id: string;
    title: string;
    isbn?: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  userType: 'Student' | 'Teacher' | 'Staff';
  issueDate: string;
  dueDate: string;
  status: 'Issued' | 'Overdue';
  fine: number;
  fineStatus: 'None' | 'Pending' | 'Paid';
  remarks?: string;
}

const LibraryReturnPage: React.FC = () => {
  const [returnBooks, setReturnBooks] = useState<ReturnBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ReturnBook | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  const fetchIssuedBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/library/issues', {
        params: {
          status: 'Issued,Overdue' // Only get books that haven't been returned
        }
      });
      
      if (response.data.success) {
        setReturnBooks(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching issued books:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch issued books';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Issued':
        return 'bg-primary';
      case 'Overdue':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const handleViewDetails = (book: ReturnBook) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  };

  const handleReturnBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to mark this book as returned?')) {
      return;
    }

    try {
      setReturning(true);
      const response = await apiClient.put(`/library/issues/${bookId}/return`);
      
      if (response.data.success) {
        toast.success('Book returned successfully');
        setShowBookDetails(false);
        setSelectedBook(null);
        fetchIssuedBooks();
      }
    } catch (error: any) {
      console.error('Error returning book:', error);
      toast.error(error.response?.data?.message || 'Failed to return book');
    } finally {
      setReturning(false);
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

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Books</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchIssuedBooks}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Return Book</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <a href="#!">Management</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Return Book</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1" 
                onClick={fetchIssuedBooks}
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
                  <a href="#!" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Books List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Return Book</h4>
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
                    <div className="p-3 border-bottom">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Date of Issue</label>
                            <select className="form-select" name="dateOfIssue">
                              <option>Select Date of Issue</option>
                              <option>20 Apr 2024</option>
                              <option>24 Apr 2024</option>
                              <option>02 May 2024</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Name</label>
                            <select className="form-select" name="nameFilter">
                              <option>Select Name</option>
                              <option>Janet</option>
                              <option>Joann</option>
                              <option>Kathleen</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-0">
                            <label className="form-label">More Filter</label>
                            <select className="form-select" name="moreFilter">
                              <option>Filters</option>
                              <option>ID</option>
                              <option>Date of Issue</option>
                              <option>Due Date</option>
                              <option>Issue To</option>
                              <option>Books Issued</option>
                              <option>Book Returned</option>
                              <option>Issue Remarks</option>
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
                    <a href="#!" className="dropdown-item rounded-1 active">
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Descending
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Recently Viewed
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Recently Added
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="card-body p-0 py-3">
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Date of Issue</th>
                    <th>Due Date</th>
                    <th>Issue To</th>
                    <th>Books Issued</th>
                    <th>Book Returned</th>
                    <th>Issue Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returnBooks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        <p className="text-muted mb-0">No books to return</p>
                      </td>
                    </tr>
                  ) : (
                    returnBooks.map((book) => (
                      <tr key={book._id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td><Link to="#" className="link-primary">{book._id.slice(-8)}</Link></td>
                        <td>{formatDate(book.issueDate)}</td>
                        <td>
                          <span className={book.status === 'Overdue' ? 'text-danger fw-medium' : ''}>
                            {formatDate(book.dueDate)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-md me-2">
                              {book.user.avatar ? (
                                <img 
                                  src={book.user.avatar} 
                                  className="img-fluid rounded-circle" 
                                  alt={book.user.name} 
                                />
                              ) : (
                                <div className="avatar-title bg-primary rounded-circle">
                                  {book.user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-dark mb-0">{book.user.name}</p>
                              <span className="fs-12">{book.userType}</span>
                            </div>
                          </div>
                        </td>
                        <td>1</td>
                        <td>0</td>
                        <td>
                          <span className={`badge ${getStatusBadge(book.status)}`}>
                            {book.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex">
                            <button 
                              className="btn btn-light btn-sm me-2"
                              onClick={() => handleViewDetails(book)}
                            >
                              View
                            </button>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleReturnBook(book._id)}
                              disabled={returning}
                            >
                              {returning ? 'Processing...' : 'Return'}
                            </button>
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
     

      {/* Book Details Modal */}
      {showBookDetails && selectedBook && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Book Return Details</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowBookDetails(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Issue ID</label>
                      <p className="form-control-static">{selectedBook._id.slice(-8)}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Date of Issue</label>
                      <p className="form-control-static">{formatDate(selectedBook.issueDate)}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Due Date</label>
                      <p className={`form-control-static ${selectedBook.status === 'Overdue' ? 'text-danger fw-medium' : ''}`}>
                        {formatDate(selectedBook.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <span className={`badge ${getStatusBadge(selectedBook.status)}`}>
                        {selectedBook.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Issued To</label>
                      <div className="d-flex align-items-center">
                        <div className="avatar me-3">
                          {selectedBook.user.avatar ? (
                            <img 
                              src={selectedBook.user.avatar} 
                              className="img-fluid rounded-circle" 
                              alt={selectedBook.user.name} 
                              style={{ width: '50px', height: '50px' }}
                            />
                          ) : (
                            <div className="avatar-title bg-primary rounded-circle" style={{ width: '50px', height: '50px' }}>
                              {selectedBook.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="mb-0">{selectedBook.user.name}</h5>
                          <p className="mb-0">
                            {selectedBook.userType} - {selectedBook.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Book Title</label>
                      <p className="form-control-static">{selectedBook.book.title}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">ISBN</label>
                      <p className="form-control-static">{selectedBook.book.isbn || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedBook.fine > 0 && (
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Fine Amount</label>
                        <p className="form-control-static text-danger fw-medium">
                          ${selectedBook.fine.toFixed(2)} ({selectedBook.fineStatus})
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedBook.remarks && (
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Remarks</label>
                        <p className="form-control-static">{selectedBook.remarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-light" 
                  onClick={() => setShowBookDetails(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    handleReturnBook(selectedBook._id);
                  }}
                  disabled={returning}
                >
                  {returning ? 'Processing...' : 'Mark as Returned'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LibraryReturnPage;