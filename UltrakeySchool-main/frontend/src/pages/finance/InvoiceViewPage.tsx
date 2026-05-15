import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../api/client';

interface InvoiceItem {
  description: string;
  dueDate: string;
  amount: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  studentName: string;
  studentId: string;
  term: string;
  billTo: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  totalAmount: number;
  paymentMethod: string;
  paidAmount: number;
  notes: string;
  termsAndConditions: string;
}

const InvoiceViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/finance/invoices/${id}`);
      
      if (response.data.success) {
        const inv = response.data.data?.invoice || response.data.data;
        setInvoice({
          id: inv._id || inv.id,
          invoiceNumber: inv.invoiceNumber || 'N/A',
          invoiceDate: inv.createdAt || inv.invoiceDate || new Date().toISOString(),
          dueDate: inv.dueDate || new Date().toISOString(),
          studentName: inv.student?.name || inv.studentName || 'N/A',
          studentId: inv.student?.studentId || inv.studentId || 'N/A',
          term: inv.term || 'N/A',
          billTo: {
            name: inv.billTo?.name || inv.student?.name || 'N/A',
            address: inv.billTo?.address || inv.student?.address || 'N/A',
            email: inv.billTo?.email || inv.student?.email || 'N/A',
            phone: inv.billTo?.phone || inv.student?.phone || 'N/A'
          },
          items: inv.items || [],
          subtotal: inv.subtotal || 0,
          discount: inv.discount || 0,
          discountPercent: inv.discountPercent || 0,
          tax: inv.tax || 0,
          taxPercent: inv.taxPercent || 0,
          totalAmount: inv.totalAmount || 0,
          paymentMethod: inv.paymentMethod || 'N/A',
          paidAmount: inv.paidAmount || 0,
          notes: inv.notes || '',
          termsAndConditions: inv.termsAndConditions || 'Here we can write additional notes for the client to get a better understanding of this invoice.'
        });
      } else {
        setError(response.data.message || 'Failed to load invoice');
      }
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    console.log('Download invoice as PDF');
  };

  const handleSendEmail = () => {
    // Implement email sending functionality
    console.log('Send invoice via email');
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

  if (error || !invoice) {
    return (
      <div className="alert alert-danger m-3">
        <i className="ti ti-alert-circle me-2" />
        {error || 'Invoice not found'}
        <div className="mt-3">
          <Link to="/accounts-invoices" className="btn btn-primary">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Invoice</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/accounts-invoices">Finance & Accounts</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">View Invoice</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card mb-0">
            <div className="card-body p-4">
              <div className="invoice-popup-head d-flex align-items-center justify-content-between mb-4">
                <span>
                  <img src="/assets/img/logo.png" alt="Logo" />
                </span>
                <div className="popup-title text-center">
                  <h2>UNIVERSITY NAME</h2>
                  <p className="mb-0">Original For Recipient</p>
                </div>
                <div style={{ width: '120px' }}></div>
              </div>
              
              <div className="tax-info mb-2">
                <div className="mb-4 text-center">
                  <h1>Tax Invoice</h1>
                </div>
                
                <div className="row">
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Student Name :</h5>
                      <h6 className="mb-0">{invoice.studentName}</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Student ID :</h5>
                      <h6 className="mb-0">{invoice.studentId}</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Term :</h5>
                      <h6 className="mb-0">{invoice.term}</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Invoice No :</h5>
                      <h6 className="mb-0">{invoice.invoiceNumber}</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Invoice Date :</h5>
                      <h6 className="mb-0">{formatDate(invoice.invoiceDate)}</h6>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tax-invoice-info d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Due Date :</h5>
                      <h6 className="mb-0">{formatDate(invoice.dueDate)}</h6>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h6 className="mb-1">Bill To :</h6>
                  <p className="mb-1">
                    <span className="text-dark fw-medium">{invoice.billTo.name}</span>
                  </p>
                  <p className="mb-1">{invoice.billTo.address}</p>
                  <p className="mb-1">
                    <a href={`mailto:${invoice.billTo.email}`} className="text-primary">{invoice.billTo.email}</a>
                  </p>
                  <p className="mb-0">{invoice.billTo.phone}</p>
                </div>
                
                <div className="invoice-product-table">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Description</th>
                          <th>Due Date</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center">No items found</td>
                          </tr>
                        ) : (
                          invoice.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.description}</td>
                              <td>{formatDate(item.dueDate)}</td>
                              <td className="text-end">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="row mt-4">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <h5 className="mb-1">Important Note: </h5>
                      <p className="text-dark mb-0">Delivery dates are not guaranteed and Seller has</p>
                      <p className="text-dark mb-0">
                        no liability for damages that may be incurred due to any delay.
                      </p>
                    </div>
                    {invoice.notes && (
                      <div>
                        <h5 className="mb-1">Notes:</h5>
                        <p className="text-dark mb-0">{invoice.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="col-lg-6">
                    <div className="ms-auto" style={{ maxWidth: '300px' }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-medium">Subtotal</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-medium">Discount ({invoice.discountPercent}%)</span>
                        <span>{formatCurrency(invoice.discount)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                        <span className="fw-medium">Tax ({invoice.taxPercent}%)</span>
                        <span>{formatCurrency(invoice.tax)}</span>
                      </div>
                      <div className="d-flex justify-content-between fw-bold fs-5">
                        <span>Total Payable</span>
                        <span>{formatCurrency(invoice.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="payment-info mt-4 pt-4 border-top">
                  <div className="row align-items-center">
                    <div className="col-lg-6">
                      <h5 className="mb-2">Payment Info:</h5>
                      <p className="mb-1">
                        Payment Method : <span className="fw-medium text-dark">{invoice.paymentMethod}</span>
                      </p>
                      <p className="mb-0">
                        Amount Paid : <span className="fw-medium text-dark">{formatCurrency(invoice.paidAmount)}</span>
                      </p>
                    </div>
                    <div className="col-lg-6 text-lg-end mt-3 mt-lg-0">
                      <h6 className="mb-2">For University Name</h6>
                      <div className="signature">
                        <img src="/assets/img/signature.png" alt="Signature" style={{ height: '50px' }} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-top text-center pt-4 mt-4">
                  <p className="text-dark fw-medium mb-2">
                    <strong>Terms & Conditions :</strong>
                  </p>
                  <p className="mb-0">{invoice.termsAndConditions}</p>
                </div>
                
                <div className="text-center mt-4">
                  <p className="mb-0">Thanks for your Business</p>
                  <div className="mt-3">
                    <button className="btn btn-primary me-2" onClick={handlePrint}>
                      <i className="ti ti-printer me-2"></i>Print
                    </button>
                    <button className="btn btn-success me-2" onClick={handleDownload}>
                      <i className="ti ti-download me-2"></i>Download
                    </button>
                    <button className="btn btn-outline-secondary" onClick={handleSendEmail}>
                      <i className="ti ti-mail me-2"></i>Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceViewPage;
