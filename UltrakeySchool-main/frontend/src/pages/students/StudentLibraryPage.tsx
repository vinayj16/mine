import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import StudentSelector from '../../components/students/StudentSelector';

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  classId?: {
    name: string;
  };
  sectionId?: {
    name: string;
  };
  status: string;
  email?: string;
  phone?: string;
}

interface LibraryRecord {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    author?: string;
    isbn?: string;
    coverImage?: string;
  };
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine?: number;
}

const StudentLibraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [libraryRecords, setLibraryRecords] = useState<LibraryRecord[]>([]);

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/students/${id}`, {
        params: { schoolId }
      });

      if (response.data.success) {
        setStudent(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching student:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load student details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraryRecords = async () => {
    if (!id) return;

    try {
      setLibraryLoading(true);

      const response = await apiClient.get(`/students/${id}/library`, {
        params: { schoolId }
      });

      if (response.data.success) {
        setLibraryRecords(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching library records:', err);
      toast.error(err.response?.data?.message || 'Failed to load library records');
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (student) {
      fetchLibraryRecords();
    }
  }, [student]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return 'badge-soft-primary';
      case 'returned':
        return 'badge-soft-success';
      case 'overdue':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const isOverdue = (dueDate: string, returnDate?: string) => {
    if (returnDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    return today > due;
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

  if (error || !student) {
    if (!id && !error) {
      return (
        <StudentSelector
          redirectPath="/students/library"
          title="Select Student for Library"
          description="Choose a student to view their library records"
        />
      );
    }
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">{error || 'Student not found'}</h4>
          <button className="btn btn-primary" onClick={fetchStudent}>
            <i className="ti ti-refresh me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const classLabel = [student.classId?.name, student.sectionId?.name].filter(Boolean).join(', ') || 'N/A';

  // Calculate statistics
  const totalBooks = libraryRecords.length;
  const issuedBooks = libraryRecords.filter(r => r.status === 'issued').length;
  const returnedBooks = libraryRecords.filter(r => r.status === 'returned').length;
  const overdueBooks = libraryRecords.filter(r => r.status === 'overdue' || isOverdue(r.dueDate, r.returnDate)).length;

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Library</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Students</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Library
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button">
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/students/edit/${id}`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Student
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Sidebar */}
        <div className="col-xxl-3 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="border-bottom pb-3 mb-3">
                <div className="text-center">
                  <div className="avatar avatar-xxl mb-3">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${fullName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={fullName} 
                    />
                  </div>
                  <h5 className="mb-1">{fullName}</h5>
                  <p className="text-muted mb-2">{classLabel}</p>
                  <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {capitalize(student.status)}
                  </span>
                </div>
              </div>

              <div className="border-bottom pb-3 mb-3">
                <h6 className="mb-3">Basic Information</h6>
                <div className="mb-2">
                  <p className="text-muted mb-1">Admission No</p>
                  <p className="fw-medium mb-0">{student.admissionNumber}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Roll No</p>
                  <p className="fw-medium mb-0">{student.rollNumber || 'N/A'}</p>
                </div>
                {student.email && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Email</p>
                    <p className="fw-medium mb-0">{student.email}</p>
                  </div>
                )}
                {student.phone && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Phone</p>
                    <p className="fw-medium mb-0">{student.phone}</p>
                  </div>
                )}
              </div>

              <div>
                <h6 className="mb-3">Library Statistics</h6>
                <div className="mb-2">
                  <p className="text-muted mb-1">Total Books</p>
                  <p className="fw-medium mb-0 text-primary">{totalBooks}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Currently Issued</p>
                  <p className="fw-medium mb-0 text-info">{issuedBooks}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Returned</p>
                  <p className="fw-medium mb-0 text-success">{returnedBooks}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Overdue</p>
                  <p className="fw-medium mb-0 text-danger">{overdueBooks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-xxl-9 col-xl-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5>Library Records</h5>
              <div className="dropdown">
                <button className="btn btn-outline-light border-white bg-white dropdown-toggle shadow-md" type="button">
                  <i className="ti ti-calendar-due me-2" />
                  This Year
                </button>
              </div>
            </div>
            <div className="card-body pb-1">
              {libraryLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading library records...</span>
                  </div>
                </div>
              ) : libraryRecords.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-books-off fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No library records found</h5>
                  <p className="text-muted">This student has not borrowed any books yet.</p>
                </div>
              ) : (
                <div className="row">
                  {libraryRecords.map((record) => {
                    const bookStatus = record.returnDate 
                      ? 'returned' 
                      : isOverdue(record.dueDate, record.returnDate) 
                        ? 'overdue' 
                        : 'issued';

                    return (
                      <div className="col-xxl-4 col-md-6 d-flex" key={record._id}>
                        <div className="card mb-3 flex-fill">
                          <div className="card-body pb-1">
                            <div className="d-flex align-items-start justify-content-between mb-3">
                              <span className="avatar avatar-xl">
                                {record.bookId.coverImage ? (
                                  <img 
                                    src={record.bookId.coverImage} 
                                    className="img-fluid rounded" 
                                    alt={record.bookId.title} 
                                  />
                                ) : (
                                  <div className="avatar avatar-xl bg-light-300 rounded d-flex align-items-center justify-content-center">
                                    <i className="ti ti-book fs-24 text-muted"></i>
                                  </div>
                                )}
                              </span>
                              <span className={`badge ${getStatusBadge(bookStatus)}`}>
                                {capitalize(bookStatus)}
                              </span>
                            </div>
                            <h6 className="mb-1">{record.bookId.title}</h6>
                            {record.bookId.author && (
                              <p className="text-muted mb-3 fs-12">by {record.bookId.author}</p>
                            )}
                            <div className="row">
                              <div className="col-sm-6">
                                <div className="mb-3">
                                  <span className="fs-12 mb-1 text-muted">Book taken on</span>
                                  <p className="text-dark mb-0">{formatDate(record.issueDate)}</p>
                                </div>
                              </div>
                              <div className="col-sm-6">
                                <div className="mb-3">
                                  <span className="fs-12 mb-1 text-muted">Due Date</span>
                                  <p className={`mb-0 ${isOverdue(record.dueDate, record.returnDate) ? 'text-danger' : 'text-dark'}`}>
                                    {formatDate(record.dueDate)}
                                  </p>
                                </div>
                              </div>
                              {record.returnDate && (
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1 text-muted">Returned on</span>
                                    <p className="text-dark mb-0">{formatDate(record.returnDate)}</p>
                                  </div>
                                </div>
                              )}
                              {record.fine && record.fine > 0 && (
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1 text-muted">Fine</span>
                                    <p className="text-danger mb-0">${record.fine.toFixed(2)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentLibraryPage;
