import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';
import './CommandCenter.css';

/* ── Tiny inline icons for this page only ── */
const Ic = {
    check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 4L6.5 11 3 7.5" /></svg>,
    dollar: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1v14M11.5 4H6.25a2.25 2.25 0 000 4.5h3.5a2.25 2.25 0 010 4.5H4" /></svg>,
    rocket: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10l-4 4M6 10l-4 4" /><path d="M13.5 2.5s.5 3-2 5.5L8 11 5 8l3-3.5c2.5-2.5 5.5-2 5.5-2z" /></svg>,
    star: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M8 1l2.1 4.3 4.9.7-3.5 3.4.8 4.6L8 11.8 3.7 14l.8-4.6L1 6l4.9-.7z" /></svg>,
    alert: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 5.5v3M8 11h.01" /><path d="M7.134 2.5a1 1 0 011.732 0l5.196 9a1 1 0 01-.866 1.5H2.804a1 1 0 01-.866-1.5l5.196-9z" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>,
    msg: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14.5v-11A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5V10z" /></svg>,
    zap: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1L2 9h5.5L7 15l7-8H8.5L8.5 1z" /></svg>,
    logout: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" /><path d="M10.5 11.5L14 8l-3.5-3.5" /><path d="M14 8H6" /></svg>,
};

const CommandCenter = () => {
    const [loaded, setLoaded] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // trigger stagger animation on mount
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const todaysPlan = [
        { id: 1, task: "Post 1 Reel on Instagram at 7:30 PM", channel: "instagram", priority: "high", done: false },
        { id: 2, task: "Reply to 12 comments on Instagram", channel: "instagram", priority: "high", done: false },
        { id: 3, task: "Respond to 4 DMs on WhatsApp", channel: "whatsapp", priority: "medium", done: true },
        { id: 4, task: "Reply to 3 mentions on X", channel: "twitter", priority: "medium", done: false },
        { id: 5, task: "Schedule 2 tweets for tomorrow", channel: "twitter", priority: "low", done: false },
    ];

    const kpis = [
        { title: "Total Audience", value: "47,234", change: "+2,134", sub: "this week", up: true },
        { title: "Engagement", value: "8.7%", change: "+1.2%", sub: "vs last week", up: true },
        { title: "Inbox", value: "23", change: "unread", sub: "messages", up: false },
        { title: "Queued", value: "12", change: "posts", sub: "next 24h", up: true },
    ];

    const signals = [
        {
            type: 'sales', label: 'High-Intent DM', icon: Ic.dollar, badge: 'WA', badgeClass: 'wa',
            name: 'John Doe', handle: '+234 801 234 5678', initials: 'JD',
            msg: '"How much does your Premium plan cost? I need it for my team of 5."',
            time: '2m ago', tag: 'Sales Lead', tagClass: 'green',
            actions: ['Reply Now', 'View Thread'],
        },
        {
            type: 'viral', label: 'Viral Content', icon: Ic.rocket, badge: 'IG', badgeClass: 'ig',
            stats: [{ v: '10.5K', l: 'Views' }, { v: '847', l: 'Likes' }, { v: '156', l: 'Comments' }],
            msg: 'Your Reel "AI Automation Tips" got 10.5K views in 2 hours!',
            time: '15m ago', tag: 'Trending', tagClass: 'blue',
            actions: ['Engage Now', 'View Post'],
        },
        {
            type: 'vip', label: 'VIP Mention', icon: Ic.star, badge: 'X', badgeClass: 'tw',
            name: 'Tech Crunch', handle: '@TechCrunch', initials: 'TC', vip: true,
            msg: '"Interesting automation tool from @FlowSync — streamlining social media management with AI"',
            time: '1h ago', tag: 'VIP', tagClass: 'orange',
            actions: ['Reply', 'Quote'],
        },
        {
            type: 'alert', label: 'Needs Attention', icon: Ic.alert, badge: 'IG', badgeClass: 'ig',
            name: 'Sarah Miller', handle: '@sarah_m_designs', initials: 'SM',
            msg: '"I\'m having issues with the scheduling feature. Posts aren\'t going out on time."',
            time: '45m ago', tag: 'Urgent', tagClass: 'red',
            actions: ['Respond', 'Escalate'],
        },
    ];

    const progress = todaysPlan.filter(i => i.done).length / todaysPlan.length * 100;
    const circumference = 2 * Math.PI * 18;

    return (
        <MainLayout>
            <div className={`overview ${loaded ? 'loaded' : ''} `}>
                {/* ── Greeting ── */}
                <div className="ov-greeting anim-item" style={{ '--i': 0 }}>
                    <div className="greeting-top">
                        <div>
                            <h1>{getGreeting()}, {displayName}</h1>
                            <p>Here's what's happening across your channels today.</p>
                        </div>
                        <button className="logout-btn" onClick={handleLogout} title="Sign out">
                            {Ic.logout}
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>

                {/* ── KPI strip ── */}
                <div className="ov-kpis anim-item" style={{ '--i': 1 }}>
                    {kpis.map((k, idx) => (
                        <div key={idx} className="kpi">
                            <span className="kpi-label">{k.title}</span>
                            <span className="kpi-val">{k.value}</span>
                            <span className={`kpi - delta ${k.up ? 'up' : 'down'} `}>
                                {k.up ? '↑' : '•'} {k.change} <span className="kpi-sub">{k.sub}</span>
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Two-column layout ── */}
                <div className="ov-columns">
                    {/* Left: Plan */}
                    <div className="ov-plan anim-item" style={{ '--i': 2 }}>
                        <div className="plan-head">
                            <div>
                                <h2>Today's Plan</h2>
                                <span className="plan-sub">{todaysPlan.filter(i => i.done).length} of {todaysPlan.length} done</span>
                            </div>
                            <svg className="plan-ring" width="44" height="44" viewBox="0 0 44 44">
                                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                <circle
                                    cx="22" cy="22" r="18" fill="none"
                                    stroke="var(--accent)" strokeWidth="3"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference * (1 - progress / 100)}
                                    strokeLinecap="round"
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
                                />
                                <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{Math.round(progress)}%</text>
                            </svg>
                        </div>
                        <div className="plan-list">
                            {todaysPlan.map((item, idx) => (
                                <div key={item.id} className={`plan - row ${item.done ? 'done' : ''} `} style={{ '--j': idx }}>
                                    <div className={`plan - check ${item.done ? 'checked' : ''} `}>
                                        {item.done && Ic.check}
                                    </div>
                                    <div className="plan-info">
                                        <p>{item.task}</p>
                                        <div className="plan-tags">
                                            <span className={`tag - priority ${item.priority} `}>{item.priority}</span>
                                            <span className={`tag - channel ${item.channel} `}>{item.channel}</span>
                                        </div>
                                    </div>
                                    <button className="plan-go">Go</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Quick actions */}
                    <div className="ov-quick anim-item" style={{ '--i': 3 }}>
                        <h2>Quick Actions</h2>
                        <div className="qa-grid">
                            <button className="qa-btn primary">
                                {Ic.plus}<span>Create Post</span>
                            </button>
                            <button className="qa-btn">
                                {Ic.msg}<span>New Thread</span>
                            </button>
                            <button className="qa-btn">
                                {Ic.msg}<span>Broadcast</span>
                            </button>
                            <button className="qa-btn">
                                {Ic.zap}<span>Automation</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Signals ── */}
                <div className="ov-signals-section anim-item" style={{ '--i': 4 }}>
                    <div className="signals-head">
                        <h2>Hot Signals</h2>
                        <span className="signals-badge">{signals.length} requiring attention</span>
                    </div>
                    <div className="ov-signals">
                        {signals.map((s, idx) => (
                            <div key={idx} className={`sig ${s.type} `} style={{ '--j': idx }}>
                                <div className="sig-top">
                                    <div className="sig-label">
                                        <span className="sig-icon">{s.icon}</span>
                                        <span>{s.label}</span>
                                    </div>
                                    <span className={`sig - badge ${s.badgeClass} `}>{s.badge}</span>
                                </div>

                                {s.name && (
                                    <div className="sig-from">
                                        <div className={`sig - avatar ${s.vip ? 'vip' : ''} `}>{s.initials}</div>
                                        <div>
                                            <span className="sig-name">{s.name}{s.vip && <span className="sig-verified">✓</span>}</span>
                                            <span className="sig-handle">{s.handle}</span>
                                        </div>
                                    </div>
                                )}

                                <p className="sig-msg">{s.msg}</p>

                                {s.stats && (
                                    <div className="sig-stats">
                                        {s.stats.map((st, i) => (
                                            <div key={i} className="sig-stat">
                                                <span className="sig-stat-v">{st.v}</span>
                                                <span className="sig-stat-l">{st.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="sig-foot">
                                    <div className="sig-meta">
                                        <span className="sig-time">{s.time}</span>
                                        <span className={`sig - tag ${s.tagClass} `}>{s.tag}</span>
                                    </div>
                                    <div className="sig-actions">
                                        {s.actions.map((a, i) => (
                                            <button key={i} className={`sig - btn ${i === 0 ? 'primary' : ''} `}>{a}</button>
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
