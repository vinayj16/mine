import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import TeacherDetailTabs from '../../components/teachers/TeacherDetailTabs';

interface Teacher {
  _id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  designationId?: {
    _id: string;
    name: string;
    code: string;
  };
  designation: string;
  subjects?: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  classes?: Array<{
    classId: {
      _id: string;
      name: string;
      grade: string;
    };
    sectionId?: {
      _id: string;
      name: string;
    };
  }>;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  qualification?: string;
  experience?: number;
  address?: {
    current?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    permanent?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  };
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  previousSchool?: {
    name?: string;
    address?: string;
    phone?: string;
  };
  workDetails?: {
    contractType?: string;
    shift?: string;
    location?: string;
  };
  isActive: boolean;
  createdAt: string;
}

const TeacherDetailsPage = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const schoolId = '507f1f77bcf86cd799439011'; // This should come from auth context

  useEffect(() => {
    if (teacherId) {
      fetchTeacherDetails();
    }
  }, [teacherId]);

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/teachers/${teacherId}`, {
        params: { schoolId }
      });

      if (response.data.success) {
        setTeacher(response.data.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch teacher details';
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

  const formatAddress = (address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string }) => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !teacher) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Error Loading Teacher Details</h4>
          <p className="text-muted mb-4">{error || 'Teacher not found'}</p>
          <button className="btn btn-primary" onClick={fetchTeacherDetails}>
            <i className="ti ti-refresh me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  const profileDetails = [
    { label: 'Employee ID', value: teacher.employeeId || 'N/A' },
    { label: 'Department', value: teacher.departmentId?.name || 'N/A' },
    { label: 'Designation', value: teacher.designation || 'N/A' },
    { label: 'Date of Birth', value: formatDate(teacher.dateOfBirth) },
    { label: 'Gender', value: teacher.gender || 'N/A' },
    { label: 'Blood Group', value: teacher.bloodGroup || 'N/A' },
    { label: 'Nationality', value: teacher.nationality || 'N/A' },
    { label: 'Religion', value: teacher.religion || 'N/A' },
    { label: 'Marital Status', value: teacher.maritalStatus || 'N/A' },
    { label: 'Qualification', value: teacher.qualification || 'N/A' },
    { label: 'Experience', value: teacher.experience ? `${teacher.experience} years` : 'N/A' },
    { label: 'Join Date', value: formatDate(teacher.joinDate) },
  ];

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
          <div className="card border-white">
            <div className="card-header">
              <div className="d-flex align-items-center flex-wrap row-gap-3">
                <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0">
                  <img 
                    src={teacher.photo || `https://ui-avatars.com/api/?name=${teacher.firstName}+${teacher.lastName}&background=random`} 
                    className="img-fluid rounded-circle" 
                    alt={`${teacher.firstName} ${teacher.lastName}`} 
                  />
                </div>
                <div>
                  <h5 className="mb-1 text-truncate">{teacher.firstName} {teacher.lastName}</h5>
                  <p className="text-primary mb-1">{teacher.employeeId || teacher._id.slice(-6)}</p>
                  <p className="mb-0">{teacher.designation}</p>
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
                  <p className="text-dark mb-0">{teacher.phone}</p>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                  <i className="ti ti-mail" />
                </span>
                <div>
                  <p className="text-dark mb-0">{teacher.email}</p>
                </div>
              </div>
              <div className="d-flex align-items-center mb-0">
                <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                  <i className="ti ti-building" />
                </span>
                <div>
                  <p className="text-dark mb-0">{teacher.departmentId?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="card-body border-top">
              <h5 className="mb-3">Basic Info</h5>
              <div className="mb-3">
                <p className="text-muted mb-1">Classes & Sections</p>
                <p className="text-dark mb-0">
                  {teacher.classes && teacher.classes.length > 0
                    ? teacher.classes.map(c => `${c.classId.name}${c.sectionId ? ` (${c.sectionId.name})` : ''}`).join(', ')
                    : 'N/A'}
                </p>
              </div>
              <div className="mb-3">
                <p className="text-muted mb-1">Subjects</p>
                <p className="text-dark mb-0">
                  {teacher.subjects && teacher.subjects.length > 0
                    ? teacher.subjects.map(s => s.name).join(', ')
                    : 'N/A'}
                </p>
              </div>
              <div className="mb-0">
                <p className="text-muted mb-1">Status</p>
                <span className={`badge badge-soft-${teacher.status === 'active' ? 'success' : teacher.status === 'inactive' ? 'danger' : 'warning'}`}>
                  {teacher.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-9 col-xl-8">
          <TeacherDetailTabs active="details" />
          <div className="row">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5>Profile Details</h5>
                </div>
                <div className="card-body">
                  <div className="border rounded p-3 pb-0">
                    <div className="row">
                      {profileDetails.map((detail) => (
                        <div className="col-sm-6 col-lg-4" key={detail.label}>
                          <div className="mb-3">
                            <p className="text-dark fw-medium mb-1">{detail.label}</p>
                            <p className="mb-0">{detail.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {teacher.documents && teacher.documents.length > 0 && (
              <div className="col-xxl-6 d-flex">
                <div className="card flex-fill mb-4">
                  <div className="card-header">
                    <h5>Documents</h5>
                  </div>
                  <div className="card-body">
                    {teacher.documents.map((doc, index) => (
                      <div className="bg-light-300 border rounded d-flex align-items-center justify-content-between p-2 mb-3" key={index}>
                        <div className="d-flex align-items-center overflow-hidden">
                          <span className="avatar avatar-md bg-white rounded flex-shrink-0 text-default">
                            <i className="ti ti-file-text fs-15" />
                          </span>
                          <div className="ms-2">
                            <p className="text-truncate fw-medium text-dark mb-0">{doc.name}</p>
                            <small className="text-muted">{doc.type}</small>
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

            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill mb-4">
                <div className="card-header">
                  <h5>Address</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                      <i className="ti ti-map-pin-up" />
                    </span>
                    <div>
                      <p className="text-dark fw-medium mb-1">Current Address</p>
                      <p className="mb-0">{formatAddress(teacher.address?.current)}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-start mb-0">
                    <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                      <i className="ti ti-map-pins" />
                    </span>
                    <div>
                      <p className="text-dark fw-medium mb-1">Permanent Address</p>
                      <p className="mb-0">{formatAddress(teacher.address?.permanent)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {teacher.previousSchool && (
              <div className="col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Previous School Details</h5>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Previous School Name</p>
                          <p className="mb-0">{teacher.previousSchool.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">School Address</p>
                          <p className="mb-0">{teacher.previousSchool.address || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Phone Number</p>
                          <p className="mb-0">{teacher.previousSchool.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {teacher.bankDetails && (
              <div className="col-xxl-6 d-flex">
                <div className="card flex-fill mb-4">
                  <div className="card-header">
                    <h5>Bank Details</h5>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Bank Name</p>
                          <p className="mb-0">{teacher.bankDetails.bankName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Branch</p>
                          <p className="mb-0">{teacher.bankDetails.branch || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Account Number</p>
                          <p className="mb-0">{teacher.bankDetails.accountNumber || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">IFSC Code</p>
                          <p className="mb-0">{teacher.bankDetails.ifscCode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {teacher.workDetails && (
              <div className="col-xxl-6 d-flex">
                <div className="card flex-fill mb-4">
                  <div className="card-header">
                    <h5>Work Details</h5>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Contract Type</p>
                          <p className="mb-0">{teacher.workDetails.contractType || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Shift</p>
                          <p className="mb-0">{teacher.workDetails.shift || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <p className="mb-1 text-dark fw-medium">Work Location</p>
                          <p className="mb-0">{teacher.workDetails.location || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {teacher.socialMedia && (
              <div className="col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Social Media</h5>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row row-cols-xxl-5 row-cols-xl-3 row-cols-sm-2">
                      {teacher.socialMedia.facebook && (
                        <div className="col">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Facebook</p>
                            <p className="mb-0">{teacher.socialMedia.facebook}</p>
                          </div>
                        </div>
                      )}
                      {teacher.socialMedia.twitter && (
                        <div className="col">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Twitter</p>
                            <p className="mb-0">{teacher.socialMedia.twitter}</p>
                          </div>
                        </div>
                      )}
                      {teacher.socialMedia.linkedin && (
                        <div className="col">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">LinkedIn</p>
                            <p className="mb-0">{teacher.socialMedia.linkedin}</p>
                          </div>
                        </div>
                      )}
                      {teacher.socialMedia.instagram && (
                        <div className="col">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Instagram</p>
                            <p className="mb-0">{teacher.socialMedia.instagram}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherDetailsPage;
