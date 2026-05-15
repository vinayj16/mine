/**
 * Excel Export Utility
 * Generates and downloads Excel files from data arrays
 */

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any) => string;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: any[];
}

/**
 * Convert data to CSV format for Excel compatibility
 */
export function exportToCSV(options: ExcelExportOptions): void {
  const { filename, columns, data } = options;
  
  // Create header row
  const headers = columns.map(col => col.header).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(formattedValue || '').replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',');
  });
  
  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n');
  
  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export library books to Excel/CSV
 */
export function exportLibraryBooks(books: any[]): void {
  const columns: ExcelColumn[] = [
    { header: 'Book ID', key: 'id', width: 15 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'ISBN', key: 'isbn', width: 20 },
    { header: 'Author', key: 'authors', width: 25, format: (v) => Array.isArray(v) ? v.join(', ') : v },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Publisher', key: 'publisher', width: 20 },
    { header: 'Total Copies', key: 'totalCopies', width: 12 },
    { header: 'Available', key: 'availableCopies', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Location', key: 'location', width: 15 },
    { header: 'Added Date', key: 'createdAt', width: 15, format: (v) => v ? new Date(v).toLocaleDateString() : '' }
  ];
  
  exportToCSV({
    filename: `library-books-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Books',
    columns,
    data: books
  });
}

/**
 * Export library members to Excel/CSV
 */
export function exportLibraryMembers(members: any[]): void {
  const columns: ExcelColumn[] = [
    { header: 'Member ID', key: 'id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Membership Date', key: 'membershipDate', width: 18, format: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { header: 'Expiry Date', key: 'expiryDate', width: 18, format: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' },
    { header: 'Books Issued', key: 'booksIssued', width: 12 },
    { header: 'Fines Due', key: 'finesDue', width: 12, format: (v) => v ? `$${v}` : '$0' }
  ];
  
  exportToCSV({
    filename: `library-members-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Members',
    columns,
    data: members
  });
}

/**
 * Export borrowing records to Excel/CSV
 */
export function exportBorrowingRecords(records: any[]): void {
  const columns: ExcelColumn[] = [
    { header: 'Record ID', key: 'id', width: 15 },
    { header: 'Book Title', key: 'bookTitle', width: 30 },
    { header: 'Borrower Name', key: 'borrowerName', width: 25 },
    { header: 'Issue Date', key: 'issueDate', width: 15, format: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { header: 'Due Date', key: 'dueDate', width: 15, format: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { header: 'Return Date', key: 'returnDate', width: 15, format: (v) => v ? new Date(v).toLocaleDateString() : 'Not Returned' },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Fine Amount', key: 'fineAmount', width: 12, format: (v) => v ? `$${v}` : '$0' }
  ];
  
  exportToCSV({
    filename: `library-borrowing-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Borrowing Records',
    columns,
    data: records
  });
}

/**
 * Export fines report to Excel/CSV
 */
export function exportFinesReport(fines: any[]): void {
  const columns: ExcelColumn[] = [
    { header: 'Fine ID', key: 'id', width: 15 },
    { header: 'Member Name', key: 'memberName', width: 25 },
    { header: 'Book Title', key: 'bookTitle', width: 30 },
    { header: 'Amount', key: 'amount', width: 12, format: (v) => `$${v || 0}` },
    { header: 'Reason', key: 'reason', width: 25 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created Date', key: 'createdAt', width: 15, format: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { header: 'Paid Date', key: 'paidDate', width: 15, format: (v) => v ? new Date(v).toLocaleDateString() : 'Not Paid' }
  ];
  
  exportToCSV({
    filename: `library-fines-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Fines',
    columns,
    data: fines
  });
}

/**
 * Export expired membership cards report
 */
export function exportExpiredCards(members: any[]): void {
  const columns: ExcelColumn[] = [
    { header: 'Member ID', key: 'id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Membership Date', key: 'membershipDate', width: 18, format: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { header: 'Expiry Date', key: 'expiryDate', width: 18, format: (v) => v ? new Date(v).toLocaleDateString() : 'Expired' },
    { header: 'Days Overdue', key: 'daysOverdue', width: 12 }
  ];
  
  exportToCSV({
    filename: `library-expired-members-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Expired Members',
    columns,
    data: members
  });
}
