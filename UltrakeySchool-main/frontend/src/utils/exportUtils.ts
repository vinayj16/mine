import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any, row: any) => string;
}

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'print';

function getFilename(filename: string, ext: string): string {
  return `${filename}_${new Date().toISOString().split('T')[0]}.${ext}`;
}

function formatCellValue(value: any, col?: ExportColumn, row?: any): string {
  if (col?.format) return col.format(value, row);
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getColumnsFromData(data: any[], columns?: ExportColumn[]): ExportColumn[] {
  if (columns && columns.length > 0) return columns;
  if (data.length === 0) return [];
  return Object.keys(data[0]).map(key => ({ key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) }));
}

function prepareRows(data: any[], columns: ExportColumn[]): Record<string, string>[] {
  return data.map(row => {
    const result: Record<string, string> = {};
    columns.forEach(col => {
      result[col.key] = formatCellValue(row[col.key], col, row);
    });
    return result;
  });
}

export const exportToCSV = (data: any[], filename: string, columns?: ExportColumn[], options?: { header?: string; footer?: string }) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const cols = getColumnsFromData(data, columns);
    const rows = prepareRows(data, cols);

    const headerRow = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const dataRows = rows.map(row =>
      cols.map(c => `"${(row[c.key] || '').replace(/"/g, '""')}"`).join(',')
    );

    const parts: string[] = [];
    if (options?.header) parts.push(options.header);
    parts.push(headerRow, ...dataRows);
    if (options?.footer) parts.push(options.footer);

    const csvContent = parts.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, getFilename(filename, 'csv'));
    toast.success('CSV exported successfully');
  } catch (error) {
    console.error('Export CSV error:', error);
    toast.error('Failed to export CSV');
  }
};

export const exportToExcel = (data: any[], filename: string, columns?: ExportColumn[], sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const cols = getColumnsFromData(data, columns);
    const rows = prepareRows(data, cols);

    const headerRow = cols.map(c => c.label);
    const dataRows = rows.map(row => cols.map(c => row[c.key] ?? ''));
    
    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, getFilename(filename, 'xlsx'));
    toast.success('Excel exported successfully');
  } catch (error) {
    console.error('Export Excel error:', error);
    toast.error('Failed to export Excel');
  }
};

export const exportToPDF = (data: any[], filename: string, columns?: ExportColumn[], title?: string, landscape: boolean = false) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const cols = getColumnsFromData(data, columns);
    const rows = prepareRows(data, cols);

    const doc = new jsPDF(landscape ? 'landscape' : 'portrait', 'pt');

    if (title) {
      doc.setFontSize(16);
      doc.text(title, 40, 40);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 56);
    }

    autoTable(doc, {
      head: [cols.map(c => c.label)],
      body: rows.map(row => cols.map(c => row[c.key] ?? '')),
      startY: title ? 70 : 40,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [99, 102, 241], fontSize: 10, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 30, bottom: 30 },
    });

    if (landscape) {
      doc.save(getFilename(filename, 'pdf'));
    } else {
      doc.save(getFilename(filename, 'pdf'));
    }
    toast.success('PDF exported successfully');
  } catch (error) {
    console.error('Export PDF error:', error);
    toast.error('Failed to export PDF');
  }
};

export const exportToPrint = (data: any[], title: string, columns?: ExportColumn[]) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const cols = getColumnsFromData(data, columns);
    const rows = prepareRows(data, cols);

    const headerCells = cols.map(c => `<th style="background:#6366f1;color:white;padding:8px 12px;text-align:left;border:1px solid #d1d5db;font-size:12px">${c.label}</th>`).join('');

    const bodyRows = rows.map(row =>
      `<tr>${cols.map(c => `<td style="padding:8px 12px;border:1px solid #d1d5db;font-size:11px">${row[c.key] ?? ''}</td>`).join('')}</tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { text-align: center; color: #1e293b; font-size: 20px; }
      p.info { text-align: center; color: #64748b; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      tr:nth-child(even) { background: #f8fafc; }
    </style></head><body>
      <h1>${title}</h1>
      <p class="info">Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
      <p class="info" style="margin-top:20px">UltraKey School Management System</p>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { toast.error('Please allow popups'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    toast.success('Print ready');
  } catch (error) {
    console.error('Print error:', error);
    toast.error('Failed to print');
  }
};

export const exportData = (data: any[], filename: string, format: ExportFormat, columns?: ExportColumn[], options?: { title?: string; sheetName?: string; header?: string; footer?: string; landscape?: boolean }) => {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename, columns, { header: options?.header, footer: options?.footer });
      break;
    case 'excel':
      exportToExcel(data, filename, columns, options?.sheetName);
      break;
    case 'pdf':
      exportToPDF(data, filename, columns, options?.title || filename, options?.landscape);
      break;
    case 'print':
      exportToPrint(data, options?.title || filename, columns);
      break;
  }
};

export default { exportToCSV, exportToExcel, exportToPDF, exportToPrint, exportData };