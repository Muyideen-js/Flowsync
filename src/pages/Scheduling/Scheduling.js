import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Scheduling.css';

const platformMeta = {
    instagram: { abbr: 'IG', color: '#E4405F', name: 'Instagram' },
    twitter: { abbr: 'X', color: '#1DA1F2', name: 'X (Twitter)' },
    whatsapp: { abbr: 'WA', color: '#25D366', name: 'WhatsApp' },
    telegram: { abbr: 'TG', color: '#0088CC', name: 'Telegram' },
};

const statusMeta = {
    scheduled: { label: 'Scheduled', color: '#1DA1F2' },
    queued: { label: 'Queued', color: '#ffa726' },
    draft: { label: 'Draft', color: 'rgba(255,255,255,0.35)' },
    published: { label: 'Published', color: '#00c93a' },
    failed: { label: 'Failed', color: '#ff6b6b' },
};

/* ── Days helper ── */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Scheduling = () => {
    const [loaded, setLoaded] = useState(false);
    const [view, setView] = useState('queue'); /* queue | calendar | timeline */
    const [tab, setTab] = useState('upcoming');
    const [editingId, setEditingId] = useState(null);
    const [currentDate] = useState(new Date(2026, 1, 17)); /* Feb 17, 2026 */

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const [posts, setPosts] = useState([
        { id: 1, platform: 'twitter', type: 'Tweet', content: 'Announcing our new AI-powered features for social automation 🚀', date: '2026-02-17', time: '10:00 AM', status: 'scheduled' },
        { id: 2, platform: 'telegram', type: 'Channel Post', content: 'Weekly community update: Product roadmap and upcoming releases', date: '2026-02-17', time: '2:00 PM', status: 'scheduled' },
        { id: 3, platform: 'instagram', type: 'Reel', content: 'Behind the scenes: How we built FlowSync automation engine', date: '2026-02-18', time: '9:00 AM', status: 'queued' },
        { id: 4, platform: 'twitter', type: 'Thread', content: 'Tips for maximizing engagement with AI-assisted replies (1/5)', date: '2026-02-18', time: '3:00 PM', status: 'queued' },
        { id: 5, platform: 'whatsapp', type: 'Broadcast', content: 'Monthly newsletter: Industry trends and best practices', date: '2026-02-19', time: '10:00 AM', status: 'draft' },
        { id: 6, platform: 'instagram', type: 'Post', content: 'Launch day — announcing FlowSync 2.0 with AI composer ✨', date: '2026-02-20', time: '7:30 PM', status: 'draft' },
        { id: 7, platform: 'twitter', type: 'Tweet', content: 'The future of social media management is here. Are you ready?', date: '2026-02-21', time: '11:00 AM', status: 'scheduled' },
        { id: 8, platform: 'telegram', type: 'Broadcast', content: 'Flash deal: 50% off annual plans — 48 hours only!', date: '2026-02-21', time: '6:00 PM', status: 'queued' },
        { id: 9, platform: 'instagram', type: 'Story', content: 'Quick poll: What feature do you want next? 🤔', date: '2026-02-22', time: '12:00 PM', status: 'draft' },
        { id: 10, platform: 'twitter', type: 'Tweet', content: 'Just crossed 10K users! Thank you to this amazing community 🎉', date: '2026-02-15', time: '9:00 AM', status: 'published' },
        { id: 11, platform: 'instagram', type: 'Post', content: 'Our year in review — FlowSync by the numbers 📊', date: '2026-02-14', time: '5:00 PM', status: 'published' },
        { id: 12, platform: 'whatsapp', type: 'DM Reply', content: 'Thank you for reaching out! Let me connect you with our team.', date: '2026-02-16', time: '3:00 PM', status: 'failed' },
    ]);

    const deletePost = (id) => {
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    const retryPost = (id) => {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'queued' } : p));
    };

    const counts = useMemo(() => ({
        upcoming: posts.filter(p => p.status === 'scheduled' || p.status === 'queued').length,
        drafts: posts.filter(p => p.status === 'draft').length,
        published: posts.filter(p => p.status === 'published').length,
        failed: posts.filter(p => p.status === 'failed').length,
    }), [posts]);

    const filtered = useMemo(() => posts.filter(p => {
        if (tab === 'upcoming') return p.status === 'scheduled' || p.status === 'queued';
        if (tab === 'drafts') return p.status === 'draft';
        if (tab === 'published') return p.status === 'published';
        if (tab === 'failed') return p.status === 'failed';
        return true;
    }), [posts, tab]);

    /* ── Calendar data ── */
    const calendarWeeks = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeks = [];
        let week = new Array(firstDay).fill(null);

        for (let d = 1; d <= daysInMonth; d++) {
            week.push(d);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }
        if (week.length > 0) {
            while (week.length < 7) week.push(null);
            weeks.push(week);
        }
        return weeks;
    }, [currentDate]);

    const postsByDate = useMemo(() => {
        const map = {};
        posts.forEach(p => {
            const day = parseInt(p.date.split('-')[2]);
            if (!map[day]) map[day] = [];
            map[day].push(p);
        });
        return map;
    }, [posts]);

    /* ── Timeline data (next 24h) ── */
    const timelineHours = useMemo(() => {
        const hours = [];
        for (let h = 6; h <= 23; h++) {
            const label = h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
            const matching = posts.filter(p => {
                const [, ampm] = p.time.split(' ');
                let hr = parseInt(p.time);
                if (ampm === 'PM' && hr !== 12) hr += 12;
                if (ampm === 'AM' && hr === 12) hr = 0;
                return hr === h && (p.status === 'scheduled' || p.status === 'queued');
            });
            hours.push({ hour: h, label, posts: matching });
        }
        return hours;
    }, [posts]);

    const tabs = [
        { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
        { key: 'drafts', label: 'Drafts', count: counts.drafts },
        { key: 'published', label: 'Published', count: counts.published },
        { key: 'failed', label: 'Failed', count: counts.failed },
    ];

    const views = [
        { key: 'queue', label: 'Queue' },
        { key: 'calendar', label: 'Calendar' },
        { key: 'timeline', label: 'Timeline' },
    ];

    return (
        <MainLayout>
            <div className={`sched ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="sc-head anim-s" style={{ '--i': 0 }}>
                    <div>
                        <h1>Schedule</h1>
                        <p>Your content calendar and publishing queue</p>
                    </div>
                    <div className="sc-head-right">
                        <div className="sc-view-switcher">
                            {views.map(v => (
                                <button
                                    key={v.key}
                                    className={`sc-view-btn ${view === v.key ? 'active' : ''}`}
                                    onClick={() => setView(v.key)}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                        <button className="sc-new-btn">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                            <span>New Post</span>
                        </button>
                    </div>
                </div>

                {/* ── Stats strip ── */}
                <div className="sc-stats anim-s" style={{ '--i': 1 }}>
                    <div className="sc-stat">
                        <span className="sc-stat-val">{counts.upcoming}</span>
                        <span className="sc-stat-label">Queued</span>
                    </div>
                    <div className="sc-stat-div" />
                    <div className="sc-stat">
                        <span className="sc-stat-val">{counts.drafts}</span>
                        <span className="sc-stat-label">Drafts</span>
                    </div>
                    <div className="sc-stat-div" />
                    <div className="sc-stat">
                        <span className="sc-stat-val">{counts.published}</span>
                        <span className="sc-stat-label">Published</span>
                    </div>
                    <div className="sc-stat-div" />
                    <div className="sc-stat">
                        <span className="sc-stat-val sc-failed-val">{counts.failed}</span>
                        <span className="sc-stat-label">Failed</span>
                    </div>
                </div>

                {/* ── QUEUE VIEW ── */}
                {view === 'queue' && (
                    <>
                        {/* Tabs */}
                        <div className="sc-tabs anim-s" style={{ '--i': 2 }}>
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    className={`sc-tab ${tab === t.key ? 'active' : ''} ${t.key === 'failed' && t.count > 0 ? 'has-failed' : ''}`}
                                    onClick={() => setTab(t.key)}
                                >
                                    <span className="sc-tab-name">{t.label}</span>
                                    <span className="sc-tab-count">{t.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Post list */}
                        <div className="sc-list anim-s" style={{ '--i': 3 }}>
                            {filtered.length === 0 ? (
                                <div className="sc-empty">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                    <p>No {tab} posts yet</p>
                                    <span>Create content in the Composer to get started</span>
                                </div>
                            ) : (
                                filtered.map((post, idx) => {
                                    const p = platformMeta[post.platform] || {};
                                    const s = statusMeta[post.status] || {};
                                    return (
                                        <div key={post.id} className={`sc-post ${post.status === 'failed' ? 'failed-post' : ''}`} style={{ '--j': idx }}>
                                            <div className="sc-post-left">
                                                <span className="sc-badge" style={{ '--ch': p.color }}>{p.abbr}</span>
                                                <div className="sc-post-info">
                                                    <p className="sc-post-text">{post.content}</p>
                                                    <div className="sc-post-meta">
                                                        <span className="sc-post-type">{post.type}</span>
                                                        <span className="sc-post-date">
                                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.5v3.5l2.5 2.5" /></svg>
                                                            {post.date.split('-').slice(1).join('/')} · {post.time}
                                                        </span>
                                                        <span className="sc-status" style={{ '--st': s.color }}>{s.label}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="sc-post-actions">
                                                {post.status === 'failed' && (
                                                    <button className="sc-action retry" onClick={() => retryPost(post.id)}>
                                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13.5 2.5v4h-4" /><path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.5l1.6 2" /></svg>
                                                        Retry
                                                    </button>
                                                )}
                                                <button className="sc-action" onClick={() => setEditingId(editingId === post.id ? null : post.id)}>Edit</button>
                                                <button className="sc-action danger" onClick={() => deletePost(post.id)}>Delete</button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* ── CALENDAR VIEW ── */}
                {view === 'calendar' && (
                    <div className="sc-calendar anim-s" style={{ '--i': 2 }}>
                        <div className="sc-cal-header">
                            <h2>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                        </div>
                        <div className="sc-cal-grid">
                            {/* Day headers */}
                            {DAYS.map(d => (
                                <div key={d} className="sc-cal-day-header">{d}</div>
                            ))}
                            {/* Calendar cells */}
                            {calendarWeeks.flat().map((day, i) => {
                                const dayPosts = day ? (postsByDate[day] || []) : [];
                                const isToday = day === currentDate.getDate();
                                return (
                                    <div
                                        key={i}
                                        className={`sc-cal-cell ${day ? '' : 'empty'} ${isToday ? 'today' : ''}`}
                                    >
                                        {day && (
                                            <>
                                                <span className="sc-cal-num">{day}</span>
                                                <div className="sc-cal-posts">
                                                    {dayPosts.slice(0, 3).map(p => {
                                                        const pm = platformMeta[p.platform] || {};
                                                        return (
                                                            <div key={p.id} className="sc-cal-post" style={{ '--ch': pm.color }}>
                                                                <span className="sc-cal-badge">{pm.abbr}</span>
                                                                <span className="sc-cal-text">{p.content.substring(0, 25)}…</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayPosts.length > 3 && (
                                                        <span className="sc-cal-more">+{dayPosts.length - 3} more</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── TIMELINE VIEW ── */}
                {view === 'timeline' && (
                    <div className="sc-timeline anim-s" style={{ '--i': 2 }}>
                        <div className="sc-tl-header">
                            <h2>Today's Timeline</h2>
                            <span className="sc-tl-date">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
                            </span>
                        </div>
                        <div className="sc-tl-track">
                            {timelineHours.map(({ hour, label, posts: hourPosts }) => (
                                <div key={hour} className={`sc-tl-row ${hourPosts.length > 0 ? 'has-posts' : ''}`}>
                                    <span className="sc-tl-time">{label}</span>
                                    <div className="sc-tl-line">
                                        <div className="sc-tl-dot" />
                                    </div>
                                    <div className="sc-tl-content">
                                        {hourPosts.map(p => {
                                            const pm = platformMeta[p.platform] || {};
                                            const s = statusMeta[p.status] || {};
                                            return (
                                                <div key={p.id} className="sc-tl-card" style={{ '--ch': pm.color }}>
                                                    <div className="sc-tl-card-head">
                                                        <span className="sc-badge" style={{ '--ch': pm.color }}>{pm.abbr}</span>
                                                        <span className="sc-tl-type">{p.type}</span>
                                                        <span className="sc-status" style={{ '--st': s.color }}>{s.label}</span>
                                                    </div>
                                                    <p className="sc-tl-card-text">{p.content}</p>
                                                </div>
                                            );
                                        })}
                                        {hourPosts.length === 0 && (
                                            <span className="sc-tl-empty-slot">—</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Scheduling;
