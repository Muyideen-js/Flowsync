import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Analytics.css';

const Analytics = () => {
    const [loaded, setLoaded] = useState(false);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const periods = ['24h', '7d', '30d', '90d'];

    const kpis = [
        { label: 'Total Reach', value: '24.8K', delta: '+12%', up: true },
        { label: 'Engagement', value: '3.2K', delta: '+8%', up: true },
        { label: 'Followers', value: '1,847', delta: '+23', up: true },
        { label: 'Response Rate', value: '94%', delta: '-2%', up: false },
    ];

    const channelPerf = [
        { name: 'Instagram', abbr: 'IG', color: '#E4405F', reach: '12.4K', engage: '1.8K', growth: '+5.2%' },
        { name: 'X (Twitter)', abbr: 'X', color: '#1DA1F2', reach: '8.1K', engage: '920', growth: '+3.1%' },
        { name: 'Telegram', abbr: 'TG', color: '#0088CC', reach: '3.2K', engage: '380', growth: '+1.8%' },
        { name: 'WhatsApp', abbr: 'WA', color: '#25D366', reach: '1.1K', engage: '120', growth: '+0.4%' },
    ];

    const topPosts = [
        { platform: 'instagram', content: 'Behind the scenes: How we built FlowSync...', reach: '4.2K', engagement: '380', time: '2 days ago' },
        { platform: 'twitter', content: 'Announcing our new AI-powered features...', reach: '3.8K', engagement: '290', time: '3 days ago' },
        { platform: 'telegram', content: 'Weekly community update: Product roadmap...', reach: '1.4K', engagement: '95', time: '5 days ago' },
    ];

    const platformColors = {
        instagram: '#E4405F',
        twitter: '#1DA1F2',
        telegram: '#0088CC',
        whatsapp: '#25D366',
    };

    // Simple sparkline SVG
    const Sparkline = ({ color }) => (
        <svg width="80" height="28" viewBox="0 0 80 28" fill="none" className="an-spark">
            <path d="M0 22 L10 18 L20 20 L30 14 L40 16 L50 10 L60 12 L70 6 L80 8"
                stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 22 L10 18 L20 20 L30 14 L40 16 L50 10 L60 12 L70 6 L80 8 L80 28 L0 28Z"
                fill={color} fillOpacity="0.08" />
        </svg>
    );

    return (
        <MainLayout>
            <div className={`analytics ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="an-head anim-an" style={{ '--i': 0 }}>
                    <div>
                        <h1>Analytics</h1>
                        <p>Performance insights across all channels</p>
                    </div>
                    <div className="an-period">
                        {periods.map(p => (
                            <button
                                key={p}
                                className={`an-per-btn ${period === p ? 'active' : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI cards ── */}
                <div className="an-kpis anim-an" style={{ '--i': 1 }}>
                    {kpis.map((k, idx) => (
                        <div key={idx} className="an-kpi">
                            <span className="an-kpi-label">{k.label}</span>
                            <span className="an-kpi-val">{k.value}</span>
                            <span className={`an-kpi-delta ${k.up ? 'up' : 'down'}`}>
                                {k.up ? '↑' : '↓'} {k.delta}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Channel performance ── */}
                <div className="an-section anim-an" style={{ '--i': 2 }}>
                    <h2 className="an-section-title">Channel Performance</h2>
                    <div className="an-channels">
                        {channelPerf.map(ch => (
                            <div key={ch.abbr} className="an-ch-row">
                                <div className="an-ch-left">
                                    <span className="an-ch-badge" style={{ '--ch': ch.color }}>{ch.abbr}</span>
                                    <span className="an-ch-name">{ch.name}</span>
                                </div>
                                <div className="an-ch-metrics">
                                    <div className="an-ch-metric">
                                        <span className="an-ch-metric-val">{ch.reach}</span>
                                        <span className="an-ch-metric-label">Reach</span>
                                    </div>
                                    <div className="an-ch-metric">
                                        <span className="an-ch-metric-val">{ch.engage}</span>
                                        <span className="an-ch-metric-label">Engage</span>
                                    </div>
                                    <div className="an-ch-metric">
                                        <span className="an-ch-metric-val an-growth">{ch.growth}</span>
                                        <span className="an-ch-metric-label">Growth</span>
                                    </div>
                                </div>
                                <Sparkline color={ch.color} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Top posts ── */}
                <div className="an-section anim-an" style={{ '--i': 3 }}>
                    <h2 className="an-section-title">Top Performing Posts</h2>
                    <div className="an-posts">
                        {topPosts.map((post, idx) => (
                            <div key={idx} className="an-post">
                                <div className="an-post-left">
                                    <span className="an-post-badge" style={{ '--ch': platformColors[post.platform] }}>
                                        {post.platform === 'twitter' ? 'X' : post.platform === 'instagram' ? 'IG' : 'TG'}
                                    </span>
                                    <div className="an-post-info">
                                        <p className="an-post-text">{post.content}</p>
                                        <span className="an-post-time">{post.time}</span>
                                    </div>
                                </div>
                                <div className="an-post-stats">
                                    <div className="an-post-stat">
                                        <span className="an-ps-val">{post.reach}</span>
                                        <span className="an-ps-label">Reach</span>
                                    </div>
                                    <div className="an-post-stat">
                                        <span className="an-ps-val">{post.engagement}</span>
                                        <span className="an-ps-label">Engage</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Engagement breakdown ── */}
                <div className="an-section anim-an" style={{ '--i': 4 }}>
                    <h2 className="an-section-title">Engagement Breakdown</h2>
                    <div className="an-breakdown">
                        {[
                            { label: 'Likes', pct: 42, color: '#E4405F' },
                            { label: 'Comments', pct: 28, color: '#1DA1F2' },
                            { label: 'Shares', pct: 18, color: '#25D366' },
                            { label: 'Saves', pct: 12, color: '#ffa64d' },
                        ].map(item => (
                            <div key={item.label} className="an-bar-row">
                                <span className="an-bar-label">{item.label}</span>
                                <div className="an-bar-track">
                                    <div className="an-bar-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                                </div>
                                <span className="an-bar-pct">{item.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Analytics;
