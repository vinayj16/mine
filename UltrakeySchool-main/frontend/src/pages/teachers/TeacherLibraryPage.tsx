import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import TeacherDetailTabs from '../../components/teachers/TeacherDetailTabs';

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
}

interface User {
  _id: string;
  name: string;
}

interface LibraryRecord {
  _id: string;
  bookId: Book;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue' | 'lost';
  issuedBy: User;
  returnedTo?: User;
  fineAmount: number;
  finePaid: boolean;
  remarks?: string;
  createdAt: string;
}

interface LibraryStats {
  issued: number;
  returned: number;
  overdue: number;
  lost: number;
  totalFine: number;
  unpaidFine: number;
}

interface TeacherProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: string;
}

const TeacherLibraryPage = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [libraryRecords, setLibraryRecords] = useState<LibraryRecord[]>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({
    issued: 0,
    returned: 0,
    overdue: 0,
    lost: 0,
    totalFine: 0,
    unpaidFine: 0
  });
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const schoolId = '507f1f77bcf86cd799439011'; // This should come from auth context

  useEffect(() => {
    if (teacherId) {
      fetchTeacherProfile();
      fetchLibraryRecords();
    }
  }, [teacherId, statusFilter]);

  const fetchTeacherProfile = async () => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      if (response.data.success) {
        setTeacherProfile(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch teacher profile:', error);
    }
  };

  const fetchLibraryRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/teachers/${teacherId}/library`, {
        params: {
          schoolId,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });

      if (response.data.success) {
        setLibraryRecords(response.data.data.records || []);
        setLibraryStats(response.data.data.stats || {
          issued: 0,
          returned: 0,
          overdue: 0,
          lost: 0,
          totalFine: 0,
          unpaidFine: 0
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch library records';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return 'badge-soft-info';
      case 'returned':
        return 'badge-soft-success';
      case 'overdue':
        return 'badge-soft-danger';
      case 'lost':
        return 'badge-soft-warning';
      default:
        return 'badge-soft-secondary';
    }
  };

  const isOverdue = (record: LibraryRecord) => {
    if (record.status === 'issued' && record.dueDate) {
      return new Date() > new Date(record.dueDate);
    }
    return false;
  };

  // Loading state
  if (loading && libraryRecords.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && libraryRecords.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Library Records</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchLibraryRecords}>
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
          <h3 className="page-title mb-1">Teacher Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/teachers">Teachers</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Teacher Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2" type="button">
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <Link to={`/teachers/${teacherId}/edit`} className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-edit-circle me-2" />
            Edit Teacher
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-3 col-xl-4">
          {/* Teacher Profile Sidebar */}
          {teacherProfile && (
            <div className="card border-white">
              <div className="card-header">
                <div className="d-flex align-items-center flex-wrap row-gap-3">
                  <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0">
                    <img 
                      src={teacherProfile.photo || `https://ui-avatars.com/api/?name=${teacherProfile.firstName}+${teacherProfile.lastName}&background=random`} 
                      className="img-fluid rounded-circle" 
                      alt={`${teacherProfile.firstName} ${teacherProfile.lastName}`} 
                    />
                  </div>
                  <div>
                    <h5 className="mb-1 text-truncate">{teacherProfile.firstName} {teacherProfile.lastName}</h5>
                    <p className="text-primary mb-1">{teacherProfile._id.slice(-6)}</p>
                    <p className="mb-0">{teacherProfile.designation}</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <h5 className="mb-3">Contact Information</h5>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-phone" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.phone}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-mail" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.email}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-0">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-building" />
                  </span>
                  <div>
                    <p className="text-dark mb-0">{teacherProfile.department}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="col-xxl-9 col-xl-8">
          <TeacherDetailTabs active="library" />

          {/* Library Statistics Cards */}
          <div className="row">
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Issued</p>
                  <h5>{libraryStats.issued}</h5>
                </div>
                <span className="avatar avatar-lg bg-info-transparent rounded flex-shrink-0 text-info">
                  <i className="ti ti-book fs-24" />
                </span>
              </div>
            </div>
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Returned</p>
                  <h5>{libraryStats.returned}</h5>
                </div>
                <span className="avatar avatar-lg bg-success-transparent rounded flex-shrink-0 text-success">
                  <i className="ti ti-book-2 fs-24" />
                </span>
              </div>
            </div>
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Overdue</p>
                  <h5>{libraryStats.overdue}</h5>
                </div>
                <span className="avatar avatar-lg bg-danger-transparent rounded flex-shrink-0 text-danger">
                  <i className="ti ti-alert-circle fs-24" />
                </span>
              </div>
            </div>
            <div className="col-md-6 col-xxl-3 d-flex">
              <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white w-100">
                <div className="ms-2">
                  <p className="mb-1">Unpaid Fine</p>
                  <h5>{formatCurrency(libraryStats.unpaidFine)}</h5>
                </div>
                <span className="avatar avatar-lg bg-warning-transparent rounded flex-shrink-0 text-warning">
                  <i className="ti ti-currency-rupee fs-24" />
                </span>
              </div>
            </div>
          </div>

          {/* Library Records */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Library Records</h4>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <select 
                  className="form-select mb-3" 
                  style={{ width: 'auto' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="issued">Issued</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                  <option value="lost">Lost</option>
                </select>
                <button 
                  className="btn btn-outline-light bg-white mb-3"
                  onClick={fetchLibraryRecords}
                >
                  <i className="ti ti-refresh me-2" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body pb-1">
              {/* Empty State */}
              {libraryRecords.length === 0 && !loading && (
                <div className="text-center py-5">
                  <i className="ti ti-books-off fs-1 text-muted mb-3"></i>
                  <h5 className="mb-2">No Library Records Found</h5>
                  <p className="text-muted mb-4">
                    {statusFilter !== 'all' 
                      ? `No ${statusFilter} books found for this teacher` 
                      : 'This teacher has not borrowed any books yet'}
                  </p>
                </div>
              )}

              {/* Library Records Grid */}
              {libraryRecords.length > 0 && (
                <div className="row">
                  {libraryRecords.map((record) => (
                    <div className="col-xxl-4 col-md-6 d-flex" key={record._id}>
                      <div className="card mb-3 flex-fill">
                        <div className="card-body">
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <span className="avatar avatar-xl bg-light-300 rounded flex-shrink-0">
                              <i className="ti ti-book-2 fs-24 text-primary" />
                            </span>
                            <span className={`badge ${getStatusBadge(record.status)} d-inline-flex align-items-center`}>
                              <i className="ti ti-circle-filled fs-5 me-1"></i>
                              {record.status}
                            </span>
                          </div>
                          <h6 className="mb-2">{record.bookId.title}</h6>
                          <p className="text-muted mb-3 fs-12">
                            by {record.bookId.author} • {record.bookId.category}
                          </p>
                          <div className="row">
                            <div className="col-sm-6">
                              <div className="mb-3">
                                <span className="fs-12 mb-1 text-muted d-block">Issue Date</span>
                                <p className="text-dark mb-0">{formatDate(record.issueDate)}</p>
                              </div>
                            </div>
                            <div className="col-sm-6">
                              <div className="mb-3">
                                <span className="fs-12 mb-1 text-muted d-block">Due Date</span>
                                <p className={`mb-0 ${isOverdue(record) ? 'text-danger fw-medium' : 'text-dark'}`}>
                                  {formatDate(record.dueDate)}
                                  {isOverdue(record) && <i className="ti ti-alert-circle ms-1"></i>}
                                </p>
                              </div>
                            </div>
                            {record.returnDate && (
                              <div className="col-sm-6">
                                <div className="mb-3">
                                  <span className="fs-12 mb-1 text-muted d-block">Return Date</span>
                                  <p className="text-dark mb-0">{formatDate(record.returnDate)}</p>
                                </div>
                              </div>
                            )}
                            {record.fineAmount > 0 && (
                              <div className="col-sm-6">
                                <div className="mb-3">
                                  <span className="fs-12 mb-1 text-muted d-block">Fine Amount</span>
                                  <p className={`mb-0 ${record.finePaid ? 'text-success' : 'text-danger'} fw-medium`}>
                                    {formatCurrency(record.fineAmount)}
                                    {record.finePaid && <i className="ti ti-check ms-1"></i>}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          {record.remarks && (
                            <div className="mt-2">
                              <span className="fs-12 text-muted d-block mb-1">Remarks</span>
                              <p className="text-dark mb-0 fs-12">{record.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherLibraryPage;
