import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Scheduling.css';

const platformMeta = {
    instagram: { abbr: 'IG', color: '#E4405F' },
    twitter: { abbr: 'X', color: '#1DA1F2' },
    whatsapp: { abbr: 'WA', color: '#25D366' },
    telegram: { abbr: 'TG', color: '#0088CC' },
};

const Scheduling = () => {
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState('upcoming');

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const posts = [
        { id: 1, platform: 'twitter', content: 'Announcing our new AI-powered features for social automation', date: 'Feb 10', time: '10:00 AM', status: 'scheduled' },
        { id: 2, platform: 'telegram', content: 'Weekly community update: Product roadmap and upcoming releases', date: 'Feb 10', time: '2:00 PM', status: 'scheduled' },
        { id: 3, platform: 'instagram', content: 'Behind the scenes: How we built FlowSync automation engine', date: 'Feb 11', time: '9:00 AM', status: 'queued' },
        { id: 4, platform: 'twitter', content: 'Tips for maximizing engagement with AI-assisted replies', date: 'Feb 12', time: '3:00 PM', status: 'queued' },
        { id: 5, platform: 'whatsapp', content: 'Monthly newsletter: Industry trends and best practices', date: 'Feb 14', time: '10:00 AM', status: 'draft' },
        { id: 6, platform: 'instagram', content: 'Launch day post — announcing FlowSync 2.0 with AI composer', date: 'Feb 15', time: '7:30 PM', status: 'draft' },
    ];

    const tabs = ['upcoming', 'drafts', 'published'];

    const filtered = posts.filter(p => {
        if (tab === 'upcoming') return p.status === 'scheduled' || p.status === 'queued';
        if (tab === 'drafts') return p.status === 'draft';
        return false;
    });

    const counts = {
        upcoming: posts.filter(p => p.status === 'scheduled' || p.status === 'queued').length,
        drafts: posts.filter(p => p.status === 'draft').length,
        published: 0,
    };

    return (
        <MainLayout>
            <div className={`sched ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="sc-head anim-s" style={{ '--i': 0 }}>
                    <div>
                        <h1>Schedule</h1>
                        <p>Your content calendar and queue</p>
                    </div>
                    <button className="sc-new-btn">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                        <span>New Post</span>
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="sc-tabs anim-s" style={{ '--i': 1 }}>
                    {tabs.map(t => (
                        <button
                            key={t}
                            className={`sc-tab ${tab === t ? 'active' : ''}`}
                            onClick={() => setTab(t)}
                        >
                            <span className="sc-tab-name">{t}</span>
                            <span className="sc-tab-count">{counts[t]}</span>
                        </button>
                    ))}
                </div>

                {/* ── Post list ── */}
                <div className="sc-list anim-s" style={{ '--i': 2 }}>
                    {filtered.length === 0 ? (
                        <div className="sc-empty">
                            <p>No {tab} posts yet</p>
                        </div>
                    ) : (
                        filtered.map((post, idx) => {
                            const p = platformMeta[post.platform] || {};
                            return (
                                <div key={post.id} className="sc-post" style={{ '--j': idx }}>
                                    <div className="sc-post-left">
                                        <span className="sc-badge" style={{ '--ch': p.color }}>{p.abbr}</span>
                                        <div className="sc-post-info">
                                            <p className="sc-post-text">{post.content}</p>
                                            <div className="sc-post-meta">
                                                <span className="sc-post-date">
                                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.5v3.5l2.5 2.5" /></svg>
                                                    {post.date} · {post.time}
                                                </span>
                                                <span className={`sc-status ${post.status}`}>{post.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sc-post-actions">
                                        <button className="sc-action">Edit</button>
                                        <button className="sc-action danger">Delete</button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Summary strip ── */}
                <div className="sc-summary anim-s" style={{ '--i': 3 }}>
                    <div className="sc-sum-item">
                        <span className="sc-sum-val">{counts.upcoming}</span>
                        <span className="sc-sum-label">Queued</span>
                    </div>
                    <div className="sc-sum-divider" />
                    <div className="sc-sum-item">
                        <span className="sc-sum-val">{counts.drafts}</span>
                        <span className="sc-sum-label">Drafts</span>
                    </div>
                    <div className="sc-sum-divider" />
                    <div className="sc-sum-item">
                        <span className="sc-sum-val">0</span>
                        <span className="sc-sum-label">Published today</span>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Scheduling;
