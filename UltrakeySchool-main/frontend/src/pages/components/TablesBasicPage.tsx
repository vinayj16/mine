import React, { useState } from 'react'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'Active' | 'Inactive' | 'Pending'
  joinDate: string
  lastLogin: string
}

const TablesBasicPage: React.FC = () => {
  const [users] = useState<User[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Administrator',
      status: 'Active',
      joinDate: '2023-01-15',
      lastLogin: '2024-06-15 10:30 AM'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Teacher',
      status: 'Active',
      joinDate: '2023-02-20',
      lastLogin: '2024-06-14 09:15 AM'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'Student',
      status: 'Inactive',
      joinDate: '2023-03-10',
      lastLogin: '2024-06-10 02:45 PM'
    },
    {
      id: 4,
      name: 'Alice Williams',
      email: 'alice.williams@example.com',
      role: 'Teacher',
      status: 'Active',
      joinDate: '2023-04-05',
      lastLogin: '2024-06-15 11:20 AM'
    },
    {
      id: 5,
      name: 'Charlie Brown',
      email: 'charlie.brown@example.com',
      role: 'Student',
      status: 'Pending',
      joinDate: '2023-05-12',
      lastLogin: '2024-06-13 03:30 PM'
    },
    {
      id: 6,
      name: 'Diana Prince',
      email: 'diana.prince@example.com',
      role: 'Administrator',
      status: 'Active',
      joinDate: '2023-06-18',
      lastLogin: '2024-06-15 08:45 AM'
    },
    {
      id: 7,
      name: 'Edward Norton',
      email: 'edward.norton@example.com',
      role: 'Teacher',
      status: 'Active',
      joinDate: '2023-07-22',
      lastLogin: '2024-06-14 04:15 PM'
    },
    {
      id: 8,
      name: 'Fiona Green',
      email: 'fiona.green@example.com',
      role: 'Student',
      status: 'Active',
      joinDate: '2023-08-30',
      lastLogin: '2024-06-15 12:00 PM'
    }
  ])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: 'bg-success',
      Inactive: 'bg-danger',
      Pending: 'bg-warning'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Basic Tables</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">Tables</li>
              <li className="breadcrumb-item active" aria-current="page">Basic Tables</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Basic Table */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Basic Table</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.joinDate}</td>
                    <td>{user.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Striped Table */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Striped Table</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button type="button" className="btn btn-sm btn-outline-primary">
                          <i className="ti ti-eye"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-success">
                          <i className="ti ti-edit"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger">
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bordered Table */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Bordered Table</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 4).map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hover Table */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Hover Table</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 6).map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-primary">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dark Table */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Dark Table</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-dark">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 4).map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Responsive Table</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.joinDate}</td>
                    <td>{user.lastLogin}</td>
                    <td>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          Actions
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <a className="dropdown-item" href="#">
                              <i className="ti ti-eye me-2"></i>View
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="#">
                              <i className="ti ti-edit me-2"></i>Edit
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="#">
                              <i className="ti ti-trash me-2"></i>Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Info */}
          <div className="row mt-3">
            <div className="col-sm-12 col-md-5">
              <div className="dataTables_info">
                Showing 1 to {users.length} of {users.length} entries
              </div>
            </div>
            <div className="col-sm-12 col-md-7">
              <div className="dataTables_paginate paging_simple_numbers">
                <ul className="pagination">
                  <li className="paginate_button page-item previous disabled">
                    <a href="#" className="page-link">Previous</a>
                  </li>
                  <li className="paginate_button page-item active">
                    <a href="#" className="page-link">1</a>
                  </li>
                  <li className="paginate_button page-item">
                    <a href="#" className="page-link">2</a>
                  </li>
                  <li className="paginate_button page-item">
                    <a href="#" className="page-link">3</a>
                  </li>
                  <li className="paginate_button page-item next">
                    <a href="#" className="page-link">Next</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TablesBasicPage
