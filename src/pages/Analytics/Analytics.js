import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Analytics.css';

/* ── Mini SVG sparkline ── */
const Spark = ({ points = '0 20 15 14 30 16 45 10 60 12 75 5 90 7', color }) => (
    <svg width="90" height="28" viewBox="0 0 90 28" fill="none">
        <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <polyline points={`${points} 90 28 0 28`} stroke="none" fill={color} fillOpacity="0.07" />
    </svg>
);

/* ── Bar chart column ── */
const BarCol = ({ label, value, max, color }) => {
    const pct = Math.round((value / max) * 100);
    return (
        <div className="an-col">
            <div className="an-col-track">
                <div className="an-col-fill" style={{ height: `${pct}%`, background: color }} />
            </div>
            <span className="an-col-label">{label}</span>
            <span className="an-col-val">{value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}</span>
        </div>
    );
};

const platformMeta = {
    instagram: { abbr: 'IG', color: '#E4405F', name: 'Instagram' },
    twitter: { abbr: 'X', color: '#1DA1F2', name: 'X (Twitter)' },
    telegram: { abbr: 'TG', color: '#0088CC', name: 'Telegram' },
    whatsapp: { abbr: 'WA', color: '#25D366', name: 'WhatsApp' },
};

/* ── Period-keyed data ── */
const DATA = {
    '24h': {
        kpis: [
            { label: 'Reach', value: '3.1K', raw: 3100, delta: '+4.2%', up: true },
            { label: 'Engagements', value: '420', raw: 420, delta: '+6%', up: true },
            { label: 'New Followers', value: '+12', raw: 12, delta: '+2', up: true },
            { label: 'Response Rate', value: '97%', raw: 97, delta: '+1%', up: true },
            { label: 'Posts Sent', value: '3', raw: 3, delta: '', up: true },
            { label: 'Avg Eng. Rate', value: '13.5%', raw: 13.5, delta: '+0.8%', up: true },
        ],
        reach: [1200, 800, 600, 500],
        chartBars: [
            { label: '6am', value: 120 }, { label: '9am', value: 380 }, { label: '12pm', value: 820 },
            { label: '3pm', value: 640 }, { label: '6pm', value: 490 }, { label: '9pm', value: 350 },
        ],
    },
    '7d': {
        kpis: [
            { label: 'Reach', value: '24.8K', raw: 24800, delta: '+12%', up: true },
            { label: 'Engagements', value: '3.2K', raw: 3200, delta: '+8%', up: true },
            { label: 'New Followers', value: '+184', raw: 184, delta: '+23', up: true },
            { label: 'Response Rate', value: '94%', raw: 94, delta: '-2%', up: false },
            { label: 'Posts Sent', value: '18', raw: 18, delta: '+3', up: true },
            { label: 'Avg Eng. Rate', value: '12.9%', raw: 12.9, delta: '+1.4%', up: true },
        ],
        reach: [12400, 8100, 3200, 1100],
        chartBars: [
            { label: 'Mon', value: 2800 }, { label: 'Tue', value: 3900 }, { label: 'Wed', value: 2100 },
            { label: 'Thu', value: 4800 }, { label: 'Fri', value: 5400 }, { label: 'Sat', value: 3600 }, { label: 'Sun', value: 2200 },
        ],
    },
    '30d': {
        kpis: [
            { label: 'Reach', value: '98.4K', raw: 98400, delta: '+21%', up: true },
            { label: 'Engagements', value: '14.1K', raw: 14100, delta: '+15%', up: true },
            { label: 'New Followers', value: '+820', raw: 820, delta: '+12%', up: true },
            { label: 'Response Rate', value: '91%', raw: 91, delta: '-4%', up: false },
            { label: 'Posts Sent', value: '74', raw: 74, delta: '+8', up: true },
            { label: 'Avg Eng. Rate', value: '14.3%', raw: 14.3, delta: '+2.1%', up: true },
        ],
        reach: [48000, 30000, 14000, 6400],
        chartBars: [
            { label: 'W1', value: 18000 }, { label: 'W2', value: 24000 }, { label: 'W3', value: 28000 }, { label: 'W4', value: 28400 },
        ],
    },
    '90d': {
        kpis: [
            { label: 'Reach', value: '284K', raw: 284000, delta: '+38%', up: true },
            { label: 'Engagements', value: '42.6K', raw: 42600, delta: '+29%', up: true },
            { label: 'New Followers', value: '+2.4K', raw: 2400, delta: '+31%', up: true },
            { label: 'Response Rate', value: '88%', raw: 88, delta: '-6%', up: false },
            { label: 'Posts Sent', value: '218', raw: 218, delta: '+24%', up: true },
            { label: 'Avg Eng. Rate', value: '15.0%', raw: 15, delta: '+3.4%', up: true },
        ],
        reach: [142000, 88000, 36000, 18000],
        chartBars: [
            { label: 'Jan', value: 72000 }, { label: 'Feb', value: 98000 }, { label: 'Mar', value: 114000 },
        ],
    },
};

const channelPerf = [
    { key: 'instagram', reach: [0, 1], engage: [0, 1], growth: '+5.2%', posts: 42, points: '0 22 15 16 30 18 45 12 60 14 75 6 90 8' },
    { key: 'twitter', reach: [1, 2], engage: [1, 2], growth: '+3.1%', posts: 28, points: '0 18 15 14 30 16 45 10 60 12 75 8 90 10' },
    { key: 'telegram', reach: [2, 3], engage: [2, 3], growth: '+1.8%', posts: 16, points: '0 20 15 17 30 18 45 14 60 16 75 12 90 14' },
    { key: 'whatsapp', reach: [3, 4], engage: [3, 4], growth: '+0.4%', posts: 7, points: '0 24 15 22 30 20 45 19 60 20 75 18 90 20' },
];

const topPosts = [
    { platform: 'instagram', content: 'Behind the scenes: Building the FlowSync automation engine', reach: '4.2K', engagement: '380', rate: '9.0%', time: '2 days ago' },
    { platform: 'twitter', content: 'Announcing our new AI-powered features for social automation', reach: '3.8K', engagement: '290', rate: '7.6%', time: '3 days ago' },
    { platform: 'telegram', content: 'Weekly community update: Product roadmap and upcoming releases', reach: '1.4K', engagement: '95', rate: '6.8%', time: '5 days ago' },
    { platform: 'instagram', content: 'Just crossed 10K users — thank you to this amazing community!', reach: '3.1K', engagement: '244', rate: '7.9%', time: '6 days ago' },
];

const breakdown = [
    { label: 'Likes', pct: 42, color: '#E4405F' },
    { label: 'Comments', pct: 28, color: '#818cf8' },
    { label: 'Shares', pct: 18, color: '#25D366' },
    { label: 'Saves', pct: 12, color: '#f59e0b' },
];

const BEST_TIMES = [
    { day: 'Mon', slots: [9, 13, 19] },
    { day: 'Tue', slots: [8, 12, 18] },
    { day: 'Wed', slots: [9, 14, 20] },
    { day: 'Thu', slots: [10, 13, 18] },
    { day: 'Fri', slots: [9, 12, 17] },
    { day: 'Sat', slots: [11, 15] },
    { day: 'Sun', slots: [14, 18] },
];

const Analytics = () => {
    const [loaded, setLoaded] = useState(false);
    const [period, setPeriod] = useState('7d');

    useEffect(() => { requestAnimationFrame(() => setLoaded(true)); }, []);

    const d = DATA[period];
    const maxBar = Math.max(...d.chartBars.map(b => b.value));
    const totalReach = d.reach.reduce((a, b) => a + b, 0);

    return (
        <MainLayout>
            <div className={`analytics ${loaded ? 'loaded' : ''}`}>

                {/* ── Header ── */}
                <div className="an-head an-anim" style={{ '--i': 0 }}>
                    <div>
                        <h1>Analytics</h1>
                        <p>Performance insights across all your connected channels</p>
                    </div>
                    <div className="an-period-strip">
                        {['24h', '7d', '30d', '90d'].map(p => (
                            <button key={p} className={`an-per-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
                        ))}
                    </div>
                </div>

                {/* ── KPI grid ── */}
                <div className="an-kpi-grid an-anim" style={{ '--i': 1 }}>
                    {d.kpis.map((k, i) => (
                        <div key={i} className="an-kpi">
                            <span className="an-kpi-label">{k.label}</span>
                            <span className="an-kpi-val">{k.value}</span>
                            {k.delta && (
                                <span className={`an-kpi-delta ${k.up ? 'up' : 'down'}`}>
                                    <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
                                        {k.up
                                            ? <path d="M5 1l4 5H1z" />
                                            : <path d="M5 9L1 4h8z" />}
                                    </svg>
                                    {k.delta}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Two column ── */}
                <div className="an-two-col an-anim" style={{ '--i': 2 }}>

                    {/* ── Reach chart ── */}
                    <div className="an-card an-chart-card">
                        <div className="an-card-head">
                            <span>Reach Over Time</span>
                            <span className="an-card-sub">{period} period</span>
                        </div>
                        <div className="an-bar-chart">
                            {d.chartBars.map((b, i) => (
                                <BarCol key={i} label={b.label} value={b.value} max={maxBar} color="#00c93a" />
                            ))}
                        </div>
                    </div>

                    {/* ── Engagement breakdown ── */}
                    <div className="an-card">
                        <div className="an-card-head">
                            <span>Engagement Breakdown</span>
                        </div>
                        <div className="an-breakdown-list">
                            {breakdown.map(item => (
                                <div key={item.label} className="an-bd-row">
                                    <div className="an-bd-left">
                                        <span className="an-bd-dot" style={{ background: item.color }} />
                                        <span className="an-bd-label">{item.label}</span>
                                    </div>
                                    <div className="an-bd-track">
                                        <div className="an-bd-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                                    </div>
                                    <span className="an-bd-pct">{item.pct}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="an-card-divider" />
                        <div className="an-card-head" style={{ paddingTop: 0 }}>
                            <span>Best Posting Times</span>
                        </div>
                        <div className="an-times-grid">
                            {BEST_TIMES.map(row => (
                                <div key={row.day} className="an-times-row">
                                    <span className="an-times-day">{row.day}</span>
                                    <div className="an-times-slots">
                                        {row.slots.map(h => (
                                            <span key={h} className="an-time-slot">
                                                {h > 12 ? `${h - 12}pm` : `${h}am`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Channel performance ── */}
                <div className="an-card an-anim" style={{ '--i': 3 }}>
                    <div className="an-card-head">
                        <span>Channel Performance</span>
                        <span className="an-card-sub">Reach distribution and growth</span>
                    </div>

                    {/* Platform distribution bar */}
                    <div className="an-dist-bar">
                        {channelPerf.map((ch) => {
                            const pct = Math.round((d.reach[channelPerf.indexOf(ch)] / totalReach) * 100);
                            const meta = platformMeta[ch.key];
                            return (
                                <div
                                    key={ch.key}
                                    className="an-dist-seg"
                                    style={{ width: `${pct}%`, background: meta.color }}
                                    title={`${meta.name}: ${pct}%`}
                                />
                            );
                        })}
                    </div>
                    <div className="an-dist-legend">
                        {channelPerf.map((ch) => {
                            const pct = Math.round((d.reach[channelPerf.indexOf(ch)] / totalReach) * 100);
                            const meta = platformMeta[ch.key];
                            return (
                                <div key={ch.key} className="an-legend-item">
                                    <span className="an-legend-dot" style={{ background: meta.color }} />
                                    <span>{meta.abbr}</span>
                                    <span className="an-legend-pct">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="an-ch-table">
                        <div className="an-ch-thead">
                            <span>Channel</span>
                            <span>Reach</span>
                            <span>Engagements</span>
                            <span>Growth</span>
                            <span>Posts</span>
                            <span>Trend</span>
                        </div>
                        {channelPerf.map((ch) => {
                            const meta = platformMeta[ch.key];
                            const reachVal = d.reach[channelPerf.indexOf(ch)];
                            const engVal = Math.round(reachVal * 0.145);
                            return (
                                <div key={ch.key} className="an-ch-trow">
                                    <div className="an-ch-name-cell">
                                        <span className="an-ch-badge" style={{ '--ch': meta.color }}>{meta.abbr}</span>
                                        <span>{meta.name}</span>
                                    </div>
                                    <span>{reachVal >= 1000 ? `${(reachVal / 1000).toFixed(1)}K` : reachVal}</span>
                                    <span>{engVal >= 1000 ? `${(engVal / 1000).toFixed(1)}K` : engVal}</span>
                                    <span className="an-growth">{ch.growth}</span>
                                    <span>{ch.posts}</span>
                                    <Spark points={ch.points} color={meta.color} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Top posts ── */}
                <div className="an-card an-anim" style={{ '--i': 4 }}>
                    <div className="an-card-head">
                        <span>Top Performing Posts</span>
                        <span className="an-card-sub">Sorted by reach</span>
                    </div>
                    <div className="an-posts-table">
                        <div className="an-pt-thead">
                            <span>Content</span>
                            <span>Reach</span>
                            <span>Engage</span>
                            <span>Rate</span>
                            <span>When</span>
                        </div>
                        {topPosts.map((p, i) => {
                            const meta = platformMeta[p.platform];
                            return (
                                <div key={i} className="an-pt-row">
                                    <div className="an-pt-content">
                                        <span className="an-ch-badge" style={{ '--ch': meta.color }}>{meta.abbr}</span>
                                        <p>{p.content}</p>
                                    </div>
                                    <span>{p.reach}</span>
                                    <span>{p.engagement}</span>
                                    <span className="an-growth">{p.rate}</span>
                                    <span className="an-pt-time">{p.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </MainLayout>
    );
};

export default Analytics;
