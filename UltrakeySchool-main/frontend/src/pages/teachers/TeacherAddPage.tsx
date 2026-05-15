import React, { useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  department: string;
  designation: string;
  qualification: string;
  experience: string;
  joiningDate: string;
  salary: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  photo: string;
}

interface CreatedTeacher {
  email: string;
  password: string;
  name: string;
}

const TeacherAddPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<CreatedTeacher | null>(null);
  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    department: '',
    designation: '',
    qualification: '',
    experience: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    photo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/teachers', {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dateOfBirth,
        department: formData.department,
        designation: formData.designation,
        qualification: formData.qualification,
        joiningDate: formData.joiningDate,
        salary: formData.salary,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        }
      });

      if (response.data.success) {
        toast.success('Teacher created successfully!');
        
        // Get the default password from response
        const teacherEmail = formData.email;
        const teacherPassword = response.data.data?.defaultPassword || `TCH${Date.now().toString().slice(-6)}`;
        const teacherName = `${formData.firstName} ${formData.lastName}`;
        
        // Store created teacher info and show credentials
        setCreatedTeacher({
          email: teacherEmail,
          password: teacherPassword,
          name: teacherName
        });
        setShowCredentials(true);
      } else {
        toast.error(response.data.message || 'Failed to create teacher');
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <div>
          <h3 className="page-title">Add New Teacher</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/institution">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/institution/teachers">Teachers</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Add Teacher</li>
            </ol>
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-9">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Personal Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <select className="form-select" name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Professional Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., Science, Mathematics"
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Designation</label>
                      <input
                        type="text"
                        className="form-control"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="e.g., Senior Teacher, HOD"
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Qualification</label>
                      <input
                        type="text"
                        className="form-control"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        placeholder="e.g., M.Sc, B.Ed"
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Experience (Years)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Salary</label>
                      <input
                        type="text"
                        className="form-control"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        placeholder="e.g., 50000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Address Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Zip Code</label>
                      <input
                        type="text"
                        className="form-control"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Actions</h4>
              </div>
              <div className="card-body">
                <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Teacher'}
                </button>
                <button type="button" className="btn btn-outline-secondary w-100" onClick={() => navigate('/institution/teachers')}>
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Note</h4>
              </div>
              <div className="card-body">
                <p className="text-muted small">
                  Login credentials will be automatically generated and displayed after teacher creation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Credentials Modal */}
      {showCredentials && createdTeacher && (
        <div className="modal-backdrop fade show"></div>
      )}
      {showCredentials && createdTeacher && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Teacher Created Successfully!</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCredentials(false); navigate('/institution/teachers'); }}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div className="avatar avatar-lg bg-success rounded-circle mx-auto mb-3">
                    <i className="ti ti-check fs-24 text-white"></i>
                  </div>
                  <h5>Teacher Login Credentials</h5>
                  <p className="text-muted">Please save these credentials. They will be needed for login.</p>
                </div>
                
                <div className="bg-light rounded p-3 mb-3">
                  <div className="row">
                    <div className="col-md-6 mb-2 mb-md-0">
                      <label className="text-muted small">Name</label>
                      <p className="mb-0 fw-bold">{createdTeacher.name}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small">Email (Username)</label>
                      <p className="mb-0 fw-bold">{createdTeacher.email}</p>
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-md-6 mb-2 mb-md-0">
                      <label className="text-muted small">Password</label>
                      <p className="mb-0 fw-bold text-primary">{createdTeacher.password}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small">Role</label>
                      <p className="mb-0 fw-bold">Teacher</p>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info mb-0">
                  <i className="ti ti-info-circle me-2"></i>
                  Teacher can login at the login page using these credentials.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${createdTeacher.email}\nPassword: ${createdTeacher.password}`);
                    toast.success('Credentials copied to clipboard!');
                  }}
                >
                  <i className="ti ti-copy me-1"></i> Copy Credentials
                </button>
                <Link 
                  to="/login" 
                  className="btn btn-success"
                >
                  <i className="ti ti-login me-1"></i> Go to Login
                </Link>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => { setShowCredentials(false); navigate('/institution/teachers'); }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAddPage;