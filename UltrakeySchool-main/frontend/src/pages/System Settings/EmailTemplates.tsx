import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body?: string;
  variables?: string[];
  status: string;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/email-templates');
      
      if (response.data.success) {
        setTemplates(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch email templates:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setShowModal(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleDeleteClick = (templateId: string) => {
    setDeleteTemplateId(templateId);
    setShowDeleteModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const formData = new FormData(e.currentTarget);
      const templateData = {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        body: formData.get('body') as string,
        variables: (formData.get('variables') as string)?.split(',').map(v => v.trim()).filter(Boolean) || [],
        status: 'Active'
      };

      if (selectedTemplate) {
        // Update existing template
        const response = await apiClient.put(`/settings/email-templates/${selectedTemplate._id}`, templateData);
        
        if (response.data.success) {
          toast.success('Email template updated successfully');
          fetchTemplates();
          setShowModal(false);
        }
      } else {
        // Create new template
        const response = await apiClient.post('/settings/email-templates', templateData);
        
        if (response.data.success) {
          toast.success('Email template created successfully');
          fetchTemplates();
          setShowModal(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to save email template:', error);
      toast.error(error.response?.data?.message || 'Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;

    try {
      const response = await apiClient.delete(`/settings/email-templates/${deleteTemplateId}`);
      
      if (response.data.success) {
        toast.success('Email template deleted successfully');
        fetchTemplates();
        setShowDeleteModal(false);
        setDeleteTemplateId(null);
      }
    } catch (error: any) {
      console.error('Failed to delete email template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete email template');
    }
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
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">System Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">System Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchTemplates}
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
            <Link to="/settings/email" className="d-block rounded p-2">Email Settings</Link>
            <Link to="/settings/email-templates" className="d-block rounded p-2 active">Email Templates</Link>
            <Link to="/settings/sms" className="d-block rounded p-2">SMS Settings</Link>
            <Link to="/settings/otp" className="d-block rounded p-2">OTP</Link>
            <Link to="/settings/gdpr" className="d-block rounded p-2">GDPR Cookies</Link>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
              <div className="mb-3">
                <h5 className="mb-1">Email Templates</h5>
                <p className="mb-0">Manage email templates for system notifications</p>
              </div>
              <div className="mb-3">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddTemplate}
                >
                  <i className="ti ti-plus me-2"></i>
                  Add Template
                </button>
              </div>
            </div>
            <div className="card">
              <div className="card-body p-3 pb-0">
                {templates.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-mail-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                    <p className="text-muted mt-3">No email templates found</p>
                    <button className="btn btn-primary" onClick={handleAddTemplate}>
                      <i className="ti ti-plus me-2"></i>
                      Create First Template
                    </button>
                  </div>
                ) : (
                  <div className="row">
                    {templates.map((template) => (
                      <div className="col-xxl-4 col-md-6" key={template._id}>
                        <div className="d-flex align-items-center justify-content-between bg-white p-3 border rounded mb-3">
                          <div className="flex-grow-1">
                            <h5 className="fs-15 fw-normal mb-1">{template.name}</h5>
                            <small className="text-muted">{template.subject}</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <button 
                              className="btn btn-outline-light bg-white btn-icon me-2"
                              onClick={() => handleEditTemplate(template)}
                              title="Edit"
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button 
                              className="btn btn-outline-light bg-white btn-icon"
                              onClick={() => handleDeleteClick(template._id)}
                              title="Delete"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Template Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedTemplate ? 'Edit Email Template' : 'Add Email Template'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                />
              </div>
              <form onSubmit={handleSaveTemplate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Template Name</label>
                    <input 
                      type="text" 
                      name="name"
                      className="form-control"
                      defaultValue={selectedTemplate?.name || ''}
                      placeholder="e.g., Welcome Email"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input 
                      type="text" 
                      name="subject"
                      className="form-control"
                      defaultValue={selectedTemplate?.subject || ''}
                      placeholder="e.g., Welcome to our platform"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Body</label>
                    <textarea 
                      name="body"
                      className="form-control"
                      rows={8}
                      defaultValue={selectedTemplate?.body || ''}
                      placeholder="Enter email body content..."
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Variables (comma-separated)</label>
                    <input 
                      type="text" 
                      name="variables"
                      className="form-control"
                      defaultValue={selectedTemplate?.variables?.join(', ') || ''}
                      placeholder="e.g., {{name}}, {{email}}, {{date}}"
                    />
                    <small className="text-muted">
                      Available variables that can be used in the template
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : selectedTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Email Template</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this email template? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteTemplate}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
