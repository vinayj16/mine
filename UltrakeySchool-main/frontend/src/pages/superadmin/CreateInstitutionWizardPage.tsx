import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { superAdminService } from '../../services/superAdminService';

declare global {
  interface Window {
    bootstrap: any;
  }
}

interface InstitutionData {
  name: string;
  code: string;
  type: 'school' | 'inter_college' | 'degree_college' | 'engineering_college';
  email: string;
  phone: string;
  website: string;
  address: string;
  plan: string;
  modules: string[];
  academicSystem: string;
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  security: {
    adminEmail: string;
    adminPassword: string;
    twoFactorAuth: boolean;
  };
  status: 'active' | 'inactive' | 'pending';
}

const CreateInstitutionWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [institutionData, setInstitutionData] = useState<InstitutionData>({
    name: '',
    code: '',
    type: 'school',
    email: '',
    phone: '',
    website: '',
    address: '',
    plan: 'basic',
    modules: [],
    academicSystem: '',
    branding: {
      logo: '',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d'
    },
    security: {
      adminEmail: '',
      adminPassword: '',
      twoFactorAuth: false
    },
    status: 'active'
  });

  const totalSteps = 11;
  const stepTitles = [
    'Basic Info',
    'Address',
    'Admin',
    'Plan',
    'Modules',
    'Academic',
    'System',
    'Branding',
    'Security',
    'Status',
    'Review'
  ];

  const institutionTypes = [
    { value: 'school', label: 'School' },
    { value: 'inter_college', label: 'Inter College' },
    { value: 'degree_college', label: 'Degree College' },
    { value: 'engineering_college', label: 'Engineering College' }
  ];

  const availableModules = [
    'Student Management',
    'Teacher Management',
    'Attendance System',
    'Grade Management',
    'Timetable System',
    'Exam System',
    'Library System',
    'Fee Management',
    'Hostel Management',
    'Transport Management',
    'Inventory System',
    'Accounting System',
    'HR Management',
    'Report System',
    'Communication System',
    'Learning Management System'
  ];

  const academicSystems = [
    'Basic',
    'Standard',
    'Advanced',
    'Enterprise',
    'Custom'
  ];

  const plans = [
    { value: 'basic', label: 'Basic', features: ['Core Features', 'Up to 100 Students'] },
    { value: 'premium', label: 'Premium', features: ['All Basic Features', 'Up to 500 Students', 'Priority Support'] },
    { value: 'enterprise', label: 'Enterprise', features: ['All Premium Features', 'Unlimited Students', 'Dedicated Support', 'Custom Integrations'] }
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    try {
      // Create the institution
      const result = await superAdminService.createInstitution(institutionData as any);
      
      // Store in local storage for immediate UI updates
      const existingInstitutions = JSON.parse(localStorage.getItem('institutions_cache') || '[]');
      const newInstitution = {
        _id: result._id || result.id,
        name: institutionData.name,
        code: institutionData.code,
        type: institutionData.type,
        email: institutionData.email,
        phone: institutionData.phone,
        website: institutionData.website,
        plan: institutionData.plan,
        status: institutionData.status || 'active',
        createdAt: new Date().toISOString(),
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        principalName: institutionData.security?.adminEmail || institutionData.email,
        principalEmail: institutionData.security?.adminEmail || institutionData.email,
        principalPhone: institutionData.phone,
        analytics: {
          totalStudents: 0,
          totalTeachers: 0
        }
      };
      
      // Update local cache
      localStorage.setItem('institutions_cache', JSON.stringify([...existingInstitutions, newInstitution]));
      
      // Trigger storage event for cross-tab updates
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Institution created successfully');
      navigate('/super-admin/institutions');
    } catch (error) {
      console.error('Error creating institution:', error);
      toast.error('Failed to create institution');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Basic Information</h4>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Institution Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Springfield High School"
                      value={institutionData.name}
                      onChange={(e) => setInstitutionData({...institutionData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Institution Code*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. SHS001"
                      value={institutionData.code}
                      onChange={(e) => setInstitutionData({...institutionData, code: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Institution Type*</label>
                    <select
                      className="form-select"
                      value={institutionData.type}
                      onChange={(e) => setInstitutionData({...institutionData, type: e.target.value as any})}
                      required
                    >
                      {institutionTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email*</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="institution@example.com"
                      value={institutionData.email}
                      onChange={(e) => setInstitutionData({...institutionData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone Number*</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1 234 567 8900"
                      value={institutionData.phone}
                      onChange={(e) => setInstitutionData({...institutionData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://www.example.com"
                      value={institutionData.website}
                      onChange={(e) => setInstitutionData({...institutionData, website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Address Information</h4>
              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Enter complete institution address"
                      value={institutionData.address}
                      onChange={(e) => setInstitutionData({...institutionData, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Administrator Information</h4>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Admin Email*</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="admin@institution.com"
                      value={institutionData.security.adminEmail}
                      onChange={(e) => setInstitutionData({
                        ...institutionData,
                        security: { ...institutionData.security, adminEmail: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Admin Password*</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Generate secure password"
                      value={institutionData.security.adminPassword}
                      onChange={(e) => setInstitutionData({
                        ...institutionData,
                        security: { ...institutionData.security, adminPassword: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Two-Factor Authentication</label>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={institutionData.security.twoFactorAuth}
                        onChange={(e) => setInstitutionData({
                          ...institutionData,
                          security: { ...institutionData.security, twoFactorAuth: e.target.checked }
                        })}
                      />
                      <label className="form-check-label">Enable 2FA for admin accounts</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Subscription Plan</h4>
              <div className="row">
                <div className="col-12">
                  {plans.map(plan => (
                    <div key={plan.value} className="border rounded p-3 mb-3">
                      <div className="form-check">
                        <input
                          type="radio"
                          name="plan"
                          className="form-check-input"
                          value={plan.value}
                          checked={institutionData.plan === plan.value}
                          onChange={(e) => setInstitutionData({...institutionData, plan: e.target.value})}
                        />
                        <label className="form-check-label">
                          <strong>{plan.label}</strong>
                        </label>
                      </div>
                      <ul className="mt-2">
                        {plan.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Module Selection</h4>
              <div className="row">
                <div className="col-12">
                  <p className="text-muted mb-3">Select the modules your institution will use:</p>
                  {availableModules.map(module => (
                    <div key={module} className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        value={module}
                        checked={institutionData.modules.includes(module)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInstitutionData({...institutionData, modules: [...institutionData.modules, module]});
                          } else {
                            setInstitutionData({...institutionData, modules: institutionData.modules.filter(m => m !== module)});
                          }
                        }}
                      />
                      <label className="form-check-label">{module}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Academic System</h4>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Academic System Type</label>
                    <select
                      className="form-select"
                      value={institutionData.academicSystem}
                      onChange={(e) => setInstitutionData({...institutionData, academicSystem: e.target.value})}
                    >
                      {academicSystems.map(system => (
                        <option key={system} value={system}>{system}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">System Configuration</h4>
              <div className="row">
                <div className="col-12">
                  <p className="text-muted">System settings will be configured after institution creation</p>
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2"></i>
                    Advanced system configurations including database setup, server configuration, and integration settings will be available in the institution dashboard after creation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Branding</h4>
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Logo URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Upload institution logo"
                      value={institutionData.branding.logo}
                      onChange={(e) => setInstitutionData({
                        ...institutionData,
                        branding: { ...institutionData.branding, logo: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Primary Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={institutionData.branding.primaryColor}
                      onChange={(e) => setInstitutionData({
                        ...institutionData,
                        branding: { ...institutionData.branding, primaryColor: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Secondary Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={institutionData.branding.secondaryColor}
                      onChange={(e) => setInstitutionData({
                        ...institutionData,
                        branding: { ...institutionData.branding, secondaryColor: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Security Settings</h4>
              <div className="row">
                <div className="col-12">
                  <p className="text-muted mb-3">Advanced security settings will be configured in institution dashboard</p>
                  <div className="alert alert-warning">
                    <i className="ti ti-alert-triangle me-2"></i>
                    Security settings including SSL configuration, firewall rules, and access controls will be managed at the institution level.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Initial Status</h4>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-select"
                      value={institutionData.status}
                      onChange={(e) => setInstitutionData({...institutionData, status: e.target.value as any})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Review & Create</h4>
              <div className="row">
                <div className="col-12">
                  <div className="alert alert-info">
                    <h5><i className="ti ti-check me-2"></i>Institution Summary</h5>
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <strong>Name:</strong> {institutionData.name || 'Not set'}
                      </div>
                      <div className="col-md-6">
                        <strong>Type:</strong> {institutionTypes.find(t => t.value === institutionData.type)?.label || 'Not set'}
                      </div>
                      <div className="col-md-6">
                        <strong>Email:</strong> {institutionData.email || 'Not set'}
                      </div>
                      <div className="col-md-6">
                        <strong>Phone:</strong> {institutionData.phone || 'Not set'}
                      </div>
                      <div className="col-md-6">
                        <strong>Plan:</strong> {plans.find(p => p.value === institutionData.plan)?.label || 'Not set'}
                      </div>
                      <div className="col-md-6">
                        <strong>Status:</strong> <span className={`badge bg-${institutionData.status === 'active' ? 'success' : institutionData.status === 'inactive' ? 'danger' : 'warning'} text-white`}>{institutionData.status}</span>
                      </div>
                      <div className="col-md-6">
                        <strong>Modules:</strong> {institutionData.modules.length} selected
                      </div>
                    </div>
                    <div className="mt-3">
                      <button className="btn btn-primary me-2" onClick={handleSubmit}>
                        <i className="ti ti-check me-2"></i>Create Institution
                      </button>
                      <button className="btn btn-light" onClick={() => navigate('/super-admin/institutions')}>
                        <i className="ti ti-x me-2"></i>Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Create New Institution</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/super-admin/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/super-admin/institutions">Institutions</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Create Institution</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}</h5>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary btn-sm" 
                onClick={prevStep} 
                disabled={currentStep === 1}
              >
                <i className="ti ti-arrow-left me-1"></i>Previous
              </button>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={nextStep} 
                disabled={currentStep === totalSteps}
              >
                Next<i className="ti ti-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-primary" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          {/* Step Navigation */}
          <div className="d-flex flex-wrap gap-2 mt-3">
            {stepTitles.map((title, index) => (
              <button
                key={index + 1}
                className={`btn btn-sm ${currentStep === index + 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => goToStep(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
};

export default CreateInstitutionWizardPage;
