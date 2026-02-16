import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Inbox.css';

const platformMeta = {
    instagram: { abbr: 'IG', color: '#E4405F' },
    twitter: { abbr: 'X', color: '#1DA1F2' },
    whatsapp: { abbr: 'WA', color: '#25D366' },
    telegram: { abbr: 'TG', color: '#0088CC' },
};

const Inbox = () => {
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const threads = [
        {
            id: 1, platform: 'twitter', from: '@user123', name: 'Alex Rivera', avatar: 'AR', messages: [
                { text: 'Hey! Love your product. When is the next update?', time: '5m ago', incoming: true },
                { text: "Thanks Alex! We're shipping v2.0 next week 🚀", time: '3m ago', incoming: false },
            ], unread: true
        },
        {
            id: 2, platform: 'telegram', from: 'John Doe', name: 'John Doe', avatar: 'JD', messages: [
                { text: 'Interested in your services. Can we schedule a call?', time: '15m ago', incoming: true },
            ], unread: true
        },
        {
            id: 3, platform: 'instagram', from: '@creator_pro', name: 'Creative Studio', avatar: 'CS', messages: [
                { text: 'Amazing content! Keep it up 🔥', time: '1h ago', incoming: true },
                { text: 'Thanks! More coming soon.', time: '45m ago', incoming: false },
            ], unread: false
        },
        {
            id: 4, platform: 'twitter', from: '@techuser', name: 'Dev Sarah', avatar: 'DS', messages: [
                { text: 'Question about your API documentation — is there a rate limit?', time: '2h ago', incoming: true },
            ], unread: false
        },
        {
            id: 5, platform: 'whatsapp', from: '+234 801 234 5678', name: 'Support Lead', avatar: 'SL', messages: [
                { text: 'New inquiry from website contact form — pricing question.', time: '3h ago', incoming: true },
            ], unread: true
        },
    ];

    const filters = ['all', 'unread', 'read'];
    const filtered = threads.filter(t => {
        if (filter === 'unread') return t.unread;
        if (filter === 'read') return !t.unread;
        return true;
    });

    const unreadCount = threads.filter(t => t.unread).length;
    const activeThread = selected !== null ? threads.find(t => t.id === selected) : null;

    return (
        <MainLayout>
            <div className={`inbox ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="ib-head anim-ib" style={{ '--i': 0 }}>
                    <div>
                        <h1>Inbox</h1>
                        <p>Unified messages across all channels</p>
                    </div>
                    <div className="ib-unread-badge">
                        {unreadCount} unread
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="ib-filters anim-ib" style={{ '--i': 1 }}>
                    {filters.map(f => (
                        <button
                            key={f}
                            className={`ib-filter ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* ── Split pane ── */}
                <div className="ib-split anim-ib" style={{ '--i': 2 }}>
                    {/* Thread list */}
                    <div className="ib-list">
                        {filtered.map(t => {
                            const p = platformMeta[t.platform] || {};
                            const lastMsg = t.messages[t.messages.length - 1];
                            return (
                                <div
                                    key={t.id}
                                    className={`ib-thread ${t.unread ? 'unread' : ''} ${selected === t.id ? 'selected' : ''}`}
                                    onClick={() => setSelected(t.id)}
                                >
                                    <div className="ib-thread-avatar">{t.avatar}</div>
                                    <div className="ib-thread-body">
                                        <div className="ib-thread-top">
                                            <span className="ib-thread-name">{t.name}</span>
                                            <span className="ib-thread-time">{lastMsg.time}</span>
                                        </div>
                                        <div className="ib-thread-bottom">
                                            <p className="ib-thread-preview">{lastMsg.text}</p>
                                            <span className="ib-thread-badge" style={{ '--ch': p.color }}>{p.abbr}</span>
                                        </div>
                                    </div>
                                    {t.unread && <span className="ib-dot" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Conversation pane */}
                    <div className="ib-convo">
                        {activeThread ? (
                            <>
                                <div className="ib-convo-head">
                                    <div className="ib-convo-who">
                                        <div className="ib-convo-avatar">{activeThread.avatar}</div>
                                        <div>
                                            <span className="ib-convo-name">{activeThread.name}</span>
                                            <span className="ib-convo-handle">{activeThread.from}</span>
                                        </div>
                                    </div>
                                    <span className="ib-convo-platform" style={{ '--ch': platformMeta[activeThread.platform]?.color }}>
                                        {platformMeta[activeThread.platform]?.abbr}
                                    </span>
                                </div>
                                <div className="ib-messages">
                                    {activeThread.messages.map((m, idx) => (
                                        <div key={idx} className={`ib-msg ${m.incoming ? 'in' : 'out'}`}>
                                            <p>{m.text}</p>
                                            <span className="ib-msg-time">{m.time}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="ib-reply">
                                    <input type="text" placeholder="Type a reply…" />
                                    <button className="ib-send">
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2L9 11" /><path d="M18 2l-6 16-3-7-7-3 16-6z" /></svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="ib-empty">
                                <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
                                    <path d="M16 12.5a1.5 1.5 0 01-1.5 1.5H5.5L2.5 17V4a1.5 1.5 0 011.5-1.5h11A1.5 1.5 0 0116.5 4v8.5z" />
                                </svg>
                                <p>Select a conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Inbox;
