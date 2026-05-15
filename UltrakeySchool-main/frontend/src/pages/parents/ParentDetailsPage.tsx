import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Guardian {
  _id: string;
  guardianId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  children: Array<{
    studentId: {
      _id: string;
      firstName: string;
      lastName: string;
      admissionNumber: string;
      avatar?: string;
      classId?: {
        name: string;
        grade?: string;
      };
      sectionId?: {
        name: string;
      };
    };
    relationship: {
      type: string;
      isPrimary: boolean;
    };
    isActive: boolean;
  }>;
  status: string;
  createdAt: string;
}

const ParentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentImageError, setParentImageError] = useState(false);

  // Get schoolId from localStorage
  const schoolId = localStorage.getItem('schoolId') || '507f1f77bcf86cd799439011';

  const fetchGuardianDetails = async () => {
    if (!id) {
      setError('Guardian ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/guardians/schools/${schoolId}/${id}`);

      if (response.data.success) {
        setGuardian(response.data.data.guardian || response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching guardian details:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load parent details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardianDetails();
  }, [id]);

  const handleParentImageError = () => {
    setParentImageError(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="badge badge-soft-success d-inline-flex align-items-center">
            <i className="ti ti-circle-filled fs-5 me-1" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="badge badge-soft-secondary d-inline-flex align-items-center">
            <i className="ti ti-circle-filled fs-5 me-1" />
            Inactive
          </span>
        );
      case 'suspended':
        return (
          <span className="badge badge-soft-danger d-inline-flex align-items-center">
            <i className="ti ti-circle-filled fs-5 me-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="badge badge-soft-secondary d-inline-flex align-items-center">
            <i className="ti ti-circle-filled fs-5 me-1" />
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFullAddress = (address?: Guardian['address']) => {
    if (!address) return 'Not provided';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  const getActiveChildren = () => {
    return guardian?.children.filter(child => child.isActive) || [];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading parent details...</p>
      </div>
    );
  }

  if (error || !guardian) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="ti ti-alert-circle me-2"></i>
        {error || 'Parent not found'}
        <Link to="/parents" className="btn btn-sm btn-outline-danger ms-3">
          <i className="ti ti-arrow-left me-1"></i>Back to Parents
        </Link>
      </div>
    );
  }

  const activeChildren = getActiveChildren();
  const primaryChild = activeChildren.find(c => c.relationship.isPrimary) || activeChildren[0];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Parent Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/parents">Parents</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Parent Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button 
            className="btn btn-light me-2 mb-2"
            onClick={() => toast.info('Login details feature coming soon')}
          >
            <i className="ti ti-lock me-2" />
            Login Details
          </button>
          <button 
            className="btn btn-primary d-flex align-items-center mb-2"
            onClick={() => toast.info('Edit feature coming soon')}
          >
            <i className="ti ti-edit-circle me-2" />
            Edit Parent
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-3 col-xl-4">
          <div className="card border-white">
            <div className="card-header">
              <div className="d-flex align-items-center flex-wrap row-gap-3">
                <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                  {parentImageError || !guardian.avatar ? (
                    <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded">
                      <i className="ti ti-user fs-32 text-muted"></i>
                    </div>
                  ) : (
                    <img
                      src={guardian.avatar}
                      className="img-fluid"
                      alt={`${guardian.firstName} ${guardian.lastName}`}
                      onError={handleParentImageError}
                    />
                  )}
                </div>
                <div className="overflow-hidden">
                  {getStatusBadge(guardian.status)}
                  <h5 className="mb-1 text-truncate">
                    {guardian.firstName} {guardian.lastName}
                  </h5>
                  <p className="text-primary">{guardian.guardianId}</p>
                </div>
              </div>
            </div>

            <div className="card-body">
              <h5 className="mb-3">Contact Information</h5>
              <div className="mb-3">
                <p className="text-dark fw-medium mb-1">Phone</p>
                <p className="mb-0">{guardian.phone}</p>
              </div>
              {guardian.alternatePhone && (
                <div className="mb-3">
                  <p className="text-dark fw-medium mb-1">Alternate Phone</p>
                  <p className="mb-0">{guardian.alternatePhone}</p>
                </div>
              )}
              <div className="mb-3">
                <p className="text-dark fw-medium mb-1">Email</p>
                <p className="mb-0">{guardian.email}</p>
              </div>
              <div className="mb-3">
                <p className="text-dark fw-medium mb-1">Added On</p>
                <p className="mb-0">{formatDate(guardian.createdAt)}</p>
              </div>
            </div>
          </div>

          {primaryChild && (
            <div className="card border-white mt-4">
              <div className="card-body">
                <h5 className="mb-3">Primary Child Information</h5>
                <div className="d-flex align-items-center bg-light-300 rounded p-3">
                  <span className="avatar avatar-lg me-2">
                    {primaryChild.studentId.avatar ? (
                      <img
                        src={primaryChild.studentId.avatar}
                        className="img-fluid rounded-circle"
                        alt={`${primaryChild.studentId.firstName} ${primaryChild.studentId.lastName}`}
                      />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                        <i className="ti ti-user fs-16 text-muted"></i>
                      </div>
                    )}
                  </span>
                  <div className="ms-2">
                    <h6 className="fs-14 mb-0">
                      {primaryChild.studentId.firstName} {primaryChild.studentId.lastName}
                    </h6>
                    <p className="mb-0">
                      {primaryChild.studentId.classId?.name || '-'}
                      {primaryChild.studentId.sectionId?.name && `, ${primaryChild.studentId.sectionId.name}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-xxl-9 col-xl-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Parent Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="text-dark fw-medium mb-1">Parent ID</p>
                    <p className="mb-0">{guardian.guardianId}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="text-dark fw-medium mb-1">Parent Name</p>
                    <p className="mb-0">{guardian.firstName} {guardian.lastName}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="text-dark fw-medium mb-1">Email Address</p>
                    <p className="mb-0">{guardian.email}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="text-dark fw-medium mb-1">Phone Number</p>
                    <p className="mb-0">{guardian.phone}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="text-dark fw-medium mb-1">Added On</p>
                    <p className="mb-0">{formatDate(guardian.createdAt)}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="text-dark fw-medium mb-1">Status</p>
                    {getStatusBadge(guardian.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5>Children Information ({activeChildren.length})</h5>
            </div>
            <div className="card-body">
              {activeChildren.length === 0 ? (
                <p className="text-muted">No active children found</p>
              ) : (
                <div className="row">
                  {activeChildren.map((child) => (
                    <div className="col-md-6" key={child.studentId._id}>
                      <div className="mb-3 p-3 border rounded">
                        <div className="d-flex align-items-center mb-2">
                          <span className="avatar avatar-md me-2">
                            {child.studentId.avatar ? (
                              <img
                                src={child.studentId.avatar}
                                className="img-fluid rounded-circle"
                                alt={`${child.studentId.firstName} ${child.studentId.lastName}`}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                                <i className="ti ti-user fs-16 text-muted"></i>
                              </div>
                            )}
                          </span>
                          <div>
                            <h6 className="mb-0">
                              {child.studentId.firstName} {child.studentId.lastName}
                            </h6>
                            <small className="text-muted">{child.studentId.admissionNumber}</small>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-6">
                            <p className="text-dark fw-medium mb-1">Class</p>
                            <p className="mb-0">{child.studentId.classId?.name || '-'}</p>
                          </div>
                          <div className="col-6">
                            <p className="text-dark fw-medium mb-1">Section</p>
                            <p className="mb-0">{child.studentId.sectionId?.name || '-'}</p>
                          </div>
                          <div className="col-6 mt-2">
                            <p className="text-dark fw-medium mb-1">Relationship</p>
                            <p className="mb-0 text-capitalize">{child.relationship.type}</p>
                          </div>
                          <div className="col-6 mt-2">
                            <p className="text-dark fw-medium mb-1">Status</p>
                            <span className="badge badge-soft-success">
                              {child.relationship.isPrimary ? 'Primary' : 'Secondary'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>Address Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <p className="text-dark fw-medium mb-1">Address</p>
                <p className="mb-0">{getFullAddress(guardian.address)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ParentDetailsPage;
