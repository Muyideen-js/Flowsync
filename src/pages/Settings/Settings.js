import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Settings.css';

const Settings = () => {
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState('general');

    const [settings, setSettings] = useState({
        workspaceName: 'FlowSync',
        email: 'team@flowsync.io',
        timezone: 'UTC+1 (West Africa)',
        language: 'English',
        darkMode: true,
        notifications: true,
        emailDigest: true,
        soundAlerts: false,
        aiAssist: true,
        autoSchedule: true,
        smartReplies: true,
        sentimentAlert: false,
    });

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const toggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const tabs = [
        { key: 'general', label: 'General' },
        { key: 'notifications', label: 'Notifications' },
        { key: 'ai', label: 'AI & Automation' },
        { key: 'billing', label: 'Billing' },
    ];

    const Toggle = ({ checked, onChange }) => (
        <label className="st-toggle">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="st-toggle-track" />
        </label>
    );

    return (
        <MainLayout>
            <div className={`settings ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="st-head anim-st" style={{ '--i': 0 }}>
                    <h1>Settings</h1>
                    <p>Manage your workspace preferences</p>
                </div>

                {/* ── Tabs ── */}
                <div className="st-tabs anim-st" style={{ '--i': 1 }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            className={`st-tab ${tab === t.key ? 'active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Content ── */}
                <div className="st-content anim-st" style={{ '--i': 2 }}>

                    {/* General */}
                    {tab === 'general' && (
                        <div className="st-panel">
                            <div className="st-section">
                                <h3>Workspace</h3>
                                <div className="st-field">
                                    <label>Workspace Name</label>
                                    <input
                                        type="text"
                                        value={settings.workspaceName}
                                        onChange={e => setSettings(p => ({ ...p, workspaceName: e.target.value }))}
                                    />
                                </div>
                                <div className="st-field">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={e => setSettings(p => ({ ...p, email: e.target.value }))}
                                    />
                                </div>
                                <div className="st-field">
                                    <label>Timezone</label>
                                    <select value={settings.timezone} onChange={e => setSettings(p => ({ ...p, timezone: e.target.value }))}>
                                        <option>UTC+1 (West Africa)</option>
                                        <option>UTC+0 (GMT)</option>
                                        <option>UTC-5 (Eastern US)</option>
                                        <option>UTC-8 (Pacific US)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="st-section">
                                <h3>Appearance</h3>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Dark Mode</span>
                                        <span className="st-row-desc">Use dark theme across the dashboard</span>
                                    </div>
                                    <Toggle checked={settings.darkMode} onChange={() => toggle('darkMode')} />
                                </div>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Language</span>
                                        <span className="st-row-desc">Interface language</span>
                                    </div>
                                    <select className="st-inline-select" value={settings.language} onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}>
                                        <option>English</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                    </select>
                                </div>
                            </div>

                            <div className="st-section danger-zone">
                                <h3>Danger Zone</h3>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Delete Workspace</span>
                                        <span className="st-row-desc">Permanently delete this workspace and all data</span>
                                    </div>
                                    <button className="st-danger-btn">Delete</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {tab === 'notifications' && (
                        <div className="st-panel">
                            <div className="st-section">
                                <h3>Notifications</h3>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Push Notifications</span>
                                        <span className="st-row-desc">Receive real-time alerts in the browser</span>
                                    </div>
                                    <Toggle checked={settings.notifications} onChange={() => toggle('notifications')} />
                                </div>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Email Digest</span>
                                        <span className="st-row-desc">Daily summary of activity sent to your email</span>
                                    </div>
                                    <Toggle checked={settings.emailDigest} onChange={() => toggle('emailDigest')} />
                                </div>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Sound Alerts</span>
                                        <span className="st-row-desc">Play a sound for new messages and mentions</span>
                                    </div>
                                    <Toggle checked={settings.soundAlerts} onChange={() => toggle('soundAlerts')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI & Automation */}
                    {tab === 'ai' && (
                        <div className="st-panel">
                            <div className="st-section">
                                <h3>AI Features</h3>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">AI Assist in Composer</span>
                                        <span className="st-row-desc">Show AI writing suggestions when composing posts</span>
                                    </div>
                                    <Toggle checked={settings.aiAssist} onChange={() => toggle('aiAssist')} />
                                </div>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Auto-Schedule</span>
                                        <span className="st-row-desc">Automatically pick the best time to post</span>
                                    </div>
                                    <Toggle checked={settings.autoSchedule} onChange={() => toggle('autoSchedule')} />
                                </div>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Smart Replies</span>
                                        <span className="st-row-desc">Generate AI reply suggestions for incoming messages</span>
                                    </div>
                                    <Toggle checked={settings.smartReplies} onChange={() => toggle('smartReplies')} />
                                </div>
                                <div className="st-row">
                                    <div className="st-row-info">
                                        <span className="st-row-label">Sentiment Alerts</span>
                                        <span className="st-row-desc">Alert when negative sentiment is detected</span>
                                    </div>
                                    <Toggle checked={settings.sentimentAlert} onChange={() => toggle('sentimentAlert')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing */}
                    {tab === 'billing' && (
                        <div className="st-panel">
                            <div className="st-section">
                                <h3>Current Plan</h3>
                                <div className="st-plan-card">
                                    <div className="st-plan-info">
                                        <span className="st-plan-name">Pro Plan</span>
                                        <span className="st-plan-price">$29<span>/mo</span></span>
                                    </div>
                                    <ul className="st-plan-features">
                                        <li>Unlimited automations</li>
                                        <li>All platform connections</li>
                                        <li>AI-powered composer</li>
                                        <li>Advanced analytics</li>
                                        <li>Priority support</li>
                                    </ul>
                                    <div className="st-plan-actions">
                                        <button className="st-upgrade-btn">Manage Subscription</button>
                                    </div>
                                </div>
                            </div>

                            <div className="st-section">
                                <h3>Usage</h3>
                                <div className="st-usage-row">
                                    <div className="st-usage-info">
                                        <span className="st-usage-label">API Calls</span>
                                        <span className="st-usage-val">2,847 / 10,000</span>
                                    </div>
                                    <div className="st-usage-bar">
                                        <div className="st-usage-fill" style={{ width: '28.5%' }} />
                                    </div>
                                </div>
                                <div className="st-usage-row">
                                    <div className="st-usage-info">
                                        <span className="st-usage-label">AI Tokens</span>
                                        <span className="st-usage-val">14.2K / 50K</span>
                                    </div>
                                    <div className="st-usage-bar">
                                        <div className="st-usage-fill" style={{ width: '28.4%' }} />
                                    </div>
                                </div>
                                <div className="st-usage-row">
                                    <div className="st-usage-info">
                                        <span className="st-usage-label">Scheduled Posts</span>
                                        <span className="st-usage-val">18 / Unlimited</span>
                                    </div>
                                    <div className="st-usage-bar">
                                        <div className="st-usage-fill full" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Save bar ── */}
                <div className="st-save anim-st" style={{ '--i': 3 }}>
                    <button className="st-save-btn">Save Changes</button>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
