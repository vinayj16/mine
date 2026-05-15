import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface AddonLimits {
  students: { value: number; isUnlimited: boolean; isEnabled: boolean };
  teachers: { value: number; isUnlimited: boolean; isEnabled: boolean };
  classes: { value: number; isUnlimited: boolean; isEnabled: boolean };
  sections: { value: number; isUnlimited: boolean; isEnabled: boolean };
  subjects: { value: number; isUnlimited: boolean; isEnabled: boolean };
  exams: { value: number; isUnlimited: boolean; isEnabled: boolean };
  departments: { value: number; isUnlimited: boolean; isEnabled: boolean };
  designations: { value: number; isUnlimited: boolean; isEnabled: boolean };
  library: { value: number; isUnlimited: boolean; isEnabled: boolean };
  transport: { value: number; isUnlimited: boolean; isEnabled: boolean };
}

interface Addon {
  _id: string;
  addonId: string;
  name: string;
  description?: string;
  category: string;
  limits: AddonLimits;
  price: number;
  currency: string;
  billingCycle: string;
  status: string;
  isPopular: boolean;
}

const MembershipAddons: React.FC = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'capacity',
    price: 0,
    billingCycle: 'monthly',
    status: 'active',
    limits: {
      students: { value: 0, isUnlimited: false, isEnabled: true },
      teachers: { value: 0, isUnlimited: false, isEnabled: true },
      classes: { value: 0, isUnlimited: false, isEnabled: true },
      sections: { value: 0, isUnlimited: false, isEnabled: true },
      subjects: { value: 0, isUnlimited: false, isEnabled: true },
      exams: { value: 0, isUnlimited: false, isEnabled: true },
      departments: { value: 0, isUnlimited: false, isEnabled: true },
      designations: { value: 0, isUnlimited: false, isEnabled: true },
      library: { value: 0, isUnlimited: false, isEnabled: true },
      transport: { value: 0, isUnlimited: false, isEnabled: true }
    }
  });

  const fetchAddons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/addons');
      if (response.data.success) {
        setAddons(response.data.data.addons || []);
      }
    } catch (err: any) {
      console.error('Error fetching addons:', err);
      setError(err.response?.data?.message || 'Failed to load addons');
      toast.error('Failed to load addons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const handleRefresh = () => {
    fetchAddons();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLimitChange = (limitType: keyof AddonLimits, field: 'value' | 'isUnlimited' | 'isEnabled', value: any) => {
    setFormData(prev => ({
      ...prev,
      limits: {
        ...prev.limits,
        [limitType]: {
          ...prev.limits[limitType],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter addon name');
      return;
    }

    try {
      if (editingAddon) {
        const response = await apiClient.put(`/addons/${editingAddon._id}`, formData);
        if (response.data.success) {
          toast.success('Addon updated successfully');
          resetForm();
          fetchAddons();
        }
      } else {
        const response = await apiClient.post('/addons', formData);
        if (response.data.success) {
          toast.success('Addon created successfully');
          resetForm();
          fetchAddons();
        }
      }
    } catch (err: any) {
      console.error('Error saving addon:', err);
      toast.error(err.response?.data?.message || 'Failed to save addon');
    }
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description || '',
      category: addon.category,
      price: addon.price,
      billingCycle: addon.billingCycle,
      status: addon.status,
      limits: addon.limits
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this addon?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/addons/${id}`);
      if (response.data.success) {
        toast.success('Addon deleted successfully');
        fetchAddons();
      }
    } catch (err: any) {
      console.error('Error deleting addon:', err);
      toast.error(err.response?.data?.message || 'Failed to delete addon');
    }
  };

  const resetForm = () => {
    setEditingAddon(null);
    setFormData({
      name: '',
      description: '',
      category: 'capacity',
      price: 0,
      billingCycle: 'monthly',
      status: 'active',
      limits: {
        students: { value: 0, isUnlimited: false, isEnabled: true },
        teachers: { value: 0, isUnlimited: false, isEnabled: true },
        classes: { value: 0, isUnlimited: false, isEnabled: true },
        sections: { value: 0, isUnlimited: false, isEnabled: true },
        subjects: { value: 0, isUnlimited: false, isEnabled: true },
        exams: { value: 0, isUnlimited: false, isEnabled: true },
        departments: { value: 0, isUnlimited: false, isEnabled: true },
        designations: { value: 0, isUnlimited: false, isEnabled: true },
        library: { value: 0, isUnlimited: false, isEnabled: true },
        transport: { value: 0, isUnlimited: false, isEnabled: true }
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const limitLabels: Record<keyof AddonLimits, string> = {
    students: 'Students & Teachers',
    teachers: 'Teachers',
    classes: 'Classes & Sections',
    sections: 'Sections',
    subjects: 'Subjects & Exams',
    exams: 'Exams',
    departments: 'Departments',
    designations: 'Designations',
    library: 'Library & Transport',
    transport: 'Transport'
  };

  return (
    <div className="content content-two">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Membership Addons</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                Membership
              </li>
              <li className="breadcrumb-item active" aria-current="page">Membership Addons</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              data-bs-toggle="tooltip"
              data-bs-placement="top" 
              aria-label="Refresh" 
              data-bs-original-title="Refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              aria-label="Print"
              data-bs-original-title="Print"
              onClick={handlePrint}
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
        </div>
      </div>
      {/* /Page Header */}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading addons...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          <i className="ti ti-alert-circle me-2"></i>
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchAddons}
          >
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="row">
          {/* Addon Form */}
          <div className="col-md-12">
            <form onSubmit={handleSubmit}>
              <div className="card mb-4">
                <div className="card-header">
                  <h5>{editingAddon ? 'Edit Addon' : 'Create New Addon'}</h5>
                </div>
                <div className="card-body pb-1">
                  <div className="row mb-3">
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Addon Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price</label>
                        <input 
                          type="number" 
                          className="form-control"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Billing Cycle</label>
                        <select 
                          className="form-select"
                          value={formData.billingCycle}
                          onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="one-time">One-time</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control"
                          rows={2}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <h6 className="mb-3">Addon Limits</h6>
                  <div className="row">
                    {(['students', 'classes', 'subjects', 'departments', 'designations', 'library'] as Array<keyof AddonLimits>).map((limitType) => (
                      <div className="col-md-6" key={limitType}>
                        <div className="mb-3">
                          <label className="form-label">{limitLabels[limitType]}</label>
                          <div className="d-flex align-items-center mb-3">
                            <div className="w-100 me-3">
                              <input 
                                type="number" 
                                className="form-control"
                                value={formData.limits[limitType].value}
                                onChange={(e) => handleLimitChange(limitType, 'value', parseInt(e.target.value) || 0)}
                                disabled={formData.limits[limitType].isUnlimited}
                                min="0"
                              />
                            </div>
                            <div className="form-check form-switch">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={formData.limits[limitType].isEnabled}
                                onChange={(e) => handleLimitChange(limitType, 'isEnabled', e.target.checked)}
                              />
                            </div>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox"
                              id={`unlimited-${limitType}`}
                              checked={formData.limits[limitType].isUnlimited}
                              onChange={(e) => handleLimitChange(limitType, 'isUnlimited', e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`unlimited-${limitType}`}>
                              Unlimited
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {editingAddon && (
                  <button type="button" className="btn btn-light me-2" onClick={resetForm}>Cancel Edit</button>
                )}
                <button type="submit" className="btn btn-primary">
                  {editingAddon ? 'Update Addon' : 'Create Addon'}
                </button>
              </div>
            </form>
          </div>

          {/* Addons List */}
          {addons.length === 0 && !loading && (
            <div className="col-md-12">
              <div className="text-center py-5">
                <i className="ti ti-package" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No addons found. Create your first addon above.</p>
              </div>
            </div>
          )}

          {addons.length > 0 && (
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5>Existing Addons ({addons.length})</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Billing</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addons.map((addon) => (
                          <tr key={addon._id}>
                            <td>{addon.addonId}</td>
                            <td>
                              <div>
                                <strong>{addon.name}</strong>
                                {addon.description && (
                                  <div className="text-muted small">{addon.description}</div>
                                )}
                              </div>
                            </td>
                            <td>{formatCurrency(addon.price)}</td>
                            <td className="text-capitalize">{addon.billingCycle}</td>
                            <td>
                              <span className={`badge ${addon.status === 'active' ? 'badge-soft-success' : 'badge-soft-secondary'}`}>
                                {addon.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-light me-2"
                                onClick={() => handleEdit(addon)}
                                title="Edit"
                              >
                                <i className="ti ti-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-light text-danger"
                                onClick={() => handleDelete(addon._id)}
                                title="Delete"
                              >
                                <i className="ti ti-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MembershipAddons;
