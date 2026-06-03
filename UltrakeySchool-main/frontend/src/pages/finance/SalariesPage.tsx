import React, { useState, useEffect } from 'react';
import ConfirmModal from '../../components/common/ConfirmModal';
import salaryService, { type Salary } from '../../services/salaryService';
import apiClient from '../../services/api';
import { toast } from 'react-toastify';
import { getInstitutionId } from '../../utils/auth';

const SalariesPage: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form State
  const [employeeId, setEmployeeId] = useState<string>('');
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [month, setMonth] = useState<string>('January');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paymentMethod, setPaymentMethod] = useState<string>('bank-transfer');
  const [allowanceTitle, setAllowanceTitle] = useState<string>('');
  const [allowanceAmount, setAllowanceAmount] = useState<number>(0);
  const [allowances, setAllowances] = useState<Array<{ title: string; amount: number }>>([]);
  const [deductionTitle, setDeductionTitle] = useState<string>('');
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductions, setDeductions] = useState<Array<{ title: string; amount: number }>>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const data: any = await salaryService.getAll({ institutionId: getInstitutionId() });
      // API returns { salaries: [] } directly
      setSalaries(data?.data?.salaries || data?.salaries || []);
    } catch (error: any) {
      toast.error('Failed to load salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response: any = await apiClient.get('/users', { institutionId: getInstitutionId(), role: 'teacher,staff_member' });
      setEmployees(response.data || []);
    } catch (error) {
      console.log('Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, []);

  const handleAddAllowance = () => {
    if (allowanceTitle && allowanceAmount > 0) {
      setAllowances([...allowances, { title: allowanceTitle, amount: allowanceAmount }]);
      setAllowanceTitle('');
      setAllowanceAmount(0);
    }
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const handleAddDeduction = () => {
    if (deductionTitle && deductionAmount > 0) {
      setDeductions([...deductions, { title: deductionTitle, amount: deductionAmount }]);
      setDeductionTitle('');
      setDeductionAmount(0);
    }
  };

  const handleRemoveDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEmployeeId('');
    setBasicSalary(0);
    setMonth(months[new Date().getMonth()]);
    setYear(new Date().getFullYear());
    setPaymentMethod('bank-transfer');
    setAllowances([]);
    setDeductions([]);
    setShowModal(true);
  };

  const openEditModal = (salary: Salary) => {
    setIsEditing(true);
    setCurrentId(salary._id || null);
    setEmployeeId(salary.employee?._id || salary.employee || '');
    setBasicSalary(salary.basicSalary);
    setMonth(salary.month);
    setYear(salary.year);
    setPaymentMethod(salary.paymentMethod);
    setAllowances((salary.allowances || []).map((a: any) => ({ title: a.title || a.type || a.description || '', amount: a.amount })));
    setDeductions((salary.deductions || []).map((d: any) => ({ title: d.title || d.type || d.description || '', amount: d.amount })));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.warn('Please select an employee');
      return;
    }
    const payload: Salary = {
      employee: employeeId,
      basicSalary,
      allowances,
      deductions,
      month,
      year,
      paymentMethod
    };

    try {
      if (isEditing && currentId) {
        await salaryService.update(currentId, payload);
        toast.success('Salary record updated successfully');
      } else {
        await salaryService.create(payload);
        toast.success('Salary record created successfully');
      }
      setShowModal(false);
      fetchSalaries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    setShowDeleteModal(true);
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await salaryService.delete(deleteTarget);
      toast.success('Salary record deleted successfully');
      fetchSalaries();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error('Failed to delete salary record');
    }
  };

  const calculateGross = (basic: number, allow: typeof allowances) => {
    return basic + allow.reduce((acc, curr) => acc + curr.amount, 0);
  };

  const calculateNet = (basic: number, allow: typeof allowances, deduct: typeof deductions) => {
    return calculateGross(basic, allow) - deduct.reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '85vh' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Salary Management</h2>
          <p className="text-muted mb-0">Manage staff salaries, basic payments, additions, and deductions.</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4 py-2"
          style={{ borderRadius: '10px', fontWeight: 500 }}
          onClick={openAddModal}
        >
          <i className="ti ti-plus fs-5"></i> Create New Salary
        </button>
      </div>

      {/* Salary List Card */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-semibold text-dark">All Salary Records</h5>
          <span className="badge bg-indigo-soft text-indigo px-3 py-2 rounded-pill fw-medium">
            {salaries.length} Records Total
          </span>
        </div>
        
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary uppercase fs-7">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="py-3">Month / Year</th>
                <th className="py-3">Basic Salary</th>
                <th className="py-3">Gross Salary</th>
                <th className="py-3">Deductions</th>
                <th className="py-3">Net Salary</th>
                <th className="py-3">Method</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted mb-0">Loading salaries...</p>
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <i className="ti ti-receipt-off fs-1 d-block mb-3 opacity-40"></i>
                    No salary records created yet.
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => {
                  const gross = calculateGross(salary.basicSalary, salary.allowances || []);
                  const net = calculateNet(salary.basicSalary, salary.allowances || [], salary.deductions || []);
                  const totalDeductions = (salary.deductions || []).reduce((acc, curr) => acc + curr.amount, 0);

                  return (
                    <tr key={salary._id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar avatar-md bg-light-soft text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                            {salary.employee?.name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold text-dark">{salary.employee?.name || 'Unknown Staff'}</h6>
                            <span className="text-muted fs-7">{salary.employee?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="fw-medium text-dark">{salary.month} {salary.year}</td>
                      <td className="text-dark">₹{salary.basicSalary.toLocaleString()}</td>
                      <td className="text-success fw-medium">₹{gross.toLocaleString()}</td>
                      <td className="text-danger">₹{totalDeductions.toLocaleString()}</td>
                      <td className="fw-bold text-dark">₹{net.toLocaleString()}</td>
                      <td>
                        <span className="badge bg-light text-secondary border px-3 py-1.5 rounded-pill fs-7 text-capitalize">
                          {salary.paymentMethod.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            className="btn btn-icon btn-light-soft border-0 rounded-circle" 
                            title="Edit"
                            onClick={() => openEditModal(salary)}
                          >
                            <i className="ti ti-pencil text-secondary"></i>
                          </button>
                          <button 
                            className="btn btn-icon btn-light-soft border-0 rounded-circle" 
                            title="Delete"
                            onClick={() => handleDelete(salary._id!)}
                          >
                            <i className="ti ti-trash text-danger"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">{isEditing ? 'Edit Salary Record' : 'Create Salary Record'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    {/* Employee Choice */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Employee</label>
                      <select 
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3" 
                        style={{ borderRadius: '10px' }}
                        value={employeeId} 
                        onChange={(e) => setEmployeeId(e.target.value)}
                        disabled={isEditing}
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                    </div>

                    {/* Basic Salary */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Basic Salary (₹)</label>
                      <input 
                        type="number" 
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={basicSalary} 
                        onChange={(e) => setBasicSalary(Number(e.target.value))} 
                        required 
                      />
                    </div>

                    {/* Month */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-secondary">Month</label>
                      <select 
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                      >
                        {months.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Year */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-secondary">Year</label>
                      <input 
                        type="number" 
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))} 
                        required 
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-secondary">Payment Method</label>
                      <select 
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>

                    <hr className="my-4 opacity-10" />

                    {/* Allowances Section */}
                    <div className="col-md-6 border-end pr-md-4">
                      <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <i className="ti ti-plus-circle text-success fs-5"></i> Allowances
                      </h6>
                      <div className="d-flex gap-2 mb-3">
                        <input 
                          type="text" 
                          placeholder="Title (e.g. HRA)" 
                          className="form-control border-light-soft bg-light-soft py-2 px-3 fs-7" 
                          value={allowanceTitle} 
                          onChange={(e) => setAllowanceTitle(e.target.value)} 
                        />
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          className="form-control border-light-soft bg-light-soft py-2 px-3 fs-7" 
                          value={allowanceAmount || ''} 
                          onChange={(e) => setAllowanceAmount(Number(e.target.value))} 
                        />
                        <button type="button" className="btn btn-success px-3 fs-7" onClick={handleAddAllowance}>Add</button>
                      </div>
                      
                      <div className="list-group list-group-flush border rounded-3 bg-white" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {allowances.length === 0 ? (
                          <div className="p-3 text-center text-muted fs-7">No allowances added</div>
                        ) : (
                          allowances.map((item, idx) => (
                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 fs-7">
                              <span className="fw-medium text-dark">{item.title}</span>
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-success fw-bold">₹{item.amount}</span>
                                <button type="button" className="btn btn-link text-danger p-0 border-0" onClick={() => handleRemoveAllowance(idx)}>
                                  <i className="ti ti-x"></i>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Deductions Section */}
                    <div className="col-md-6 pl-md-4">
                      <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <i className="ti ti-minus-circle text-danger fs-5"></i> Deductions
                      </h6>
                      <div className="d-flex gap-2 mb-3">
                        <input 
                          type="text" 
                          placeholder="Title (e.g. PF)" 
                          className="form-control border-light-soft bg-light-soft py-2 px-3 fs-7" 
                          value={deductionTitle} 
                          onChange={(e) => setDeductionTitle(e.target.value)} 
                        />
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          className="form-control border-light-soft bg-light-soft py-2 px-3 fs-7" 
                          value={deductionAmount || ''} 
                          onChange={(e) => setDeductionAmount(Number(e.target.value))} 
                        />
                        <button type="button" className="btn btn-danger px-3 fs-7" onClick={handleAddDeduction}>Add</button>
                      </div>

                      <div className="list-group list-group-flush border rounded-3 bg-white" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {deductions.length === 0 ? (
                          <div className="p-3 text-center text-muted fs-7">No deductions added</div>
                        ) : (
                          deductions.map((item, idx) => (
                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 fs-7">
                              <span className="fw-medium text-dark">{item.title}</span>
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-danger fw-bold">₹{item.amount}</span>
                                <button type="button" className="btn btn-link text-danger p-0 border-0" onClick={() => handleRemoveDeduction(idx)}>
                                  <i className="ti ti-x"></i>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Total Overview */}
                <div className="bg-light p-3 px-4 border-top d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-secondary fs-7 fw-medium d-block">Estimated Net Salary</span>
                    <h4 className="mb-0 fw-bold text-dark">
                      ₹{calculateNet(basicSalary, allowances, deductions).toLocaleString()}
                    </h4>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-light shadow-sm px-4 py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary shadow-sm px-4 py-2" style={{ borderRadius: '10px' }}>{isEditing ? 'Save Changes' : 'Create Salary'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Are you sure you want to delete this salary record?" />
    </div>
  );
};

export default SalariesPage;
