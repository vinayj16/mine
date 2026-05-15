import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';

interface LibraryData {
  overview: {
    totalBooks: number;
    availableBooks: number;
    issuedBooks: number;
    overdueBooks: number;
    totalMembers: number;
    activeMembers: number;
  };
  books: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    status: 'available' | 'issued' | 'overdue' | 'lost';
    issuedDate?: string;
    returnDate?: string;
    issuedTo?: string;
  }[];
  members: {
    id: string;
    name: string;
    role: string;
    grade?: string;
    booksIssued: number;
    membershipDate: string;
    status: 'active' | 'inactive';
  }[];
  categories: {
    name: string;
    count: number;
  }[];
}

const AdminLibraryPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction',
    totalCopies: 1,
    publisher: '',
    publishedYear: new Date().getFullYear()
  });
  const [memberFormData, setMemberFormData] = useState({
    userId: '',
    userType: 'Student'
  });
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Debug effect
  useEffect(() => {
    console.log('showAddBookModal changed to:', showAddBookModal);
  }, [showAddBookModal]);

  useEffect(() => {
    console.log('showAddMemberModal changed to:', showAddMemberModal);
  }, [showAddMemberModal]);

  useEffect(() => {
    fetchLibraryData();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get schoolId from localStorage or use default
      const userStr = localStorage.getItem('user');
      const schoolId = userStr ? JSON.parse(userStr)?.schoolId || '507f1f77bcf86cd799439011' : '507f1f77bcf86cd799439011';
      
      const studentRes = await apiClient.get('/students', { params: { schoolId, limit: 100 } });
      const teacherRes = await apiClient.get('/teachers', { params: { schoolId, limit: 100 } });
      
      const studentsArray = studentRes.data?.data?.students || studentRes.data?.data || [];
      const teachersArray = teacherRes.data?.data?.teachers || teacherRes.data?.data || [];
      
      setStudents(Array.isArray(studentsArray) ? studentsArray : []);
      setTeachers(Array.isArray(teachersArray) ? teachersArray : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setStudents([]);
      setTeachers([]);
    }
  };

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const [booksRes, membersRes, statsRes] = await Promise.all([
        apiClient.get('/library/books?limit=100'),
        apiClient.get('/library/members?limit=100'),
        apiClient.get('/library/stats')
      ]);
      
      const books = booksRes.data.data?.books || [];
      const members = membersRes.data.data?.members || [];
      const stats = statsRes.data.data || {};
      
      const categoriesCount: { [key: string]: number } = {};
      books.forEach((book: any) => {
        categoriesCount[book.category] = (categoriesCount[book.category] || 0) + 1;
      });
      
      setLibraryData({
        overview: {
          totalBooks: stats.totalBooks || books.length,
          availableBooks: stats.availableBooks || books.filter((b: any) => b.availableCopies > 0).length,
          issuedBooks: stats.issuedBooks || 0,
          overdueBooks: stats.overdueBooks || 0,
          totalMembers: stats.totalMembers || members.length,
          activeMembers: members.filter((m: any) => m.status === 'active').length
        },
        books: books.map((b: any) => ({
          id: b._id,
          title: b.title,
          author: b.author,
          isbn: b.isbn || '',
          category: b.category,
          status: b.availableCopies > 0 ? 'available' : 'issued',
          issuedTo: b.issuedTo,
          returnDate: b.returnDate
        })),
        members: members.map((m: any) => ({
          id: m.id || m._id,
          name: m.name,
          role: m.role || m.userType,
          grade: m.grade,
          booksIssued: m.booksIssued || 0,
          membershipDate: m.membershipDate,
          status: m.status
        })),
        categories: Object.keys(categoriesCount).map(name => ({ name, count: categoriesCount[name] }))
      });
    } catch (error) {
      console.error('Error fetching library data:', error);
      setLibraryData({
        overview: {
          totalBooks: 0,
          availableBooks: 0,
          issuedBooks: 0,
          overdueBooks: 0,
          totalMembers: 0,
          activeMembers: 0
        },
        books: [],
        members: [],
        categories: [
          { name: 'Fiction', count: 0 },
          { name: 'Non-Fiction', count: 0 },
          { name: 'Science', count: 0 },
          { name: 'Mathematics', count: 0 },
          { name: 'History', count: 0 },
          { name: 'Literature', count: 0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding book with data:', bookFormData);
    try {
      setSaving(true);
      const response = await apiClient.post('/library/books', bookFormData);
      console.log('Book added response:', response);
      toast.success('Book added successfully!');
      setShowAddBookModal(false);
      setBookFormData({
        title: '',
        author: '',
        isbn: '',
        category: 'Fiction',
        totalCopies: 1,
        publisher: '',
        publishedYear: new Date().getFullYear()
      });
      fetchLibraryData();
    } catch (error: any) {
      console.error('Error adding book:', error);
      toast.error(error.response?.data?.message || 'Failed to add book');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding member with data:', memberFormData);
    try {
      setSaving(true);
      const response = await apiClient.post('/library/members', memberFormData);
      console.log('Member added response:', response);
      toast.success('Member added successfully!');
      setShowAddMemberModal(false);
      setMemberFormData({ userId: '', userType: 'Student' });
      fetchLibraryData();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const bookStatusData = libraryData ? [
    { name: 'Available', value: libraryData.overview.availableBooks, color: '#10b981' },
    { name: 'Issued', value: libraryData.overview.issuedBooks, color: '#3b82f6' },
    { name: 'Overdue', value: libraryData.overview.overdueBooks, color: '#ef4444' }
  ] : [];

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
          <h3 className="page-title mb-1">Library Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Library</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchLibraryData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ zIndex: 1 }}
            onClick={(e) => {
              e.preventDefault();
              console.log('Add Book button clicked, setting modal to true');
              setShowAddBookModal(true);
            }}
          >
            <i className="ti ti-book-plus me-2"></i>Add Book
          </button>
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} onClick={() => setShowAddBookModal(false)}></div>
          <div className="modal fade show" style={{ display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1050, width: '500px' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Book</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddBookModal(false)}></button>
                </div>
                <form onSubmit={handleAddBook}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Book Title *</label>
                      <input type="text" className="form-control" required value={bookFormData.title} 
                        onChange={e => setBookFormData({...bookFormData, title: e.target.value})} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Author *</label>
                      <input type="text" className="form-control" required value={bookFormData.author}
                        onChange={e => setBookFormData({...bookFormData, author: e.target.value})} />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">ISBN</label>
                        <input type="text" className="form-control" value={bookFormData.isbn}
                          onChange={e => setBookFormData({...bookFormData, isbn: e.target.value})} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Category *</label>
                        <select className="form-select" required value={bookFormData.category}
                          onChange={e => setBookFormData({...bookFormData, category: e.target.value})}>
                          <option value="Fiction">Fiction</option>
                          <option value="Non-Fiction">Non-Fiction</option>
                          <option value="Science">Science</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="History">History</option>
                          <option value="Geography">Geography</option>
                          <option value="Literature">Literature</option>
                          <option value="Reference">Reference</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Total Copies *</label>
                        <input type="number" className="form-control" required min="1" value={bookFormData.totalCopies}
                          onChange={e => setBookFormData({...bookFormData, totalCopies: parseInt(e.target.value)})} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Published Year</label>
                        <input type="number" className="form-control" value={bookFormData.publishedYear}
                          onChange={e => setBookFormData({...bookFormData, publishedYear: parseInt(e.target.value)})} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Publisher</label>
                      <input type="text" className="form-control" value={bookFormData.publisher}
                        onChange={e => setBookFormData({...bookFormData, publisher: e.target.value})} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddBookModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Adding...' : 'Add Book'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} onClick={() => setShowAddMemberModal(false)}></div>
          <div className="modal fade show" style={{ display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1050, width: '500px' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Library Member</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddMemberModal(false)}></button>
                </div>
                <form onSubmit={handleAddMember}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">User Type *</label>
                      <select className="form-select" required value={memberFormData.userType}
                        onChange={e => setMemberFormData({...memberFormData, userType: e.target.value, userId: ''})}>
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Select User *</label>
                      <select className="form-select" required value={memberFormData.userId}
                        onChange={e => setMemberFormData({...memberFormData, userId: e.target.value})}>
                        <option value="">Select User</option>
                        {memberFormData.userType === 'Student' && students.map(s => (
                          <option key={s._id} value={s._id}>{s.name || s.firstName + ' ' + s.lastName}</option>
                        ))}
                        {memberFormData.userType === 'Teacher' && teachers.map(t => (
                          <option key={t._id} value={t._id}>{t.name || t.firstName + ' ' + t.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{libraryData?.overview.totalBooks}</h4>
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
                  <h4 className="mb-1">{libraryData?.overview.availableBooks}</h4>
                  <p className="mb-0">Available</p>
                  <small>Ready to issue</small>
                </div>
                <i className="ti ti-book-2 fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{libraryData?.overview.issuedBooks}</h4>
                  <p className="mb-0">Issued Books</p>
                  <small>Currently issued</small>
                </div>
                <i className="ti ti-book-upload fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{libraryData?.overview.overdueBooks}</h4>
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
              <h5 className="card-title">Library Sections</h5>
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
                  <i className="ti ti-book me-2"></i>
                  Books
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'members' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('members')}
                >
                  <i className="ti ti-users me-2"></i>
                  Members
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'issue' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('issue')}
                >
                  <i className="ti ti-book-upload me-2"></i>
                  Issue Book
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'return' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('return')}
                >
                  <i className="ti ti-book-download me-2"></i>
                  Return Book
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
                          data={bookStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {bookStatusData.map((entry, index) => (
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
                      <BarChart data={libraryData?.categories || []}>
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
                    <h5 className="card-title mb-0">Library Statistics</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="text-center">
                          <h4>{libraryData?.overview.totalMembers}</h4>
                          <p className="text-muted">Total Members</p>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center">
                          <h4>{libraryData?.overview.activeMembers}</h4>
                          <p className="text-muted">Active Members</p>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center">
                          <h4>{libraryData?.categories.length}</h4>
                          <p className="text-muted">Categories</p>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center">
                          <h4>{libraryData?.overview.overdueBooks}</h4>
                          <p className="text-muted">Overdue Books</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Books */}
          {selectedSection === 'books' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Book Management</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search books..." />
                  <select className="form-select form-select-sm">
                    <option value="">All Categories</option>
                    {libraryData?.categories.map((cat, index) => (
                      <option key={index} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddBookModal(true)}>
                    <i className="ti ti-plus me-1"></i>Add Book
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Issued To</th>
                        <th>Return Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {libraryData?.books.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted">
                            No books found in the library. Click "Add Book" to add your first book.
                          </td>
                        </tr>
                      ) : (
                        libraryData?.books.map((book) => (
                          <tr key={book.id}>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.isbn}</td>
                            <td>
                              <span className="badge bg-primary">{book.category}</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                book.status === 'available' ? 'bg-success' :
                                book.status === 'issued' ? 'bg-info' :
                                book.status === 'overdue' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                              </span>
                            </td>
                            <td>{book.issuedTo || '-'}</td>
                            <td>{book.returnDate || '-'}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning">
                                  <i className="ti ti-edit"></i>
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
          )}

          {/* Members */}
          {selectedSection === 'members' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Library Members</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search members..." />
                  <button className="btn btn-primary btn-sm" onClick={() => { console.log('Add Member button clicked'); setShowAddMemberModal(true); }}>
                    <i className="ti ti-user-plus me-1"></i>Add Member
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Grade</th>
                        <th>Books Issued</th>
                        <th>Membership Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {libraryData?.members.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted">
                            No library members found. Click "Add Member" to register library members.
                          </td>
                        </tr>
                      ) : (
                        libraryData?.members.map((member) => (
                          <tr key={member.id}>
                            <td>{member.name}</td>
                            <td>
                              <span className="badge bg-primary">{member.role}</span>
                            </td>
                            <td>{member.grade || '-'}</td>
                            <td>{member.booksIssued}</td>
                            <td>{member.membershipDate}</td>
                            <td>
                              <span className={`badge ${
                                member.status === 'active' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning">
                                  <i className="ti ti-edit"></i>
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
                        <label className="form-label">Select Member</label>
                        <select className="form-select">
                          <option value="">Select Member</option>
                          {libraryData?.members.filter(m => m.status === 'active').map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} - {member.role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Select Book</label>
                        <select className="form-select">
                          <option value="">Select Book</option>
                          {libraryData?.books.filter(b => b.status === 'available').map((book) => (
                            <option key={book.id} value={book.id}>
                              {book.title} - {book.author}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Issue Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Expected Return Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea className="form-control" rows={3} placeholder="Enter any remarks"></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Issue Book</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Return Book */}
          {selectedSection === 'return' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Return Book</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search by member or book..." />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-search me-1"></i>Search
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Author</th>
                        <th>Issued To</th>
                        <th>Issue Date</th>
                        <th>Expected Return</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          No issued books found. All books are currently available in the library.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLibraryPage;
