import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import apiClient from '../../api/client'
import { useAuth } from '../../store/authStore'
import InstitutionDetailsCard from '../../components/dashboard/InstitutionDetailsCard'

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
  availableCopies: number
  timesIssued?: number
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
  const { user, institutionData } = useAuth();
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
         setError(null)

         const [statsResult, booksResult, overdueResult] = await Promise.allSettled([
           apiClient.get('/library/statistics'),
           apiClient.get('/library', { params: { limit: 50 } }),
           apiClient.get('/library/overdue')
         ])

         if (statsResult.status === 'fulfilled' && statsResult.value.data.success) {
           const payload = statsResult.value.data.data
           setStats({
             totalBooks: payload.totalBooks ?? 0,
             issuedBooks: payload.issuedBooks ?? 0,
             overdueBooks: payload.overdueBooks ?? 0,
             availableBooks: payload.availableBooks ?? 0,
             totalReservations: payload.bookreservations ?? payload.totalReservations ?? 0
           })
         } else {
           setError('Some library metrics could not be loaded. Showing the available data.')
         }

         if (booksResult.status === 'fulfilled' && booksResult.value.data.success) {
           const books = Array.isArray(booksResult.value.data.data)
             ? booksResult.value.data.data
             : booksResult.value.data.data?.books || []

           const computedCategories: Record<string, number> = {}
           const mappedTopBooks = books.slice(0, 5).map((book: any) => {
             if (book.category) {
               computedCategories[book.category] = (computedCategories[book.category] || 0) + 1
             }
             return {
               title: book.title || 'Untitled',
               author: book.author || 'Unknown',
               availableCopies: typeof book.availableCopies === 'number' ? book.availableCopies : 0,
               timesIssued: typeof book.timesIssued === 'number' ? book.timesIssued : undefined
             }
           })

           const categoriesList = Object.entries(computedCategories).map(([category, count]) => ({ category, count }))
           setTopBooks(mappedTopBooks)
           setCategoryData(categoriesList)
         } else {
           setCategoryData([])
         }

         if (overdueResult.status === 'fulfilled' && overdueResult.value.data.success) {
           const overdueList = Array.isArray(overdueResult.value.data.data)
             ? overdueResult.value.data.data
             : overdueResult.value.data.data?.issues || []

           setOverdueBooks(
             overdueList.map((issue: any) => ({
               title: issue.title || issue.book?.title || 'Unknown Book',
               memberName: issue.memberName || issue.user?.name || 'Unknown Member',
               className: issue.className || issue.user?.className || 'N/A',
               dueDate: issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'N/A',
               daysOverdue: issue.daysOverdue ?? issue.overdueDays ?? 0
             }))
           )
         }
       } catch (err) {
         console.error('Error fetching library data:', err)
         setError('Unable to load some library dashboard data. Please refresh or check your connection.')
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

  return (
    <div>
      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <InstitutionDetailsCard 
        institution={institutionData || user?.institutionData} 
        userRole={user?.role}
      />

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
           <Link to="/library/issues" className="btn btn-primary">
             <i className="ti ti-book-upload me-1" />Issue Book
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

       {/* ── LIBRARY ANALYTICS ── */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Library Analytics</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <div className="card text-white bg-primary mb-3">
                      <div className="card-body">
                        <h5 className="card-title">Issued Percentage</h5>
                        <p className="card-text display-4">
                          {stats.totalBooks > 0 ? ((stats.issuedBooks / stats.totalBooks) * 100).toFixed(1) + '%' : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-white bg-success mb-3">
                      <div className="card-body">
                        <h5 className="card-title">Available Percentage</h5>
                        <p className="card-text display-4">
                          {stats.totalBooks > 0 ? ((stats.availableBooks / stats.totalBooks) * 100).toFixed(1) + '%' : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-white bg-warning mb-3">
                      <div className="card-body">
                        <h5 className="card-title">Overdue Percentage</h5>
                        <p className="card-text display-4">
                          {stats.issuedBooks > 0 ? ((stats.overdueBooks / stats.issuedBooks) * 100).toFixed(1) + '%' : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-white bg-info mb-3">
                      <div className="card-body">
                        <h5 className="card-title">Avg Days Overdue</h5>
                        <p className="card-text display-4">
                          {overdueBooks.length > 0 ? 
                            (overdueBooks.reduce((sum, book) => sum + book.daysOverdue, 0) / overdueBooks.length).toFixed(1) 
                            : '0'}
                        </p>
                      </div>
                    </div>
                  </div>
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
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">No category data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP BOOKS & OVERDUE ── */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Popular Books</h5>
              <Link to="/dashboard/library/books" className="btn btn-sm btn-primary">
                <i className="ti ti-book-open me-1" />View Books
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBooks.length > 0 ? (
                      topBooks.map((book, index) => (
                        <tr key={index}>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>
                            <span className="badge bg-primary-transparent">{book.availableCopies}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          No books available to display.
                        </td>
                      </tr>
                    )}
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
              {overdueBooks.length > 0 ? (
                overdueBooks.map((book, index) => (
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
                ))
              ) : (
                <div className="text-center text-muted py-5">No overdue books at the moment.</div>
              )}
            </div>
          </div>
        </div>
      </div>

       {/* ── QUICK ACTIONS & CATEGORY LIST ── */}
       <div className="row">
         <div className="col-md-6">
           <div className="card">
             <div className="card-header">
               <h5 className="card-title mb-0">Quick Actions</h5>
             </div>
             <div className="card-body">
               <div className="d-flex flex-column gap-2">
                 <Link to="/dashboard/library/books" className="btn btn-light border">
                   <i className="ti ti-book me-2" />Add Book
                 </Link>
                 <Link to="/dashboard/library/books" className="btn btn-light border">
                   <i className="ti ti-book-open me-2" />Manage Books
                 </Link>
                 <Link to="/dashboard/library/members" className="btn btn-light border">
                   <i className="ti ti-users me-2" />Manage Members
                 </Link>
                 <Link to="/dashboard/library/issue" className="btn btn-light border">
                   <i className="ti ti-book-upload me-2" />Issue Book to Member
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
              {categoryData.length > 0 ? (
                categoryData.map((category, index) => (
                  <div key={index} className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                    <span>{category.category}</span>
                    <span className="badge bg-info-transparent">{category.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-5">No categories found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibraryDashboardPage
