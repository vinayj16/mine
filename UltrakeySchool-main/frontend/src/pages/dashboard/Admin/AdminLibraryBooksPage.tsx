import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LibraryBookData {
  overview: {
    totalBooks: number;
    availableBooks: number;
    issuedBooks: number;
    overdueBooks: number;
    totalCategories: number;
    newBooksThisMonth: number;
  };
  books: {
    id: string;
    isbn: string;
    title: string;
    author: string;
    category: string;
    publisher: string;
    publishYear: string;
    language: string;
    pages: number;
    price: number;
    location: string;
    rack: string;
    status: 'available' | 'issued' | 'overdue' | 'lost' | 'damaged' | 'under-repair';
    issuedTo?: string;
    issuedDate?: string;
    dueDate?: string;
    timesIssued: number;
    addedDate: string;
  }[];
  categories: {
    name: string;
    count: number;
    color: string;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    color: string;
  }[];
  monthlyTrend: {
    month: string;
    booksAdded: number;
    booksIssued: number;
    booksReturned: number;
  }[];
}

const AdminLibraryBooksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bookData, setBookData] = useState<LibraryBookData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchBookData();
  }, [selectedCategory, searchTerm]);

  const fetchBookData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setBookData({
        overview: {
          totalBooks: 0,
          availableBooks: 0,
          issuedBooks: 0,
          overdueBooks: 0,
          totalCategories: 0,
          newBooksThisMonth: 0
        },
        books: [],
        categories: [
          { name: 'Non-Fiction', count: 0, color: '#3b82f6' },
          { name: 'Mathematics', count: 0, color: '#10b981' },
          { name: 'Literature', count: 0, color: '#f59e0b' },
          { name: 'Science', count: 0, color: '#ef4444' },
          { name: 'History', count: 0, color: '#8b5cf6' }
        ],
        statusDistribution: [
          { status: 'Available', count: 0, color: '#10b981' },
          { status: 'Issued', count: 0, color: '#3b82f6' },
          { status: 'Overdue', count: 0, color: '#ef4444' },
          { status: 'Lost', count: 0, color: '#6b7280' },
          { status: 'Damaged', count: 0, color: '#f59e0b' }
        ],
        monthlyTrend: [
          { month: 'Jan', booksAdded: 0, booksIssued: 0, booksReturned: 0 },
          { month: 'Feb', booksAdded: 0, booksIssued: 0, booksReturned: 0 },
          { month: 'Mar', booksAdded: 0, booksIssued: 0, booksReturned: 0 },
          { month: 'Apr', booksAdded: 0, booksIssued: 0, booksReturned: 0 },
          { month: 'May', booksAdded: 0, booksIssued: 0, booksReturned: 0 },
          { month: 'Jun', booksAdded: 0, booksIssued: 0, booksReturned: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching library book data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = () => {
    // Handle book addition logic
    console.log('Adding new book...');
  };

  const filteredBooks = bookData?.books.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.isbn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

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
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Library Books</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Library</li>
              <li className="breadcrumb-item active">Books</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchBookData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleAddBook}>
            <i className="ti ti-book-plus me-2"></i>Add Book
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{bookData?.overview.totalBooks}</h4>
                  <p className="mb-0">Total Books</p>
                  <small>In library</small>
                </div>
                <i className="ti ti-book fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{bookData?.overview.availableBooks}</h4>
                  <p className="mb-0">Available</p>
                  <small>Ready to issue</small>
                </div>
                <i className="ti ti-book-2 fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{bookData?.overview.issuedBooks}</h4>
                  <p className="mb-0">Issued Books</p>
                  <small>Currently issued</small>
                </div>
                <i className="ti ti-book-off fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{bookData?.overview.overdueBooks}</h4>
                  <p className="mb-0">Overdue</p>
                  <small>Return overdue</small>
                </div>
                <i className="ti ti-alert-circle fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Book Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'books' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('books')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Books
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'add' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('add')}
                >
                  <i className="ti ti-book-plus me-2"></i>
                  Add Book
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'issue' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('issue')}
                >
                  <i className="ti ti-book-download me-2"></i>
                  Issue Book
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'return' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('return')}
                >
                  <i className="ti ti-book-upload me-2"></i>
                  Return Book
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Reports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Book Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookData?.statusDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {bookData?.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Book Categories</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={bookData?.categories || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Monthly Book Activity</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={bookData?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="booksAdded" fill="#10b981" />
                        <Bar dataKey="booksIssued" fill="#3b82f6" />
                        <Bar dataKey="booksReturned" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Books */}
          {selectedSection === 'books' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Books</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search books..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select 
                    className="form-select form-select-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Literature">Literature</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ISBN</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Rack</th>
                        <th>Status</th>
                        <th>Issued To</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-muted">
                            No books found. Click "Add Book" to add your first book to the library.
                          </td>
                        </tr>
                      ) : (
                        filteredBooks.map((book) => (
                          <tr key={book.id}>
                            <td>
                              <span className="badge bg-primary">{book.isbn}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm bg-info text-white rounded-circle me-2">
                                  <i className="ti ti-book"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{book.title}</h6>
                                  <small className="text-muted">{book.author}</small>
                                </div>
                              </div>
                            </td>
                            <td>{book.author}</td>
                            <td>
                              <span className="badge bg-secondary">{book.category}</span>
                            </td>
                            <td>{book.location}</td>
                            <td>{book.rack}</td>
                            <td>
                              <span className={`badge ${
                                book.status === 'available' ? 'bg-success' :
                                book.status === 'issued' ? 'bg-primary' :
                                book.status === 'overdue' ? 'bg-danger' :
                                book.status === 'lost' ? 'bg-dark' : 'bg-warning'
                              }`}>
                                {book.status.charAt(0).toUpperCase() + book.status.slice(1).replace('-', ' ')}
                              </span>
                            </td>
                            <td>{book.issuedTo || '-'}</td>
                            <td>{book.dueDate || '-'}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                {book.status === 'available' && (
                                  <button className="btn btn-outline-success" title="Issue">
                                    <i className="ti ti-book-download"></i>
                                  </button>
                                )}
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
          )}

          {/* Add Book */}
          {selectedSection === 'add' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Add New Book</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">ISBN</label>
                        <input type="text" className="form-control" placeholder="Enter ISBN" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input type="text" className="form-control" placeholder="Enter book title" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Author</label>
                        <input type="text" className="form-control" placeholder="Enter author name" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Publisher</label>
                        <input type="text" className="form-control" placeholder="Enter publisher" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" required>
                          <option value="">Select Category</option>
                          <option value="Non-Fiction">Non-Fiction</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Literature">Literature</option>
                          <option value="Science">Science</option>
                          <option value="History">History</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Language</label>
                        <select className="form-select">
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Publish Year</label>
                        <input type="number" className="form-control" placeholder="Enter year" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Location</label>
                        <input type="text" className="form-control" placeholder="Enter location" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Rack Number</label>
                        <input type="text" className="form-control" placeholder="Enter rack number" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Pages</label>
                        <input type="number" className="form-control" placeholder="Number of pages" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Price</label>
                        <input type="number" className="form-control" placeholder="Book price" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Quantity</label>
                        <input type="number" className="form-control" placeholder="Number of copies" defaultValue="1" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} placeholder="Enter book description"></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-book-plus me-1"></i>Add Book
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Issue Book */}
          {selectedSection === 'issue' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Issue Book</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Book ISBN / Title</label>
                        <input type="text" className="form-control" placeholder="Enter ISBN or search by title" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Member ID / Name</label>
                        <input type="text" className="form-control" placeholder="Enter member ID or name" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Issue Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Due Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea className="form-control" rows={2} placeholder="Any remarks"></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-book-download me-1"></i>Issue Book
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Return Book */}
          {selectedSection === 'return' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Return Book</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Book ISBN / Title</label>
                        <input type="text" className="form-control" placeholder="Enter ISBN or search by title" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Member ID / Name</label>
                        <input type="text" className="form-control" placeholder="Enter member ID or name" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Return Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Book Condition</label>
                        <select className="form-select">
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fine Amount (if any)</label>
                    <input type="number" className="form-control" placeholder="Enter fine amount" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea className="form-control" rows={2} placeholder="Any remarks"></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-book-upload me-1"></i>Return Book
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Book Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-book fs-24 text-primary mb-2"></i>
                        <h6>Book Inventory Report</h6>
                        <p className="text-muted small">Complete book catalog</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-book-download fs-24 text-success mb-2"></i>
                        <h6>Issued Books Report</h6>
                        <p className="text-muted small">Currently issued books</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-circle fs-24 text-danger mb-2"></i>
                        <h6>Overdue Books Report</h6>
                        <p className="text-muted small">Books overdue for return</p>
                        <button className="btn btn-danger btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-warning mb-2"></i>
                        <h6>Category-wise Report</h6>
                        <p className="text-muted small">Books by category</p>
                        <button className="btn btn-warning btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar fs-24 text-info mb-2"></i>
                        <h6>Monthly Activity Report</h6>
                        <p className="text-muted small">Monthly book activities</p>
                        <button className="btn btn-info btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-trending-up fs-24 text-secondary mb-2"></i>
                        <h6>Popular Books Report</h6>
                        <p className="text-muted small">Most issued books</p>
                        <button className="btn btn-secondary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLibraryBooksPage;
