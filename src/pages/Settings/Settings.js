import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, updateEmail } from 'firebase/auth';
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
    shield: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2L3 6v4c0 5 3.3 8.5 7 10 3.7-1.5 7-5 7-10V6z" /></svg>,
};

const Settings = () => {
    const { user, userData, updateUserData } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState('general');
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
    const [statusMessage, setStatusMessage] = useState('');

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const saveTimeout = useRef(null);

    // Initialize from Firestore userData, with defaults
    const [settings, setSettings] = useState({
        workspaceName: 'FlowSync',
        displayName: displayName,
        email: user?.email || '',
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
        bio: '',
        phone: '',
        twoFactor: false,
        sessionTimeout: '30',
    });

    // Sync from Firestore when userData loads
    useEffect(() => {
        if (userData?.settings) {
            setSettings(prev => ({ ...prev, ...userData.settings }));
        }
        if (userData?.displayName) {
            setSettings(prev => ({ ...prev, displayName: userData.displayName }));
        }
        if (userData?.email) {
            setSettings(prev => ({ ...prev, email: userData.email }));
        }
    }, [userData]);

    useEffect(() => { requestAnimationFrame(() => setLoaded(true)); }, []);

    // Auto-save debounce (saves settings changes automatically)
    const autoSave = useCallback((newSettings) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        setSaveStatus('saving');
        saveTimeout.current = setTimeout(async () => {
            try {
                await updateUserData({ settings: newSettings });
                setSaveStatus('saved');
                setStatusMessage('Settings saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                setSaveStatus('error');
                setStatusMessage('Failed to save');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }, 800);
    }, [updateUserData]);

    const toggle = (key) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            autoSave(updated);
            return updated;
        });
    };

    const set = (key, val) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: val };
            autoSave(updated);
            return updated;
        });
    };

    // Handle profile changes (name + email update Firebase Auth too)
    const handleSaveProfile = async () => {
        setSaveStatus('saving');
        try {
            // Update Firebase Auth display name
            if (user && settings.displayName !== user.displayName) {
                await updateProfile(user, { displayName: settings.displayName });
            }
            // Update Firebase Auth email (requires recent sign-in)
            if (user && settings.email !== user.email) {
                try {
                    await updateEmail(user, settings.email);
                } catch (emailErr) {
                    if (emailErr.code === 'auth/requires-recent-login') {
                        setStatusMessage('Please re-login to change email');
                        setSaveStatus('error');
                        setTimeout(() => setSaveStatus('idle'), 3000);
                        return;
                    }
                    throw emailErr;
                }
            }
            // Save to Firestore
            await updateUserData({
                displayName: settings.displayName,
                email: settings.email,
                settings,
            });
            setSaveStatus('saved');
            setStatusMessage('Profile updated');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Settings save error:', err);
            setSaveStatus('error');
            setStatusMessage(err.message || 'Failed to save');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handleDeleteWorkspace = () => {
        if (!window.confirm('Are you sure you want to delete your workspace? This action cannot be undone.')) return;
        alert('Workspace deletion is not yet implemented. Contact support.');
    };

    const tabs = [
        { key: 'general', label: 'General', icon: Ic.user },
        { key: 'notifications', label: 'Notifications', icon: Ic.bell },
        { key: 'ai', label: 'AI & Features', icon: Ic.ai },
        { key: 'security', label: 'Security', icon: Ic.shield },
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Auto-save indicator */}
                        {saveStatus !== 'idle' && (
                            <span style={{
                                fontSize: '11px', fontWeight: 600,
                                color: saveStatus === 'saved' ? '#22C55E' :
                                    saveStatus === 'saving' ? 'rgba(255,255,255,0.4)' :
                                        saveStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.3s',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                {saveStatus === 'saving' && (
                                    <span style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        border: '1.5px solid rgba(255,255,255,0.4)',
                                        borderTopColor: 'transparent',
                                        display: 'inline-block',
                                        animation: 'spin 0.6s linear infinite',
                                    }} />
                                )}
                                {saveStatus === 'saved' && Ic.check}
                                {statusMessage}
                            </span>
                        )}
                        <button className={`st-save-btn ${saveStatus === 'saved' ? 'saved' : ''}`} onClick={handleSaveProfile}>
                            {saveStatus === 'saving' ? <><span className="st-spinner" /> Saving…</> :
                                saveStatus === 'saved' ? <>{Ic.check} Saved</> :
                                    <>{Ic.save} Save Profile</>}
                        </button>
                    </div>
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
                                            <span>{(settings.displayName || displayName).charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="st-avatar-name">{settings.displayName || displayName}</p>
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
                                        <div className="st-field">
                                            <label>Bio</label>
                                            <textarea
                                                className="st-input"
                                                rows="3"
                                                placeholder="Tell us about yourself..."
                                                value={settings.bio}
                                                onChange={e => set('bio', e.target.value)}
                                                style={{ resize: 'vertical', minHeight: '60px' }}
                                            />
                                        </div>
                                        <div className="st-field">
                                            <label>Phone Number</label>
                                            <input className="st-input" type="tel" placeholder="+234 000 000 0000" value={settings.phone} onChange={e => set('phone', e.target.value)} />
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
                                                    <option>UTC+5:30 (India)</option>
                                                    <option>UTC+8 (Singapore)</option>
                                                    <option>UTC+9 (Japan)</option>
                                                </select>
                                            </div>
                                            <div className="st-field">
                                                <label>Language</label>
                                                <select className="st-select" value={settings.language} onChange={e => set('language', e.target.value)}>
                                                    <option>English</option>
                                                    <option>Spanish</option>
                                                    <option>French</option>
                                                    <option>Arabic</option>
                                                    <option>Portuguese</option>
                                                    <option>Hindi</option>
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
                                        <button className="st-danger-btn" onClick={handleDeleteWorkspace}>Delete Workspace</button>
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

                        {/* Security */}
                        {tab === 'security' && (
                            <>
                                <div className="st-section">
                                    <h3 className="st-section-title">Account Security</h3>
                                    <Row label="Two-Factor Authentication" desc="Add an extra layer of security to your account">
                                        <Toggle checked={settings.twoFactor} onChange={() => toggle('twoFactor')} />
                                    </Row>
                                    <Row label="Session Timeout" desc="Auto-logout after inactivity (minutes)">
                                        <select
                                            className="st-select"
                                            value={settings.sessionTimeout}
                                            onChange={(e) => set('sessionTimeout', e.target.value)}
                                            style={{ width: '100px' }}
                                        >
                                            <option value="15">15 min</option>
                                            <option value="30">30 min</option>
                                            <option value="60">1 hour</option>
                                            <option value="120">2 hours</option>
                                            <option value="never">Never</option>
                                        </select>
                                    </Row>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Active Sessions</h3>
                                    <div style={{
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: 600 }}>Current Session</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                                                    {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                                                        navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser'} — {new Date().toLocaleDateString()}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '3px 10px',
                                                background: 'rgba(34,197,94,0.1)',
                                                color: '#22C55E',
                                                fontSize: '10px', fontWeight: 700,
                                                letterSpacing: '0.05em',
                                            }}>ACTIVE</span>
                                        </div>
                                        <button style={{
                                            padding: '8px 16px',
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            color: '#EF4444', fontSize: '11px', fontWeight: 600,
                                            cursor: 'pointer', fontFamily: 'inherit',
                                        }}
                                            onClick={() => alert('This will sign out all other sessions.')}
                                        >
                                            Sign Out Other Sessions
                                        </button>
                                    </div>
                                </div>

                                <div className="st-section">
                                    <h3 className="st-section-title">Password</h3>
                                    <Row label="Change Password" desc="Update your account password">
                                        <button
                                            className="st-ghost-btn"
                                            onClick={() => {
                                                import('firebase/auth').then(({ sendPasswordResetEmail }) => {
                                                    const { auth } = require('../../firebase');
                                                    sendPasswordResetEmail(auth, user?.email)
                                                        .then(() => alert('Password reset email sent! Check your inbox.'))
                                                        .catch(err => alert('Error: ' + err.message));
                                                });
                                            }}
                                        >
                                            Send Reset Email
                                        </button>
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
