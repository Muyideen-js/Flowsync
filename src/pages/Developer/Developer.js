import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Developer.css';

/* ── Icons ── */
const Ic = {
    copy: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="5" y="5" width="9" height="9" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" /></svg>,
    eye: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></svg>,
    eyeOff: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5" /><path d="M3.4 3.5A7.5 7.5 0 0 0 1 8s2.5 5 7 5a7.2 7.2 0 0 0 3.6-1" /><path d="M8.6 3.1A7 7 0 0 1 15 8a7.5 7.5 0 0 1-1.4 2.5" /></svg>,
    plus: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>,
    trash: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2.5 4h11" /><path d="M5 4V2.5h6V4" /><path d="M3.5 4l.9 9.5a1 1 0 001 .9h5.2a1 1 0 001-.9L12.5 4" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2.5 8.5l4 4 7-9" /></svg>,
    refresh: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13.5 2.5v4h-4" /><path d="M2.5 8a5.5 5.5 0 019.4-3.5l1.6 2" /><path d="M2.5 13.5v-4h4" /><path d="M13.5 8a5.5 5.5 0 01-9.4 3.5l-1.6-2" /></svg>,
    link: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" /><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" /></svg>,
    code: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5 4L1 8l4 4" /><path d="M11 4l4 4-4 4" /><path d="M9.5 2.5l-3 11" /></svg>,
    zap: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1L2 9h5.5L7 15l7-8H8.5L8.5 1z" /></svg>,
    close: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>,
};

const MOCK_KEYS = [
    { id: 1, name: 'Production Key', key: 'fsk_live_4a8b2c1d9e7f3g5h6i0j2k4l8m6n0p2q', created: '2026-01-15', lastUsed: '2 hours ago', calls: 2847, active: true },
    { id: 2, name: 'Development Key', key: 'fsk_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p', created: '2026-02-01', lastUsed: 'Yesterday', calls: 412, active: true },
];

const MOCK_WEBHOOKS = [
    { id: 1, url: 'https://myapp.io/hooks/flowsync', events: ['message.received', 'post.published'], active: true, deliveries: 1204, failures: 3 },
    { id: 2, url: 'https://zapier.com/hooks/catch/abc123', events: ['lead.detected', 'follow.gained'], active: false, deliveries: 456, failures: 0 },
];

const ENDPOINTS = [
    { method: 'GET', path: '/v1/messages', desc: 'List all messages across connected platforms', auth: true },
    { method: 'POST', path: '/v1/messages/send', desc: 'Send a message to a contact on any platform', auth: true },
    { method: 'GET', path: '/v1/posts', desc: 'Retrieve all scheduled and published posts', auth: true },
    { method: 'POST', path: '/v1/posts/schedule', desc: 'Schedule a new post for one or more platforms', auth: true },
    { method: 'GET', path: '/v1/contacts', desc: 'List all contacts from your inbox', auth: true },
    { method: 'POST', path: '/v1/ai/generate', desc: 'Generate AI content using your brand voice', auth: true },
    { method: 'GET', path: '/v1/analytics/overview', desc: 'Fetch engagement metrics and audience stats', auth: true },
    { method: 'POST', path: '/v1/webhooks', desc: 'Register a new webhook endpoint', auth: true },
    { method: 'DELETE', path: '/v1/webhooks/:id', desc: 'Remove a registered webhook', auth: true },
    { method: 'GET', path: '/v1/status', desc: 'Check API health and platform connectivity', auth: false },
];

const USAGE_DAYS = [
    { day: 'Mon', calls: 320 },
    { day: 'Tue', calls: 488 },
    { day: 'Wed', calls: 215 },
    { day: 'Thu', calls: 542 },
    { day: 'Fri', calls: 621 },
    { day: 'Sat', calls: 180 },
    { day: 'Sun', calls: 97 },
];

const maskKey = (key) => key.slice(0, 12) + '•'.repeat(24) + key.slice(-4);

const Developer = () => {
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState('keys');
    const [keys, setKeys] = useState(MOCK_KEYS);
    const [webhooks, setWebhooks] = useState(MOCK_WEBHOOKS);
    const [showKey, setShowKey] = useState({});
    const [copied, setCopied] = useState(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newWH, setNewWH] = useState({ url: '', events: '' });
    const [showWHForm, setShowWHForm] = useState(false);
    const [expandedEndpoint, setExpandedEndpoint] = useState(null);

    useEffect(() => { requestAnimationFrame(() => setLoaded(true)); }, []);

    const maxCalls = Math.max(...USAGE_DAYS.map(d => d.calls));

    const copyText = useCallback((text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    const createKey = useCallback(() => {
        if (!newKeyName.trim()) return;
        const newKey = {
            id: Date.now(),
            name: newKeyName.trim(),
            key: `fsk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
            created: new Date().toISOString().split('T')[0],
            lastUsed: 'Never',
            calls: 0,
            active: true,
        };
        setKeys(prev => [newKey, ...prev]);
        setNewKeyName('');
        setShowCreate(false);
    }, [newKeyName]);

    const revokeKey = useCallback((id) => {
        setKeys(prev => prev.filter(k => k.id !== id));
    }, []);

    const addWebhook = useCallback(() => {
        if (!newWH.url.trim()) return;
        setWebhooks(prev => [...prev, {
            id: Date.now(),
            url: newWH.url.trim(),
            events: newWH.events.split(',').map(e => e.trim()).filter(Boolean),
            active: true,
            deliveries: 0,
            failures: 0,
        }]);
        setNewWH({ url: '', events: '' });
        setShowWHForm(false);
    }, [newWH]);

    const tabs = [
        { key: 'keys', label: 'API Keys' },
        { key: 'webhooks', label: 'Webhooks' },
        { key: 'docs', label: 'API Reference' },
        { key: 'usage', label: 'Usage' },
    ];

    return (
        <MainLayout>
            <div className={`dev-page ${loaded ? 'loaded' : ''}`}>

                {/* ── Hero ── */}
                <section className="dev-hero dev-anim" style={{ '--i': 0 }}>
                    <div>
                        <div className="dev-tag">DEVELOPER</div>
                        <h1>Developer Dashboard</h1>
                        <p>Manage API keys, webhooks, and integrate FlowSync into your own apps.</p>
                    </div>
                    <div className="dev-hero-badges">
                        <span className="dev-badge green">REST API v1</span>
                        <span className="dev-badge grey">Socket.io</span>
                        <span className="dev-badge grey">Webhooks</span>
                    </div>
                </section>

                {/* ── Tabs ── */}
                <div className="dev-tabs dev-anim" style={{ '--i': 1 }}>
                    {tabs.map(t => (
                        <button key={t.key} className={`dev-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="dev-content dev-anim" style={{ '--i': 2 }}>

                    {/* ══ API KEYS ════════════════════════════ */}
                    {tab === 'keys' && (
                        <div className="dev-keys">
                            <div className="dev-section-head">
                                <div>
                                    <h2>API Keys</h2>
                                    <p>Use these keys to authenticate requests from your application.</p>
                                </div>
                                <button className="dev-btn primary" onClick={() => setShowCreate(v => !v)}>
                                    {Ic.plus} <span>Create Key</span>
                                </button>
                            </div>

                            {showCreate && (
                                <div className="dev-create-form">
                                    <input
                                        type="text"
                                        placeholder="Key name (e.g. Production App)"
                                        value={newKeyName}
                                        onChange={e => setNewKeyName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && createKey()}
                                        className="dev-input"
                                        autoFocus
                                    />
                                    <button className="dev-btn primary" onClick={createKey}>Create</button>
                                    <button className="dev-btn ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                </div>
                            )}

                            <div className="dev-note">
                                {Ic.zap}
                                <span>Keep your API secret keys secure. Never expose them in client-side code or public repositories.</span>
                            </div>

                            <div className="dev-keys-list">
                                {keys.map(k => (
                                    <div key={k.id} className="dev-key-card">
                                        <div className="dev-key-top">
                                            <div className="dev-key-info">
                                                <span className="dev-key-name">{k.name}</span>
                                                <span className={`dev-key-status ${k.active ? 'active' : 'inactive'}`}>
                                                    {k.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="dev-key-actions">
                                                <button className="dev-icon-btn" onClick={() => setShowKey(p => ({ ...p, [k.id]: !p[k.id] }))} title={showKey[k.id] ? 'Hide' : 'Show'}>
                                                    {showKey[k.id] ? Ic.eyeOff : Ic.eye}
                                                </button>
                                                <button className="dev-icon-btn" onClick={() => copyText(k.key, `key-${k.id}`)} title="Copy">
                                                    {copied === `key-${k.id}` ? Ic.check : Ic.copy}
                                                </button>
                                                <button className="dev-icon-btn danger" onClick={() => revokeKey(k.id)} title="Revoke">
                                                    {Ic.trash}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="dev-key-value">
                                            <code>{showKey[k.id] ? k.key : maskKey(k.key)}</code>
                                        </div>
                                        <div className="dev-key-meta">
                                            <span>Created {k.created}</span>
                                            <span>Last used: {k.lastUsed}</span>
                                            <span>{k.calls.toLocaleString()} total calls</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="dev-code-block">
                                <div className="dev-cb-header">
                                    <span>Quick Start</span>
                                    <button className="dev-icon-btn" onClick={() => copyText(`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  https://api.flowsync.io/v1/messages`, 'quickstart')}>
                                        {copied === 'quickstart' ? Ic.check : Ic.copy}
                                    </button>
                                </div>
                                <pre>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.flowsync.io/v1/messages`}</pre>
                            </div>
                        </div>
                    )}

                    {/* ══ WEBHOOKS ════════════════════════════ */}
                    {tab === 'webhooks' && (
                        <div className="dev-webhooks">
                            <div className="dev-section-head">
                                <div>
                                    <h2>Webhooks</h2>
                                    <p>Receive real-time event notifications sent to your endpoints.</p>
                                </div>
                                <button className="dev-btn primary" onClick={() => setShowWHForm(v => !v)}>
                                    {Ic.plus} <span>Add Endpoint</span>
                                </button>
                            </div>

                            {showWHForm && (
                                <div className="dev-create-form dev-wh-form">
                                    <input type="url" placeholder="https://your-app.io/webhook" value={newWH.url} onChange={e => setNewWH(p => ({ ...p, url: e.target.value }))} className="dev-input" />
                                    <input type="text" placeholder="Events: message.received, post.published" value={newWH.events} onChange={e => setNewWH(p => ({ ...p, events: e.target.value }))} className="dev-input" />
                                    <button className="dev-btn primary" onClick={addWebhook}>Add</button>
                                    <button className="dev-btn ghost" onClick={() => setShowWHForm(false)}>Cancel</button>
                                </div>
                            )}

                            <div className="dev-wh-events-legend">
                                <span className="dev-legend-label">Available events:</span>
                                {['message.received', 'post.published', 'post.failed', 'lead.detected', 'follow.gained', 'mention.received'].map(e => (
                                    <span key={e} className="dev-event-chip">{e}</span>
                                ))}
                            </div>

                            <div className="dev-wh-list">
                                {webhooks.map(wh => (
                                    <div key={wh.id} className={`dev-wh-card ${!wh.active ? 'inactive' : ''}`}>
                                        <div className="dev-wh-top">
                                            <div className="dev-wh-url">
                                                {Ic.link}
                                                <code>{wh.url}</code>
                                            </div>
                                            <div className="dev-wh-right">
                                                <span className={`dev-key-status ${wh.active ? 'active' : 'inactive'}`}>{wh.active ? 'Active' : 'Paused'}</span>
                                                <button className="dev-icon-btn danger" onClick={() => setWebhooks(p => p.filter(w => w.id !== wh.id))}>{Ic.trash}</button>
                                            </div>
                                        </div>
                                        <div className="dev-wh-events">
                                            {wh.events.map(e => <span key={e} className="dev-event-chip">{e}</span>)}
                                        </div>
                                        <div className="dev-wh-stats">
                                            <span className="dev-stat-pill green">{wh.deliveries} delivered</span>
                                            {wh.failures > 0 && <span className="dev-stat-pill red">{wh.failures} failed</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ API REFERENCE ═══════════════════════ */}
                    {tab === 'docs' && (
                        <div className="dev-docs">
                            <div className="dev-docs-intro">
                                <div>
                                    <h2>API Reference</h2>
                                    <p>Base URL: <code>https://api.flowsync.io</code></p>
                                </div>
                                <div className="dev-auth-note">
                                    {Ic.key}
                                    <span>Pass your API key as <code>Authorization: Bearer YOUR_KEY</code></span>
                                </div>
                            </div>

                            <div className="dev-endpoints">
                                {ENDPOINTS.map((ep, i) => (
                                    <div key={i} className={`dev-ep ${expandedEndpoint === i ? 'expanded' : ''}`} onClick={() => setExpandedEndpoint(expandedEndpoint === i ? null : i)}>
                                        <div className="dev-ep-row">
                                            <span className={`dev-method ${ep.method.toLowerCase()}`}>{ep.method}</span>
                                            <code className="dev-ep-path">{ep.path}</code>
                                            <span className="dev-ep-desc">{ep.desc}</span>
                                            {!ep.auth && <span className="dev-ep-pub">Public</span>}
                                            <button className="dev-icon-btn" onClick={(e) => { e.stopPropagation(); copyText(`curl -H "Authorization: Bearer KEY" https://api.flowsync.io${ep.path}`, `ep-${i}`); }}>
                                                {copied === `ep-${i}` ? Ic.check : Ic.copy}
                                            </button>
                                        </div>
                                        {expandedEndpoint === i && (
                                            <div className="dev-ep-detail">
                                                <div className="dev-code-block">
                                                    <pre>{ep.method === 'GET'
                                                        ? `curl -X GET \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  https://api.flowsync.io${ep.path}`
                                                        : `curl -X ${ep.method} \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"key":"value"}' \\\n  https://api.flowsync.io${ep.path}`}
                                                    </pre>
                                                </div>
                                                <div className="dev-ep-response">
                                                    <span className="dev-resp-label">Response</span>
                                                    <pre>{`{\n  "status": "ok",\n  "data": [...]\n}`}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ USAGE ══════════════════════════════ */}
                    {tab === 'usage' && (
                        <div className="dev-usage">
                            <div className="dev-section-head">
                                <div>
                                    <h2>Usage Statistics</h2>
                                    <p>API call volume for the past 7 days</p>
                                </div>
                                <button className="dev-btn ghost">{Ic.refresh} <span>Refresh</span></button>
                            </div>

                            <div className="dev-usage-kpis">
                                {[
                                    { label: 'Total Calls (7d)', value: '2,463', change: '+12%', up: true },
                                    { label: 'Avg / Day', value: '352', change: '', up: true },
                                    { label: 'Error Rate', value: '0.8%', change: '-0.3%', up: false },
                                    { label: 'Latency (avg)', value: '142ms', change: '', up: true },
                                ].map((k, i) => (
                                    <div key={i} className="dev-kpi">
                                        <span className="dev-kpi-label">{k.label}</span>
                                        <span className="dev-kpi-value">{k.value}</span>
                                        {k.change && <span className={`dev-kpi-change ${k.up ? 'up' : 'down'}`}>{k.change}</span>}
                                    </div>
                                ))}
                            </div>

                            <div className="dev-chart-wrap">
                                <div className="dev-chart-label">Requests per day</div>
                                <div className="dev-bar-chart">
                                    {USAGE_DAYS.map((d, i) => (
                                        <div key={i} className="dev-bar-col">
                                            <div className="dev-bar-track">
                                                <div className="dev-bar-fill" style={{ height: `${(d.calls / maxCalls) * 100}%` }} title={d.calls.toString()} />
                                            </div>
                                            <span className="dev-bar-day">{d.day}</span>
                                            <span className="dev-bar-val">{d.calls}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="dev-usage-table">
                                <div className="dev-ut-header">
                                    <span>Endpoint</span>
                                    <span>Calls</span>
                                    <span>Avg ms</span>
                                    <span>Errors</span>
                                </div>
                                {[
                                    { path: 'GET /v1/messages', calls: 942, ms: 121, errors: 2 },
                                    { path: 'POST /v1/messages/send', calls: 418, ms: 274, errors: 8 },
                                    { path: 'GET /v1/analytics/overview', calls: 387, ms: 156, errors: 0 },
                                    { path: 'POST /v1/ai/generate', calls: 312, ms: 1240, errors: 1 },
                                    { path: 'POST /v1/posts/schedule', calls: 204, ms: 192, errors: 0 },
                                ].map((row, i) => (
                                    <div key={i} className="dev-ut-row">
                                        <code>{row.path}</code>
                                        <span>{row.calls.toLocaleString()}</span>
                                        <span>{row.ms}ms</span>
                                        <span className={row.errors > 0 ? 'dev-err' : 'dev-ok'}>{row.errors}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </MainLayout>
    );
};

export default Developer;
