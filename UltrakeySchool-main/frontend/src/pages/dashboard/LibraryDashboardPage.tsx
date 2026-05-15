import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import apiClient from '../../api/client'

type LibraryStats = {
  totalBooks: number
  issuedBooks: number
  overdueBooks: number
  availableBooks: number
  totalReservations: number
}

type LibraryTopBook = {
  title: string
  author: string
  timesIssued: number
}

type LibraryOverdueBook = {
  title: string
  memberName: string
  className: string
  dueDate: string
  daysOverdue: number
}

type LibraryCategory = {
  category: string
  count: number
}

const initialStats: LibraryStats = {
  totalBooks: 0,
  issuedBooks: 0,
  overdueBooks: 0,
  availableBooks: 0,
  totalReservations: 0
}

const LibraryDashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LibraryStats>(initialStats)
  const [topBooks, setTopBooks] = useState<LibraryTopBook[]>([])
  const [overdueBooks, setOverdueBooks] = useState<LibraryOverdueBook[]>([])
  const [categoryData, setCategoryData] = useState<LibraryCategory[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch library statistics
        const statsResponse = await apiClient.get('/library/dashboard/stats')
        if (statsResponse.data.success && statsResponse.data.data) {
          const payload = statsResponse.data.data
          setStats({
            totalBooks: payload.totalBooks ?? 0,
            issuedBooks: payload.issuedBooks ?? 0,
            overdueBooks: payload.overdueBooks ?? 0,
            availableBooks: payload.availableBooks ?? 0,
            totalReservations: payload.totalReservations ?? 0
          })
        }

        // Fetch top issued books
        const booksResponse = await apiClient.get('/library/dashboard/top-books')
        if (booksResponse.data.success) {
          setTopBooks(booksResponse.data.data)
        }

        // Fetch overdue books
        const overdueResponse = await apiClient.get('/library/dashboard/overdue')
        if (overdueResponse.data.success) {
          setOverdueBooks(overdueResponse.data.data)
        }

        // Fetch category distribution
        const categoryResponse = await apiClient.get('/library/dashboard/categories')
        if (categoryResponse.data.success) {
          setCategoryData(categoryResponse.data.data)
        }

      } catch (err) {
        console.error('Error fetching library data:', err)
        setError('Failed to load library dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Library Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Library</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <Link to="/library/books" className="btn btn-primary">
            <i className="ti ti-book me-1" />Books
          </Link>
          <Link to="/library/members" className="btn btn-success">
            <i className="ti ti-users me-1" />Members
          </Link>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="row mb-4">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.totalBooks}</h2>
                <p className="mb-0">Total Books</p>
                <small className="text-muted">Available copies: {stats.availableBooks}</small>
              </div>
              <div className="avatar avatar-xl bg-primary rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-books fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.issuedBooks}</h2>
                <p className="mb-0">Currently Issued</p>
                <small className="text-muted">Out to members</small>
              </div>
              <div className="avatar avatar-xl bg-success rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-book-upload fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.overdueBooks}</h2>
                <p className="mb-0">Overdue Books</p>
                <small className="text-muted">Pending return</small>
              </div>
              <div className="avatar avatar-xl bg-warning rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-alert-circle fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.totalReservations}</h2>
                <p className="mb-0">Active Reservations</p>
                <small className="text-muted">Awaiting fulfillment</small>
              </div>
              <div className="avatar avatar-xl bg-info rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-users fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY DISTRIBUTION CHART ── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Book Categories Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP ISSUED BOOKS & OVERDUE ── */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Top Issued Books</h5>
              <Link to="/library/books" className="btn btn-sm btn-primary">
                <i className="ti ti-plus me-1" />Add Book
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Times Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBooks.map((book, index) => (
                      <tr key={index}>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>
                          <span className="badge bg-primary-transparent">{book.timesIssued}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Overdue Books</h5>
              <button className="btn btn-sm btn-warning">
                <i className="ti ti-send me-1" />Send Reminders
              </button>
            </div>
            <div className="card-body">
              {overdueBooks.map((book, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <div className="fw-semibold mb-2">{book.title}</div>
                  <small className="text-muted d-block mb-1">
                    Issued to: {book.memberName} ({book.className})
                  </small>
                  <small className="text-danger">
                    <i className="ti ti-alert-triangle me-1" />
                    Due: {book.dueDate} (Overdue by {book.daysOverdue} days)
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS & RECENT ACTIVITY ── */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <Link to="/library/books" className="btn btn-light border">
                  <i className="ti ti-book me-2" />Manage Books
                </Link>
                <Link to="/library/members" className="btn btn-light border">
                  <i className="ti ti-users me-2" />Manage Members
                </Link>
                <Link to="/library/issue" className="btn btn-light border">
                  <i className="ti ti-book-upload me-2" />Issue Book
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Book Categories</h5>
            </div>
            <div className="card-body">
              {categoryData.map((category, index) => (
                <div key={index} className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                  <span>{category.category}</span>
                  <span className="badge bg-info-transparent">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibraryDashboardPage
