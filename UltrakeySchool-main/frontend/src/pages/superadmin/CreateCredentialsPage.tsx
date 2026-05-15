import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api.js';
import institutionService, { type Institution } from '../../services/institutionService';

interface CredentialsForm {
  userId: string;
  email: string;
  password: string;
  role: string;
  institutionId: string;
  permissions: {
    read: boolean;
    write: boolean;
    manageStudents: boolean;
    manageStaff: boolean;
    manageFinances: boolean;
    manageLibrary: boolean;
  };
}

const CreateCredentialsPage: React.FC = () => {
  const [formData, setFormData] = useState<CredentialsForm>({
    userId: '',
    email: '',
    password: '',
    role: 'agent',
    institutionId: '',
    permissions: {
      read: false,
      write: false,
      manageStudents: false,
      manageStaff: false,
      manageFinances: false,
      manageLibrary: false
    }
  });

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await institutionService.getInstitutions();
        setInstitutions(response.institutions || []);
        // Update local cache
        localStorage.setItem('institutions_cache', JSON.stringify(response.institutions || []));
      } catch (err) {
        console.error(err);
        // Try to get from local cache as fallback
        const cached = localStorage.getItem('institutions_cache');
        if (cached) {
          setInstitutions(JSON.parse(cached));
        }
      }
    };

    fetchInstitutions();
    
    // Listen for storage events to refresh when institutions are updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'institutions_cache' || !e.key) {
        fetchInstitutions();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
          institutionId: formData.institutionId,
          permissions: selectedPermissions
        });
  
        if (response.success) {
          setMessage(`Credentials created successfully for ${(response.data as any)?.fullName || 'User'} (${(response.data as any)?.email || formData.email})`);
          setMessageType('success');
          
          // Reset form
          setFormData({
            userId: '',
            email: '',
            password: '',
            role: 'agent',
            institutionId: '',
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
  
    return (
      <div className="container-fluid">
          <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
              <h3 className="page-title">Create Login Credentials</h3>
              <nav>
                  <ol className="breadcrumb mb-0">
                      <li className="breadcrumb-item"><Link to="/super-admin/dashboard">Dashboard</Link></li>
                      <li className="breadcrumb-item active" aria-current="page">User Setup</li>
                  </ol>
              </nav>
          </div>
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Generate login credentials for institution users</h4>
              </div>
              <div className="card-body">
                {message && (
                  <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`} role="alert">
                    {message}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="institutionId" className="form-label">Institution *</label>
                    <select
                      className="form-select"
                      id="institutionId"
                      name="institutionId"
                      value={formData.institutionId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Institution</option>
                      {institutions.map(inst => (
                        <option key={inst._id} value={inst._id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userId" className="form-label">User ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      placeholder="Enter user ID (e.g., 1, 2, or AR-1773121743498-h2i056byi)"
                      required
                    />
                  </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="user@example.com" 
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password *</label>
                  <div className="input-group">
                    <input 
                      type="password" 
                      className="form-control" 
                      id="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password or generate one" 
                      required
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={generatePassword}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Role *</label>
                  <select 
                    className="form-select" 
                    id="role" 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="agent">Agent</option>
                    <option value="institution_owner">Institution Owner</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Permissions</label>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="readPermission"
                      name="permission_read"
                      checked={formData.permissions.read}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="readPermission">Read</label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="writePermission"
                      name="permission_write"
                      checked={formData.permissions.write}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="writePermission">Write</label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="manageStudentsPermission"
                      name="permission_manageStudents"
                      checked={formData.permissions.manageStudents}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="manageStudentsPermission">Manage Students</label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="manageStaffPermission"
                      name="permission_manageStaff"
                      checked={formData.permissions.manageStaff}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="manageStaffPermission">Manage Staff</label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="manageFinancesPermission"
                      name="permission_manageFinances"
                      checked={formData.permissions.manageFinances}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="manageFinancesPermission">Manage Finances</label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="manageLibraryPermission"
                      name="permission_manageLibrary"
                      checked={formData.permissions.manageLibrary}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="manageLibraryPermission">Manage Library</label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Credentials...
                    </>
                  ) : (
                    'Create Credentials'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Quick Guide</h4>
            </div>
            <div className="card-body">
              <h5>How to create credentials:</h5>
              <ol>
                <li>Enter the User ID from the registration</li>
                <li>Enter the email address</li>
                <li>Generate or enter a secure password</li>
                <li>Select the appropriate role</li>
                <li>Choose required permissions</li>
                <li>Click "Create Credentials"</li>
              </ol>
              <hr />
              <h5>Common User IDs:</h5>
              <ul>
                <li><code>1</code> - John Doe (School) - Approved ✅</li>
                <li><code>2</code> - Jane Smith (College) - Pending</li>
                <li><code>AR-1773121743498-h2i056byi</code> - Recent registration</li>
                <li>Check Pending Requests page for available IDs</li>
              </ul>
              <div className="alert alert-info mt-3">
                <strong>Note:</strong> The account request must be approved before creating credentials.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCredentialsPage;
