import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface SchoolSettingsData {
  general: {
    schoolName: string;
    schoolCode: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    establishedYear: string;
    schoolType: string;
    affiliation: string;
  };
  academic: {
    currentAcademicYear: string;
    semesterSystem: boolean;
    gradingSystem: string;
    attendanceRequirement: number;
    minimumPassingMarks: number;
    workingDays: string[];
    schoolTimings: {
      start: string;
      end: string;
      breakStart: string;
      breakEnd: string;
    };
  };
  system: {
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
    autoBackup: boolean;
    backupFrequency: string;
    sessionTimeout: number;
  };
  features: {
    onlineAdmissions: boolean;
    feeManagement: boolean;
    attendanceTracking: boolean;
    examManagement: boolean;
    libraryManagement: boolean;
    transportManagement: boolean;
    hostelManagement: boolean;
    parentPortal: boolean;
    studentPortal: boolean;
  };
}

const AdminSchoolSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settingsData] = useState<SchoolSettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    // Handle settings save logic
    console.log('Saving settings...');
    setIsEditing(false);
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

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">School Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Settings</li>
              <li className="breadcrumb-item active">School Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchSettingsData}>
            <i className="ti ti-refresh"></i>
          </button>
          {isEditing ? (
            <>
              <button className="btn btn-secondary me-2" onClick={() => setIsEditing(false)}>
                <i className="ti ti-x me-2"></i>Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                <i className="ti ti-device-floppy me-2"></i>Save Changes
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <i className="ti ti-edit me-2"></i>Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <i className="ti ti-building me-2"></i>General Settings
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'academic' ? 'active' : ''}`}
                onClick={() => setActiveTab('academic')}
              >
                <i className="ti ti-book me-2"></i>Academic Settings
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                onClick={() => setActiveTab('system')}
              >
                <i className="ti ti-settings me-2"></i>System Settings
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                <i className="ti ti-toggle-left me-2"></i>Features
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div>
              <h5 className="card-title mb-4">General School Information</h5>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">School Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settingsData?.general.schoolName || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">School Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settingsData?.general.schoolCode || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      value={settingsData?.general.phone || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={settingsData?.general.email || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input 
                      type="url" 
                      className="form-control" 
                      value={settingsData?.general.website || ''}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea 
                      className="form-control" 
                      rows={3}
                      value={settingsData?.general.address || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Established Year</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settingsData?.general.establishedYear || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">School Type</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="elementary" selected={settingsData?.general.schoolType === 'Elementary School'}>Elementary School</option>
                      <option value="middle">Middle School</option>
                      <option value="high">High School</option>
                      <option value="k12">K-12 School</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Affiliation</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settingsData?.general.affiliation || ''}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Settings Tab */}
          {activeTab === 'academic' && (
            <div>
              <h5 className="card-title mb-4">Academic Configuration</h5>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Current Academic Year</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settingsData?.academic.currentAcademicYear || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Grading System</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="A-F" selected={settingsData?.academic.gradingSystem === 'A-F'}>A-F</option>
                      <option value="percentage">Percentage</option>
                      <option value="gpa">GPA</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Attendance Requirement (%)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={settingsData?.academic.attendanceRequirement || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Minimum Passing Marks</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={settingsData?.academic.minimumPassingMarks || ''}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Semester System</label>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={settingsData?.academic.semesterSystem}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">Enable Semester System</label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Working Days</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="mon" checked disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="mon">Monday</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="tue" checked disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="tue">Tuesday</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="wed" checked disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="wed">Wednesday</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="thu" checked disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="thu">Thursday</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="fri" checked disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="fri">Friday</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="sat" disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="sat">Saturday</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="sun" disabled={!isEditing} />
                      <label className="form-check-label" htmlFor="sun">Sunday</label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">School Timings</label>
                    <div className="row">
                      <div className="col-6">
                        <input 
                          type="text" 
                          className="form-control mb-2" 
                          placeholder="Start Time"
                          value={settingsData?.academic.schoolTimings.start || ''}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col-6">
                        <input 
                          type="text" 
                          className="form-control mb-2" 
                          placeholder="End Time"
                          value={settingsData?.academic.schoolTimings.end || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-6">
                        <input 
                          type="text" 
                          className="form-control mb-2" 
                          placeholder="Break Start"
                          value={settingsData?.academic.schoolTimings.breakStart || ''}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col-6">
                        <input 
                          type="text" 
                          className="form-control mb-2" 
                          placeholder="Break End"
                          value={settingsData?.academic.schoolTimings.breakEnd || ''}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div>
              <h5 className="card-title mb-4">System Configuration</h5>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Timezone</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="America/Chicago" selected={settingsData?.system.timezone === 'America/Chicago'}>Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date Format</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="MM/DD/YYYY" selected={settingsData?.system.dateFormat === 'MM/DD/YYYY'}>MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Time Format</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="12-hour" selected={settingsData?.system.timeFormat === '12-hour'}>12-hour</option>
                      <option value="24-hour">24-hour</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Currency</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="USD" selected={settingsData?.system.currency === 'USD'}>USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Language</label>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="English" selected={settingsData?.system.language === 'English'}>English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={settingsData?.system.sessionTimeout || ''}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Backup Settings</label>
                    <div className="form-check form-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={settingsData?.system.autoBackup}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">Auto Backup</label>
                    </div>
                    <select className="form-select" disabled={!isEditing}>
                      <option value="daily" selected={settingsData?.system.backupFrequency === 'daily'}>Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div>
              <h5 className="card-title mb-4">Feature Management</h5>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="mb-3">Core Features</h6>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="onlineAdmissions"
                      checked={settingsData?.features.onlineAdmissions}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="onlineAdmissions">Online Admissions</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="feeManagement"
                      checked={settingsData?.features.feeManagement}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="feeManagement">Fee Management</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="attendanceTracking"
                      checked={settingsData?.features.attendanceTracking}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="attendanceTracking">Attendance Tracking</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="examManagement"
                      checked={settingsData?.features.examManagement}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="examManagement">Exam Management</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="mb-3">Additional Features</h6>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="libraryManagement"
                      checked={settingsData?.features.libraryManagement}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="libraryManagement">Library Management</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="transportManagement"
                      checked={settingsData?.features.transportManagement}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="transportManagement">Transport Management</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="hostelManagement"
                      checked={settingsData?.features.hostelManagement}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="hostelManagement">Hostel Management</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="parentPortal"
                      checked={settingsData?.features.parentPortal}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="parentPortal">Parent Portal</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="studentPortal"
                      checked={settingsData?.features.studentPortal}
                      disabled={!isEditing}
                    />
                    <label className="form-check-label" htmlFor="studentPortal">Student Portal</label>
                  </div>
                </div>
              </div>
              <div className="alert alert-info">
                <i className="ti ti-info-circle me-2"></i>
                <strong>Note:</strong> Some features may require additional configuration or subscription plans. Contact support for more information.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSchoolSettingsPage;
