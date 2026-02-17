import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Inbox.css';

const platformMeta = {
    instagram: { abbr: 'IG', color: '#E4405F', name: 'Instagram' },
    twitter: { abbr: 'X', color: '#1DA1F2', name: 'X (Twitter)' },
    whatsapp: { abbr: 'WA', color: '#25D366', name: 'WhatsApp' },
    telegram: { abbr: 'TG', color: '#0088CC', name: 'Telegram' },
};

/* Mock AI reply suggestions */
const mockAISuggestions = {
    sales: [
        "Hi! Thanks for reaching out. Our pricing starts at $29/month for the Starter plan with all core features included. Would you like me to walk you through the options?",
        "Great to hear from you! We have flexible plans designed for businesses of all sizes. I'd love to schedule a quick demo — when works best for you?",
        "Thanks for your interest! Here's a quick overview of what's included. Feel free to book a call if you'd like to learn more: flowsync.io/demo"
    ],
    support: [
        "Thanks for reaching out! Let me look into this for you right away. Could you share a screenshot or more details about the issue?",
        "I understand the frustration. Let me check our system and get back to you with a solution within the next 30 minutes.",
        "Happy to help! This is a known issue we're working on. In the meantime, here's a quick workaround..."
    ],
    general: [
        "Thanks for the kind words! We really appreciate your support. Stay tuned for some exciting updates coming soon! 🚀",
        "Great question! Let me get you the best answer. I'll follow up shortly with more details.",
        "Appreciate you reaching out! We love hearing from our community. Is there anything specific I can help with?"
    ]
};

const Inbox = () => {
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showAI, setShowAI] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiSummary, setAiSummary] = useState('');
    const [aiIntent, setAiIntent] = useState('');
    const [autoReply, setAutoReply] = useState({ instagram: false, twitter: false, whatsapp: true, telegram: false });

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const [threads, setThreads] = useState([
        {
            id: 1, platform: 'whatsapp', from: '+234 801 234 5678', name: 'John Doe', avatar: 'JD',
            intent: 'sales', vip: true, tags: ['sales-lead'],
            messages: [
                { text: 'Hi! I saw your product online. How much does the Premium plan cost?', time: '5m ago', incoming: true },
                { text: 'Also, do you offer any discounts for annual subscriptions?', time: '4m ago', incoming: true },
            ], unread: true, flagged: true
        },
        {
            id: 2, platform: 'twitter', from: '@tech_sarah', name: 'Tech Sarah', avatar: 'TS',
            intent: 'general', vip: false, tags: [],
            messages: [
                { text: '@FlowSync just made my workflow 10x easier 🚀 Can\'t believe I was doing this manually!', time: '15m ago', incoming: true },
            ], unread: true, flagged: false
        },
        {
            id: 3, platform: 'instagram', from: '@creator_pro', name: 'Creative Studio', avatar: 'CS',
            intent: 'support', vip: false, tags: ['bug-report'],
            messages: [
                { text: 'Hey, I\'m having trouble connecting my second Instagram account. Getting an error on the OAuth screen.', time: '1h ago', incoming: true },
                { text: 'Can you try disconnecting and reconnecting? Go to Settings → Accounts → Instagram → Disconnect', time: '45m ago', incoming: false },
                { text: 'Still getting the same error. Here\'s a screenshot...', time: '30m ago', incoming: true },
            ], unread: true, flagged: false
        },
        {
            id: 4, platform: 'telegram', from: 'Alex Rivera', name: 'Alex Rivera', avatar: 'AR',
            intent: 'sales', vip: true, tags: ['enterprise'],
            messages: [
                { text: 'Interested in your Enterprise plan for our 50-person team. Can we schedule a demo?', time: '2h ago', incoming: true },
            ], unread: true, flagged: true
        },
        {
            id: 5, platform: 'twitter', from: '@devtools_daily', name: 'DevTools Daily', avatar: 'DD',
            intent: 'general', vip: false, tags: ['media'],
            messages: [
                { text: 'Would love to feature FlowSync in our weekly newsletter. Do you have a press kit?', time: '3h ago', incoming: true },
                { text: 'Absolutely! I\'ll send the press kit over. Thanks for the interest!', time: '2h ago', incoming: false },
                { text: 'Perfect, looking forward to it! When can we expect it?', time: '1h ago', incoming: true },
            ], unread: false, flagged: false
        },
        {
            id: 6, platform: 'instagram', from: '@jane_markets', name: 'Jane Marketing', avatar: 'JM',
            intent: 'support', vip: false, tags: [],
            messages: [
                { text: 'Your auto-reply feature sent the wrong response to one of our customers 😬', time: '4h ago', incoming: true },
            ], unread: false, flagged: true
        },
        {
            id: 7, platform: 'whatsapp', from: '+1 555 123 4567', name: 'Michael B', avatar: 'MB',
            intent: 'general', vip: false, tags: [],
            messages: [
                { text: 'Love the product! When are you launching the mobile app?', time: '5h ago', incoming: true },
                { text: 'Thanks Michael! We\'re targeting Q2 2026 for the mobile app launch. Stay tuned!', time: '4h ago', incoming: false },
            ], unread: false, flagged: false
        },
    ]);

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'flagged', label: 'Flagged' },
        { key: 'vip', label: 'VIP' },
        { key: 'sales', label: 'Sales' },
    ];

    const filtered = useMemo(() => threads.filter(t => {
        if (filter === 'unread') return t.unread;
        if (filter === 'flagged') return t.flagged;
        if (filter === 'vip') return t.vip;
        if (filter === 'sales') return t.intent === 'sales';
        return true;
    }), [threads, filter]);

    const unreadCount = threads.filter(t => t.unread).length;
    const activeThread = selected !== null ? threads.find(t => t.id === selected) : null;

    /* Generate AI suggestions when selecting a thread */
    const selectThread = useCallback((id) => {
        setSelected(id);
        const thread = threads.find(t => t.id === id);
        if (thread) {
            setAiLoading(true);
            setAiSuggestions([]);
            setAiSummary('');
            setAiIntent('');
            setTimeout(() => {
                const sugType = thread.intent || 'general';
                setAiSuggestions(mockAISuggestions[sugType] || mockAISuggestions.general);
                setAiIntent(sugType.charAt(0).toUpperCase() + sugType.slice(1));
                const lastMsg = thread.messages[thread.messages.length - 1];
                setAiSummary(
                    thread.messages.length > 2
                        ? `${thread.messages.length}-message thread. Customer is ${thread.intent === 'sales' ? 'inquiring about pricing/plans' : thread.intent === 'support' ? 'reporting an issue' : 'engaging positively'}. Last message: "${lastMsg.text.substring(0, 60)}…"`
                        : `${thread.name} sent a ${sugType} message via ${platformMeta[thread.platform]?.name || thread.platform}. ${thread.vip ? 'VIP contact.' : ''}`
                );
                setAiLoading(false);
                // Mark as read
                setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: false } : t));
            }, 800);
        }
    }, [threads]);

    const applySuggestion = useCallback((text) => {
        setReplyText(text);
    }, []);

    const sendReply = useCallback(() => {
        if (!replyText.trim() || !selected) return;
        setThreads(prev => prev.map(t =>
            t.id === selected
                ? { ...t, messages: [...t.messages, { text: replyText, time: 'Just now', incoming: false }] }
                : t
        ));
        setReplyText('');
    }, [replyText, selected]);

    const toggleAutoReply = useCallback((ch) => {
        setAutoReply(prev => ({ ...prev, [ch]: !prev[ch] }));
    }, []);

    return (
        <MainLayout>
            <div className={`inbox ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="ib-head anim-ib" style={{ '--i': 0 }}>
                    <div>
                        <h1>Inbox AI</h1>
                        <p>Unified messaging with AI-powered assistance</p>
                    </div>
                    <div className="ib-head-right">
                        <div className="ib-unread-badge">{unreadCount} unread</div>
                        <button
                            className={`ib-ai-toggle ${showAI ? 'active' : ''}`}
                            onClick={() => setShowAI(!showAI)}
                        >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" /><path d="M15 12l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" /></svg>
                            AI Panel
                        </button>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="ib-filters anim-ib" style={{ '--i': 1 }}>
                    {filters.map(f => (
                        <button
                            key={f.key}
                            className={`ib-filter ${filter === f.key ? 'active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                            <span className="ib-filter-count">
                                {f.key === 'all' ? threads.length : threads.filter(t =>
                                    f.key === 'unread' ? t.unread :
                                        f.key === 'flagged' ? t.flagged :
                                            f.key === 'vip' ? t.vip :
                                                f.key === 'sales' ? t.intent === 'sales' : true
                                ).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Three-column split ── */}
                <div className={`ib-split anim-ib ${showAI ? 'with-ai' : ''}`} style={{ '--i': 2 }}>
                    {/* Thread list */}
                    <div className="ib-list">
                        {filtered.map(t => {
                            const p = platformMeta[t.platform] || {};
                            const lastMsg = t.messages[t.messages.length - 1];
                            return (
                                <div
                                    key={t.id}
                                    className={`ib-thread ${t.unread ? 'unread' : ''} ${selected === t.id ? 'selected' : ''}`}
                                    onClick={() => selectThread(t.id)}
                                >
                                    <div className="ib-thread-avatar">{t.avatar}</div>
                                    <div className="ib-thread-body">
                                        <div className="ib-thread-top">
                                            <span className="ib-thread-name">
                                                {t.name}
                                                {t.vip && <span className="ib-vip-badge">VIP</span>}
                                            </span>
                                            <span className="ib-thread-time">{lastMsg.time}</span>
                                        </div>
                                        <div className="ib-thread-bottom">
                                            <p className="ib-thread-preview">{lastMsg.text}</p>
                                            <div className="ib-thread-tags">
                                                <span className="ib-thread-badge" style={{ '--ch': p.color }}>{p.abbr}</span>
                                                {t.tags.slice(0, 1).map(tag => (
                                                    <span key={tag} className="ib-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {t.unread && <span className="ib-dot" />}
                                    {t.flagged && <span className="ib-flag">🚩</span>}
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
                                            <span className="ib-convo-name">
                                                {activeThread.name}
                                                {activeThread.vip && <span className="ib-vip-badge">VIP</span>}
                                            </span>
                                            <span className="ib-convo-handle">{activeThread.from}</span>
                                        </div>
                                    </div>
                                    <div className="ib-convo-meta">
                                        <span className="ib-convo-platform" style={{ '--ch': platformMeta[activeThread.platform]?.color }}>
                                            {platformMeta[activeThread.platform]?.abbr}
                                        </span>
                                        {activeThread.tags.map(tag => (
                                            <span key={tag} className="ib-convo-tag">{tag}</span>
                                        ))}
                                    </div>
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
                                    <input
                                        type="text"
                                        placeholder="Type a reply…"
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendReply()}
                                    />
                                    <button className="ib-send" onClick={sendReply} disabled={!replyText.trim()}>
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2L9 11" /><path d="M18 2l-6 16-3-7-7-3 16-6z" /></svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="ib-empty">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                <p>Select a conversation</p>
                                <span>Choose a thread to view messages and AI suggestions</span>
                            </div>
                        )}
                    </div>

                    {/* ── AI Assistant Panel ── */}
                    {showAI && (
                        <div className="ib-ai-panel">
                            {activeThread ? (
                                <>
                                    <div className="ib-ai-section">
                                        <h3 className="ib-ai-title">
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" /></svg>
                                            AI Suggestions
                                        </h3>
                                        {aiLoading ? (
                                            <div className="ib-ai-loading">
                                                <div className="ib-ai-spinner" />
                                                <span>Analyzing conversation…</span>
                                            </div>
                                        ) : (
                                            <div className="ib-ai-replies">
                                                {aiSuggestions.map((s, i) => (
                                                    <div key={i} className="ib-ai-reply">
                                                        <p>{s}</p>
                                                        <button onClick={() => applySuggestion(s)}>Use this</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Summary & Intent */}
                                    <div className="ib-ai-section">
                                        <h3 className="ib-ai-title">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M2 8h8M2 12h10" /></svg>
                                            Summary
                                        </h3>
                                        {aiSummary && <p className="ib-ai-summary">{aiSummary}</p>}
                                    </div>

                                    <div className="ib-ai-section">
                                        <h3 className="ib-ai-title">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" /></svg>
                                            Detected Intent
                                        </h3>
                                        {aiIntent && (
                                            <span className={`ib-intent-badge ${aiIntent.toLowerCase()}`}>
                                                {aiIntent}
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick actions */}
                                    <div className="ib-ai-section">
                                        <h3 className="ib-ai-title">Quick Actions</h3>
                                        <div className="ib-ai-actions">
                                            <button className="ib-ai-action">📋 Save as FAQ</button>
                                            <button className="ib-ai-action">🏷️ Add Tag</button>
                                            <button className="ib-ai-action">👤 Escalate</button>
                                            <button className="ib-ai-action">⭐ Mark VIP</button>
                                        </div>
                                    </div>

                                    {/* Auto-reply safety */}
                                    <div className="ib-ai-section">
                                        <h3 className="ib-ai-title">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 1v6l4 2" /><circle cx="8" cy="8" r="7" /></svg>
                                            Safety Controls
                                        </h3>
                                        <div className="ib-safety-controls">
                                            {Object.entries(platformMeta).map(([key, val]) => (
                                                <div key={key} className="ib-safety-row">
                                                    <span style={{ color: val.color }}>{val.abbr}</span>
                                                    <span className="ib-safety-label">Auto-reply</span>
                                                    <label className="ib-toggle">
                                                        <input type="checkbox" checked={autoReply[key]} onChange={() => toggleAutoReply(key)} />
                                                        <span className="ib-toggle-track" />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="ib-ai-empty">
                                    <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="rgba(138,43,226,0.25)" strokeWidth="1.2"><path d="M10 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" /><path d="M15 12l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" /></svg>
                                    <p>AI Assistant</p>
                                    <span>Select a conversation to get AI-powered suggestions</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Inbox;
