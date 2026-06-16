import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './hooks/useAuth';
import { DOC_TYPES, type DocType } from './lib/docTypes';
import { generatePDF } from './lib/pdfGenerator';
import { tradedoc, type Dashboard } from './lib/tradedoc';
import './App.css';

type View = 'dashboard' | 'documents' | 'upgrade' | 'workspace';
type FormData = Record<string, string>;
type AuthStep = 'email' | 'code';

const navItems: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'documents', label: 'Documents' },
  { id: 'workspace', label: 'New Document' },
  { id: 'upgrade', label: 'Pro Plan' },
];

const workspaceSteps = ['Draft', 'Review', 'Export', 'Archive'];

function getInitialForm(doc: DocType): FormData {
  return doc.fields.reduce<FormData>((acc, field) => {
    acc[field.id] = field.type === 'date' ? new Date().toISOString().slice(0, 10) : '';
    return acc;
  }, {});
}

function App() {
  const { user, loading, requestCode, verifyCode, logout } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(DOC_TYPES[0]?.id ?? '');
  const selectedDoc = useMemo(
    () => DOC_TYPES.find((doc) => doc.id === selectedDocId) ?? DOC_TYPES[0],
    [selectedDocId],
  );
  const [form, setForm] = useState<FormData>(() => getInitialForm(selectedDoc));
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [pendingEmail, setPendingEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [docError, setDocError] = useState('');
  const [notice, setNotice] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const freeDocs = useMemo(() => DOC_TYPES.filter((doc) => !doc.proOnly), []);
  const proDocs = useMemo(() => DOC_TYPES.filter((doc) => doc.proOnly), []);
  const completedFields = selectedDoc.fields.filter((field) => form[field.id]?.trim()).length;
  const completion = Math.round((completedFields / selectedDoc.fields.length) * 100);
  const isPro = dashboard?.plan_status === 'pro';
  const accountLabel = dashboard?.company || user?.email || 'TradeDoc';

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      if (!user) {
        setDashboard(null);
        setDashboardError('');
        return;
      }

      setDashboardLoading(true);
      setDashboardError('');
      try {
        const result = await tradedoc.getDashboard();
        if (!ignore) {
          setDashboard(result);
        }
      } catch (error) {
        if (!ignore) {
          setDashboard(null);
          setDashboardError(error instanceof Error ? error.message : 'Unable to load dashboard.');
        }
      } finally {
        if (!ignore) {
          setDashboardLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [user]);

  function handleSelectDoc(doc: DocType) {
    setSelectedDocId(doc.id);
    setForm(getInitialForm(doc));
    setDocError('');
    setNotice('');
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const company = String(data.get('company') ?? '').trim();

    if (!email || !company) {
      setAuthError('Enter a work email and company name to continue.');
      return;
    }

    setIsAuthenticating(true);
    try {
      await requestCode(email, company);
      setPendingEmail(email);
      setAuthStep('code');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to send a login code.');
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    const data = new FormData(event.currentTarget);
    const token = String(data.get('token') ?? '').trim();

    if (!pendingEmail || !token) {
      setAuthError('Enter the code sent to your email.');
      return;
    }

    setIsAuthenticating(true);
    try {
      await verifyCode(pendingEmail, token);
      await tradedoc.getDashboard();
      setView('dashboard');
      setAuthStep('email');
      setPendingEmail('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to verify that code.');
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setDashboard(null);
    setNotice('');
    setDocError('');
    setDashboardError('');
    await logout();
    setView('dashboard');
    setIsSigningOut(false);
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDocError('');
    setNotice('');

    if (!user) {
      setDocError('Sign in again to generate documents.');
      return;
    }

    const missing = selectedDoc.fields.filter((field) => field.required && !form[field.id]?.trim());
    if (missing.length > 0) {
      setDocError(`Complete required fields: ${missing.map((field) => field.label).join(', ')}.`);
      return;
    }

    setIsGenerating(true);
    try {
      const approval = await tradedoc.generateDoc({ doc_type: selectedDoc.id, payload: form });
      generatePDF(selectedDoc, form, dashboard?.company ?? 'TradeDoc Workspace', approval.document_id);
      setNotice(`${selectedDoc.label} generated successfully.`);
      const refreshedDashboard = await tradedoc.getDashboard();
      setDashboard(refreshedDashboard);
    } catch (error) {
      setDocError(error instanceof Error ? error.message : 'The document could not be generated. Check the form and try again.');
      if (selectedDoc.proOnly && !isPro) {
        setView('upgrade');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleUpgradeRequest() {
    setDocError('');
    setNotice('');

    try {
      await tradedoc.submitUpgradeRequest();
      setNotice('Upgrade request sent.');
    } catch (error) {
      setDocError(error instanceof Error ? error.message : 'Unable to send upgrade request.');
    }
  }

  if (loading) {
    return (
      <main className="app-shell is-loading">
        <div className="loading-card" aria-live="polite">
          <span className="loader" />
          <p>Preparing TradeDoc workspace</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-hero" aria-labelledby="login-title">
          <div className="brand-mark">TD</div>
          <p className="eyebrow">Export infrastructure</p>
          <h1 id="login-title">TradeDoc</h1>
          <p className="hero-copy">
            Export documentation and verification infrastructure for invoices, packing lists, QA records, and shipment-ready evidence.
          </p>
          <div className="hero-panel" aria-label="Workspace preview">
            <div>
              <span>Commercial invoice</span>
              <strong>Ready</strong>
            </div>
            <div>
              <span>Packing list</span>
              <strong>Draft</strong>
            </div>
            <div>
              <span>QA record</span>
              <strong>Review</strong>
            </div>
          </div>
        </section>

        <section className="login-card" aria-label="Sign in">
          <p className="eyebrow">Private access</p>
          <h2>{authStep === 'email' ? 'Sign in' : 'Enter code'}</h2>
          {authStep === 'email' ? (
            <form onSubmit={handleRequestCode} className="auth-form">
              <label>
                Work email
                <input name="email" type="email" autoComplete="email" placeholder="operations@company.com" />
              </label>
              <label>
                Company
                <input name="company" autoComplete="organization" placeholder="Company Limited" />
              </label>
              {authError && <p className="error-state">{authError}</p>}
              <button className="primary-button" type="submit" disabled={isAuthenticating}>
                {isAuthenticating ? 'Sending...' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="auth-form">
              <p className="muted-copy">We sent a login code to {pendingEmail}.</p>
              <label>
                Login code
                <input name="token" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
              </label>
              {authError && <p className="error-state">{authError}</p>}
              <button className="primary-button" type="submit" disabled={isAuthenticating}>
                {isAuthenticating ? 'Verifying...' : 'Verify code'}
              </button>
              <button className="link-button" type="button" onClick={() => setAuthStep('email')}>
                Use a different email
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="TradeDoc navigation">
        <div className="sidebar-brand">
          <div className="brand-mark">TD</div>
          <div>
            <strong>TradeDoc</strong>
            <span>{accountLabel}</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={view === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="account-card">
          <span>{user.email}</span>
          <strong>{dashboardLoading ? 'Syncing plan...' : `${dashboard?.plan_status ?? 'free'} plan`}</strong>
          <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
        <p className="sidebar-product-credit">A LenmacAI product</p>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{view}</p>
            <h1>
              {view === 'documents'
                ? selectedDoc.label
                : view === 'workspace'
                  ? 'Workspace controls'
                  : view === 'upgrade'
                    ? 'Upgrade workspace'
                    : 'Export command center'}
            </h1>
          </div>
          <button className="secondary-button" type="button" onClick={() => setView('documents')}>
            New document
          </button>
        </header>

        {dashboardError && <p className="error-state">{dashboardError}</p>}

        {view === 'dashboard' && (
          <section className="dashboard-grid">
            <div className="hero-dashboard">
              <p className="eyebrow">Today</p>
              <h2>Control export records from draft to verified PDF.</h2>
              <p>Start from approved templates, monitor completion, and keep document output aligned with the active account plan.</p>
            </div>
            <div className="metrics-grid">
              <Metric label="Documents" value={dashboardLoading ? '...' : String(dashboard?.documents_generated ?? 0)} />
              <Metric label="Limit" value={dashboardLoading ? '...' : String(dashboard?.document_limit ?? 0)} />
              <Metric label="Templates" value={String(DOC_TYPES.length)} />
            </div>
            <div className="panel wide-panel">
              <PanelHeader title="Recent activity" caption="Server-synced account activity" />
              {dashboardLoading ? (
                <SkeletonRows />
              ) : dashboard?.recent_activity?.length ? (
                <ul className="activity-list">
                  {dashboard.recent_activity.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <EmptyState title="No recent activity" copy="Generated documents and account updates will appear here." />
              )}
            </div>
          </section>
        )}

        {view === 'documents' && (
          <section className="document-layout">
            <div className="template-rail">
              <PanelHeader title="Templates" caption={`${freeDocs.length} free, ${proDocs.length} pro`} />
              <div className="template-list">
                {DOC_TYPES.map((doc) => (
                  <button
                    className={selectedDoc.id === doc.id ? 'template-card active' : 'template-card'}
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    type="button"
                  >
                    <span>{doc.icon}</span>
                    <strong>{doc.label}</strong>
                    <small>{doc.description}</small>
                    {doc.proOnly && <em>Pro</em>}
                  </button>
                ))}
              </div>
            </div>

            <form className="document-form" onSubmit={handleGenerate}>
              <div className="form-header">
                <div>
                  <p className="eyebrow">Controlled template</p>
                  <h2>{selectedDoc.label}</h2>
                </div>
                <div className="progress-ring" aria-label={`${completion}% complete`}>{completion}%</div>
              </div>
              <div className="field-grid">
                {selectedDoc.fields.map((field) => (
                  <label className={field.type === 'textarea' ? 'span-two' : ''} key={field.id}>
                    {field.label}{field.required && <span>Required</span>}
                    {field.type === 'textarea' ? (
                      <textarea
                        value={form[field.id] ?? ''}
                        placeholder={field.placeholder}
                        onChange={(event) => setForm((current) => ({ ...current, [field.id]: event.target.value }))}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={form[field.id] ?? ''}
                        onChange={(event) => setForm((current) => ({ ...current, [field.id]: event.target.value }))}
                      >
                        <option value="">Select</option>
                        {field.options?.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={form[field.id] ?? ''}
                        placeholder={field.placeholder}
                        onChange={(event) => setForm((current) => ({ ...current, [field.id]: event.target.value }))}
                      />
                    )}
                  </label>
                ))}
              </div>
              {docError && <p className="error-state">{docError}</p>}
              {notice && <p className="success-state">{notice}</p>}
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={() => setForm(getInitialForm(selectedDoc))}>Reset</button>
                <button className="primary-button" type="submit" disabled={isGenerating || dashboardLoading}>
                  {isGenerating ? 'Verifying...' : 'Generate PDF'}
                </button>
              </div>
            </form>
          </section>
        )}

        {view === 'workspace' && (
          <section className="panel workspace-panel">
            <PanelHeader title="Workspace flow" caption="Operational handoff from draft file to archived export record" />
            <div className="steps-grid">
              {workspaceSteps.map((step, index) => (
                <div className="step-card" key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                  <p>{index === 0 ? 'Create from a template.' : index === 1 ? 'Check required fields.' : index === 2 ? 'Generate the final PDF.' : 'Keep a clean record.'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'upgrade' && (
          <section className="upgrade-grid">
            <div className="upgrade-hero">
              <p className="eyebrow">Pro workspace</p>
              <h2>Extend the same controlled workflow to advanced export records.</h2>
              <p>Pro adds contract, export readiness, banking, and trade finance templates without changing the workspace model.</p>
            </div>
            <div className="panel">
              <PanelHeader title="Included Pro templates" caption="No workflow changes required" />
              <ul className="pro-list">
                {proDocs.map((doc) => <li key={doc.id}>{doc.label}</li>)}
              </ul>
              {docError && <p className="error-state">{docError}</p>}
              {notice && <p className="success-state">{notice}</p>}
              <button className="primary-button full-width" type="button" onClick={handleUpgradeRequest}>
                Request upgrade
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelHeader({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <p>{caption}</p>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="skeleton-stack" aria-label="Loading activity">
      <span />
      <span />
      <span />
    </div>
  );
}

export default App;
