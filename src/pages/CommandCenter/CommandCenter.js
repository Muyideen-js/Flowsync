import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';
import './CommandCenter.css';

/* ── Inline icons ── */
const Ic = {
    check: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M13 4L6.5 11 3 7.5" /></svg>,
    dollar: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1v14M11.5 4H6.25a2.25 2.25 0 000 4.5h3.5a2.25 2.25 0 010 4.5H4" /></svg>,
    rocket: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10l-4 4M6 10l-4 4" /><path d="M13.5 2.5s.5 3-2 5.5L8 11 5 8l3-3.5c2.5-2.5 5.5-2 5.5-2z" /></svg>,
    star: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M8 1l2.1 4.3 4.9.7-3.5 3.4.8 4.6L8 11.8 3.7 14l.8-4.6L1 6l4.9-.7z" /></svg>,
    alert: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 5.5v3M8 11h.01" /><path d="M7.134 2.5a1 1 0 011.732 0l5.196 9a1 1 0 01-.866 1.5H2.804a1 1 0 01-.866-1.5l5.196-9z" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>,
    msg: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14.5v-11A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5V10z" /></svg>,
    zap: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1L2 9h5.5L7 15l7-8H8.5L8.5 1z" /></svg>,
    broadcast: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2" /><path d="M4.5 4.5a5 5 0 000 7" /><path d="M11.5 4.5a5 5 0 010 7" /></svg>,
    trend: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 13l3-4 3 2.5L14 4" /><path d="M11 4h3v3" /></svg>,
};

const CommandCenter = () => {
    const [loaded, setLoaded] = useState(false);
    const { user } = useAuth();

    useEffect(() => { requestAnimationFrame(() => setLoaded(true)); }, []);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

    const kpis = [
        { title: 'Total Audience', value: '47,234', change: '+2,134', sub: 'this week', up: true, color: '#00c93a' },
        { title: 'Engagement', value: '8.7%', change: '+1.2%', sub: 'vs last week', up: true, color: '#818cf8' },
        { title: 'Inbox', value: '23', change: 'unread', sub: 'messages', up: false, color: '#f59e0b' },
        { title: 'Queued', value: '12', change: 'posts', sub: 'next 24h', up: true, color: '#a855f7' },
    ];

    const todaysPlan = [
        { id: 1, task: 'Post 1 Reel on Instagram at 7:30 PM', channel: 'instagram', priority: 'high', done: false },
        { id: 2, task: 'Reply to 12 comments on Instagram', channel: 'instagram', priority: 'high', done: false },
        { id: 3, task: 'Respond to 4 DMs on WhatsApp', channel: 'whatsapp', priority: 'medium', done: true },
        { id: 4, task: 'Reply to 3 mentions on X', channel: 'twitter', priority: 'medium', done: false },
        { id: 5, task: 'Schedule 2 tweets for tomorrow', channel: 'twitter', priority: 'low', done: false },
    ];

    const signals = [
        { type: 'sales', label: 'High-Intent DM', icon: Ic.dollar, badge: 'WA', badgeClass: 'wa', name: 'John Doe', handle: '+234 801 234 5678', initials: 'JD', msg: '"How much does your Premium plan cost? I need it for my team of 5."', time: '2m ago', tag: 'Sales Lead', tagClass: 'green', actions: ['Reply Now', 'View Thread'] },
        { type: 'viral', label: 'Viral Content', icon: Ic.rocket, badge: 'IG', badgeClass: 'ig', stats: [{ v: '10.5K', l: 'Views' }, { v: '847', l: 'Likes' }, { v: '156', l: 'Comments' }], msg: 'Your Reel "AI Automation Tips" got 10.5K views in 2 hours!', time: '15m ago', tag: 'Trending', tagClass: 'blue', actions: ['Engage Now', 'View Post'] },
        { type: 'vip', label: 'VIP Mention', icon: Ic.star, badge: 'X', badgeClass: 'tw', name: 'Tech Crunch', handle: '@TechCrunch', initials: 'TC', vip: true, msg: '"Interesting automation tool from @FlowSync — streamlining social media management with AI"', time: '1h ago', tag: 'VIP', tagClass: 'orange', actions: ['Reply', 'Quote'] },
        { type: 'alert', label: 'Needs Attention', icon: Ic.alert, badge: 'IG', badgeClass: 'ig', name: 'Sarah Miller', handle: '@sarah_m_designs', initials: 'SM', msg: '"I\'m having issues with the scheduling feature. Posts aren\'t going out on time."', time: '45m ago', tag: 'Urgent', tagClass: 'red', actions: ['Respond', 'Escalate'] },
    ];

    const doneCount = todaysPlan.filter(i => i.done).length;
    const progress = (doneCount / todaysPlan.length) * 100;
    const circumference = 2 * Math.PI * 18;

    return (
        <MainLayout>
            <div className={`cc ${loaded ? 'loaded' : ''}`}>

                {/* ── Hero ── */}
                <section className="cc-hero cc-anim" style={{ '--i': 0 }}>
                    <div className="cc-hero-left">
                        <div className="cc-tag">OVERVIEW</div>
                        <h1 className="cc-title">
                            {getGreeting()}, <span className="cc-name">{displayName}</span>
                        </h1>
                        <p className="cc-subtitle">Here's what's happening across your channels today.</p>
                    </div>
                    <div className="cc-hero-right">
                        <div className="cc-live-pill">
                            <div className="cc-live-dot" />
                            <span>4 platforms active</span>
                        </div>
                    </div>
                </section>

                {/* ── KPI row ── */}
                <div className="cc-kpis cc-anim" style={{ '--i': 1 }}>
                    {kpis.map((k, i) => (
                        <div key={i} className="cc-kpi" style={{ '--kc': k.color }}>
                            <span className="cc-kpi-label">{k.title}</span>
                            <span className="cc-kpi-value">{k.value}</span>
                            <div className="cc-kpi-delta">
                                <span className={`cc-kpi-change ${k.up ? 'up' : 'neutral'}`}>{k.up ? '+' : ''}{k.change}</span>
                                <span className="cc-kpi-sub">{k.sub}</span>
                            </div>
                            <div className="cc-kpi-bar-track">
                                <div className="cc-kpi-bar-fill" style={{ background: k.color, width: `${i === 0 ? 78 : i === 1 ? 62 : i === 2 ? 45 : 88}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main grid ── */}
                <div className="cc-grid cc-anim" style={{ '--i': 2 }}>

                    {/* Today's Plan */}
                    <div className="cc-card cc-plan">
                        <div className="cc-card-head">
                            <div>
                                <h2 className="cc-card-title">Today's Plan</h2>
                                <span className="cc-card-sub">{doneCount} of {todaysPlan.length} complete</span>
                            </div>
                            <svg className="cc-ring" width="44" height="44" viewBox="0 0 44 44">
                                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#00c93a" strokeWidth="3"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference * (1 - progress / 100)}
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
                                />
                                <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{Math.round(progress)}%</text>
                            </svg>
                        </div>
                        <div className="cc-plan-list">
                            {todaysPlan.map(item => (
                                <div key={item.id} className={`cc-plan-row ${item.done ? 'done' : ''}`}>
                                    <div className={`cc-plan-check ${item.done ? 'checked' : ''}`}>
                                        {item.done && Ic.check}
                                    </div>
                                    <div className="cc-plan-info">
                                        <p>{item.task}</p>
                                        <div className="cc-plan-tags">
                                            <span className={`cc-ptag priority-${item.priority}`}>{item.priority}</span>
                                            <span className={`cc-ptag channel-${item.channel}`}>{item.channel}</span>
                                        </div>
                                    </div>
                                    <button className="cc-plan-go">Go</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="cc-card cc-quick">
                        <h2 className="cc-card-title">Quick Actions</h2>
                        <div className="cc-qa-grid">
                            <Link to="/composer" className="cc-qa" style={{ '--qa': '#00c93a' }}>
                                <div className="cc-qa-orb">{Ic.plus}</div>
                                <span>Create Post</span>
                            </Link>
                            <Link to="/composer" className="cc-qa" style={{ '--qa': '#818cf8' }}>
                                <div className="cc-qa-orb">{Ic.msg}</div>
                                <span>New Thread</span>
                            </Link>
                            <Link to="/inbox" className="cc-qa" style={{ '--qa': '#f59e0b' }}>
                                <div className="cc-qa-orb">{Ic.broadcast}</div>
                                <span>Broadcast</span>
                            </Link>
                            <Link to="/automation" className="cc-qa" style={{ '--qa': '#a855f7' }}>
                                <div className="cc-qa-orb">{Ic.zap}</div>
                                <span>Automation</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Hot Signals ── */}
                <div className="cc-signals-wrap cc-anim" style={{ '--i': 3 }}>
                    <div className="cc-signals-head">
                        <h2 className="cc-card-title">Hot Signals</h2>
                        <span className="cc-signals-count">
                            <div className="cc-count-dot" />
                            {signals.length} requiring attention
                        </span>
                    </div>
                    <div className="cc-signals">
                        {signals.map((s, idx) => (
                            <div key={idx} className={`cc-sig cc-sig-${s.type}`}>
                                <div className="cc-sig-top">
                                    <div className="cc-sig-label">
                                        <span className="cc-sig-icon">{s.icon}</span>
                                        <span>{s.label}</span>
                                    </div>
                                    <span className={`cc-sig-badge ${s.badgeClass}`}>{s.badge}</span>
                                </div>

                                {s.name && (
                                    <div className="cc-sig-from">
                                        <div className={`cc-sig-avatar ${s.vip ? 'vip' : ''}`}>{s.initials}</div>
                                        <div>
                                            <span className="cc-sig-name">{s.name}</span>
                                            <span className="cc-sig-handle">{s.handle}</span>
                                        </div>
                                    </div>
                                )}

                                {s.stats && (
                                    <div className="cc-sig-stats">
                                        {s.stats.map((st, i) => (
                                            <div key={i} className="cc-sig-stat">
                                                <span className="cc-sig-stat-v">{st.v}</span>
                                                <span className="cc-sig-stat-l">{st.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="cc-sig-msg">{s.msg}</p>

                                <div className="cc-sig-foot">
                                    <div className="cc-sig-meta">
                                        <span className="cc-sig-time">{s.time}</span>
                                        <span className={`cc-sig-tag ${s.tagClass}`}>{s.tag}</span>
                                    </div>
                                    <div className="cc-sig-actions">
                                        {s.actions.map((a, i) => (
                                            <button key={i} className={`cc-sig-btn ${i === 0 ? 'primary' : ''}`}>{a}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default CommandCenter;
