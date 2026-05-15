import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface PrefixSettings {
  students: string;
  teachers: string;
  parents: string;
  guardians: string;
  subjects: string;
  class: string;
  sections: string;
  homeWork: string;
  department: string;
  designation: string;
  noticeBoard: string;
  attendance: string;
  timeTable: string;
  sports: string;
  syllabus: string;
  classRoom: string;
}

const Prefixes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefixes, setPrefixes] = useState<PrefixSettings>({
    students: 'STU-',
    teachers: 'TCH-',
    parents: 'PAR-',
    guardians: 'GRD-',
    subjects: 'SUB-',
    class: 'CLS-',
    sections: 'SEC-',
    homeWork: 'HW-',
    department: 'DEPT-',
    designation: 'DES-',
    noticeBoard: 'NOT-',
    attendance: 'ATT-',
    timeTable: 'TT-',
    sports: 'SPT-',
    syllabus: 'SYL-',
    classRoom: 'CR-',
  });

  const prefixFields = [
    { key: 'students', label: 'Students' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'parents', label: 'Parents' },
    { key: 'guardians', label: 'Guardians' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'class', label: 'Class' },
    { key: 'sections', label: 'Sections' },
    { key: 'homeWork', label: 'Home Work' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'noticeBoard', label: 'Notice Board' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'timeTable', label: 'Time Table' },
    { key: 'sports', label: 'Sports' },
    { key: 'syllabus', label: 'Syllabus' },
    { key: 'classRoom', label: 'Class Room' },
  ];

  useEffect(() => {
    fetchPrefixes();
  }, []);

  const fetchPrefixes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/prefixes');

      if (response.data.success) {
        setPrefixes(response.data.data || prefixes);
      }
    } catch (err: any) {
      console.error('Error fetching prefixes:', err);
      toast.error(err.response?.data?.message || 'Failed to load prefixes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrefixes(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await apiClient.put('/settings/prefixes', prefixes);

      if (response.data.success) {
        toast.success('Prefixes updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating prefixes:', err);
      toast.error(err.response?.data?.message || 'Failed to update prefixes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchPrefixes();
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
              onClick={fetchPrefixes}
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
              <Link to="/prefixes" className="d-block rounded p-2 active">
                Prefixes
              </Link>
              <Link to="/preferences" className="d-block rounded p-2">
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
                    <h5 className="mb-1">Prefixes</h5>
                    <p>Configure ID prefixes for automatic number generation</p>
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
                          {prefixFields.map((field) => (
                            <div className="col-xxl-3 col-xl-4 col-sm-6" key={field.key}>
                              <div className="mb-3">
                                <label className="form-label">{field.label}</label>
                                <input
                                  type="text"
                                  name={field.key}
                                  className="form-control"
                                  placeholder={`e.g., ${field.key.substring(0, 3).toUpperCase()}-`}
                                  value={prefixes[field.key as keyof PrefixSettings]}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="alert alert-info mb-3">
                          <i className="ti ti-info-circle me-2"></i>
                          <strong>Note:</strong> These prefixes will be used for automatic ID generation. 
                          For example, if you set "STU-" for Students, new student IDs will be generated as STU-001, STU-002, etc.
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

export default Prefixes;
