import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  paymentMethod: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | string;
}

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/finance/invoices');
        if (response.data.success) {
          const payload = response.data.data?.invoices ?? [];
          setInvoices(payload.map((inv: any) => ({
            id: inv._id ?? inv.id,
            invoiceNumber: inv.invoiceNumber,
            date: formatDate(inv.createdAt ?? new Date()),
            description: inv.items?.[0]?.description ?? inv.notes ?? 'Invoice',
            amount: formatCurrency(inv.totalAmount ?? 0),
            paymentMethod: inv.paymentMethod ?? 'N/A',
            dueDate: formatDate(inv.dueDate ?? new Date()),
            status: inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : 'Draft'
          })));
        } else {
          setError(response.data.message || 'Failed to load invoices');
        }
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const toggleInvoiceSelection = (id: string) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(invoiceId => invoiceId !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  useEffect(() => {
    setSelectedInvoices(prev => prev.filter(id => invoices.some(inv => inv.id === id)));
  }, [invoices]);

  useEffect(() => {
    setSelectAll(invoices.length > 0 && selectedInvoices.length === invoices.length);
  }, [invoices, selectedInvoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'badge-soft-success';
      case 'Pending':
        return 'badge-soft-warning';
      case 'Overdue':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Invoices</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#">Finance & Accounts</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Invoices</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <a href="#" className="btn btn-outline-light bg-white btn-icon me-1" 
              data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Refresh" data-bs-original-title="Refresh">
              <i className="ti ti-refresh"></i>
            </a>
          </div>
          <div className="pe-1 mb-2">
            <button type="button" className="btn btn-outline-light bg-white btn-icon me-1"
              data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Print"
              data-bs-original-title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <a href="#"
              className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </a>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <a href="#" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </a>
              </li>
              <li>
                <a href="#" className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </a>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <Link to="/add-invoice" className="btn btn-primary d-flex align-items-center">
              <i className="ti ti-square-rounded-plus me-2"></i>Add Invoices
            </Link>
          </div>
        </div>
      </div>
      {/* /Page Header */}

      {/* Filter Section */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Invoices List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="text" 
                className="form-control date-range bookingrange" 
                placeholder="Select"
                value="Academic Year : 2024 / 2025"
                readOnly 
              />
            </div>
            <div className="dropdown mb-3 me-2">
              <a href="#" className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i className="ti ti-filter me-2"></i>Filter
              </a>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 pb-0 border-bottom">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Invoice Number</label>
                          <select className="select">
                            <option>Select</option>
                            <option>INV681537</option>
                            <option>INV681536</option>
                            <option>INV681535</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Date</label>
                          <select className="select">
                            <option>Select</option>
                            <option>25 Apr 2024</option>
                            <option>29 Apr 2024</option>
                            <option>11 May 2024</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <select className="select">
                            <option>Select</option>
                            <option>Cash</option>
                            <option>Credit</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="dropdown mb-3">
              <a href="#" className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </a>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="#" className="dropdown-item rounded-1 active">
                    Ascending
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    Descending
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    Recently Viewed
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item rounded-1">
                    Recently Added
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card-body p-0 py-3">
          {/* Invoice List */}
          {error && (
            <div className="alert alert-danger mb-0">
              {error}
            </div>
          )}
          <div className="custom-datatable-filter table-responsive">
            <table className="table datatable">
              <thead className="thead-light">
                <tr>
                  <th className="no-sort">
                    <div className="form-check form-check-md">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="select-all"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th>Invoice Number</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">Loading invoices...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">No invoices found.</td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => toggleInvoiceSelection(invoice.id)}
                          />
                        </div>
                      </td>
                      <td>
                        <a href="#" className="link-primary" data-bs-toggle="modal"
                          data-bs-target="#view_invoice">{invoice.invoiceNumber}</a>
                      </td>
                      <td>{invoice.date}</td>
                      <td>{invoice.description}</td>
                      <td>{invoice.amount}</td>
                      <td>{invoice.paymentMethod}</td>
                      <td>{invoice.dueDate}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(invoice.status)} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>{invoice.status}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <a href="#"
                            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="ti ti-dots-vertical fs-14"></i>
                          </a>
                          <ul className="dropdown-menu dropdown-menu-right p-3">
                            <li>
                              <a className="dropdown-item rounded-1" href="#" data-bs-toggle="modal" data-bs-target="#view_invoice">
                                <i className="ti ti-menu me-2"></i>View Invoice
                              </a>
                            </li>
                            <li>
                              <Link className="dropdown-item rounded-1" to={`/edit-invoice/${invoice.id}`}>
                                <i className="ti ti-edit-circle me-2"></i>Edit
                              </Link>
                            </li>
                            <li>
                              <a className="dropdown-item rounded-1" href="#" data-bs-toggle="modal" data-bs-target="#delete-modal">
                                <i className="ti ti-trash-x me-2"></i>Delete
                              </a>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* /Invoice List */}
        </div>
      </div>

      {/* View Invoice Modal */}
      <div className="modal fade" id="view_invoice">
        <div className="modal-dialog modal-dialog-centered modal-xl invoice-modal">
          <div className="modal-content">
            <div className="modal-wrapper">
              <div className="invoice-popup-head d-flex align-items-center justify-content-between mb-4">
                <span><img src="/assets/img/logo.png" alt="Logo" /></span>
                <div className="popup-title">
                  <h2>UNIVERSITY NAME</h2>
                  <p>Original For Recipient</p>
                </div>
              </div>
              <div className="tax-info mb-2">
                <div className="mb-4 text-center">
                  <h1>Tax Invoice</h1>
                </div>
                <div className="row">
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5>Student Name :</h5>
                      <h6>Walter Roberson</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5>Student ID :</h5>
                      <h6>DD465123</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5>Term :</h5>
                      <h6>Term 1</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5>Invoice No :</h5>
                      <h6>INV681531</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5>Invoice Date :</h5>
                      <h6>24 Apr 2024</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5>Due Date :</h5>
                      <h6>30 Apr 2024</h6>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h6 className="mb-1">Bill To :</h6>
                  <p><span className="text-dark">Walter Roberson</span> <br />
                    299 Star Trek Drive, Panama City, Florida, 32405, USA. <br />
                    <a href="mailto:walter@example.com">walter@example.com</a> <br />
                    +45 5421 4523
                  </p>
                </div>
                <div className="invoice-product-table">
                  <div className="table-responsive invoice-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Semester Fees</td>
                          <td>25 Apr 2024</td>
                          <td>$5,000</td>
                        </tr>
                        <tr>
                          <td>Exam Fees</td>
                          <td>25 Apr 2024</td>
                          <td>$1,000</td>
                        </tr>
                        <tr>
                          <td>Transport Fees</td>
                          <td>25 Apr 2024</td>
                          <td>$4,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <h5 className="mb-1">Important Note: </h5>
                      <p className="text-dark mb-0">Delivery dates are not guaranteed and Seller has</p>
                      <p className="text-dark">no liability for damages that may be incurred
                        due to any delay. has
                      </p>
                    </div>
                    <div>
                      <h5 className="mb-1">Total amount (in words):</h5>
                      <p className="text-dark fw-medium">USD Ten Thousand One Hundred Sixty Five Only</p>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="total-amount-tax">
                      <ul>
                        <li className="fw-medium text-dark">Subtotal</li>
                        <li className="fw-medium text-dark">Discount 0%</li>
                        <li className="fw-medium text-dark">IGST 18.0%</li>
                      </ul>
                      <ul>
                        <li>$10,000.00</li>
                        <li>+ $0.00</li>
                        <li>$10,000.00</li>
                      </ul>
                    </div>
                    <div className="total-amount-tax mb-3">
                      <ul className="total-amount">
                        <li className="text-dark">Amount Payable</li>
                      </ul>
                      <ul className="total-amount">
                        <li className="text-dark">$10,165.00</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="payment-info">
                  <div className="row align-items-center">
                    <div className="col-lg-6 mb-4 pt-4">
                      <h5 className="mb-2">Payment Info:</h5>
                      <p className="mb-1">Debit Card : <span className="fw-medium text-dark">465 *************645</span></p>
                      <p className="mb-0">Amount : <span className="fw-medium text-dark">$10,165</span></p>
                    </div>
                    <div className="col-lg-6 text-end mb-4 pt-4">
                      <h6 className="mb-2">For Dreamguys</h6>
                      <img src="/assets/img/icons/signature.svg" alt="Signature" />
                    </div>
                  </div>
                </div>
                <div className="border-bottom text-center pt-4 pb-4">
                  <span className="text-dark fw-medium">Terms & Conditions : </span>
                  <p>Here we can write additional notes for the client to get a better understanding of this invoice.</p>
                </div>
                <p className="text-center pt-3">Thanks for your Business</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Invoice Modal */}

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="delete-icon">
                <i className="ti ti-trash-x"></i>
              </span>
              <h4>Confirm Deletion</h4>
              <p>You want to delete all the marked items, this can't be undone once you delete.</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}
    </>
  );
};

export default InvoicesPage;
