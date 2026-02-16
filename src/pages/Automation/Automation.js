import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Automation.css';

const Automation = () => {
    const [loaded, setLoaded] = useState(false);
    const [rules, setRules] = useState([
        { id: 1, name: 'Smart Reply Assistant', trigger: 'DM received', action: 'Generate AI reply', enabled: true, runs: 342, platform: 'all' },
        { id: 2, name: 'Lead Qualification', trigger: 'Contains keywords', action: 'Tag as sales lead', enabled: true, runs: 128, platform: 'twitter' },
        { id: 3, name: 'Sentiment Analysis', trigger: 'New comment', action: 'Analyze sentiment', enabled: true, runs: 567, platform: 'instagram' },
        { id: 4, name: 'Spam Detection', trigger: 'Unknown sender', action: 'Flag for review', enabled: false, runs: 23, platform: 'all' },
        { id: 5, name: 'Welcome Sequence', trigger: 'New follower', action: 'Send welcome DM', enabled: true, runs: 89, platform: 'telegram' },
        { id: 6, name: 'Auto-Scheduler', trigger: 'Draft saved', action: 'Queue for best time', enabled: true, runs: 214, platform: 'all' },
    ]);

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const toggleRule = (id) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const activeCount = rules.filter(r => r.enabled).length;
    const totalRuns = rules.reduce((s, r) => s + r.runs, 0);

    return (
        <MainLayout>
            <div className={`auto ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="au-head anim-au" style={{ '--i': 0 }}>
                    <div>
                        <h1>Automation</h1>
                        <p>AI-powered workflows and rules</p>
                    </div>
                    <button className="au-new-btn">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                        <span>New Rule</span>
                    </button>
                </div>

                {/* ── Stats strip ── */}
                <div className="au-stats anim-au" style={{ '--i': 1 }}>
                    <div className="au-stat">
                        <span className="au-stat-val">{activeCount}</span>
                        <span className="au-stat-label">Active rules</span>
                    </div>
                    <div className="au-stat-div" />
                    <div className="au-stat">
                        <span className="au-stat-val">{rules.length - activeCount}</span>
                        <span className="au-stat-label">Paused</span>
                    </div>
                    <div className="au-stat-div" />
                    <div className="au-stat">
                        <span className="au-stat-val">{totalRuns.toLocaleString()}</span>
                        <span className="au-stat-label">Total runs</span>
                    </div>
                </div>

                {/* ── Rules list ── */}
                <div className="au-list anim-au" style={{ '--i': 2 }}>
                    {rules.map((rule) => (
                        <div key={rule.id} className={`au-rule ${rule.enabled ? '' : 'disabled'}`}>
                            <div className="au-rule-left">
                                <div className="au-rule-icon">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="4.5" cy="5" r="2" /><circle cx="15.5" cy="5" r="2" /><circle cx="10" cy="15" r="2" />
                                        <path d="M6.2 6.2L8.5 13" /><path d="M13.8 6.2l-2.3 6.8" />
                                    </svg>
                                </div>
                                <div className="au-rule-info">
                                    <div className="au-rule-top">
                                        <h3>{rule.name}</h3>
                                        <span className="au-rule-runs">{rule.runs} runs</span>
                                    </div>
                                    <div className="au-rule-flow">
                                        <span className="au-flow-tag trigger">
                                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 2v8M2 6l4-4 4 4" /></svg>
                                            {rule.trigger}
                                        </span>
                                        <span className="au-flow-arrow">→</span>
                                        <span className="au-flow-tag action">
                                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
                                            {rule.action}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="au-rule-right">
                                <button className="au-edit">Edit</button>
                                <label className="au-toggle">
                                    <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                                    <span className="au-toggle-track" />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
};

export default Automation;
