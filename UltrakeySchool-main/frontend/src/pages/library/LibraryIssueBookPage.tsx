import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface IssuedBook {
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
  returnDate?: string;
  status: 'Issued' | 'Returned' | 'Overdue' | 'Lost';
  fine: number;
  fineStatus: 'None' | 'Pending' | 'Paid';
  remarks?: string;
}

const LibraryIssueBookPage: React.FC = () => {
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [selectedBook, setSelectedBook] = useState<IssuedBook | null>(null);

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  const fetchIssuedBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/library/issues');
      
      if (response.data.success) {
        setIssuedBooks(response.data.data || []);
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
      case 'Returned':
        return 'bg-success';
      case 'Overdue':
        return 'bg-danger';
      case 'Lost':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  const handleViewDetails = (book: IssuedBook) => {
    setSelectedBook(book);
    setShowBookDetails(true);
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
          <h4 className="mb-3">Error Loading Issued Books</h4>
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
              <h3 className="page-title mb-1">Issue Book</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="#!">Management</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Issue Book</li>
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
              <h4 className="mb-3">Issue Book</h4>
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
                              <label className="form-label">Issue Book</label>
                              <select className="form-select" name="issueBookFilter">
                                <option>Select</option>
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
                                <option>Select</option>
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedBooks.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4">
                          <p className="text-muted mb-0">No issued books found</p>
                        </td>
                      </tr>
                    ) : (
                      issuedBooks.map((book) => (
                        <tr key={book._id}>
                          <td>
                            <div className="form-check form-check-md">
                              <input className="form-check-input" type="checkbox" />
                            </div>
                          </td>
                          <td><Link to="#" className="link-primary">{book._id.slice(-8)}</Link></td>
                          <td>{formatDate(book.issueDate)}</td>
                          <td>{formatDate(book.dueDate)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-md me-2">
                                {book.user?.avatar ? (
                                  <img 
                                    src={book.user.avatar} 
                                    className="img-fluid rounded-circle" 
                                    alt={book.user?.name || 'User'} 
                                  />
                                ) : (
                                  <div className="avatar-title bg-primary rounded-circle">
                                    {book.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-dark mb-0">{book.user?.name || 'Unknown User'}</p>
                                <span className="fs-12">{book.userType || 'Student'}</span>
                              </div>
                            </div>
                          </td>
                          <td>1</td>
                          <td>{book.returnDate ? '1' : '0'}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(book.status)}`}>
                              {book.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-light"
                              onClick={() => handleViewDetails(book)}
                            >
                              View Details
                            </button>
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">View Details</h4>
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
                <div className="view-book">
                  <div className="view-book-title">
                    <h5>Issue Book Details</h5>
                  </div>
                  <div className="book-issue-details">
                    <div className="book-details-head">
                      <span className="text-primary">{selectedBook._id.slice(-8)}</span>
                      <h6><span>Issue Date :</span> {formatDate(selectedBook.issueDate)}</h6>
                    </div>
                    <ul className="book-taker-info">
                      <li>
                        <div className="d-flex align-items-center">
                          <span className="student-img">
                            {selectedBook.user?.avatar ? (
                              <img 
                                src={selectedBook.user.avatar}
                                className="img-fluid rounded-circle" 
                                alt={selectedBook.user?.name || 'User'} 
                              />
                            ) : (
                              <div className="avatar-title bg-primary rounded-circle" style={{ width: '50px', height: '50px' }}>
                                {selectedBook.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </span>
                          <h6>
                            {selectedBook.user.name} <br />
                            {selectedBook.userType}
                          </h6>
                        </div>
                      </li>
                      <li>
                        <span>User Type</span>
                        <h6>{selectedBook.userType}</h6>
                      </li>
                      <li>
                        <span>Book Name</span>
                        <h6>{selectedBook.book.title}</h6>
                      </li>
                      <li>
                        <span>ISBN</span>
                        <h6>{selectedBook.book.isbn || 'N/A'}</h6>
                      </li>
                      <li>
                        <span>Due Date</span>
                        <h6>{formatDate(selectedBook.dueDate)}</h6>
                      </li>
                      <li>
                        <span>Status</span>
                        <h6>
                          <span className={`badge ${getStatusBadge(selectedBook.status)}`}>
                            {selectedBook.status}
                          </span>
                        </h6>
                      </li>
                      {selectedBook.fine > 0 && (
                        <li>
                          <span>Fine</span>
                          <h6 className="text-danger">${selectedBook.fine.toFixed(2)}</h6>
                        </li>
                      )}
                      {selectedBook.returnDate && (
                        <li>
                          <span>Return Date</span>
                          <h6>{formatDate(selectedBook.returnDate)}</h6>
                        </li>
                      )}
                      {selectedBook.remarks && (
                        <li>
                          <span>Remarks</span>
                          <h6>{selectedBook.remarks}</h6>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LibraryIssueBookPage;