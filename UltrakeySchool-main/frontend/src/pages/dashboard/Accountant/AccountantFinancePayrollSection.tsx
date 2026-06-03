import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  salariesSummary?: { total: number; recent: Array<{ id: string; employee: string; netSalary: number }> };
  payrollSummary?: { total: number; recent: Array<{ id: string; employee: string; netSalary: number }> };
  budgetsSummary?: {
    total: number;
    recent: Array<{ id: string; title: string; plannedAmount: number; spentAmount: number }>;
  };
}

const AccountantFinancePayrollSection: React.FC<Props> = ({
  salariesSummary,
  payrollSummary,
  budgetsSummary
}) => (
  <div className="row mt-4">
    <div className="col-xl-4 col-md-12 mb-3">
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className="ti ti-wallet me-2 text-warning" />
            Salaries
          </h4>
          <Link to="/dashboard/accountant/salaries" className="btn btn-sm btn-warning">
            View
          </Link>
        </div>
        <div className="card-body p-0">
          {(salariesSummary?.recent?.length ?? 0) > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <tbody>
                  {salariesSummary!.recent.slice(0, 5).map((s) => (
                    <tr key={s.id}>
                      <td>{s.employee}</td>
                      <td className="text-end">₹{(s.netSalary || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-4 mb-0">No salary records yet</p>
          )}
        </div>
      </div>
    </div>
    <div className="col-xl-4 col-md-12 mb-3">
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className="ti ti-users me-2 text-secondary" />
            Payroll
          </h4>
          <Link to="/dashboard/accountant/payroll" className="btn btn-sm btn-secondary">
            View
          </Link>
        </div>
        <div className="card-body p-0">
          {(payrollSummary?.recent?.length ?? 0) > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <tbody>
                  {payrollSummary!.recent.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.employee}</td>
                      <td className="text-end">₹{(p.netSalary || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-4 mb-0">No payroll records yet</p>
          )}
        </div>
      </div>
    </div>
    <div className="col-xl-4 col-md-12 mb-3">
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className="ti ti-chart-pie me-2 text-dark" />
            Budgets
          </h4>
          <Link to="/dashboard/accountant/budgets" className="btn btn-sm btn-dark">
            View
          </Link>
        </div>
        <div className="card-body p-0">
          {(budgetsSummary?.recent?.length ?? 0) > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <tbody>
                  {budgetsSummary!.recent.slice(0, 5).map((b) => (
                    <tr key={b.id}>
                      <td className="text-truncate" style={{ maxWidth: 140 }}>
                        {b.title}
                      </td>
                      <td className="text-end">
                        ₹{(b.spentAmount || 0).toLocaleString()} / ₹
                        {(b.plannedAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-4 mb-0">No budgets yet</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AccountantFinancePayrollSection;
