import { toast } from 'react-toastify';

export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const keys = headers || Object.keys(data[0]);
    const rows = data.map(item => 
      keys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [keys.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('CSV exported successfully');
  } catch (error) {
    console.error('Export CSV error:', error);
    toast.error('Failed to export CSV');
  }
};

export const exportToPDF = (data: any[], filename: string, title?: string, columns?: { key: string; label: string }[]) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const tableHeaders = columns 
      ? columns.map(col => `<th style="background:#4CAF50;color:white;padding:8px;text-align:left;border:1px solid #ddd">${col.label}</th>`).join('')
      : Object.keys(data[0]).map(key => `<th style="background:#4CAF50;color:white;padding:8px;text-align:left;border:1px solid #ddd">${key}</th>`).join('');

    const tableRows = data.map(item => {
      const cells = columns 
        ? columns.map(col => `<td style="padding:8px;border:1px solid #ddd">${item[col.key] ?? ''}</td>`).join('')
        : Object.values(item).map(val => `<td style="padding:8px;border:1px solid #ddd">${val ?? ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title || filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          p { text-align: center; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${title || filename.replace(/-/g, ' ').toUpperCase()}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('PDF generated successfully');
    }
  } catch (error) {
    console.error('Export PDF error:', error);
    toast.error('Failed to generate PDF');
  }
};

export const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    const keys = Object.keys(data[0]);
    let excelContent = keys.join('\t') + '\n';
    
    data.forEach(item => {
      const row = keys.map(key => {
        const value = item[key];
        return value === null || value === undefined ? '' : String(value).replace(/\t/g, ' ');
      }).join('\t');
      excelContent += row + '\n';
    });

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Excel exported successfully');
  } catch (error) {
    console.error('Export Excel error:', error);
    toast.error('Failed to export Excel');
  }
};

export default { exportToCSV, exportToPDF, exportToExcel };