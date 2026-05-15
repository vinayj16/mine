import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import customFieldService, { type CustomField, type CustomFieldFormData } from '../../services/customFieldService';

const CustomFields: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('student');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CustomFieldFormData>({
    entityType: 'student',
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    placeholder: '',
    helpText: '',
    defaultValue: '',
    options: [],
    isRequired: false,
    isUnique: false,
    isActive: true,
    displayOrder: 0
  });

  const entityTypes = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'staff', label: 'Staff' },
    { value: 'user', label: 'User' }
  ];

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
    { value: 'multiselect', label: 'Multi Select' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'file', label: 'File' }
  ];

  useEffect(() => {
    const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId');
    if (schoolId) {
      fetchFields();
    }
  }, [selectedEntityType]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId');
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }
      const response = await customFieldService.getFields(schoolId, selectedEntityType);
      setFields((response as any).data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionsChange = (value: string) => {
    const optionsArray = value.split(',').map(opt => opt.trim()).filter(opt => opt);
    setFormData(prev => ({ ...prev, options: optionsArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fieldName || !formData.fieldLabel) {
      toast.error('Field name and label are required');
      return;
    }

    try {
      setSaving(true);
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId');
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      if (showEditModal && selectedField) {
        await customFieldService.updateField(schoolId, selectedField.entityType, selectedField._id, formData);
        toast.success('Custom field updated successfully');
        setShowEditModal(false);
      } else {
        await customFieldService.createField(schoolId, formData);
        toast.success('Custom field created successfully');
        setShowAddModal(false);
      }
      
      resetForm();
      fetchFields();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save custom field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedField) return;

    try {
      setSaving(true);
      const schoolId = localStorage.getItem('schoolId') || localStorage.getItem('institutionId');
      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      await customFieldService.deleteField(schoolId, selectedField.entityType, selectedField._id);
      toast.success('Custom field deleted successfully');
      setShowDeleteModal(false);
      setSelectedField(null);
      fetchFields();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete custom field');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      entityType: selectedEntityType,
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      placeholder: '',
      helpText: '',
      defaultValue: '',
      options: [],
      isRequired: false,
      isUnique: false,
      isActive: true,
      displayOrder: 0
    });
  };

  const openEditModal = (field: CustomField) => {
    setFormData({
      entityType: field.entityType,
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      defaultValue: field.defaultValue || '',
      options: field.options || [],
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isActive: field.isActive,
      displayOrder: field.displayOrder
    });
    setSelectedField(field);
    setShowEditModal(true);
  };

  const openDeleteModal = (field: CustomField) => {
    setSelectedField(field);
    setShowDeleteModal(true);
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Custom Fields</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Custom Fields
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon"
              onClick={fetchFields}
              disabled={loading}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-plus me-2"></i>Add Custom Field
            </button>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label">Entity Type</label>
            <select
              className="form-select"
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
            >
              {entityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : fields.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-forms fs-1 text-muted mb-3"></i>
            <p className="text-muted">No custom fields found for {selectedEntityType}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-plus me-2"></i>Add First Field
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {fields.map(field => (
            <div key={field._id} className="col-12 mb-3">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between p-3">
                  <div>
                    <h5 className="mb-1">{field.fieldLabel}</h5>
                    <small className="text-muted">
                      {field.fieldName} • {field.fieldType}
                      {field.isRequired && <span className="badge badge-soft-danger ms-2">Required</span>}
                      {!field.isActive && <span className="badge badge-soft-secondary ms-2">Inactive</span>}
                    </small>
                  </div>
                  <div className="d-flex align-items-center">
                    <button
                      className="btn btn-outline-light bg-white btn-icon me-2"
                      onClick={() => openEditModal(field)}
                    >
                      <i className="ti ti-edit"></i>
                    </button>
                    <button
                      className="btn btn-outline-light bg-white btn-icon"
                      onClick={() => openDeleteModal(field)}
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-md-3">
                      <small className="text-muted">Field Type</small>
                      <p className="mb-0">{field.fieldType}</p>
                    </div>
                    {field.placeholder && (
                      <div className="col-md-3">
                        <small className="text-muted">Placeholder</small>
                        <p className="mb-0">{field.placeholder}</p>
                      </div>
                    )}
                    {field.defaultValue && (
                      <div className="col-md-3">
                        <small className="text-muted">Default Value</small>
                        <p className="mb-0">{field.defaultValue}</p>
                      </div>
                    )}
                    <div className="col-md-3">
                      <small className="text-muted">Status</small>
                      <p className="mb-0">
                        <span className={`badge ${field.isActive ? 'badge-soft-success' : 'badge-soft-secondary'}`}>
                          {field.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                  {field.helpText && (
                    <div className="mt-2">
                      <small className="text-muted">Help Text: {field.helpText}</small>
                    </div>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Options: {field.options.join(', ')}</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {showEditModal ? 'Edit Custom Field' : 'Add Custom Field'}
                </h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Entity Type *</label>
                        <select
                          className="form-select"
                          name="entityType"
                          value={formData.entityType}
                          onChange={handleInputChange}
                          required
                          disabled={showEditModal}
                        >
                          {entityTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Field Type *</label>
                        <select
                          className="form-select"
                          name="fieldType"
                          value={formData.fieldType}
                          onChange={handleInputChange}
                          required
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Field Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fieldName"
                          value={formData.fieldName}
                          onChange={handleInputChange}
                          placeholder="e.g., customField1"
                          required
                          disabled={showEditModal}
                        />
                        <small className="text-muted">Unique identifier (no spaces)</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Field Label *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fieldLabel"
                          value={formData.fieldLabel}
                          onChange={handleInputChange}
                          placeholder="e.g., Custom Field 1"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Placeholder</label>
                        <input
                          type="text"
                          className="form-control"
                          name="placeholder"
                          value={formData.placeholder}
                          onChange={handleInputChange}
                          placeholder="Enter placeholder text"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Default Value</label>
                        <input
                          type="text"
                          className="form-control"
                          name="defaultValue"
                          value={formData.defaultValue}
                          onChange={handleInputChange}
                          placeholder="Enter default value"
                        />
                      </div>
                    </div>
                    {(formData.fieldType === 'select' || formData.fieldType === 'multiselect' || formData.fieldType === 'radio') && (
                      <div className="col-12">
                        <div className="mb-3">
                          <label className="form-label">Options (comma-separated)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.options?.join(', ') || ''}
                            onChange={(e) => handleOptionsChange(e.target.value)}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      </div>
                    )}
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Help Text</label>
                        <textarea
                          className="form-control"
                          name="helpText"
                          value={formData.helpText}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Enter help text"
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="isRequired"
                          checked={formData.isRequired}
                          onChange={handleInputChange}
                          id="isRequired"
                        />
                        <label className="form-check-label" htmlFor="isRequired">
                          Required Field
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="isUnique"
                          checked={formData.isUnique}
                          onChange={handleInputChange}
                          id="isUnique"
                        />
                        <label className="form-check-label" htmlFor="isUnique">
                          Unique Value
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          id="isActive"
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : showEditModal ? 'Update Field' : 'Add Field'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedField && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  Are you sure you want to delete the custom field "{selectedField.fieldLabel}"?
                  This action cannot be undone.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedField(null);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFields;
