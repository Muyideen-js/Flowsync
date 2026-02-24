import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import './Settings.css';

/* ── Icons ── */
const Ic = {
    user: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="7" r="3.5" /><path d="M2.5 18.5a7.5 7.5 0 0115 0" /></svg>,
    bell: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 8a5 5 0 00-10 0c0 5.5-2.5 7-2.5 7h15S15 13.5 15 8z" /><path d="M11.5 17a1.8 1.8 0 01-3 0" /></svg>,
    ai: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1.5 4 4 1.5-4 1.5L10 13l-1.5-4-4-1.5 4-1.5z" /><path d="M15 12l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>,
    card: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="16" height="12" /><path d="M2 9h16" /></svg>,
    check: <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2.5 8.5l4 4 7-9" /></svg>,
    save: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13.5 5.5v8a1 1 0 01-1 1h-9a1 1 0 01-1-1v-11a1 1 0 011-1h6z" /><path d="M9.5 1.5v4h4" /><path d="M5 9l2 2 4-4" /></svg>,
    alert: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7.134 2.5a1 1 0 011.732 0l5.2 9a1 1 0 01-.866 1.5H2.8a1 1 0 01-.866-1.5z" /><path d="M8 6v3M8 11h.01" /></svg>,
};

const Settings = () => {
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState('general');
    const [saved, setSaved] = useState(false);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

    const [settings, setSettings] = useState({
        workspaceName: 'FlowSync',
        displayName: displayName,
        email: user?.email || 'team@flowsync.io',
        timezone: 'UTC+1 (West Africa)',
        language: 'English',
        darkMode: true,
        notifications: true,
        emailDigest: true,
        soundAlerts: false,
        inboxAlerts: true,
        mentionAlerts: true,
        aiAssist: true,
        autoSchedule: true,
        smartReplies: true,
        sentimentAlert: false,
        brandVoice: true,
    });

    useEffect(() => { requestAnimationFrame(() => setLoaded(true)); }, []);

    const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const tabs = [
        { key: 'general', label: 'General', icon: Ic.user },
        { key: 'notifications', label: 'Notifications', icon: Ic.bell },
        { key: 'ai', label: 'AI & Features', icon: Ic.ai },
        { key: 'billing', label: 'Billing', icon: Ic.card },
    ];

    const Toggle = ({ checked, onChange }) => (
        <label className="st-toggle">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="st-track">
                {checked && <span className="st-check">{Ic.check}</span>}
            </span>
        </label>
    );

    const Row = ({ label, desc, children }) => (
        <div className="st-row">
            <div className="st-row-info">
                <span className="st-row-label">{label}</span>
                {desc && <span className="st-row-desc">{desc}</span>}
            </div>
            <div className="st-row-control">{children}</div>
        </div>
    );

    return (
        <MainLayout>
            <div className={`settings-page ${loaded ? 'loaded' : ''}`}>

                {/* ── Header ── */}
                <div className="st-head st-anim" style={{ '--i': 0 }}>
                    <div>
                        <h1>Settings</h1>
                        <p>Manage your workspace preferences and account configuration</p>
                    </div>
                    <button className={`st-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
                        {saved ? <>{Ic.check} Saved</> : <>{Ic.save} Save Changes</>}
                    </button>
                </div>

                {/* ── Layout ── */}
                <div className="st-layout st-anim" style={{ '--i': 1 }}>

                    {/* ── Vertical tab nav ── */}
                    <nav className="st-nav">
                        {tabs.map(t => (
                            <button key={t.key} className={`st-nav-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                                <span className="st-nav-icon">{t.icon}</span>
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* ── Panel ── */}
                    <div className="st-panel">

                        {/* General */}
                        {tab === 'general' && (
                            <>
                                <div className="st-section">
                                    <h3 className="st-section-title">Profile</h3>
                                    <div className="st-profile-header">
                                        <div className="st-avatar">
                                            <span>{displayName.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="st-avatar-name">{displayName}</p>
                                            <p className="st-avatar-email">{settings.email}</p>
                                        </div>
                                    </div>
                                    <div className="st-fields">
                                        <div className="st-field">
                                            <label>Display Name</label>
                                            <input className="st-input" type="text" value={settings.displayName} onChange={e => set('displayName', e.target.value)} />
                                        </div>
                                        <div className="st-field">
                                            <label>Email</label>
                                            <input className="st-input" type="email" value={settings.email} onChange={e => set('email', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Workspace</h3>
                                    <div className="st-fields">
                                        <div className="st-field">
                                            <label>Workspace Name</label>
                                            <input className="st-input" type="text" value={settings.workspaceName} onChange={e => set('workspaceName', e.target.value)} />
                                        </div>
                                        <div className="st-field-row">
                                            <div className="st-field">
                                                <label>Timezone</label>
                                                <select className="st-select" value={settings.timezone} onChange={e => set('timezone', e.target.value)}>
                                                    <option>UTC+1 (West Africa)</option>
                                                    <option>UTC+0 (GMT)</option>
                                                    <option>UTC-5 (Eastern US)</option>
                                                    <option>UTC-8 (Pacific US)</option>
                                                    <option>UTC+3 (East Africa)</option>
                                                </select>
                                            </div>
                                            <div className="st-field">
                                                <label>Language</label>
                                                <select className="st-select" value={settings.language} onChange={e => set('language', e.target.value)}>
                                                    <option>English</option>
                                                    <option>Spanish</option>
                                                    <option>French</option>
                                                    <option>Arabic</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Appearance</h3>
                                    <Row label="Dark Mode" desc="Use dark theme across the dashboard">
                                        <Toggle checked={settings.darkMode} onChange={() => toggle('darkMode')} />
                                    </Row>
                                </div>

                                <div className="st-section danger-zone">
                                    <h3 className="st-section-title st-danger-title">
                                        {Ic.alert} Danger Zone
                                    </h3>
                                    <Row label="Delete Workspace" desc="Permanently delete this workspace and all associated data. This cannot be undone.">
                                        <button className="st-danger-btn">Delete Workspace</button>
                                    </Row>
                                </div>
                            </>
                        )}

                        {/* Notifications */}
                        {tab === 'notifications' && (
                            <>
                                <div className="st-section">
                                    <h3 className="st-section-title">Push & Browser</h3>
                                    <Row label="Push Notifications" desc="Receive real-time alerts in your browser">
                                        <Toggle checked={settings.notifications} onChange={() => toggle('notifications')} />
                                    </Row>
                                    <Row label="Sound Alerts" desc="Play a sound for new messages and events">
                                        <Toggle checked={settings.soundAlerts} onChange={() => toggle('soundAlerts')} />
                                    </Row>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Email</h3>
                                    <Row label="Daily Digest" desc="Receive a morning summary of yesterday's activity">
                                        <Toggle checked={settings.emailDigest} onChange={() => toggle('emailDigest')} />
                                    </Row>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Activity</h3>
                                    <Row label="Inbox Alerts" desc="Notify when new messages arrive in your inbox">
                                        <Toggle checked={settings.inboxAlerts} onChange={() => toggle('inboxAlerts')} />
                                    </Row>
                                    <Row label="Mention Alerts" desc="Notify when your brand is mentioned across platforms">
                                        <Toggle checked={settings.mentionAlerts} onChange={() => toggle('mentionAlerts')} />
                                    </Row>
                                </div>
                            </>
                        )}

                        {/* AI & Features */}
                        {tab === 'ai' && (
                            <>
                                <div className="st-section">
                                    <h3 className="st-section-title">AI Features</h3>
                                    <Row label="AI Assist in Composer" desc="Show writing suggestions and generate content variations">
                                        <Toggle checked={settings.aiAssist} onChange={() => toggle('aiAssist')} />
                                    </Row>
                                    <Row label="Brand Voice" desc="Train AI to match your brand tone and style">
                                        <Toggle checked={settings.brandVoice} onChange={() => toggle('brandVoice')} />
                                    </Row>
                                    <Row label="Smart Replies" desc="Generate context-aware reply suggestions in the Inbox">
                                        <Toggle checked={settings.smartReplies} onChange={() => toggle('smartReplies')} />
                                    </Row>
                                    <Row label="Sentiment Alerts" desc="Alert when negative sentiment is detected in messages">
                                        <Toggle checked={settings.sentimentAlert} onChange={() => toggle('sentimentAlert')} />
                                    </Row>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Scheduling</h3>
                                    <Row label="Auto-Schedule" desc="AI picks the optimal time to publish your posts based on audience data">
                                        <Toggle checked={settings.autoSchedule} onChange={() => toggle('autoSchedule')} />
                                    </Row>
                                </div>
                            </>
                        )}

                        {/* Billing */}
                        {tab === 'billing' && (
                            <>
                                <div className="st-section">
                                    <h3 className="st-section-title">Current Plan</h3>
                                    <div className="st-plan-card">
                                        <div className="st-plan-top">
                                            <div>
                                                <span className="st-plan-name">Pro Plan</span>
                                                <span className="st-plan-badge">Active</span>
                                            </div>
                                            <div className="st-plan-price">$29<span>/mo</span></div>
                                        </div>
                                        <div className="st-plan-features">
                                            {['4 platform connections', 'AI-powered composer', 'Smart reply suggestions', 'Advanced analytics', 'API access', 'Priority support'].map(f => (
                                                <div key={f} className="st-plan-feature">
                                                    {Ic.check}<span>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="st-plan-actions">
                                            <button className="st-upgrade-btn">Manage Subscription</button>
                                            <button className="st-ghost-btn">View Invoice History</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Usage This Month</h3>
                                    {[
                                        { label: 'API Calls', used: 2847, max: 10000 },
                                        { label: 'AI Tokens', used: 14200, max: 50000 },
                                        { label: 'Messages Sent', used: 826, max: 5000 },
                                        { label: 'Scheduled Posts', used: 18, max: null },
                                    ].map((item, i) => {
                                        const pct = item.max ? Math.round((item.used / item.max) * 100) : 100;
                                        const warn = pct > 80;
                                        return (
                                            <div key={i} className="st-usage-row">
                                                <div className="st-usage-info">
                                                    <span className="st-usage-label">{item.label}</span>
                                                    <span className="st-usage-val">{item.used.toLocaleString()}{item.max ? ` / ${item.max.toLocaleString()}` : ' / Unlimited'}</span>
                                                </div>
                                                <div className="st-usage-bar">
                                                    <div className="st-usage-fill" style={{ width: `${pct}%`, background: item.max ? (warn ? '#f59e0b' : '#00c93a') : '#00c93a' }} />
                                                </div>
                                                {warn && item.max && <span className="st-usage-warn">{100 - pct}% remaining</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
