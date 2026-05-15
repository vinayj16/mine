import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../api/client";

interface PlanLimits {
  students: { value: number; isUnlimited: boolean };
  teachers: { value: number; isUnlimited: boolean };
  classes: { value: number; isUnlimited: boolean };
  sections: { value: number; isUnlimited: boolean };
  subjects: { value: number; isUnlimited: boolean };
  exams: { value: number; isUnlimited: boolean };
  departments: { value: number; isUnlimited: boolean };
  designations: { value: number; isUnlimited: boolean };
  library: { isEnabled: boolean };
  transport: { isEnabled: boolean };
}

interface Plan {
  _id: string;
  planId: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  pricing: {
    monthly: { amount: number; currency: string };
    yearly: { amount: number; currency: string };
  };
  limits: PlanLimits;
  status: string;
  isRecommended: boolean;
  isPopular: boolean;
}

const MembershipPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'starter',
    pricing: {
      monthly: { amount: 0, currency: 'USD' },
      yearly: { amount: 0, currency: 'USD' }
    },
    limits: {
      students: { value: 0, isUnlimited: false },
      teachers: { value: 0, isUnlimited: false },
      classes: { value: 0, isUnlimited: false },
      sections: { value: 0, isUnlimited: false },
      subjects: { value: 0, isUnlimited: false },
      exams: { value: 0, isUnlimited: false },
      departments: { value: 0, isUnlimited: false },
      designations: { value: 0, isUnlimited: false },
      library: { isEnabled: false },
      transport: { isEnabled: false }
    },
    status: 'active',
    isRecommended: false
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/membership-plans');
      if (response.data.success) {
        setPlans(response.data.data.plans || []);
      }
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.response?.data?.message || 'Failed to load membership plans');
      toast.error('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleRefresh = () => {
    fetchPlans();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.displayName.trim()) {
      toast.error('Please enter plan name and display name');
      return;
    }

    try {
      if (editingPlan) {
        const response = await apiClient.put(`/membership-plans/${editingPlan._id}`, formData);
        if (response.data.success) {
          toast.success('Plan updated successfully');
          resetForm();
          fetchPlans();
          // Close modal
          const modal = document.getElementById('add_membership');
          const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
          modalInstance?.hide();
        }
      } else {
        const response = await apiClient.post('/membership-plans', formData);
        if (response.data.success) {
          toast.success('Plan created successfully');
          resetForm();
          fetchPlans();
          // Close modal
          const modal = document.getElementById('add_membership');
          const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
          modalInstance?.hide();
        }
      }
    } catch (err: any) {
      console.error('Error saving plan:', err);
      toast.error(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description || '',
      category: plan.category,
      pricing: plan.pricing,
      limits: plan.limits,
      status: plan.status,
      isRecommended: plan.isRecommended
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/membership-plans/${id}`);
      if (response.data.success) {
        toast.success('Plan deleted successfully');
        fetchPlans();
      }
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      category: 'starter',
      pricing: {
        monthly: { amount: 0, currency: 'USD' },
        yearly: { amount: 0, currency: 'USD' }
      },
      limits: {
        students: { value: 0, isUnlimited: false },
        teachers: { value: 0, isUnlimited: false },
        classes: { value: 0, isUnlimited: false },
        sections: { value: 0, isUnlimited: false },
        subjects: { value: 0, isUnlimited: false },
        exams: { value: 0, isUnlimited: false },
        departments: { value: 0, isUnlimited: false },
        designations: { value: 0, isUnlimited: false },
        library: { isEnabled: false },
        transport: { isEnabled: false }
      },
      status: 'active',
      isRecommended: false
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'starter':
        return 'bg-info';
      case 'enterprise':
        return 'bg-primary';
      case 'premium':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Membership Plans</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">Membership</li>
                <li className="breadcrumb-item active">Membership Plans</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={handleRefresh}
                disabled={loading}
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={handlePrint}
              >
                <i className="ti ti-printer"></i>
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <button
                className="btn btn-light fw-medium dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-file-export me-2"></i>
                Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button className="dropdown-item">
                    <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item">
                    <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                  </button>
                </li>
              </ul>
            </div>
            <div className="mb-2">
              <button
                className="btn btn-primary d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#add_membership"
                onClick={resetForm}
              >
                <i className="ti ti-square-rounded-plus me-2"></i>
                Add Membership
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
            <p className="mt-2 text-muted">Loading membership plans...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert alert-danger" role="alert">
            <i className="ti ti-alert-circle me-2"></i>
            {error}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchPlans}
            >
              <i className="ti ti-refresh me-1"></i>Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Monthly / Yearly Switch */}
            <div className="card border-0">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-center">
                  <h5>Monthly</h5>
                  <div className="form-check form-switch mx-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox"
                      checked={isYearly}
                      onChange={(e) => setIsYearly(e.target.checked)}
                    />
                  </div>
                  <h5>Yearly</h5>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {plans.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-package" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p className="mt-2 text-muted">No membership plans found. Create your first plan.</p>
              </div>
            )}

            {/* Plans */}
            <div className="row">
              {plans.map((plan) => (
                <div className="col-lg-4 col-md-6 d-flex" key={plan._id}>
                  <div className="card flex-fill">
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-3">
                        <span className={`badge ${getCategoryBadgeClass(plan.category)}`}>
                          {plan.displayName}
                        </span>
                        {plan.isRecommended && (
                          <span className="badge bg-warning">Recommended</span>
                        )}
                      </div>
                      <h3 className="mb-3">
                        {plan.description || 'No description available'}
                      </h3>
                      <div className="bg-light-300 p-3 rounded text-center mb-3">
                        <h2>
                          {formatCurrency(isYearly ? plan.pricing.yearly.amount : plan.pricing.monthly.amount)}
                          <span className="fs-14 text-muted">/{isYearly ? 'year' : 'month'}</span>
                        </h2>
                      </div>
                      <ul className="list-unstyled mb-3">
                        <li className="mb-2">
                          {plan.limits.students.isUnlimited ? '✔ Unlimited Students' : `✔ ${plan.limits.students.value} Students`}
                        </li>
                        <li className="mb-2">
                          {plan.limits.classes.isUnlimited ? '✔ Unlimited Classes' : `✔ ${plan.limits.classes.value} Classes & Sections`}
                        </li>
                        <li className="mb-2">
                          {plan.limits.subjects.isUnlimited ? '✔ Unlimited Subjects' : `✔ ${plan.limits.subjects.value} Subjects & Exams`}
                        </li>
                        <li className="mb-2">
                          {plan.limits.departments.isUnlimited ? '✔ Unlimited Departments' : `✔ ${plan.limits.departments.value} Departments`}
                        </li>
                        <li className="mb-2">
                          {plan.limits.designations.isUnlimited ? '✔ Unlimited Designations' : `✔ ${plan.limits.designations.value} Designations`}
                        </li>
                        <li className={`mb-2 ${plan.limits.library.isEnabled ? '' : 'text-danger'}`}>
                          {plan.limits.library.isEnabled ? '✔' : '✖'} Library & Transport
                        </li>
                      </ul>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary flex-fill">
                          Choose Plan
                        </button>
                        <button 
                          className="btn btn-light"
                          onClick={() => handleEdit(plan)}
                          data-bs-toggle="modal"
                          data-bs-target="#add_membership"
                          title="Edit"
                        >
                          <i className="ti ti-edit"></i>
                        </button>
                        <button 
                          className="btn btn-light text-danger"
                          onClick={() => handleDelete(plan._id)}
                          title="Delete"
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Membership Modal */}
      <div className="modal fade" id="add_membership">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h4>{editingPlan ? 'Edit Plan' : 'Add Plan'}</h4>
                <button className="btn-close" data-bs-dismiss="modal" type="button" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Plan Name *</label>
                    <input 
                      className="form-control" 
                      placeholder="e.g., starter-pack"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Display Name *</label>
                    <input 
                      className="form-control" 
                      placeholder="e.g., Starter Pack"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="starter">Starter</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="premium">Premium</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Monthly Price</label>
                    <input 
                      className="form-control" 
                      type="number"
                      placeholder="99"
                      value={formData.pricing.monthly.amount}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { 
                          ...formData.pricing, 
                          monthly: { ...formData.pricing.monthly, amount: parseFloat(e.target.value) || 0 }
                        }
                      })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Yearly Price</label>
                    <input 
                      className="form-control" 
                      type="number"
                      placeholder="999"
                      value={formData.pricing.yearly.amount}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { 
                          ...formData.pricing, 
                          yearly: { ...formData.pricing.yearly, amount: parseFloat(e.target.value) || 0 }
                        }
                      })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Students Limit</label>
                    <input 
                      className="form-control" 
                      type="number"
                      value={formData.limits.students.value}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { 
                          ...formData.limits, 
                          students: { ...formData.limits.students, value: parseInt(e.target.value) || 0 }
                        }
                      })}
                      disabled={formData.limits.students.isUnlimited}
                      min="0"
                    />
                    <div className="form-check mt-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox"
                        id="unlimited-students"
                        checked={formData.limits.students.isUnlimited}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          limits: { 
                            ...formData.limits, 
                            students: { ...formData.limits.students, isUnlimited: e.target.checked }
                          }
                        })}
                      />
                      <label className="form-check-label" htmlFor="unlimited-students">
                        Unlimited
                      </label>
                    </div>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Plan description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox"
                        id="library-enabled"
                        checked={formData.limits.library.isEnabled}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          limits: { 
                            ...formData.limits, 
                            library: { isEnabled: e.target.checked }
                          }
                        })}
                      />
                      <label className="form-check-label" htmlFor="library-enabled">
                        Enable Library
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox"
                        id="recommended"
                        checked={formData.isRecommended}
                        onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="recommended">
                        Mark as Recommended
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" data-bs-dismiss="modal" type="button" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlan ? 'Update Plan' : 'Add Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default MembershipPlans;
