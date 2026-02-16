import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Mentions.css';

const platformMeta = {
    instagram: { abbr: 'IG', color: '#E4405F' },
    twitter: { abbr: 'X', color: '#1DA1F2' },
    whatsapp: { abbr: 'WA', color: '#25D366' },
    telegram: { abbr: 'TG', color: '#0088CC' },
};

const Mentions = () => {
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState('all');

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const mentions = [
        {
            id: 1, platform: 'twitter', user: '@tech_sarah', avatar: 'TS', text: "@FlowSync just made my workflow 10x easier 🚀 Can't believe I was doing this manually!", time: '8m ago', type: 'mention', replied: false
        },
        { id: 2, platform: 'instagram', user: '@design.studio', avatar: 'DS', text: 'Shoutout to @FlowSync for the amazing automation tools! Check them out 👇', time: '25m ago', type: 'mention', replied: true },
        { id: 3, platform: 'twitter', user: '@marketingguru', avatar: 'MG', text: 'Hot take: @FlowSync is the best social media automation tool on the market right now. Thread 🧵', time: '1h ago', type: 'mention', replied: false },
        { id: 4, platform: 'telegram', user: 'Alex Rivera', avatar: 'AR', text: 'Has anyone tried @FlowSync for their Telegram channels? Looking for reviews.', time: '2h ago', type: 'mention', replied: false },
        { id: 5, platform: 'twitter', user: '@devtools_daily', avatar: 'DD', text: 'Today\'s pick: @FlowSync — AI-powered social media automation that actually works. Full review 👇', time: '3h ago', type: 'tag', replied: true },
        { id: 6, platform: 'instagram', user: '@content.king', avatar: 'CK', text: 'My top 5 tools for 2026: 1. @FlowSync 2. Figma 3. Notion…', time: '5h ago', type: 'tag', replied: false },
    ];

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'mention', label: 'Mentions' },
        { key: 'tag', label: 'Tags' },
    ];

    const filtered = mentions.filter(m => tab === 'all' || m.type === tab);
    const unreplied = mentions.filter(m => !m.replied).length;

    return (
        <MainLayout>
            <div className={`mentions ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="mn-head anim-mn" style={{ '--i': 0 }}>
                    <div>
                        <h1>Mentions</h1>
                        <p>Track who's talking about you</p>
                    </div>
                    <div className="mn-badges">
                        <span className="mn-badge-count">{unreplied} unreplied</span>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="mn-tabs anim-mn" style={{ '--i': 1 }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            className={`mn-tab ${tab === t.key ? 'active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                            <span className="mn-tab-count">
                                {t.key === 'all' ? mentions.length : mentions.filter(m => m.type === t.key).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Mentions list ── */}
                <div className="mn-list anim-mn" style={{ '--i': 2 }}>
                    {filtered.map((m, idx) => {
                        const p = platformMeta[m.platform] || {};
                        return (
                            <div key={m.id} className={`mn-card ${m.replied ? 'replied' : ''}`}>
                                <div className="mn-card-left">
                                    <div className="mn-avatar">{m.avatar}</div>
                                </div>
                                <div className="mn-card-body">
                                    <div className="mn-card-top">
                                        <span className="mn-user">{m.user}</span>
                                        <div className="mn-card-meta">
                                            <span className="mn-platform" style={{ '--ch': p.color }}>{p.abbr}</span>
                                            <span className="mn-time">{m.time}</span>
                                        </div>
                                    </div>
                                    <p className="mn-text">{m.text}</p>
                                    <div className="mn-card-actions">
                                        <button className="mn-action">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8c0 3.3-2.7 6-6 6-1.1 0-2-.3-2.9-.7L2 14l.7-3.1C2.3 10 2 9 2 8c0-3.3 2.7-6 6-6s6 2.7 6 6z" /></svg>
                                            Reply
                                        </button>
                                        <button className="mn-action">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5.3L6.7 10.7 4 8" /></svg>
                                            {m.replied ? 'Replied' : 'Mark done'}
                                        </button>
                                        <button className="mn-action">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="1" /><circle cx="3" cy="8" r="1" /><circle cx="13" cy="8" r="1" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </MainLayout>
    );
};

export default Mentions;
