import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileUp, Printer } from 'lucide-react';
import type { ExportColumn, ExportFormat } from '../../utils/exportUtils';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
  disabled?: boolean;
  columns?: ExportColumn[];
  filename?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const menuItems: { format: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  { format: 'csv', label: 'CSV', icon: <FileText size={16} />, description: 'Comma-separated values' },
  { format: 'excel', label: 'Excel', icon: <FileSpreadsheet size={16} />, description: 'Excel workbook (.xlsx)' },
  { format: 'pdf', label: 'PDF', icon: <FileUp size={16} />, description: 'PDF document' },
  { format: 'print', label: 'Print', icon: <Printer size={16} />, description: 'Printable view' },
];

const ExportButton: React.FC<ExportButtonProps> = ({ onExport, loading, disabled, className = '', size = 'md' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const btnSize = size === 'sm' ? 'btn-sm' : '';

  return (
    <div className="dropdown" ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className={`btn btn-outline-primary ${btnSize} ${className}`}
        onClick={() => setOpen(!open)}
        disabled={disabled || !!loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status" />
        ) : (
          <Download size={16} />
        )}
        {loading ? `Exporting...` : 'Export'}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            zIndex: 1050,
            minWidth: 220,
            marginTop: 4,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {menuItems.map(item => (
            <button
              key={item.format}
              onClick={() => { onExport(item.format); setOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                color: '#1e293b',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: '#6366f1', display: 'flex' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportButton;