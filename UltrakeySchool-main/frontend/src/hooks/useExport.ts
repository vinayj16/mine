import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { exportData, type ExportColumn, type ExportFormat } from '../utils/exportUtils';

interface UseExportOptions {
  filename?: string;
  columns?: ExportColumn[];
  title?: string;
  sheetName?: string;
  landscape?: boolean;
}

export const useExport = (options: UseExportOptions = {}) => {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const exportAs = useCallback(async (data: any[], format: ExportFormat, overrides?: Partial<UseExportOptions>) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExporting(format);
    try {
      const merged = { ...options, ...overrides };
      exportData(data, merged.filename || 'export', format, merged.columns, {
        title: merged.title,
        sheetName: merged.sheetName,
        landscape: merged.landscape,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    } finally {
      setExporting(null);
    }
  }, [options]);

  const exportCSV = useCallback((data: any[], overrides?: Partial<UseExportOptions>) => exportAs(data, 'csv', overrides), [exportAs]);
  const exportExcel = useCallback((data: any[], overrides?: Partial<UseExportOptions>) => exportAs(data, 'excel', overrides), [exportAs]);
  const exportPDF = useCallback((data: any[], overrides?: Partial<UseExportOptions>) => exportAs(data, 'pdf', overrides), [exportAs]);
  const exportPrint = useCallback((data: any[], overrides?: Partial<UseExportOptions>) => exportAs(data, 'print', overrides), [exportAs]);

  return {
    exporting,
    exportAs,
    exportCSV,
    exportExcel,
    exportPDF,
    exportPrint,
  };
};

export default useExport;