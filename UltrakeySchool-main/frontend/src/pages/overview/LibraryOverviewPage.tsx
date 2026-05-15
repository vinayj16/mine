import React, { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'

interface LibraryData {
  totalBooks: number;
  issuedBooks: number;
  availableBooks: number;
  members: number;
  recentIssues: Array<{
    id: string;
    bookName: string;
    borrower: string;
    issueDate: string;
    dueDate: string;
    status: 'issued' | 'returned';
  }>;
}

const LibraryOverviewPage: React.FC = () => {
  const [data, setData] = useState<LibraryData>({
    totalBooks: 0,
    issuedBooks: 0,
    availableBooks: 0,
    members: 0,
    recentIssues: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLibraryData()
  }, [])

  const fetchLibraryData = async () => {
    try {
      setLoading(true)
      try {
        const response = await apiClient.get('/library/overview')
        if (response.data?.success && response.data?.data) {
          const apiData = response.data.data
          // Validate and ensure arrays exist
          setData({
            totalBooks: apiData.totalBooks || 0,
            issuedBooks: apiData.issuedBooks || 0,
            availableBooks: apiData.availableBooks || 0,
            members: apiData.members || 0,
            recentIssues: Array.isArray(apiData.recentIssues) ? apiData.recentIssues : []
          })
        }
      } catch {
        // Use demo data - already set as initial state
      }
    } catch (err: any) {
      console.error('Error fetching library data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Library Overview</h4>
          <p className="text-muted mb-0">Library statistics and recent activity</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5>{data.totalBooks.toLocaleString()}</h5>
              <p className="mb-0">Total Books</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5>{data.issuedBooks.toLocaleString()}</h5>
              <p className="mb-0">Issued Books</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5>{data.availableBooks.toLocaleString()}</h5>
              <p className="mb-0">Available Books</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5>{data.members.toLocaleString()}</h5>
              <p className="mb-0">Members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5>Recent Book Issues</h5>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>Book Name</th>
                <th>Borrower</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentIssues.map(issue => (
                <tr key={issue.id}>
                  <td>{issue.bookName}</td>
                  <td>{issue.borrower}</td>
                  <td>{new Date(issue.issueDate).toLocaleDateString()}</td>
                  <td>{new Date(issue.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${issue.status === 'issued' ? 'bg-warning' : 'bg-success'}`}>
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LibraryOverviewPage
