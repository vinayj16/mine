import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface AcademicSettings {
  academicYear: string;
  sessionStartDate: string;
  sessionEndDate: string;
  weekendDays: string[];
  workingDays: string[];
  classStartTime: string;
  classEndTime: string;
  periodDuration: number;
  breakDuration: number;
}

interface ExamSettings {
  passingPercentage: number;
  gradingSystem: 'percentage' | 'gpa' | 'cgpa' | 'letter';
  maxMarks: number;
}

interface AttendanceSettings {
  minimumAttendance: number;
  lateArrivalTime: number;
  halfDayThreshold: number;
}

interface FeeSettings {
  currency: string;
  lateFeePercentage: number;
  lateFeeGracePeriod: number;
}

interface NotificationSettings {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enablePushNotifications: boolean;
}

interface SchoolSettingsData {
  _id: string;
  institutionId: string;
  basicInfo: any;
  academicSettings: AcademicSettings;
  examSettings: ExamSettings;
  attendanceSettings: AttendanceSettings;
  feeSettings: FeeSettings;
  notificationSettings: NotificationSettings;
  status: string;
}

const SchoolSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SchoolSettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<'academic' | 'exam' | 'attendance' | 'fee' | 'notification'>('academic');

  const institutionId = '507f1f77bcf86cd799439011';

  const [academicForm, setAcademicForm] = useState<AcademicSettings>({
    academicYear: '2024/2025',
    sessionStartDate: '',
    sessionEndDate: '',
    weekendDays: ['Sunday'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    classStartTime: '08:00',
    classEndTime: '15:00',
    periodDuration: 45,
    breakDuration: 15
  });

  const [examForm, setExamForm] = useState<ExamSettings>({
    passingPercentage: 40,
    gradingSystem: 'percentage',
    maxMarks: 100
  });

  const [attendanceForm, setAttendanceForm] = useState<AttendanceSettings>({
    minimumAttendance: 75,
    lateArrivalTime: 15,
    halfDayThreshold: 4
  });

  const [feeForm, setFeeForm] = useState<FeeSettings>({
    currency: 'USD',
    lateFeePercentage: 5,
    lateFeeGracePeriod: 7
  });

  const [notificationForm, setNotificationForm] = useState<NotificationSettings>({
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enablePushNotifications: true
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/school-settings/institution/${institutionId}`);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setSettings(data);
        
        // Only update forms if data exists
        if (data.academicSettings) {
          setAcademicForm(data.academicSettings);
        }
        if (data.examSettings) {
          setExamForm(data.examSettings);
        }
        if (data.attendanceSettings) {
          setAttendanceForm(data.attendanceSettings);
        }
        if (data.feeSettings) {
          setFeeForm(data.feeSettings);
        }
        if (data.notificationSettings) {
          setNotificationForm(data.notificationSettings);
        }
      }
    } catch (err: any) {
      console.error('Error fetching school settings:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load school settings';
      setError(errorMessage);
      // Don't show toast error, just log it - settings will use default values
      console.log('Using default settings values');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAcademicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.patch(
        `/school-settings/institution/${institutionId}/academic`,
        academicForm
      );
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Academic settings updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update academic settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.patch(
        `/school-settings/institution/${institutionId}/exam`,
        examForm
      );
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Exam settings updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update exam settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.patch(
        `/school-settings/institution/${institutionId}/attendance`,
        attendanceForm
      );
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Attendance settings updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update attendance settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.patch(
        `/school-settings/institution/${institutionId}/fee`,
        feeForm
      );
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Fee settings updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update fee settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.patch(
        `/school-settings/institution/${institutionId}/notification`,
        notificationForm
      );
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Notification settings updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (day: string, type: 'weekend' | 'working') => {
    if (type === 'weekend') {
      setAcademicForm(prev => ({
        ...prev,
        weekendDays: prev.weekendDays.includes(day)
          ? prev.weekendDays.filter(d => d !== day)
          : [...prev.weekendDays, day]
      }));
    } else {
      setAcademicForm(prev => ({
        ...prev,
        workingDays: prev.workingDays.includes(day)
          ? prev.workingDays.filter(d => d !== day)
          : [...prev.workingDays, day]
      }));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading school settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="page-title mb-1">School Settings</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">School Settings</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading">Error Loading School Settings</h5>
                <p className="mb-0">{error}</p>
              </div>
              <button className="btn btn-outline-danger ms-3" onClick={fetchSettings}>
                <i className="ti ti-refresh me-1"></i>Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <h3 className="page-title mb-1">School Settings</h3>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">School Settings</li>
          </ol>
        </nav>
        <div className="card mt-3">
          <div className="card-body text-center py-5">
            <i className="ti ti-database-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No school settings available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="page-title mb-1">School Settings</h3>
      <nav>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active">School Settings</li>
        </ol>
      </nav>

      <div className="card mt-3">
        <div className="card-header">
          <h5 className="mb-0">Configure School Settings</h5>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs mb-3" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'academic' ? 'active' : ''}`}
                onClick={() => setActiveTab('academic')}
              >
                <i className="ti ti-school me-1"></i>Academic
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'exam' ? 'active' : ''}`}
                onClick={() => setActiveTab('exam')}
              >
                <i className="ti ti-certificate me-1"></i>Exam
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <i className="ti ti-calendar-check me-1"></i>Attendance
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'fee' ? 'active' : ''}`}
                onClick={() => setActiveTab('fee')}
              >
                <i className="ti ti-currency-dollar me-1"></i>Fee
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'notification' ? 'active' : ''}`}
                onClick={() => setActiveTab('notification')}
              >
                <i className="ti ti-bell me-1"></i>Notifications
              </button>
            </li>
          </ul>

          {/* ACADEMIC TAB */}
          {activeTab === 'academic' && (
            <form onSubmit={handleAcademicSubmit}>
              <h6 className="mb-3">Academic Year Configuration</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={academicForm.academicYear}
                    onChange={(e) => setAcademicForm({ ...academicForm, academicYear: e.target.value })}
                    placeholder="2024/2025"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Session Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={academicForm.sessionStartDate}
                    onChange={(e) => setAcademicForm({ ...academicForm, sessionStartDate: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Session End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={academicForm.sessionEndDate}
                    onChange={(e) => setAcademicForm({ ...academicForm, sessionEndDate: e.target.value })}
                  />
                </div>
              </div>

              <h6 className="mt-4 mb-3">Class Timings</h6>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Class Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={academicForm.classStartTime}
                    onChange={(e) => setAcademicForm({ ...academicForm, classStartTime: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Class End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={academicForm.classEndTime}
                    onChange={(e) => setAcademicForm({ ...academicForm, classEndTime: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Period Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={academicForm.periodDuration}
                    onChange={(e) => setAcademicForm({ ...academicForm, periodDuration: Number(e.target.value) })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Break Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={academicForm.breakDuration}
                    onChange={(e) => setAcademicForm({ ...academicForm, breakDuration: Number(e.target.value) })}
                  />
                </div>
              </div>

              <h6 className="mt-4 mb-3">Working Days</h6>
              <div className="row g-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="col-auto">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={academicForm.workingDays.includes(day)}
                        onChange={() => handleDayToggle(day, 'working')}
                        id={`working-${day}`}
                      />
                      <label className="form-check-label" htmlFor={`working-${day}`}>
                        {day}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <h6 className="mt-4 mb-3">Weekend Days</h6>
              <div className="row g-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="col-auto">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={academicForm.weekendDays.includes(day)}
                        onChange={() => handleDayToggle(day, 'weekend')}
                        id={`weekend-${day}`}
                      />
                      <label className="form-check-label" htmlFor={`weekend-${day}`}>
                        {day}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Academic Settings
                  </>
                )}
              </button>
            </form>
          )}

          {/* EXAM TAB */}
          {activeTab === 'exam' && (
            <form onSubmit={handleExamSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Passing Percentage</label>
                  <input
                    type="number"
                    className="form-control"
                    value={examForm.passingPercentage}
                    onChange={(e) => setExamForm({ ...examForm, passingPercentage: Number(e.target.value) })}
                    min="0"
                    max="100"
                  />
                  <small className="text-muted">Minimum percentage required to pass</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Grading System</label>
                  <select
                    className="form-select"
                    value={examForm.gradingSystem}
                    onChange={(e) => setExamForm({ ...examForm, gradingSystem: e.target.value as any })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="gpa">GPA (Grade Point Average)</option>
                    <option value="cgpa">CGPA (Cumulative GPA)</option>
                    <option value="letter">Letter Grades (A, B, C, etc.)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Maximum Marks</label>
                  <input
                    type="number"
                    className="form-control"
                    value={examForm.maxMarks}
                    onChange={(e) => setExamForm({ ...examForm, maxMarks: Number(e.target.value) })}
                  />
                  <small className="text-muted">Default maximum marks per subject</small>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Exam Settings
                  </>
                )}
              </button>
            </form>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <form onSubmit={handleAttendanceSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Minimum Attendance (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={attendanceForm.minimumAttendance}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, minimumAttendance: Number(e.target.value) })}
                    min="0"
                    max="100"
                  />
                  <small className="text-muted">Required attendance percentage</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Late Arrival Time (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={attendanceForm.lateArrivalTime}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, lateArrivalTime: Number(e.target.value) })}
                  />
                  <small className="text-muted">Grace period for late arrival</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Half Day Threshold (hours)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={attendanceForm.halfDayThreshold}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, halfDayThreshold: Number(e.target.value) })}
                  />
                  <small className="text-muted">Hours required for half day</small>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Attendance Settings
                  </>
                )}
              </button>
            </form>
          )}

          {/* FEE TAB */}
          {activeTab === 'fee' && (
            <form onSubmit={handleFeeSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-select"
                    value={feeForm.currency}
                    onChange={(e) => setFeeForm({ ...feeForm, currency: e.target.value })}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Late Fee Percentage (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={feeForm.lateFeePercentage}
                    onChange={(e) => setFeeForm({ ...feeForm, lateFeePercentage: Number(e.target.value) })}
                  />
                  <small className="text-muted">Penalty for late payment</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Grace Period (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={feeForm.lateFeeGracePeriod}
                    onChange={(e) => setFeeForm({ ...feeForm, lateFeeGracePeriod: Number(e.target.value) })}
                  />
                  <small className="text-muted">Days before late fee applies</small>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Fee Settings
                  </>
                )}
              </button>
            </form>
          )}

          {/* NOTIFICATION TAB */}
          {activeTab === 'notification' && (
            <form onSubmit={handleNotificationSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notificationForm.enableEmailNotifications}
                      onChange={(e) => setNotificationForm({ ...notificationForm, enableEmailNotifications: e.target.checked })}
                      id="emailNotif"
                    />
                    <label className="form-check-label" htmlFor="emailNotif">
                      <i className="ti ti-mail me-1"></i>Enable Email Notifications
                    </label>
                    <small className="d-block text-muted ms-4">Send notifications via email</small>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notificationForm.enableSMSNotifications}
                      onChange={(e) => setNotificationForm({ ...notificationForm, enableSMSNotifications: e.target.checked })}
                      id="smsNotif"
                    />
                    <label className="form-check-label" htmlFor="smsNotif">
                      <i className="ti ti-message me-1"></i>Enable SMS Notifications
                    </label>
                    <small className="d-block text-muted ms-4">Send notifications via SMS</small>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notificationForm.enablePushNotifications}
                      onChange={(e) => setNotificationForm({ ...notificationForm, enablePushNotifications: e.target.checked })}
                      id="pushNotif"
                    />
                    <label className="form-check-label" htmlFor="pushNotif">
                      <i className="ti ti-bell me-1"></i>Enable Push Notifications
                    </label>
                    <small className="d-block text-muted ms-4">Send push notifications to mobile apps</small>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>Save Notification Settings
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;
