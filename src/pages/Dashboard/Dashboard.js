import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import TopBar from '../../components/TopBar/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('Good morning');
    const [loaded, setLoaded] = useState(false);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Good morning');
        else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');
        setTimeout(() => setLoaded(true), 80);
    }, []);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <TopBar />

            <main className={`dashboard-main ${loaded ? 'is-loaded' : ''}`}>
                {/* ── Floating orbs background ── */}
                <div className="dash-orb dash-orb-1" />
                <div className="dash-orb dash-orb-2" />
                <div className="dash-orb dash-orb-3" />

                {/* ── Hero greeting ── */}
                <section className="dash-hero dash-enter" style={{ '--i': 0 }}>
                    <span className="dash-hero-tag">Dashboard</span>
                    <h1 className="dash-hero-title">
                        {greeting}, <span className="dash-hero-name">{displayName}</span>
                    </h1>
                    <p className="dash-hero-sub">Your AI-powered command center. Everything in one place.</p>
                </section>

                {/* ── Bento grid ── */}
                <div className="dash-bento">

                    {/* ── Card 1 — Total Reach ── */}
                    <div className="bento-card bento-reach dash-enter" style={{ '--i': 1 }}>
                        <div className="bento-glow" />
                        <div className="bento-head">
                            <div className="bento-icon bento-icon-green">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            </div>
                            <span className="bento-badge bento-badge-green">+12.5%</span>
                        </div>
                        <div className="bento-metric">
                            <span className="bento-value">24.8K</span>
                            <span className="bento-label">Total Reach</span>
                        </div>
                        <div className="bento-bar-track">
                            <div className="bento-bar-fill bento-fill-green" style={{ width: '78%' }} />
                        </div>
                    </div>

                    {/* ── Card 2 — Messages ── */}
                    <div className="bento-card bento-messages dash-enter" style={{ '--i': 2 }}>
                        <div className="bento-glow" />
                        <div className="bento-head">
                            <div className="bento-icon bento-icon-indigo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                            </div>
                            <span className="bento-badge bento-badge-indigo">+8.2%</span>
                        </div>
                        <div className="bento-metric">
                            <span className="bento-value">1,429</span>
                            <span className="bento-label">Messages Sent</span>
                        </div>
                        <div className="bento-bar-track">
                            <div className="bento-bar-fill bento-fill-indigo" style={{ width: '62%' }} />
                        </div>
                    </div>

                    {/* ── Card 3 — Automations ── */}
                    <div className="bento-card bento-auto dash-enter" style={{ '--i': 3 }}>
                        <div className="bento-glow" />
                        <div className="bento-head">
                            <div className="bento-icon bento-icon-amber">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            </div>
                            <span className="bento-badge bento-badge-amber">Active</span>
                        </div>
                        <div className="bento-metric">
                            <span className="bento-value">12</span>
                            <span className="bento-label">Automations</span>
                        </div>
                        <div className="bento-bar-track">
                            <div className="bento-bar-fill bento-fill-amber" style={{ width: '45%' }} />
                        </div>
                    </div>

                    {/* ── Card 4 — Time Saved ── */}
                    <div className="bento-card bento-time dash-enter" style={{ '--i': 4 }}>
                        <div className="bento-glow" />
                        <div className="bento-head">
                            <div className="bento-icon bento-icon-purple">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <span className="bento-badge bento-badge-purple">This month</span>
                        </div>
                        <div className="bento-metric">
                            <span className="bento-value">47h</span>
                            <span className="bento-label">Time Saved</span>
                        </div>
                        <div className="bento-bar-track">
                            <div className="bento-bar-fill bento-fill-purple" style={{ width: '88%' }} />
                        </div>
                    </div>

                    {/* ── Card 5 — Quick Actions (wide) ── */}
                    <div className="bento-card bento-actions dash-enter" style={{ '--i': 5 }}>
                        <div className="bento-glow" />
                        <h3 className="bento-section-title">Quick Actions</h3>
                        <div className="bento-action-row">
                            <Link to="/composer" className="bento-action" style={{ '--ac': '#00c93a' }}>
                                <div className="bento-action-orb">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" /></svg>
                                </div>
                                <span>Compose</span>
                            </Link>
                            <Link to="/inbox" className="bento-action" style={{ '--ac': '#818cf8' }}>
                                <div className="bento-action-orb">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                                </div>
                                <span>Inbox</span>
                            </Link>
                            <Link to="/scheduler" className="bento-action" style={{ '--ac': '#f59e0b' }}>
                                <div className="bento-action-orb">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                </div>
                                <span>Schedule</span>
                            </Link>
                            <Link to="/automation" className="bento-action" style={{ '--ac': '#a855f7' }}>
                                <div className="bento-action-orb">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                </div>
                                <span>Automate</span>
                            </Link>
                            <Link to="/analytics" className="bento-action" style={{ '--ac': '#ec4899' }}>
                                <div className="bento-action-orb">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 17l4-5.5 3.5 3L17 5" /><path d="M14 5h3v3" /></svg>
                                </div>
                                <span>Analytics</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── Card 6 — Activity (tall) ── */}
                    <div className="bento-card bento-feed dash-enter" style={{ '--i': 6 }}>
                        <div className="bento-glow" />
                        <div className="bento-feed-head">
                            <h3 className="bento-section-title">Activity</h3>
                            <Link to="/inbox" className="bento-see-all">See all →</Link>
                        </div>
                        {[
                            { platform: 'X', text: 'Replied to @designlabs', time: '2m', color: '#fff' },
                            { platform: 'IG', text: 'AI drafted reply to comment', time: '12m', color: '#E4405F' },
                            { platform: 'TG', text: 'Auto-reply sent to group', time: '28m', color: '#0088cc' },
                            { platform: 'X', text: 'Published automation thread', time: '2h', color: '#fff' },
                        ].map((item, i) => (
                            <div key={i} className="bento-feed-row">
                                <div className="bento-feed-avatar" style={{ background: item.color }}>
                                    <span>{item.platform}</span>
                                </div>
                                <div className="bento-feed-info">
                                    <span className="bento-feed-text">{item.text}</span>
                                    <span className="bento-feed-time">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Card 7 — AI Suggestions (wide bottom) ── */}
                    <div className="bento-card bento-ai dash-enter" style={{ '--i': 7 }}>
                        <div className="bento-glow" />
                        <div className="bento-ai-content">
                            <div className="bento-ai-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                            </div>
                            <div className="bento-ai-text">
                                <h3>AI Insight</h3>
                                <p>Your engagement peaks on Tuesdays at 2pm. Schedule your next post for optimal reach.</p>
                            </div>
                            <Link to="/composer" className="bento-ai-btn">
                                Schedule Now
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
