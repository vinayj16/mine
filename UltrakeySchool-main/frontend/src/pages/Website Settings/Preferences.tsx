import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface ModulePreferences {
  students: boolean;
  teachers: boolean;
  guardians: boolean;
  parents: boolean;
  classes: boolean;
  examinations: boolean;
  feesCollection: boolean;
  library: boolean;
  sports: boolean;
  hostel: boolean;
  transport: boolean;
  reports: boolean;
  department: boolean;
  designation: boolean;
  staffs: boolean;
  accounts: boolean;
}

const Preferences: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<ModulePreferences>({
    students: true,
    teachers: true,
    guardians: true,
    parents: true,
    classes: true,
    examinations: true,
    feesCollection: true,
    library: true,
    sports: true,
    hostel: true,
    transport: true,
    reports: true,
    department: true,
    designation: true,
    staffs: true,
    accounts: true,
  });

  const modules = [
    { key: 'students', label: 'Students' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'guardians', label: 'Guardians' },
    { key: 'parents', label: 'Parents' },
    { key: 'classes', label: 'Classes' },
    { key: 'examinations', label: 'Examinations' },
    { key: 'feesCollection', label: 'Fees Collection' },
    { key: 'library', label: 'Library' },
    { key: 'sports', label: 'Sports' },
    { key: 'hostel', label: 'Hostel' },
    { key: 'transport', label: 'Transport' },
    { key: 'reports', label: 'Reports' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'staffs', label: 'Staffs' },
    { key: 'accounts', label: 'Accounts' },
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/preferences');

      if (response.data.success) {
        setPreferences(response.data.data || preferences);
      }
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      toast.error(err.response?.data?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof ModulePreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await apiClient.put('/settings/preferences', preferences);

      if (response.data.success) {
        toast.success('Preferences updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      toast.error(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchPreferences();
    toast.info('Changes discarded');
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Website Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Website Settings
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchPreferences}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-xxl-2 col-xl-3">
            <div className="pt-3 d-flex flex-column list-group mb-4">
              <Link to="/company-settings" className="d-block rounded p-2">
                Company Settings
              </Link>
              <Link to="/localization" className="d-block rounded p-2">
                Localization
              </Link>
              <Link to="/prefixes" className="d-block rounded p-2">
                Prefixes
              </Link>
              <Link to="/preferences" className="d-block rounded p-2 active">
                Preferences
              </Link>
              <Link to="/social-authentication" className="d-block rounded p-2">
                Social Authentication
              </Link>
              <Link to="/language" className="d-block rounded p-2">
                Language
              </Link>
            </div>
          </div>

          <div className="col-xxl-10 col-xl-9">
            <div className="border-start ps-3">
              <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                  <div className="mb-3">
                    <h5 className="mb-1">Preferences</h5>
                    <p>Personalize your path and settings of your website</p>
                  </div>
                  <div className="mb-3">
                    <button
                      className="btn btn-light me-2"
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>

                <div className="d-md-flex d-block">
                  <div className="flex-fill">
                    <div className="card">
                      <div className="card-body p-3 pb-0">
                        <div className="row">
                          {modules.map((module) => (
                            <div className="col-xxl-3 col-xl-4 col-sm-6" key={module.key}>
                              <div className="d-md-flex justify-content-between align-items-center border rounded bg-white p-3 mb-3">
                                <h5 className="fw-normal fs-15">{module.label}</h5>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`module-${module.key}`}
                                    checked={preferences[module.key as keyof ModulePreferences]}
                                    onChange={() => handleToggle(module.key as keyof ModulePreferences)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preferences;
