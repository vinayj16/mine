import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api.js';

interface CredentialsForm {
  userId: string;
  email: string;
  password: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    manageStudents: boolean;
    manageStaff: boolean;
    manageFinances: boolean;
    manageLibrary: boolean;
  };
}

const InstitutionCreateCredentialsPage: React.FC = () => {
  const [formData, setFormData] = useState<CredentialsForm>({
    userId: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: {
      read: false,
      write: false,
      manageStudents: false,
      manageStaff: false,
      manageFinances: false,
      manageLibrary: false
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name.startsWith('permission_')) {
        const permissionName = name.replace('permission_', '');
        setFormData(prev => ({
          ...prev,
          permissions: {
            ...prev.permissions,
            [permissionName]: checkbox.checked
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Get selected permissions
      const selectedPermissions = Object.keys(formData.permissions)
        .filter(key => formData.permissions[key as keyof typeof formData.permissions]);

      const response = await apiService.post('/admin/create-credentials', {
        userId: formData.userId,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        permissions: selectedPermissions
      });

      if (response.success) {
        setMessage(`Credentials created successfully for ${(response.data as any).fullName} (${(response.data as any).email})`);
        setMessageType('success');
        
        // Reset form
        setFormData({
          userId: '',
          email: '',
          password: '',
          role: 'admin',
          permissions: {
            read: false,
            write: false,
            manageStudents: false,
            manageStaff: false,
            manageFinances: false,
            manageLibrary: false
          }
        });
      } else {
        setMessage(response.message || 'Failed to create credentials');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create credentials');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
  };

  return (
    <div className="container-fluid">
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h3 className="page-title">Create User Credentials</h3>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/dashboard/main">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active">Create Credentials</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Create User Credentials</h5>
              <p className="card-subtitle text-muted">
                Generate login credentials for institution users
              </p>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                  {message}
                  <button type="button" className="btn-close" onClick={clearMessage}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="userId" className="form-label">User ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter User ID"
                      />
                      <small className="text-muted">
                        Available test IDs: 147852369 (Test Student), 741852963 (Another Student), 123456789 (Test Teacher)
                      </small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="user@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password *</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={generatePassword}
                          title="Generate secure password"
                        >
                          <i className="ti ti-refresh"></i> Generate
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="role" className="form-label">Role *</label>
                      <select
                        className="form-select"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="admin">School Admin</option>
                        <option value="principal">Principal</option>
                        <option value="teacher">Teacher</option>
                        <option value="accountant">Accountant</option>
                        <option value="librarian">Librarian</option>
                        <option value="hr_manager">HR Manager</option>
                        <option value="transport_manager">Transport Manager</option>
                        <option value="hostel_warden">Hostel Warden</option>
                        <option value="staff_member">Staff Member</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Permissions</label>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permission_read"
                          name="permission_read"
                          checked={formData.permissions.read}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="permission_read">
                          Read Access
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permission_write"
                          name="permission_write"
                          checked={formData.permissions.write}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="permission_write">
                          Write Access
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permission_manageStudents"
                          name="permission_manageStudents"
                          checked={formData.permissions.manageStudents}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="permission_manageStudents">
                          Manage Students
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permission_manageStaff"
                          name="permission_manageStaff"
                          checked={formData.permissions.manageStaff}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="permission_manageStaff">
                          Manage Staff
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permission_manageFinances"
                          name="permission_manageFinances"
                          checked={formData.permissions.manageFinances}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="permission_manageFinances">
                          Manage Finances
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permission_manageLibrary"
                          name="permission_manageLibrary"
                          checked={formData.permissions.manageLibrary}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="permission_manageLibrary">
                          Manage Library
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Credentials'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setFormData({
                        userId: '',
                        email: '',
                        password: '',
                        role: 'admin',
                        permissions: {
                          read: false,
                          write: false,
                          manageStudents: false,
                          manageStaff: false,
                          manageFinances: false,
                          manageLibrary: false
                        }
                      });
                      setMessage('');
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>

              <div className="mt-4">
                <h6>Quick Guide</h6>
                <p className="text-muted">
                  How to create credentials:
                </p>
                <ol className="text-muted">
                  <li>Enter the User ID from the registration</li>
                  <li>Enter the email address</li>
                  <li>Generate or enter a secure password</li>
                  <li>Select the appropriate role</li>
                  <li>Choose required permissions</li>
                  <li>Click "Create Credentials"</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionCreateCredentialsPage;
