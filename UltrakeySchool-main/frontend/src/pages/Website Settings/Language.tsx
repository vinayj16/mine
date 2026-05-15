import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Language {
  _id: string;
  name: string;
  code: string;
  isRTL: boolean;
  isActive: boolean;
  isDefault: boolean;
}

const LanguagePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  
  // Form states for add/edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isRTL: false,
    isActive: true,
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/languages');

      if (response.data.success) {
        setLanguages(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching languages:', err);
      toast.error(err.response?.data?.message || 'Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Language name and code are required');
      return;
    }

    try {
      const response = await apiClient.post('/settings/languages', formData);

      if (response.data.success) {
        toast.success('Language added successfully');
        fetchLanguages();
        setFormData({ name: '', code: '', isRTL: false, isActive: true });
        // Close modal
        const modal = document.getElementById('add_language');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          bootstrapModal?.hide();
        }
      }
    } catch (err: any) {
      console.error('Error adding language:', err);
      toast.error(err.response?.data?.message || 'Failed to add language');
    }
  };

  const handleEditLanguage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLanguage) return;

    try {
      const response = await apiClient.put(`/settings/languages/${selectedLanguage._id}`, formData);

      if (response.data.success) {
        toast.success('Language updated successfully');
        fetchLanguages();
        setSelectedLanguage(null);
        // Close modal
        const modal = document.getElementById('edit_language');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          bootstrapModal?.hide();
        }
      }
    } catch (err: any) {
      console.error('Error updating language:', err);
      toast.error(err.response?.data?.message || 'Failed to update language');
    }
  };

  const handleDeleteLanguage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this language?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/settings/languages/${id}`);

      if (response.data.success) {
        toast.success('Language deleted successfully');
        fetchLanguages();
      }
    } catch (err: any) {
      console.error('Error deleting language:', err);
      toast.error(err.response?.data?.message || 'Failed to delete language');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await apiClient.put(`/settings/languages/${id}/set-default`);

      if (response.data.success) {
        toast.success('Default language updated successfully');
        fetchLanguages();
      }
    } catch (err: any) {
      console.error('Error setting default language:', err);
      toast.error(err.response?.data?.message || 'Failed to set default language');
    }
  };

  const handleToggleRTL = async (id: string) => {
    try {
      const response = await apiClient.put(`/settings/languages/${id}/toggle-rtl`);

      if (response.data.success) {
        toast.success('RTL mode updated successfully');
        fetchLanguages();
      }
    } catch (err: any) {
      console.error('Error toggling RTL:', err);
      toast.error(err.response?.data?.message || 'Failed to toggle RTL mode');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await apiClient.put(`/settings/languages/${id}/toggle-status`);

      if (response.data.success) {
        toast.success('Language status updated successfully');
        fetchLanguages();
      }
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await apiClient.post('/settings/languages/import', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Language file imported successfully');
        fetchLanguages();
      }
    } catch (err: any) {
      console.error('Error importing file:', err);
      toast.error(err.response?.data?.message || 'Failed to import language file');
    }
  };

  const openEditModal = (language: Language) => {
    setSelectedLanguage(language);
    setFormData({
      name: language.name,
      code: language.code,
      isRTL: language.isRTL,
      isActive: language.isActive,
    });
  };

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              onClick={fetchLanguages}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>

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
            <Link to="/preferences" className="d-block rounded p-2">
              Preferences
            </Link>
            <Link to="/social-authentication" className="d-block rounded p-2">
              Social Authentication
            </Link>
            <Link to="/language" className="d-block rounded p-2 active">
              Language
            </Link>
          </div>
        </div>

        <div className="col-xxl-10 col-xl-9">
          <div className="border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
              <div className="mb-3">
                <h5 className="mb-1">Language</h5>
                <p>Personalize your Language settings of your website</p>
              </div>
              <div className="mb-3">
                <label className="btn btn-light me-2">
                  <i className="ti ti-download me-2"></i>Import
                  <input
                    type="file"
                    className="d-none"
                    accept=".json,.csv"
                    onChange={handleImportFile}
                  />
                </label>
                <button
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_language"
                >
                  <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Language
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Language</h4>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="input-icon-start mb-3 me-2 position-relative">
                    <span className="icon-addon">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search languages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="card-body p-0 py-3">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredLanguages.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-language-off fs-1 text-muted mb-3"></i>
                    <h4 className="mb-3">No languages found</h4>
                    <button
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#add_language"
                    >
                      <i className="ti ti-plus me-2"></i>
                      Add Language
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead className="thead-light">
                        <tr>
                          <th>Language</th>
                          <th>Code</th>
                          <th>RTL</th>
                          <th>Status</th>
                          <th>Default</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLanguages.map((language) => (
                          <tr key={language._id}>
                            <td>{language.name}</td>
                            <td>
                              <code>{language.code}</code>
                            </td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={language.isRTL}
                                  onChange={() => handleToggleRTL(language._id)}
                                />
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  language.isActive
                                    ? 'badge-soft-success'
                                    : 'badge-soft-danger'
                                }`}
                              >
                                <i className="ti ti-circle-filled fs-5 me-1"></i>
                                {language.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {language.isDefault ? (
                                <span className="badge badge-soft-primary">
                                  <i className="ti ti-star-filled me-1"></i>
                                  Default
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <div className="dropdown">
                                <button
                                  className="btn btn-white btn-icon btn-sm"
                                  data-bs-toggle="dropdown"
                                >
                                  <i className="ti ti-dots-vertical fs-14"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end p-3">
                                  {!language.isDefault && (
                                    <li>
                                      <button
                                        className="dropdown-item rounded-1"
                                        onClick={() => handleSetDefault(language._id)}
                                      >
                                        <i className="ti ti-star me-2"></i>Make as Default
                                      </button>
                                    </li>
                                  )}
                                  <li>
                                    <button
                                      className="dropdown-item rounded-1"
                                      onClick={() => handleToggleStatus(language._id)}
                                    >
                                      <i className="ti ti-toggle-left me-2"></i>
                                      {language.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item rounded-1"
                                      data-bs-toggle="modal"
                                      data-bs-target="#edit_language"
                                      onClick={() => openEditModal(language)}
                                    >
                                      <i className="ti ti-edit-circle me-2"></i>Edit
                                    </button>
                                  </li>
                                  {!language.isDefault && (
                                    <li>
                                      <button
                                        className="dropdown-item rounded-1 text-danger"
                                        onClick={() => handleDeleteLanguage(language._id)}
                                      >
                                        <i className="ti ti-trash-x me-2"></i>Delete
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Language Modal */}
      <div className="modal fade" id="add_language" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Language</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleAddLanguage}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Language Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., English"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Language Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., en"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isRTL}
                      onChange={(e) => setFormData({ ...formData, isRTL: e.target.checked })}
                    />
                    <label className="form-check-label">Right-to-Left (RTL)</label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Language
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Language Modal */}
      <div className="modal fade" id="edit_language" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Language</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleEditLanguage}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Language Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., English"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Language Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., en"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isRTL}
                      onChange={(e) => setFormData({ ...formData, isRTL: e.target.checked })}
                    />
                    <label className="form-check-label">Right-to-Left (RTL)</label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Language
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagePage;
