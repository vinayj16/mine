import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { studentService, type Student } from '../../services/studentService'

const BranchStudentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        // For branch-specific students, we might need a different endpoint
        // For now, fetching all students and filtering by branch if needed
        const response = await studentService.getAll({
          limit: 100, // Get more students for branch view
          // TODO: Add branchId filter when backend supports it
        })
        setStudents(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [id])

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  const handleSelectAll = () => {
    setSelectedStudents(filteredStudents.map(student => student.id))
  }

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesStatus = filterStatus === 'all' || student.status === filterStatus
      const matchesGrade = filterGrade === 'all' || student.class === filterGrade
      const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesStatus && matchesGrade && matchesSearch
    })
  }, [students, filterStatus, filterGrade, searchTerm])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: 'bg-success',
      inactive: 'bg-warning',
      graduated: 'bg-info',
      transferred: 'bg-secondary'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-secondary'
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await studentService.delete(studentId)
        setStudents(students.filter(s => s.id !== studentId))
      } catch (err) {
        console.error('Failed to delete student:', err)
        alert('Failed to delete student')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} selected students? This action cannot be undone.`)) {
      try {
        await studentService.bulkDelete(selectedStudents)
        setStudents(students.filter(s => !selectedStudents.includes(s.id)))
        setSelectedStudents([])
      } catch (err) {
        console.error('Failed to delete students:', err)
        alert('Failed to delete selected students')
      }
    }
  }

  const handleToggleStatus = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId)
      if (!student) return

      const newStatus = student.status === 'active' ? 'inactive' : 'active'
      await studentService.update(studentId, { status: newStatus })
      
      // Refresh students data
      const response = await studentService.getAll({ limit: 100 })
      setStudents(response.data)
    } catch (err) {
      console.error('Failed to toggle student status:', err)
      alert('Failed to toggle student status')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
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

  const selectedCount = selectedStudents.length
  const totalCount = filteredStudents.length

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Branch Students</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/institutions">Institutions</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/super-admin/branches">Branches</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/super-admin/branches/${id}`}>Main Branch</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Students</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <Link to={`/super-admin/branches/${id}`} className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-arrow-left"></i>
            </Link>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="btn btn-light fw-medium dropdown-toggle" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item">
                  <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item">
                  <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <button className="btn btn-primary me-2 mb-2">
            <i className="ti ti-user-plus me-2"></i>Add Student
          </button>
          {selectedCount > 0 && (
            <div className="dropdown me-2 mb-2">
              <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-settings me-2"></i>
                Actions ({selectedCount})
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                <li>
                  <button className="dropdown-item" onClick={() => {
                    selectedStudents.forEach(id => handleToggleStatus(id))
                  }}>
                    <i className="ti ti-user-check me-2"></i>Activate Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => {
                    selectedStudents.forEach(id => handleToggleStatus(id))
                  }}>
                    <i className="ti ti-user-x me-2"></i>Deactivate Selected
                  </button>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleBulkDelete}>
                    <i className="ti ti-trash me-2"></i>Delete Selected
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item text-danger">
                    <i className="ti ti-x me-2"></i>Clear Selection
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{students.length}</h4>
                  <p className="text-white mb-0">Total Students</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-users text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{students.filter(s => s.status === 'active').length}</h4>
                  <p className="text-white mb-0">Active Students</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-check text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{students.filter(s => s.status === 'inactive').length}</h4>
                  <p className="text-white mb-0">Inactive Students</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-user-x text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-1">{students.filter(s => s.status === 'graduated').length}</h4>
                  <p className="text-white mb-0">Graduated Students</p>
                </div>
                <div className="avatar avatar-lg bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-graduation-cap text-white fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Filters</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Search</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search students, roll numbers, emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="ti ti-search"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Grade</label>
                <select
                  className="form-select"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                >
                  <option value="all">All Grades</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  {/* TODO: Get grades from API */}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h4 className="card-title">Students ({filteredStudents.length})</h4>
          <div className="d-flex align-items-center">
            {selectedCount > 0 && (
              <span className="badge bg-primary me-2">
                {selectedCount} selected
              </span>
            )}
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="selectAll"
                checked={selectedCount === totalCount && totalCount > 0}
                onChange={handleSelectAll}
              />
              <label className="form-check-label" htmlFor="selectAll">
                Select All
              </label>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="w-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="headerSelectAll"
                        checked={selectedCount === totalCount && totalCount > 0}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label" htmlFor="headerSelectAll"></label>
                    </div>
                  </th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                        />
                        <label className="form-check-label"></label>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="ti ti-user text-primary"></i>
                        </div>
                        <div className="fw-medium">{student.firstName} {student.lastName}</div>
                      </div>
                    </td>
                    <td>{student.rollNumber}</td>
                    <td>{student.class}</td>
                    <td>{student.section || 'N/A'}</td>
                    <td>{student.email}</td>
                    <td>{student.phone}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button className="dropdown-item">
                              <i className="ti ti-eye me-2"></i>View Details
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item">
                              <i className="ti ti-edit me-2"></i>Edit Student
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item">
                              <i className="ti ti-file-text me-2"></i>View Reports
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button 
                              className={`dropdown-item ${student.status === 'active' ? 'text-warning' : 'text-success'}`}
                              onClick={() => handleToggleStatus(student.id)}
                            >
                              <i className={`ti ti-${student.status === 'active' ? 'user-x' : 'user-check'} me-2`}></i>
                              {student.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteStudent(student.id)}>
                              <i className="ti ti-trash me-2"></i>Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Showing {filteredStudents.length} of {students.length} students
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className="page-item disabled">
                  <a className="page-link" href="#" tabIndex={-1}>
                    <i className="ti ti-chevron-left"></i>
                  </a>
                </li>
                <li className="page-item active">
                  <a className="page-link" href="#">1</a>
                </li>
                <li className="page-item">
                  <a className="page-link" href="#">2</a>
                </li>
                <li className="page-item">
                  <a className="page-link" href="#">
                    <i className="ti ti-chevron-right"></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default BranchStudentsPage
