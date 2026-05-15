import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface BookStatistics {
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  overdueBooks: number;
  lostBooks: number;
  damagedBooks: number;
}

interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembersThisMonth: number;
}

const LibraryReportPage: React.FC = () => {
  const [bookStats, setBookStats] = useState<BookStatistics>({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    lostBooks: 0,
    damagedBooks: 0
  });

  const [memberStats, setMemberStats] = useState<MemberStatistics>({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    newMembersThisMonth: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryStats();
  }, []);

  const fetchLibraryStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/library/stats');
      
      if (response.data.success) {
        const stats = response.data.data;
        
        setBookStats({
          totalBooks: stats.totalBooks || 0,
          availableBooks: stats.availableBooks || 0,
          issuedBooks: stats.issuedBooks || 0,
          overdueBooks: stats.overdueBooks || 0,
          lostBooks: stats.lostBooks || 0,
          damagedBooks: stats.damagedBooks || 0
        });
        
        setMemberStats({
          totalMembers: stats.totalMembers || 0,
          activeMembers: stats.activeMembers || 0,
          inactiveMembers: stats.inactiveMembers || 0,
          newMembersThisMonth: stats.newMembersThisMonth || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching library stats:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch library statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
          <h4 className="mb-3">Error Loading Library Statistics</h4>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchLibraryStats}>
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
          <h3 className="page-title mb-1">Library Reports</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active" aria-current="page">
                Library Report
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchLibraryStats} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary d-flex align-items-center mb-2">
            <i className="ti ti-file-export me-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Total Books</p>
                  <h4 className="mb-0">{bookStats.totalBooks}</h4>
                </div>
                <div className="avatar avatar-md bg-primary-transparent">
                  <i className="ti ti-book text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Issued Books</p>
                  <h4 className="mb-0">{bookStats.issuedBooks}</h4>
                </div>
                <div className="avatar avatar-md bg-info-transparent">
                  <i className="ti ti-arrow-up-right text-info" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Overdue Books</p>
                  <h4 className="mb-0 text-danger">{bookStats.overdueBooks}</h4>
                </div>
                <div className="avatar avatar-md bg-danger-transparent">
                  <i className="ti ti-alert-triangle text-danger" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Active Members</p>
                  <h4 className="mb-0">{memberStats.activeMembers}</h4>
                </div>
                <div className="avatar avatar-md bg-success-transparent">
                  <i className="ti ti-users text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Book Status Distribution</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Available Books</span>
                  <span className="fw-medium">{bookStats.availableBooks}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${(bookStats.availableBooks / bookStats.totalBooks) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Issued Books</span>
                  <span className="fw-medium">{bookStats.issuedBooks}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{ width: `${(bookStats.issuedBooks / bookStats.totalBooks) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Overdue Books</span>
                  <span className="fw-medium text-danger">{bookStats.overdueBooks}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-danger" 
                    style={{ width: `${(bookStats.overdueBooks / bookStats.totalBooks) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Lost Books</span>
                  <span className="fw-medium">{bookStats.lostBooks}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${(bookStats.lostBooks / bookStats.totalBooks) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-0">
                <div className="d-flex justify-content-between mb-2">
                  <span>Damaged Books</span>
                  <span className="fw-medium">{bookStats.damagedBooks}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-secondary" 
                    style={{ width: `${(bookStats.damagedBooks / bookStats.totalBooks) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Member Statistics</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Total Members</span>
                  <h4 className="mb-0">{memberStats.totalMembers}</h4>
                </div>
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Active Members</span>
                  <h4 className="mb-0 text-success">{memberStats.activeMembers}</h4>
                </div>
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Inactive Members</span>
                  <h4 className="mb-0 text-secondary">{memberStats.inactiveMembers}</h4>
                </div>
              </div>
              <div className="mb-0">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>New This Month</span>
                  <h4 className="mb-0 text-primary">{memberStats.newMembersThisMonth}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Quick Actions</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <Link to="/library/books" className="btn btn-outline-primary w-100">
                <i className="ti ti-book me-2"></i>
                View All Books
              </Link>
            </div>
            <div className="col-md-3 mb-3">
              <Link to="/library/issue-book" className="btn btn-outline-info w-100">
                <i className="ti ti-arrow-up-right me-2"></i>
                View Issued Books
              </Link>
            </div>
            <div className="col-md-3 mb-3">
              <Link to="/library/members" className="btn btn-outline-success w-100">
                <i className="ti ti-users me-2"></i>
                View Members
              </Link>
            </div>
            <div className="col-md-3 mb-3">
              <button className="btn btn-outline-danger w-100" onClick={() => {
                // Navigate to overdue books or filter issued books
                window.location.href = '/library/issue-book?filter=overdue';
              }}>
                <i className="ti ti-alert-triangle me-2"></i>
                View Overdue Books
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LibraryReportPage;
