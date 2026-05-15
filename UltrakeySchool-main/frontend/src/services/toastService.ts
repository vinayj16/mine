import { toast } from 'react-toastify';

const toastService = {
  info: (msg: string) => {
    try { toast.info(msg); } catch { console.info('[toast]', msg); }
  },
  success: (msg: string) => {
    try { toast.success(msg); } catch { console.log('[toast]', msg); }
  },
  error: (msg: string) => {
    try { toast.error(msg); } catch { console.error('[toast]', msg); }
  },
  warn: (msg: string) => {
    try { toast.warn(msg); } catch { console.warn('[toast]', msg); }
  },
  actionError: (action: string, errorMsg?: string) => {
    const message = errorMsg ? `Failed to ${action}: ${errorMsg}` : `Failed to ${action}`;
    try { toast.error(message); } catch { console.error('[toast]', message); }
  },
  messageSent: (recipientName: string) => {
    const message = `Message sent to ${recipientName}`;
    try { toast.success(message); } catch { console.log('[toast]', message); }
  },
};

export default toastService;
