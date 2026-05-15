import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import branchService, { type Branch } from '../../services/branchService'
import { studentService, type Student, type StudentFilters } from '../../services/studentService'

const BranchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchBranch()
      fetchStudents()
    }
  }, [id])

  const fetchBranch = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await branchService.getBranchById(id!)
      setBranch(data)
    } catch (err: any) {
      console.error('Failed to fetch branch:', err)
      setError(err.response?.data?.message || 'Failed to load branch details')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true)
      setStudents([])
      
      // Get students for this branch - using the studentService
      const response = await studentService.getAll({
        limit: 100, // Get more students for branch details
        // Note: If the API doesn't support branch filter, this would need to be adjusted
      } as StudentFilters & { branchId?: string })
      
      // For now, get all students and assume they belong to this branch
      // In a real implementation, you would filter by branchId or use a specific endpoint
      setStudents(response.data as unknown as Student[])
    } catch (err: any) {
      console.error('Failed to fetch students:', err)
      setStudents(err.response?.data?.message || 'Failed to load students')
    } finally {
      setStudentsLoading(false)
    }
  }
function setStudentsLoading(_arg0: boolean) {
  throw new Error('Function not implemented.')
}

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'bg-success' : 'bg-warning'
  }

  const getStudentName = (student: Student) => {
    return `${student.firstName} ${student.lastName}`
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

  if (error || !branch) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="ti ti-alert-circle me-2"></i>
        {error || 'Branch not found'}
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Branch Details</h3>
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
              <li className="breadcrumb-item active" aria-current="page">{branch.name}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <Link to="/super-admin/branches" className="btn btn-outline-light bg-white btn-icon me-1">
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
          <Link to={`/super-admin/branches/${id}/edit`} className="btn btn-primary me-2 mb-2">
            <i className="ti ti-edit me-2"></i>Edit Branch
          </Link>
        </div>
      </div>

      {/* Branch Overview Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Branch Overview</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-git-branch text-primary"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{branch.name}</h4>
                      <p className="text-muted mb-0">Branch Name</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-hash text-info"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{branch.code}</h4>
                      <p className="text-muted mb-0">Branch Code</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className={`ti ti-shield text-${branch.status === 'Active' ? 'success' : 'warning'}`}></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{branch.status}</h4>
                      <p className="text-muted mb-0">Status</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-xl me-3">
                      <i className="ti ti-users text-primary"></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{branch.students}</h4>
                      <p className="text-muted mb-0">Total Students</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Institution Information</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Institution Name</label>
                    <div className="form-control">{branch.institutionName}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Institution Type</label>
                    <div className="form-control">{branch.institutionType}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Institution ID</label>
                    <div className="form-control">{branch.institutionId}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <div className="form-control">
                      {branch.address?.street && `${branch.address.street}, `}
                      {branch.address?.city}, {branch.address?.state}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <div className="form-control">{branch.address?.city}, {branch.address?.state}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Created Date</label>
                    <div className="form-control">{new Date(branch.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Students ({students.length})</h4>
              <div className="d-flex align-items-center">
                <Link to={`/super-admin/branches/${id}/students`} className="btn btn-primary me-2">
                  <i className="ti ti-users me-2"></i>Manage Students
                </Link>
                <button className="btn btn-outline-light bg-white btn-icon" onClick={() => { fetchBranch(); fetchStudents(); }}>
                  <i className="ti ti-refresh"></i>
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Roll Number</th>
                      <th>Grade</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-2">
                              <i className="ti ti-user text-primary"></i>
                            </div>
                            <div className="fw-medium">{getStudentName(student)}</div>
                          </div>
                        </td>
                        <td>{student.email}</td>
                        <td>{student.rollNumber}</td>
                        <td>{student.class}</td>
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
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default BranchDetailsPage

