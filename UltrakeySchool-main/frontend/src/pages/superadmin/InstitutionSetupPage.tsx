import { useState } from 'react';
import institutionSetupService from '../../services/institutionSetupService';

interface InstitutionForm {
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  adminName: string;
  adminEmail: string;
  principalName: string;
  principalEmail: string;
}

interface UserForm {
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  class: string;
  section: string;
}

const INSTITUTION_TYPES = ['School', 'College', 'University', 'Training Center'];
const USER_ROLES = ['teacher', 'student', 'parent', 'admin', 'principal', 'accountant', 'librarian', 'hr_manager'];

export default function InstitutionSetupPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'users'>('create');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Institution form state
  const [institutionForm, setInstitutionForm] = useState<InstitutionForm>({
    name: '',
    type: 'School',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    adminName: '',
    adminEmail: '',
    principalName: '',
    principalEmail: ''
  });

  // Users form state
  const [institutionId, setInstitutionId] = useState('');
  const [users, setUsers] = useState<UserForm[]>([
    { name: '', email: '', role: 'teacher', phone: '', department: '', class: '', section: '' }
  ]);

  const handleInstitutionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInstitutionForm({ ...institutionForm, [e.target.name]: e.target.value });
  };

  const handleUserChange = (index: number, field: keyof UserForm, value: string) => {
    const updatedUsers = [...users];
    updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    setUsers(updatedUsers);
  };

  const addUserField = () => {
    setUsers([...users, { name: '', email: '', role: 'teacher', phone: '', department: '', class: '', section: '' }]);
  };

  const removeUserField = (index: number) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const createInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await institutionSetupService.createInstitution(institutionForm) as any;
      setMessage({ type: 'success', text: `Institution "${response.data.institution.name}" created successfully! Institution Code: ${response.data.institution.instituteCode}` });
      setInstitutionId(response.data.institution._id);
      
      // Store institution ID for user creation
      localStorage.setItem('lastCreatedInstitutionId', response.data.institution._id);
      
      // Switch to users tab after successful creation
      setTimeout(() => setActiveTab('users'), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create institution' });
    } finally {
      setLoading(false);
    }
  };

  const createUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const id = institutionId || localStorage.getItem('lastCreatedInstitutionId');
    if (!id) {
      setMessage({ type: 'error', text: 'Please create an institution first or provide an institution ID' });
      setLoading(false);
      return;
    }

    try {
      // Filter out empty users
      const validUsers = users.filter(u => u.name && u.email && u.role);
      
      if (validUsers.length === 0) {
        setMessage({ type: 'error', text: 'Please add at least one valid user' });
        setLoading(false);
        return;
      }

      const response = await institutionSetupService.createUsers(id, { users: validUsers }) as any;
      setMessage({ 
        type: 'success', 
        text: `Created ${response.data.createdUsers.length} users successfully! Institution Code: ${response.data.institution.instituteCode}` 
      });
      
      // Show credentials
      const credentialsText = response.data.createdUsers.map((u: any) => 
        `${u.name} (${u.role}): ${u.email} / Password: ${u.temporaryPassword}`
      ).join('\n');
      
      console.log('User Credentials:', credentialsText);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create users' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Institution Setup & User Management</h4>
          <p className="text-muted">Create institutions and manage users under them</p>
        </div>
        
        <div className="card-body">
          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <i className="ti ti-building me-2"></i>Create Institution
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <i className="ti ti-users me-2"></i>Add Users
              </button>
            </li>
          </ul>

          {/* Message Alert */}
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
            </div>
          )}

          {/* Create Institution Tab */}
          {activeTab === 'create' && (
            <form onSubmit={createInstitution}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Institution Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={institutionForm.name}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Institution Type *</label>
                  <select
                    className="form-select"
                    name="type"
                    value={institutionForm.type}
                    onChange={handleInstitutionChange}
                    required
                  >
                    {INSTITUTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={institutionForm.email}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={institutionForm.phone}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={institutionForm.address}
                    onChange={handleInstitutionChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    value={institutionForm.city}
                    onChange={handleInstitutionChange}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    name="state"
                    value={institutionForm.state}
                    onChange={handleInstitutionChange}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    value={institutionForm.country}
                    onChange={handleInstitutionChange}
                  />
                </div>
              </div>

              <hr className="my-4" />
              <h6 className="mb-3">Institution Admin Details</h6>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Admin Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="adminName"
                    value={institutionForm.adminName}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Admin Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="adminEmail"
                    value={institutionForm.adminEmail}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
              </div>

              <hr className="my-4" />
              <h6 className="mb-3">Principal Admin Details</h6>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Principal Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="principalName"
                    value={institutionForm.principalName}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Principal Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="principalEmail"
                    value={institutionForm.principalEmail}
                    onChange={handleInstitutionChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                ) : (
                  <><i className="ti ti-building-plus me-2"></i>Create Institution</>
                )}
              </button>
            </form>
          )}

          {/* Add Users Tab */}
          {activeTab === 'users' && (
            <form onSubmit={createUsers}>
              <div className="mb-3">
                <label className="form-label">Institution ID (optional - uses last created if empty)</label>
                <input
                  type="text"
                  className="form-control"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  placeholder="Enter institution ID or leave blank"
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Add Users to Institution</h6>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={addUserField}>
                  <i className="ti ti-plus me-1"></i>Add Another User
                </button>
              </div>

              {users.map((user, index) => (
                <div key={index} className="card mb-3 border">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <h6 className="card-title mb-0">User #{index + 1}</h6>
                      {users.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeUserField(index)}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-2">
                        <label className="form-label">Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={user.name}
                          onChange={(e) => handleUserChange(index, 'name', e.target.value)}
                          placeholder="Full Name"
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-2">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={user.email}
                          onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-2">
                        <label className="form-label">Role *</label>
                        <select
                          className="form-select"
                          value={user.role}
                          onChange={(e) => handleUserChange(index, 'role', e.target.value)}
                          required
                        >
                          {USER_ROLES.map(role => (
                            <option key={role} value={role}>
                              {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3 mb-2">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={user.phone}
                          onChange={(e) => handleUserChange(index, 'phone', e.target.value)}
                          placeholder="Phone Number"
                        />
                      </div>
                      <div className="col-md-3 mb-2">
                        <label className="form-label">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          value={user.department}
                          onChange={(e) => handleUserChange(index, 'department', e.target.value)}
                          placeholder="Department"
                        />
                      </div>
                      <div className="col-md-3 mb-2">
                        <label className="form-label">Class</label>
                        <input
                          type="text"
                          className="form-control"
                          value={user.class}
                          onChange={(e) => handleUserChange(index, 'class', e.target.value)}
                          placeholder="e.g., 10th"
                        />
                      </div>
                      <div className="col-md-3 mb-2">
                        <label className="form-label">Section</label>
                        <input
                          type="text"
                          className="form-control"
                          value={user.section}
                          onChange={(e) => handleUserChange(index, 'section', e.target.value)}
                          placeholder="e.g., A"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Creating Users...</>
                ) : (
                  <><i className="ti ti-users-plus me-2"></i>Create Users</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}  
