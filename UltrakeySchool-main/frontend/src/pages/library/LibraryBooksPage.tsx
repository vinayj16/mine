import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Book {
  _id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishedYear?: number;
  category: string;
  language: string;
  totalCopies: number;
  availableCopies: number;

  location?: {
    shelf?: string;
    rack?: string;
    floor?: string;
  };
  price?: number;
  description?: string;
  coverImage?: string;
  status: 'Active' | 'Inactive' | 'Damaged' | 'Lost';
}

const LibraryBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publishedYear: '',
    category: 'Fiction',
    language: 'English',
    totalCopies: '1',
    availableCopies: '1',
    shelf: '',
    rack: '',
    floor: '',
    price: '',
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/library/books');
      
      if (response.data.success) {
        setBooks(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching books:', error);

      const errorMessage = error.response?.data?.message || 'Failed to fetch books';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      publishedYear: '',
      category: 'Fiction',
      language: 'English',
      totalCopies: '1',
      availableCopies: '1',
      shelf: '',
      rack: '',
      floor: '',
      price: '',
      description: '',
      status: 'Active'
    });
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookData = {
        ...formData,
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
        totalCopies: parseInt(formData.totalCopies),
        availableCopies: parseInt(formData.availableCopies),
        price: formData.price ? parseFloat(formData.price) : undefined,
        location: {
          shelf: formData.shelf || undefined,
          rack: formData.rack || undefined,
          floor: formData.floor || undefined
        }
      };

      const response = await apiClient.post('/library/books', bookData);
      
      if (response.data.success) {
        toast.success('Book added successfully');
        setShowAddModal(false);
        resetForm();
        fetchBooks();
      }
    } catch (error: any) {
      console.error('Error adding book:', error);
      toast.error(error.response?.data?.message || 'Failed to add book');
    }
  };


  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const bookData = {
        ...formData,
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
        totalCopies: parseInt(formData.totalCopies),
        availableCopies: parseInt(formData.availableCopies),
        price: formData.price ? parseFloat(formData.price) : undefined,
        location: {
          shelf: formData.shelf || undefined,
          rack: formData.rack || undefined,
          floor: formData.floor || undefined
        }
      };

      const response = await apiClient.put(`/library/books/${selectedBook._id}`, bookData);
      
      if (response.data.success) {
        toast.success('Book updated successfully');
        setShowEditModal(false);
        setSelectedBook(null);
        resetForm();
        fetchBooks();
      }
    } catch (error: any) {
      console.error('Error updating book:', error);
      toast.error(error.response?.data?.message || 'Failed to update book');
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    try {
      const response = await apiClient.delete(`/library/books/${selectedBook._id}`);
      
      if (response.data.success) {
        toast.success('Book deleted successfully');
        setShowDeleteModal(false);
        setSelectedBook(null);
        fetchBooks();
      }
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast.error(error.response?.data?.message || 'Failed to delete book');
    }
  };

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setFormData({
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      publishedYear: book.publishedYear?.toString() || '',
      category: book.category,
      language: book.language,
      totalCopies: book.totalCopies.toString(),
      availableCopies: book.availableCopies.toString(),
      shelf: book.location?.shelf || '',
      rack: book.location?.rack || '',
      floor: book.location?.floor || '',
      price: book.price?.toString() || '',
      description: book.description || '',
      status: book.status
    });
    setShowEditModal(true);
  };


  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedBooks(books.map(book => book._id));
    } else {
      setSelectedBooks([]);
    }
  };

  const toggleBookSelection = (id: string) => {
    if (selectedBooks.includes(id)) {
      setSelectedBooks(selectedBooks.filter(bookId => bookId !== id));
    } else {
      setSelectedBooks([...selectedBooks, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Inactive':
        return 'bg-secondary';
      case 'Damaged':
        return 'bg-warning';
      case 'Lost':
        return 'bg-danger';
      default:
        return 'bg-secondary';
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
          <button className="btn btn-primary" onClick={fetchBooks}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Library Books</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item">Library</li>
              <li className="breadcrumb-item active">Books</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchBooks} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-info me-2" onClick={() => toast.info('Library Analytics coming soon')}>
            <i className="ti ti-chart-bar me-2"></i>Analyze
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-plus me-2"></i>Add Book
          </button>
        </div>
      </div>


      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Books List</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={selectAll} onChange={toggleSelectAll} />
                    </div>
                  </th>
                  <th>ISBN</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Total Copies</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <p className="text-muted mb-0">No books found</p>
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr key={book._id}>
                      <td>
                        <div className="form-check">
                          <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={selectedBooks.includes(book._id)}
                            onChange={() => toggleBookSelection(book._id)}
                          />
                        </div>
                      </td>
                      <td>{book.isbn || 'N/A'}</td>
                      <td>
                        <div className="fw-medium">{book.title}</div>
                        {book.publisher && <small className="text-muted">{book.publisher}</small>}
                      </td>
                      <td>{book.author}</td>
                      <td><span className="badge bg-light text-dark">{book.category}</span></td>
                      <td>{book.totalCopies}</td>
                      <td>{book.availableCopies}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(book.status)}`}>{book.status}</span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <button className="dropdown-item rounded-1" onClick={() => openEditModal(book)}>
                                <i className="ti ti-edit me-2"></i>Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger rounded-1" 
                                onClick={() => {
                                  setSelectedBook(book);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="ti ti-trash me-2"></i>Delete
                              </button>
                            </li>
                          </ul>
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


      {/* Add Book Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleAddBook}>
                <div className="modal-header">
                  <h4 className="modal-title">Add Book</h4>
                  <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Author <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="author" value={formData.author} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ISBN</label>
                      <input type="text" className="form-control" name="isbn" value={formData.isbn} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Publisher</label>
                      <input type="text" className="form-control" name="publisher" value={formData.publisher} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category <span className="text-danger">*</span></label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="History">History</option>
                        <option value="Geography">Geography</option>
                        <option value="Literature">Literature</option>
                        <option value="Reference">Reference</option>
                        <option value="Magazine">Magazine</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Language</label>
                      <input type="text" className="form-control" name="language" value={formData.language} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Total Copies <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="totalCopies" value={formData.totalCopies} onChange={handleInputChange} min="1" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Available Copies <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="availableCopies" value={formData.availableCopies} onChange={handleInputChange} min="0" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Price</label>
                      <input type="number" className="form-control" name="price" value={formData.price} onChange={handleInputChange} step="0.01" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Shelf</label>
                      <input type="text" className="form-control" name="shelf" value={formData.shelf} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Rack</label>
                      <input type="text" className="form-control" name="rack" value={formData.rack} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Floor</label>
                      <input type="text" className="form-control" name="floor" value={formData.floor} onChange={handleInputChange} />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows={3}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Book</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Edit Book Modal */}
      {showEditModal && selectedBook && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleEditBook}>
                <div className="modal-header">
                  <h4 className="modal-title">Edit Book</h4>
                  <button type="button" className="btn-close" onClick={() => { setShowEditModal(false); setSelectedBook(null); resetForm(); }}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Author <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="author" value={formData.author} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ISBN</label>
                      <input type="text" className="form-control" name="isbn" value={formData.isbn} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Publisher</label>
                      <input type="text" className="form-control" name="publisher" value={formData.publisher} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category <span className="text-danger">*</span></label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="History">History</option>
                        <option value="Geography">Geography</option>
                        <option value="Literature">Literature</option>
                        <option value="Reference">Reference</option>
                        <option value="Magazine">Magazine</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Total Copies <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="totalCopies" value={formData.totalCopies} onChange={handleInputChange} min="1" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Available Copies <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="availableCopies" value={formData.availableCopies} onChange={handleInputChange} min="0" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Price</label>
                      <input type="number" className="form-control" name="price" value={formData.price} onChange={handleInputChange} step="0.01" />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows={3}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => { setShowEditModal(false); setSelectedBook(null); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBook && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="delete-icon mb-3">
                  <i className="ti ti-trash-x fs-1 text-danger"></i>
                </div>
                <h4 className="mb-3">Confirm Deletion</h4>
                <p className="mb-4">Are you sure you want to delete "{selectedBook.title}"? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button type="button" className="btn btn-light me-3" onClick={() => { setShowDeleteModal(false); setSelectedBook(null); }}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteBook}>Yes, Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LibraryBooksPage;
