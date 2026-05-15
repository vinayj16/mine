import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  classId?: {
    _id: string;
    name: string;
    grade?: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  admissionDate: string;
  academicYear: string;
  parentId?: any;
  guardianId?: any;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
  };
  previousSchool?: {
    name?: string;
    address?: string;
  };
  documents?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  status: string;
}

const StudentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [showAddFeesModal, setShowAddFeesModal] = useState(false);

  const schoolId = '507f1f77bcf86cd799439011';

  const fetchStudent = async () => {
    if (!id) {
      setError('Student ID is required');
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

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleAddFees = () => {
    setShowAddFeesModal(true);
  };

  const handleCloseModal = () => {
    setShowAddFeesModal(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
  const statusBadge = student.status === 'active' ? 'badge-success' : 'badge-danger';

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Students</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Student Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-light me-2 mb-2">
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
                  <span className={`badge ${statusBadge}`}>{capitalize(student.status)}</span>
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
                <div className="mb-2">
                  <p className="text-muted mb-1">Gender</p>
                  <p className="fw-medium mb-0">{capitalize(student.gender)}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Date of Birth</p>
                  <p className="fw-medium mb-0">{formatDate(student.dateOfBirth)}</p>
                </div>
                <div className="mb-2">
                  <p className="text-muted mb-1">Admission Date</p>
                  <p className="fw-medium mb-0">{formatDate(student.admissionDate)}</p>
                </div>
                {student.bloodGroup && (
                  <div className="mb-2">
                    <p className="text-muted mb-1">Blood Group</p>
                    <p className="fw-medium mb-0">{student.bloodGroup}</p>
                  </div>
                )}
              </div>

              <div className="border-bottom pb-3 mb-3">
                <h6 className="mb-3">Contact Information</h6>
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

              <button className="btn btn-primary w-100" onClick={handleAddFees}>
                <i className="ti ti-plus me-2"></i>
                Add Fees
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-xxl-9 col-xl-8">
          <div className="row">
            {/* Emergency Contact */}
            {student.emergencyContact && (
              <div className="col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Emergency Contact</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Name</p>
                          <p className="mb-0">{student.emergencyContact.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Relationship</p>
                          <p className="mb-0">{student.emergencyContact.relationship || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Phone</p>
                          <p className="mb-0">{student.emergencyContact.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {student.documents && student.documents.length > 0 && (
              <div className="col-xxl-6 d-flex">
                <div className="card flex-fill mb-4">
                  <div className="card-header">
                    <h5>Documents</h5>
                  </div>
                  <div className="card-body">
                    {student.documents.map((doc, index) => (
                      <div className="bg-light-300 border rounded d-flex align-items-center justify-content-between mb-3 p-2" key={index}>
                        <div className="d-flex align-items-center overflow-hidden">
                          <span className="avatar avatar-md bg-white rounded flex-shrink-0 text-default">
                            <i className="ti ti-file-text fs-15" />
                          </span>
                          <div className="ms-2">
                            <p className="text-truncate fw-medium text-dark mb-0">{doc.name}</p>
                            <small className="text-muted">{capitalize(doc.type)}</small>
                          </div>
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-icon btn-sm">
                          <i className="ti ti-download" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {student.address && (
              <div className="col-xxl-6 d-flex">
                <div className="card flex-fill mb-4">
                  <div className="card-header">
                    <h5>Address</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <p className="text-dark fw-medium mb-1">Street</p>
                      <p className="mb-0">{student.address.street || 'N/A'}</p>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">City</p>
                          <p className="mb-0">{student.address.city || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">State</p>
                          <p className="mb-0">{student.address.state || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Country</p>
                          <p className="mb-0">{student.address.country || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Zip Code</p>
                          <p className="mb-0">{student.address.zipCode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Previous School */}
            {student.previousSchool && (
              <div className="col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Previous School Details</h5>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">School Name</p>
                          <p className="mb-0">{student.previousSchool.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">School Address</p>
                          <p className="mb-0">{student.previousSchool.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medical History */}
            {student.medicalInfo && (
              <div className="col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Medical History</h5>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Allergies</p>
                          {student.medicalInfo.allergies && student.medicalInfo.allergies.length > 0 ? (
                            student.medicalInfo.allergies.map((allergy, index) => (
                              <span key={index} className="badge bg-light text-dark me-2 mb-1">
                                {allergy}
                              </span>
                            ))
                          ) : (
                            <p className="mb-0">None</p>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Medications</p>
                          {student.medicalInfo.medications && student.medicalInfo.medications.length > 0 ? (
                            student.medicalInfo.medications.map((med, index) => (
                              <span key={index} className="badge bg-light text-dark me-2 mb-1">
                                {med}
                              </span>
                            ))
                          ) : (
                            <p className="mb-0">None</p>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="text-dark fw-medium mb-1">Conditions</p>
                          {student.medicalInfo.conditions && student.medicalInfo.conditions.length > 0 ? (
                            student.medicalInfo.conditions.map((condition, index) => (
                              <span key={index} className="badge bg-light text-dark me-2 mb-1">
                                {condition}
                              </span>
                            ))
                          ) : (
                            <p className="mb-0">None</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Academic Year */}
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5>Academic Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <p className="text-dark fw-medium mb-1">Academic Year</p>
                        <p className="mb-0">{student.academicYear}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <p className="text-dark fw-medium mb-1">Class</p>
                        <p className="mb-0">{classLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Fees Modal */}
      {showAddFeesModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Fees - {fullName}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Student Name</label>
                      <input type="text" className="form-control" value={fullName} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Admission No</label>
                      <input type="text" className="form-control" value={student.admissionNumber} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <input type="text" className="form-control" value={classLabel} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Roll No</label>
                      <input type="text" className="form-control" value={student.rollNumber || 'N/A'} readOnly />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Fees Group *</label>
                      <select className="form-select">
                        <option value="">Select Fees Group</option>
                        <option value="admission">Admission Fees</option>
                        <option value="tuition">Tuition Fees</option>
                        <option value="transport">Transport Fees</option>
                        <option value="hostel">Hostel Fees</option>
                        <option value="library">Library Fees</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Amount *</label>
                      <input type="number" className="form-control" placeholder="Enter amount" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Due Date *</label>
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Payment Mode</label>
                      <select className="form-select">
                        <option value="">Select Mode</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea className="form-control" rows={3} placeholder="Enter any additional notes"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  <i className="ti ti-x me-2"></i>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="ti ti-check me-2"></i>
                  Add Fees
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDetailsPage;
