import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../../store/authStore';
import institutionSettingsService, {
  type InstitutionSettingsBundle,
  type PaymentGatewaySummary,
  type InstitutionBranding,
  type InstitutionEmailSettings,
  type InstitutionSupport,
  type LoginActivity
} from '../../../services/institutionSettingsService';
import uploadService from '../../../services/uploadService';
import { getImageUrl } from '../../../utils/imageUtils';

type Tab = 'branding' | 'email' | 'payments' | 'support' | 'activity' | 'profile';

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'branding', label: 'Branding & Logo', icon: 'ti ti-palette' },
  { key: 'email', label: 'Email / SMTP', icon: 'ti ti-mail' },
  { key: 'payments', label: 'Payment Gateways', icon: 'ti ti-credit-card' },
  { key: 'support', label: 'Support & Contact', icon: 'ti ti-headset' },
  { key: 'activity', label: 'Daily Login Activity', icon: 'ti ti-activity-heartbeat' },
  { key: 'profile', label: 'Institution Profile', icon: 'ti ti-building' }
];

const PAYMENT_GATEWAYS: Array<{ name: string; displayName: string; description: string; defaultKey?: string }> = [
  { name: 'razorpay', displayName: 'Razorpay', description: 'Popular in India — accepts UPI, cards, netbanking, wallets' },
  { name: 'stripe', displayName: 'Stripe', description: 'Global cards & digital wallets' },
  { name: 'paypal', displayName: 'PayPal', description: 'PayPal balance, cards, Pay in 4' },
  { name: 'payu', displayName: 'PayU', description: 'India & EMEA payment gateway' },
  { name: 'paytm', displayName: 'Paytm', description: 'Wallet, UPI, cards' },
  { name: 'bank-transfer', displayName: 'Bank Transfer', description: 'Manual NEFT / RTGS / IMPS — no API key needed' },
  { name: 'cash-on-delivery', displayName: 'Cash on Delivery', description: 'Collect fees at counter' }
];

const InstitutionBrandingSettings: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const institutionId = useMemo(() => {
    return (user as any)?.institutionId || (user as any)?.institutionData?.id || '';
  }, [user]);

  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bundle, setBundle] = useState<InstitutionSettingsBundle | null>(null);

  // Branding
  const [branding, setBranding] = useState<InstitutionBranding>({});
  const [logoUploading, setLogoUploading] = useState(false);

  // Email
  const [email, setEmail] = useState<InstitutionEmailSettings>({ activeProvider: 'none', isActive: false });

  // Payments
  const [gateways, setGateways] = useState<PaymentGatewaySummary[]>([]);
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [gatewayForm, setGatewayForm] = useState<{ publicKey: string; apiKey: string; apiSecret: string; merchantId: string; webhookSecret: string; environment: 'sandbox' | 'production' }>({
    publicKey: '', apiKey: '', apiSecret: '', merchantId: '', webhookSecret: '', environment: 'sandbox'
  });

  // Support
  const [support, setSupport] = useState<InstitutionSupport>({ email: '', phone: '', helpdeskUrl: '', hours: '', whatsapp: '', telegram: '', address: '' });

  // Activity
  const [activity, setActivity] = useState<LoginActivity | null>(null);

  // Profile
  const [profileForm, setProfileForm] = useState<InstitutionSettingsBundle['profile'] | null>(null);

  useEffect(() => {
    // Allow ?tab=branding etc.
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as Tab | null;
    if (tab && TABS.find(t => t.key === tab)) setActiveTab(tab);
  }, [location.search]);

  const load = useCallback(async () => {
    if (!institutionId) {
      toast.error('No institution associated with your account');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await institutionSettingsService.getSettings(institutionId);
      setBundle(data);
      setBranding(data.branding || {});
      setEmail(data.email || { activeProvider: 'none', isActive: false });
      setGateways(data.paymentGateways || []);
      setSupport(data.support || { email: '', phone: '', helpdeskUrl: '', hours: '', whatsapp: '', telegram: '', address: '' });
      setActivity(data.loginActivity || { dailyLogins: [], totalLogins: 0, lastLoginAt: null, uniqueLoginsLast30Days: 0 });
      setProfileForm(data.profile);
    } catch (err: any) {
      console.error('load settings', err);
      toast.error(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { load(); }, [load]);


  useEffect(() => { load(); }, [load]);

  // ─── BRANDING ────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.warn('Please upload an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.warn('Logo must be under 5MB'); return; }
    try {
      setLogoUploading(true);
      const result = await uploadService.uploadFile(file, { folder: 'branding' });
      if (result.success && result.file) {
        const url = result.file.url;
        setBranding(prev => ({ ...prev, logo: url }));
        await institutionSettingsService.updateBranding(institutionId, { logo: url });
        toast.success('Logo uploaded');
        load();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const saveBranding = async () => {
    try {
      setSaving(true);
      await institutionSettingsService.updateBranding(institutionId, branding);
      toast.success('Branding saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ─── EMAIL ────────────────────────────────────────────────────────
  const saveEmail = async () => {
    try {
      setSaving(true);
      await institutionSettingsService.updateEmailConfig(institutionId, email);
      toast.success('Email settings saved. Outgoing mail will now use your SMTP.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ─── PAYMENTS ────────────────────────────────────────────────────────
  const openGatewayEditor = (g: PaymentGatewaySummary) => {
    setEditingGateway(g.name);
    setGatewayForm({
      publicKey: g.publicKey || '',
      apiKey: '',
      apiSecret: '',
      merchantId: '',
      webhookSecret: '',
      environment: g.environment || 'sandbox'
    });
  };

  const saveGateway = async (name: string) => {
    const meta = PAYMENT_GATEWAYS.find(p => p.name === name);
    if (!meta) return;
    try {
      setSaving(true);
      const credentials: Record<string, string> = {
        publicKey: gatewayForm.publicKey || undefined,
        environment: gatewayForm.environment
      } as any;
      if (gatewayForm.apiKey) credentials.apiKey = gatewayForm.apiKey;
      if (gatewayForm.apiSecret) credentials.apiSecret = gatewayForm.apiSecret;
      if (gatewayForm.merchantId) credentials.merchantId = gatewayForm.merchantId;
      if (gatewayForm.webhookSecret) credentials.webhookSecret = gatewayForm.webhookSecret;

      await institutionSettingsService.updatePaymentGateway(institutionId, {
        name,
        displayName: meta.displayName,
        description: meta.description,
        isEnabled: true,
        isConnected: true,
        credentials
      } as any);
      toast.success(`${meta.displayName} configured`);
      setEditingGateway(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleGateway = async (g: PaymentGatewaySummary) => {
    try {
      await institutionSettingsService.updatePaymentGateway(institutionId, {
        name: g.name,
        displayName: g.displayName,
        description: g.description,
        isEnabled: !g.isEnabled,
        isConnected: g.isConnected
      } as any);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  // ─── SUPPORT ────────────────────────────────────────────────────────
  const saveSupport = async () => {
    try {
      setSaving(true);
      await institutionSettingsService.updateSupport(institutionId, support);
      toast.success('Support info saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ─── PROFILE ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profileForm) return;
    try {
      setSaving(true);
      await institutionSettingsService.updateProfile(institutionId, profileForm);
      toast.success('Institution profile saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !bundle) {
    return (
      <div className="content">
        <div className="text-center py-5">
          <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Institution Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active">Settings</li>
              <li className="breadcrumb-item active" aria-current="page">Institution</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-3 col-xl-4">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            {TABS.map(t => (
              <button key={t.key} type="button" className={`d-block rounded p-2 mb-1 text-start border-0 bg-transparent ${activeTab === t.key ? 'active text-primary fw-bold' : 'text-body'}`} onClick={() => setActiveTab(t.key)}>
                <i className={`${t.icon} me-2`}></i>{t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="col-xxl-9 col-xl-8">
          <div className="flex-fill border-start ps-3 pt-3">
            {activeTab === 'branding' && (
              <div>
                <h5 className="mb-1">Branding & Logo</h5>
                <p className="text-muted">Your institution's logo and colors. Used across the dashboard, login page, and outgoing emails.</p>
                <div className="card"><div className="card-body">
                  <div className="row align-items-center mb-4">
                    <div className="col-md-3 text-center">
                      {branding.logo ? (
                        <img src={getImageUrl(branding.logo)} alt="Logo" style={{ maxWidth: 160, maxHeight: 80, objectFit: 'contain' }} />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: 160, height: 80 }}>
                          <i className="ti ti-building-bank" style={{ fontSize: 32, color: '#94a3b8' }}></i>
                        </div>
                      )}
                      <label className="btn btn-sm btn-outline-primary mt-2 mb-0">
                        {logoUploading ? 'Uploading…' : branding.logo ? 'Replace' : 'Upload Logo'}
                        <input type="file" accept="image/*" hidden onChange={handleLogoUpload} disabled={logoUploading} />
                      </label>
                    </div>
                    <div className="col-md-9">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Primary Color</label>
                          <input type="color" className="form-control form-control-color" value={branding.primaryColor || '#3b82f6'} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Secondary Color</label>
                          <input type="color" className="form-control form-control-color" value={branding.secondaryColor || '#64748b'} onChange={e => setBranding({ ...branding, secondaryColor: e.target.value })} />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label">Font Family</label>
                          <input type="text" className="form-control" value={branding.fontFamily || ''} placeholder="Inter" onChange={e => setBranding({ ...branding, fontFamily: e.target.value })} />
                        </div>
            {activeTab === 'email' && (
              <div>
                <h5 className="mb-1">Email / SMTP</h5>
                <p className="text-muted">Configure the SMTP server that will send all transactional emails (fee receipts, notices, login OTPs) <strong>on behalf of your institution</strong>. If left empty, the platform default is used.</p>
                <div className="card"><div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Active Provider</label>
                      <select className="form-select" value={email.activeProvider} onChange={e => setEmail({ ...email, activeProvider: e.target.value as any })}>
                        <option value="none">Platform default (no custom SMTP)</option>
                        <option value="smtp">SMTP (Gmail, SendGrid, SES, etc.)</option>
                        <option value="phpMailer">PHPMailer</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3 d-flex align-items-end">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="email-active" checked={email.isActive} onChange={e => setEmail({ ...email, isActive: e.target.checked })} />
                        <label className="form-check-label" htmlFor="email-active">Active — use this config</label>
                      </div>
                    </div>
                  </div>
                  {email.activeProvider === 'smtp' && (
                    <div className="row">
                      <div className="col-md-8 mb-3"><label className="form-label">Host</label>
                        <input className="form-control" placeholder="smtp.gmail.com" value={email.smtp?.host || ''} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { username: '', password: '', fromEmail: '', fromName: '', encryption: 'tls', port: 587, enabled: true }), host: e.target.value } })} />
                      </div>
                      <div className="col-md-4 mb-3"><label className="form-label">Port</label>
                        <input type="number" className="form-control" value={email.smtp?.port || 587} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { host: '', username: '', password: '', fromEmail: '', fromName: '', encryption: 'tls', enabled: true }), port: parseInt(e.target.value) } })} />
                      </div>
                      <div className="col-md-6 mb-3"><label className="form-label">Username</label>
                        <input className="form-control" value={email.smtp?.username || ''} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { host: '', password: '', fromEmail: '', fromName: '', encryption: 'tls', port: 587, enabled: true }), username: e.target.value } })} />
                      </div>
                      <div className="col-md-6 mb-3"><label className="form-label">Password / App Password</label>
                        <input type="password" className="form-control" placeholder={email.smtp?.password === '********' ? 'Leave blank to keep existing' : ''} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { host: '', username: '', fromEmail: '', fromName: '', encryption: 'tls', port: 587, enabled: true }), password: e.target.value } })} />
                      </div>
                      <div className="col-md-4 mb-3"><label className="form-label">From Email</label>
                        <input className="form-control" placeholder="no-reply@yourschool.edu" value={email.smtp?.fromEmail || ''} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { host: '', username: '', password: '', fromName: '', encryption: 'tls', port: 587, enabled: true }), fromEmail: e.target.value } })} />
                      </div>
                      <div className="col-md-4 mb-3"><label className="form-label">From Name</label>
                        <input className="form-control" placeholder={bundle?.profile?.name || 'Your School'} value={email.smtp?.fromName || ''} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { host: '', username: '', password: '', fromEmail: '', encryption: 'tls', port: 587, enabled: true }), fromName: e.target.value } })} />
                      </div>
                      <div className="col-md-4 mb-3"><label className="form-label">Encryption</label>
                        <select className="form-select" value={email.smtp?.encryption || 'tls'} onChange={e => setEmail({ ...email, smtp: { ...(email.smtp || { host: '', username: '', password: '', fromEmail: '', fromName: '', port: 587, enabled: true }), encryption: e.target.value as any } })}>
                          <option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={saveEmail} disabled={saving}>{saving ? 'Saving…' : 'Save Email Config'}</button>
                </div></div>
              </div>
            )}

                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={saveBranding} disabled={saving}>{saving ? 'Saving…' : 'Save Branding'}</button>
                </div></div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h5 className="mb-1">Payment Gateways</h5>
                <p className="text-muted">Add your own payment gateway credentials. These are used when parents/students pay fees — money goes directly to your account, not ours.</p>
                <div className="row">
                  {PAYMENT_GATEWAYS.map(meta => {
                    const configured = gateways.find(g => g.name === meta.name);
                    const enabled = configured && configured.isEnabled;
                    const isEditing = editingGateway === meta.name;
                    return (
                      <div key={meta.name} className="col-md-6 mb-3">
                        <div className="card h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-0">{meta.displayName}</h6>
                                <small className="text-muted">{meta.description}</small>
                              </div>
                              {configured && (
                                <div className="form-check form-switch">
                                  <input className="form-check-input" type="checkbox" checked={!!enabled} onChange={() => toggleGateway(configured)} />
                                </div>
                              )}
                            </div>
                            {configured && (
                              <div className="mt-2 small text-muted">
                                Status: {enabled ? <span className="text-success fw-bold">Enabled</span> : <span className="text-secondary">Disabled</span>}
                                {' • '}
                                {configured.hasApiKey ? 'API key set' : 'No key'}
                              </div>
                            )}
                            {isEditing ? (
                              <div className="mt-3 border-top pt-3">
                                <div className="mb-2"><label className="form-label small">Public Key</label>
                                  <input className="form-control form-control-sm" value={gatewayForm.publicKey} onChange={e => setGatewayForm({ ...gatewayForm, publicKey: e.target.value })} /></div>
                                {meta.name !== 'bank-transfer' && meta.name !== 'cash-on-delivery' && (
                                  <>
                                    <div className="mb-2"><label className="form-label small">Secret / API Key</label>
                                      <input type="password" className="form-control form-control-sm" placeholder={configured?.hasApiKey ? 'Leave blank to keep' : 'sk_live_...'} value={gatewayForm.apiKey} onChange={e => setGatewayForm({ ...gatewayForm, apiKey: e.target.value })} /></div>
                                    <div className="mb-2"><label className="form-label small">Webhook Secret</label>
                                      <input type="password" className="form-control form-control-sm" value={gatewayForm.webhookSecret} onChange={e => setGatewayForm({ ...gatewayForm, webhookSecret: e.target.value })} /></div>
                                  </>
                                )}
                                <div className="mb-2"><label className="form-label small">Environment</label>
                                  <select className="form-select form-select-sm" value={gatewayForm.environment} onChange={e => setGatewayForm({ ...gatewayForm, environment: e.target.value as any })}>
                                    <option value="sandbox">Sandbox / Test</option>
                                    <option value="production">Production / Live</option>
                                  </select>
                                </div>
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-primary" onClick={() => saveGateway(meta.name)} disabled={saving}>Save</button>
                                  <button className="btn btn-sm btn-light" onClick={() => setEditingGateway(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => openGatewayEditor(configured || { name: meta.name, displayName: meta.displayName, description: meta.description, isEnabled: false, isConnected: false, hasApiKey: false, hasApiSecret: false, hasMerchantId: false, hasWebhookSecret: false } as any)}>
                                  {configured ? 'Edit' : 'Configure'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div>
                <h5 className="mb-1">Support & Contact</h5>
                <p className="text-muted">Contact details used on receipts, login help screens, and as the From-address for outgoing emails.</p>
                <div className="card"><div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label">Support Email</label>
                      <input type="email" className="form-control" value={support.email} onChange={e => setSupport({ ...support, email: e.target.value })} placeholder="support@yourschool.edu" /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Support Phone</label>
                      <input className="form-control" value={support.phone} onChange={e => setSupport({ ...support, phone: e.target.value })} placeholder="+91 9876543210" /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">WhatsApp</label>
                      <input className="form-control" value={support.whatsapp} onChange={e => setSupport({ ...support, whatsapp: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Helpdesk URL</label>
                      <input className="form-control" value={support.helpdeskUrl} onChange={e => setSupport({ ...support, helpdeskUrl: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Working Hours</label>
                      <input className="form-control" value={support.hours} onChange={e => setSupport({ ...support, hours: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Telegram</label>
                      <input className="form-control" value={support.telegram} onChange={e => setSupport({ ...support, telegram: e.target.value })} /></div>
                    <div className="col-md-12 mb-3"><label className="form-label">Address</label>
                      <textarea className="form-control" rows={2} value={support.address} onChange={e => setSupport({ ...support, address: e.target.value })} /></div>
                  </div>
                  <button className="btn btn-primary" onClick={saveSupport} disabled={saving}>{saving ? 'Saving…' : 'Save Support Info'}</button>
                </div></div>
              </div>
            )}

            {activeTab === 'activity' && activity && (
              <div>
                <h5 className="mb-1">Daily Login Activity</h5>
                <p className="text-muted">Track how many people from your institution sign in each day.</p>
                <div className="row mb-3">
                  <div className="col-md-3"><div className="card"><div className="card-body"><small className="text-muted">Total logins</small><h4 className="mb-0">{activity.totalLogins}</h4></div></div></div>
                  <div className="col-md-3"><div className="card"><div className="card-body"><small className="text-muted">Unique users (30d)</small><h4 className="mb-0">{activity.uniqueLoginsLast30Days}</h4></div></div></div>
                  <div className="col-md-3"><div className="card"><div className="card-body"><small className="text-muted">Today's logins</small><h4 className="mb-0">{(activity.dailyLogins.find(d => d.date === new Date().toISOString().slice(0,10)) || { count: 0 }).count}</h4></div></div></div>
                  <div className="col-md-3"><div className="card"><div className="card-body"><small className="text-muted">Last login</small><h6 className="mb-0">{activity.lastLoginAt ? new Date(activity.lastLoginAt).toLocaleString() : '—'}</h6></div></div></div>
                </div>
                <div className="card"><div className="card-body p-0">
                  <table className="table table-striped mb-0">
                    <thead><tr><th>Date</th><th>Logins</th><th>Users</th></tr></thead>
                    <tbody>
                      {activity.dailyLogins.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-4 text-muted">No logins tracked yet</td></tr>
                      ) : (
                        [...activity.dailyLogins].sort((a, b) => b.date.localeCompare(a.date)).map(d => (
                          <tr key={d.date}>
                            <td>{d.date}</td>
                            <td><span className="badge bg-primary-transparent">{d.count}</span></td>
                            <td>{d.users.slice(0, 3).map(u => (<span key={u.userId} className="badge bg-light text-dark me-1">{u.name || u.userId}</span>))}{d.users.length > 3 && <small className="text-muted">+{d.users.length - 3} more</small>}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div></div>
              </div>
            )}

            {activeTab === 'profile' && profileForm && (
              <div>
                <h5 className="mb-1">Institution Profile</h5>
                <p className="text-muted">Basic information about your institution.</p>
                <div className="card"><div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label">Name</label>
                      <input className="form-control" value={profileForm.name || ''} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Code</label>
                      <input className="form-control" value={profileForm.code || ''} disabled /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Type</label>
                      <input className="form-control" value={profileForm.type || ''} onChange={e => setProfileForm({ ...profileForm, type: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Principal Name</label>
                      <input className="form-control" value={profileForm.principalName || ''} onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Principal Email</label>
                      <input className="form-control" value={profileForm.principalEmail || ''} onChange={e => setProfileForm({ ...profileForm, principalEmail: e.target.value })} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Principal Phone</label>
                      <input className="form-control" value={profileForm.principalPhone || ''} onChange={e => setProfileForm({ ...profileForm, principalPhone: e.target.value })} /></div>
                    <div className="col-md-12"><label className="form-label">Website</label>
                      <input className="form-control" value={profileForm.website || ''} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} /></div>
                  </div>
                  <button className="btn btn-primary mt-3" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
                </div></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionBrandingSettings;
