import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StudentManagementApiService } from '../../../api/adminService';

interface AdmissionData {
  overview: {
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    currentSession: string;
    availableSeats: number;
    admissionFee: number;
  };
  applications: {
    id: string;
    applicationId: string;
    studentName: string;
    dateOfBirth: string;
    gender: string;
    gradeApplying: string;
    previousSchool: string;
    fatherName: string;
    motherName: string;
    parentPhone: string;
    parentEmail: string;
    address: string;
    applicationDate: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Admitted';
    documents: {
      birthCertificate: boolean;
      transferCertificate: boolean;
      marksheet: boolean;
      photo: boolean;
    };
    interviewScheduled: boolean;
    interviewDate?: string;
    notes?: string;
  }[];
  gradeAvailability: {
    grade: string;
    totalSeats: number;
    availableSeats: number;
    filledSeats: number;
    waitingList: number;
  }[];
}

const AdminAddStudentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [admissionData, setAdmissionData] = useState<AdmissionData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchAdmissionData();
  }, [selectedGrade, selectedStatus]);

  const fetchAdmissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch all admission data in parallel
      const [
        applications,
        gradeAvailability
      ] = await Promise.all([
        StudentManagementApiService.getAdmissionOverview(),
        StudentManagementApiService.getAdmissionApplications(selectedGrade, selectedStatus),
        StudentManagementApiService.getGradeAvailability()
      ]);

      setAdmissionData({
      overview:{
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          currentSession: '2024-2025',
          availableSeats: 0,
          admissionFee: 0
        },
        applications: (applications as any[]) || [],
        gradeAvailability: (gradeAvailability as any[]) || [
          { grade: 'Grade 1', totalSeats: 40, availableSeats: 0, filledSeats: 0, waitingList: 0 },
          { grade: 'Grade 2', totalSeats: 40, availableSeats: 0, filledSeats: 0, waitingList: 0 },
          { grade: 'Grade 3', totalSeats: 40, availableSeats: 0, filledSeats: 0, waitingList: 0 },
          { grade: 'Grade 4', totalSeats: 40, availableSeats: 0, filledSeats: 0, waitingList: 0 },
          { grade: 'Grade 5', totalSeats: 40, availableSeats: 0, filledSeats: 0, waitingList: 0 }
        ]
      });

    } catch (error: any) {
      console.error('Error fetching admission data:', error);
      
      // Set empty data on error
      setAdmissionData({
        overview: {
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          currentSession: '2024-2025',
          availableSeats: 0,
          admissionFee: 0
        },
        applications: [],
        gradeAvailability: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewAdmission = () => {
    // Handle new admission logic
    console.log('Starting new admission process...');
  };

  const filteredApplications = admissionData?.applications.filter(application => {
    const matchesGrade = selectedGrade === 'all' || application.gradeApplying === selectedGrade;
    const matchesStatus = selectedStatus === 'all' || application.status === selectedStatus;
    return matchesGrade && matchesStatus;
  }) || [];

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
          <h3 className="page-title mb-1">Add Student</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item">Students</li>
              <li className="breadcrumb-item active">Add Student</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchAdmissionData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleNewAdmission}>
            <i className="ti ti-user-plus me-2"></i>New Admission
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{admissionData?.overview.totalApplications}</h4>
                  <p className="mb-0">Total Applications</p>
                  <small>Session {admissionData?.overview.currentSession}</small>
                </div>
                <i className="ti ti-file-text fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{admissionData?.overview.pendingApplications}</h4>
                  <p className="mb-0">Pending</p>
                  <small>Under review</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{admissionData?.overview.approvedApplications}</h4>
                  <p className="mb-0">Approved</p>
                  <small>Ready for admission</small>
                </div>
                <i className="ti ti-check-circle fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{admissionData?.overview.availableSeats}</h4>
                  <p className="mb-0">Available Seats</p>
                  <small>Across all grades</small>
                </div>
                <i className="ti ti-chair fs-24"></i>
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
              <h5 className="card-title">Admission Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'applications' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('applications')}
                >
                  <i className="ti ti-list me-2"></i>
                  Applications
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'new' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('new')}
                >
                  <i className="ti ti-user-plus me-2"></i>
                  New Admission
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'availability' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('availability')}
                >
                  <i className="ti ti-chair me-2"></i>
                  Seat Availability
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'interviews' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('interviews')}
                >
                  <i className="ti ti-message me-2"></i>
                  Interviews
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'settings' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('settings')}
                >
                  <i className="ti ti-settings me-2"></i>
                  Admission Settings
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
                    <h5 className="card-title mb-0">Application Status</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-around text-center">
                      <div>
                        <h4 className="text-warning">{admissionData?.overview.pendingApplications}</h4>
                        <small className="text-muted">Pending</small>
                      </div>
                      <div>
                        <h4 className="text-success">{admissionData?.overview.approvedApplications}</h4>
                        <small className="text-muted">Approved</small>
                      </div>
                      <div>
                        <h4 className="text-danger">{admissionData?.overview.rejectedApplications}</h4>
                        <small className="text-muted">Rejected</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Admission Fee</h5>
                  </div>
                  <div className="card-body text-center">
                    <h2 className="text-primary">₹{admissionData?.overview.admissionFee}</h2>
                    <small className="text-muted">One-time admission fee</small>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Grade-wise Availability</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Grade</th>
                            <th>Total Seats</th>
                            <th>Filled</th>
                            <th>Available</th>
                            <th>Waiting List</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admissionData?.gradeAvailability.map((grade, index) => (
                            <tr key={index}>
                              <td>{grade.grade}</td>
                              <td>{grade.totalSeats}</td>
                              <td>{grade.filledSeats}</td>
                              <td>
                                <span className={`badge bg-${
                                  grade.availableSeats > 0 ? 'success' : 'danger'
                                }`}>
                                  {grade.availableSeats}
                                </span>
                              </td>
                              <td>{grade.waitingList}</td>
                              <td>
                                <span className={`badge bg-${
                                  grade.availableSeats > 10 ? 'success' :
                                  grade.availableSeats > 0 ? 'warning' : 'danger'
                                }`}>
                                  {grade.availableSeats > 10 ? 'Open' :
                                   grade.availableSeats > 0 ? 'Limited' : 'Full'}
                                </span>
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
          )}

          {/* Applications */}
          {selectedSection === 'applications' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Admission Applications</h5>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="all">All Grades</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                  </select>
                  <select 
                    className="form-select form-select-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Admitted">Admitted</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Student Name</th>
                        <th>Grade Applying</th>
                        <th>Date of Birth</th>
                        <th>Parent Name</th>
                        <th>Contact</th>
                        <th>Application Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center text-muted">
                            No applications found. Click "New Admission" to create the first application.
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((application) => (
                          <tr key={application.id}>
                            <td>
                              <span className="badge bg-primary">{application.applicationId}</span>
                            </td>
                            <td>
                              <div>
                                <h6 className="mb-0">{application.studentName}</h6>
                                <small className="text-muted">{application.gender}</small>
                              </div>
                            </td>
                            <td>{application.gradeApplying}</td>
                            <td>{application.dateOfBirth}</td>
                            <td>{application.fatherName}</td>
                            <td>
                              <div>
                                <small>{application.parentPhone}</small>
                                <br />
                                <small className="text-muted">{application.parentEmail}</small>
                              </div>
                            </td>
                            <td>{application.applicationDate}</td>
                            <td>
                              <span className={`badge ${
                                application.status === 'Pending' ? 'bg-warning' :
                                application.status === 'Approved' ? 'bg-success' :
                                application.status === 'Rejected' ? 'bg-danger' : 'bg-info'
                              }`}>
                                {application.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                {application.status === 'Pending' && (
                                  <button className="btn btn-outline-success" title="Approve">
                                    <i className="ti ti-check"></i>
                                  </button>
                                )}
                                {application.status === 'Approved' && !application.interviewScheduled && (
                                  <button className="btn btn-outline-info" title="Schedule Interview">
                                    <i className="ti ti-calendar"></i>
                                  </button>
                                )}
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

          {/* New Admission */}
          {selectedSection === 'new' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">New Admission Application</h5>
              </div>
              <div className="card-body">
                <form>
                  <h6 className="mb-3">Student Information</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-control" placeholder="Enter first name" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-control" placeholder="Enter last name" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Gender</label>
                        <select className="form-select" required>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Grade Applying For</label>
                        <select className="form-select" required>
                          <option value="">Select grade</option>
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5">Grade 5</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Previous School</label>
                        <input type="text" className="form-control" placeholder="Enter previous school name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Blood Group</label>
                        <select className="form-select">
                          <option value="">Select blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <h6 className="mt-4 mb-3">Parent/Guardian Information</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Father's Name</label>
                        <input type="text" className="form-control" placeholder="Enter father's name" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Mother's Name</label>
                        <input type="text" className="form-control" placeholder="Enter mother's name" required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Parent Phone</label>
                        <input type="tel" className="form-control" placeholder="Enter phone number" required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Parent Email</label>
                        <input type="email" className="form-control" placeholder="Enter email address" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Emergency Contact</label>
                        <input type="tel" className="form-control" placeholder="Enter emergency contact" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3} placeholder="Enter complete address"></textarea>
                  </div>

                  <h6 className="mt-4 mb-3">Required Documents</h6>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Birth Certificate</label>
                        <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Transfer Certificate</label>
                        <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Previous Marksheet</label>
                        <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Student Photo</label>
                        <input type="file" className="form-control" accept=".jpg,.jpeg,.png" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Additional Information</label>
                    <textarea className="form-control" rows={3} placeholder="Any additional information or special requirements"></textarea>
                  </div>

                  <div className="alert alert-info">
                    <h6>Admission Fee: ₹{admissionData?.overview.admissionFee}</h6>
                    <p className="mb-0">Admission fee is payable upon approval of application. Payment details will be sent to the registered email address.</p>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-outline-primary">
                      <i className="ti ti-file-text me-1"></i>Save as Draft
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-send me-1"></i>Submit Application
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Seat Availability */}
          {selectedSection === 'availability' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Seat Availability Management</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Total Seats</th>
                        <th>Filled Seats</th>
                        <th>Available Seats</th>
                        <th>Waiting List</th>
                        <th>Admission Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissionData?.gradeAvailability.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.grade}</td>
                          <td>{grade.totalSeats}</td>
                          <td>{grade.filledSeats}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className={`badge bg-${
                                grade.availableSeats > 0 ? 'success' : 'danger'
                              } me-2`}>
                                {grade.availableSeats}
                              </span>
                              <div className="progress" style={{ width: '100px', height: '8px' }}>
                                <div 
                                  className="progress-bar bg-success"
                                  style={{ width: `${(grade.filledSeats / grade.totalSeats) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td>{grade.waitingList}</td>
                          <td>
                            <span className={`badge bg-${
                              grade.availableSeats > 10 ? 'success' :
                              grade.availableSeats > 0 ? 'warning' : 'danger'
                            }`}>
                              {grade.availableSeats > 10 ? 'Open' :
                               grade.availableSeats > 0 ? 'Limited' : 'Full'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="Edit Seats">
                                <i className="ti ti-edit"></i>
                              </button>
                              <button className="btn btn-outline-info" title="View Waiting List">
                                <i className="ti ti-users"></i>
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
          )}

          {/* Interviews */}
          {selectedSection === 'interviews' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Interview Schedule</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Interview Date</th>
                        <th>Interview Time</th>
                        <th>Interviewer</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={9} className="text-center text-muted">
                          No interviews scheduled yet.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Admission Settings */}
          {selectedSection === 'settings' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Admission Settings</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Academic Session</label>
                        <input type="text" className="form-control" defaultValue="2024-2025" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Admission Fee</label>
                        <input type="number" className="form-control" defaultValue={admissionData?.overview.admissionFee} />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Admission Start Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Admission End Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Admission Requirements</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" defaultChecked />
                      <label className="form-check-label">Birth Certificate Required</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" defaultChecked />
                      <label className="form-check-label">Transfer Certificate Required</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" defaultChecked />
                      <label className="form-check-label">Previous Marksheet Required</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" defaultChecked />
                      <label className="form-check-label">Student Photo Required</label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Auto-approval Settings</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" />
                      <label className="form-check-label">Auto-approve applications with complete documents</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" />
                      <label className="form-check-label">Auto-schedule interviews for approved applications</label>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-settings me-1"></i>Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAddStudentPage;
