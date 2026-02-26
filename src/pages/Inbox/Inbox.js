import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Inbox.css';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

/* ── Cache ─────────────────────────────────────────────────────────────────── */
const CACHE_KEY = 'flowsync_inbox_threads';
const CACHE_TTL = 5 * 60 * 1000;

function saveCache(threads) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ threads, ts: Date.now() })); } catch (_) { }
}
function loadCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { threads, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
        return threads;
    } catch (_) { return null; }
}

/* ── Platform metadata ─────────────────────────────────────────────────────── */
const platformMeta = {
    instagram: {
        abbr: 'IG', color: '#E4405F', name: 'Instagram',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
    },
    twitter: {
        abbr: 'X', color: '#1DA1F2', name: 'X (Twitter)',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
    },
    whatsapp: {
        abbr: 'WA', color: '#25D366', name: 'WhatsApp',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
    },
    telegram: {
        abbr: 'TG', color: '#0088CC', name: 'Telegram',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    },
};

/* ── Context-based AI suggestion engine ────────────────────────────────────── */
function detectIntent(messages) {
    const text = messages.map(m => m.text).join(' ').toLowerCase();
    if (/price|cost|plan|how much|pricing|buy|purchase|subscribe/.test(text)) return 'sales';
    if (/help|issue|problem|broken|error|fix|support|not working|bug/.test(text)) return 'support';
    if (/thank|great|awesome|love|nice|good job|amazing/.test(text)) return 'praise';
    if (/hello|hi|hey|good morning|good evening|start/.test(text)) return 'greeting';
    return 'general';
}

function generateAISuggestions(messages, name) {
    const intent = detectIntent(messages);
    const lastName = (messages.slice().reverse().find(m => m.incoming))?.text?.slice(0, 80) || '';
    const subject = name || 'there';

    const sets = {
        sales: [
            `Hi ${subject}! Our plans start at $29/month. Would you like me to walk you through the options?`,
            `Thanks for your interest! I can set up a quick demo for you this week — what time works best?`,
            `Great question! You can see full feature & pricing details at flowsync.io/pricing. Happy to answer any questions!`
        ],
        support: [
            `Hi ${subject}, I'm sorry to hear that. Could you share your order/account number so I can look into this?`,
            `Thanks for letting us know! I've escalated this to our tech team and will follow up within the hour.`,
            `I understand your frustration. Let me check on this right now — can you describe the issue in a bit more detail?`
        ],
        praise: [
            `Thank you so much, ${subject}! That really means a lot to us 🙏`,
            `We're thrilled to hear that! Your feedback keeps us going. Don't hesitate to reach out anytime!`,
            `Wonderful to hear! We'd love it if you shared your experience — it helps others too 🌟`
        ],
        greeting: [
            `Hello ${subject}! 👋 Welcome! How can I help you today?`,
            `Hi there! Great to connect with you. What can I do for you?`,
            `Hey ${subject}! Thanks for reaching out. How can I assist you?`
        ],
        general: [
            `Thanks for reaching out, ${subject}! How can I help you today?`,
            `Absolutely! Let me get that information for you right away.`,
            `Thanks for contacting us. Is there anything else I can assist you with?`
        ]
    };

    const intentLabel = intent.charAt(0).toUpperCase() + intent.slice(1);
    const suggestions = sets[intent] || sets.general;
    const lastIncoming = messages.slice().reverse().find(m => m.incoming);
    const summary = lastIncoming
        ? `Last message: "${lastIncoming.text.slice(0, 90)}${lastIncoming.text.length > 90 ? '…' : ''}"`
        : `No incoming messages yet.`;

    return { intent: intentLabel, suggestions, summary };
}

/* ── Component ──────────────────────────────────────────────────────────────── */
const Inbox = () => {
    const { userData } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [activePlatform, setActivePlatform] = useState('all');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [sendError, setSendError] = useState('');
    const [showAI, setShowAI] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiSummary, setAiSummary] = useState('');
    const [aiIntent, setAiIntent] = useState('');
    const [autoReply, setAutoReply] = useState({ instagram: false, twitter: false, whatsapp: true, telegram: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [tgSubTab, setTgSubTab] = useState('all'); // 'all' | 'flowsync' | 'personal'

    /* ── WA connection tracking (linked=DB, ready=backend) ───────────────────── */
    const [waReady, setWaReady] = useState(null); // null = unknown, true = ready, false = not ready
    const messagesBottomRef = useRef(null);

    /* ── Fetch state machine ────────────────────────────────────────────────── */
    // 'idle' | 'loading' | 'done' | 'error' | 'not_connected'
    const [fetchState, setFetchState] = useState('idle');
    const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0, message: 'Connecting...' });

    /* ── Thread data ────────────────────────────────────────────────────────── */
    const [threads, setThreads] = useState(() => loadCache() || []);
    const socketRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const didFetchRef = useRef(false);

    /* Auto-scroll to newest message */
    useEffect(() => {
        messagesBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected, threads]);

    const startFetchTimeout = useCallback(() => {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
            setThreads(prev => {
                if (prev.filter(t => t.platform === 'whatsapp').length === 0) {
                    setFetchState('error');
                }
                return prev;
            });
        }, 25000);
    }, []);

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
        const cached = loadCache();
        if (cached && cached.length > 0) {
            setThreads(cached);
            setFetchState('done');
            didFetchRef.current = true;
        }
    }, []);

    /* ── Use shared socket from SocketContext ─────────────── */
    const { socket: sharedSocket, connected: socketConnected, connectionStates } = useSocket() || {};
    useEffect(() => {
        if (!sharedSocket || !userData?.uid) return;
        socketRef.current = sharedSocket;

        /* ─── Define listeners ─── */
        const onConnectError = (err) => {
            console.error('[Inbox] Socket connect error:', err.message);
            setFetchState(prev => (prev === 'loading' || prev === 'connecting') ? 'error' : prev);
        };

        // Unified inbox threads from Firestore
        const onInboxThreads = (allThreads) => {
            clearTimeout(fetchTimeoutRef.current);
            console.log('[Inbox] Received threads from Firestore:', allThreads.length);
            setThreads(prev => {
                const merged = allThreads.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
                saveCache(merged);
                return merged;
            });
            setFetchState('done');
            didFetchRef.current = true;
        };

        // Legacy: WA chats
        const onWaChats = (chats) => {
            clearTimeout(fetchTimeoutRef.current);
            setThreads(prev => {
                const others = prev.filter(t => t.platform !== 'whatsapp');
                const merged = [...chats, ...others].sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
                saveCache(merged);
                return merged;
            });
            setFetchState('done');
            didFetchRef.current = true;
        };

        // Legacy: TG threads
        const onTgThreads = (tgThreads) => {
            console.log('[Inbox] Received TG threads:', tgThreads.length);
            setThreads(prev => {
                const others = prev.filter(t => t.platform !== 'telegram');
                const merged = [...others, ...tgThreads].sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
                saveCache(merged);
                return merged;
            });
            setFetchState(prev =>
                (prev === 'idle' || prev === 'connecting' || prev === 'not_connected') ? 'done' : prev
            );
        };

        // Live incoming messages
        const onWaMessage = (msg) => {
            setThreads(prev => {
                const idx = prev.findIndex(t => t.id === msg.chatId);
                if (idx > -1) {
                    const updated = { ...prev[idx], messages: [...prev[idx].messages, { text: msg.text, time: msg.time, incoming: true }], unread: true };
                    const next = [updated, ...prev.filter((_, i) => i !== idx)];
                    saveCache(next);
                    return next;
                }
                const newThread = {
                    id: msg.chatId, platform: 'whatsapp',
                    name: msg.name || msg.from,
                    avatar: (msg.name || msg.from || '?').substring(0, 2).toUpperCase(),
                    intent: 'general', vip: false, tags: [], flagged: false, unread: true,
                    messages: [{ text: msg.text, time: msg.time, incoming: true }],
                };
                const next = [newThread, ...prev];
                saveCache(next);
                return next;
            });
        };

        const onTgMessage = (msg) => {
            setThreads(prev => {
                const idx = prev.findIndex(t => t.id === msg.chatId);
                if (idx > -1) {
                    const updated = { ...prev[idx], messages: [...prev[idx].messages, { text: msg.text, time: msg.time, incoming: true }], unread: true };
                    const next = [updated, ...prev.filter((_, i) => i !== idx)];
                    saveCache(next);
                    return next;
                }
                const newThread = {
                    id: msg.chatId, platform: 'telegram',
                    telegramChatId: msg.telegramChatId,
                    name: msg.name, avatar: msg.avatar || '?',
                    intent: 'general', vip: false, tags: [], flagged: false, unread: true,
                    messages: [{ text: msg.text, time: msg.time, incoming: true }],
                };
                const next = [newThread, ...prev];
                saveCache(next);
                return next;
            });
        };

        const onSendOk = ({ chatId }) => {
            setSendingReply(false);
            setSendError('');
        };
        const onSendErr = ({ chatId, error }) => {
            setSendingReply(false);
            setSendError(error || 'Failed to send message');
            setTimeout(() => setSendError(''), 4000);
        };

        /* ─── Register listeners ─── */
        sharedSocket.on('connect_error', onConnectError);
        sharedSocket.on('inbox_threads', onInboxThreads);
        sharedSocket.on('whatsapp_chats', onWaChats);
        sharedSocket.on('telegram_threads', onTgThreads);
        sharedSocket.on('whatsapp_message', onWaMessage);
        sharedSocket.on('telegram_incoming_message', onTgMessage);
        sharedSocket.on('send_message_ok', onSendOk);
        sharedSocket.on('send_message_error', onSendErr);

        /* ─── Fetch threads from Firestore (fast, single request) ─── */
        if (sharedSocket.connected) {
            console.log('[Inbox] Fetching inbox from Firestore for:', userData.uid.substring(0, 8));
            setFetchState(prev => (prev === 'idle' || prev === 'not_connected') ? 'loading' : prev);
            sharedSocket.emit('get_inbox');
            // Also request Telegram threads (polling may have new ones)
            sharedSocket.emit('get_telegram_messages');
            startFetchTimeout();
        }

        return () => {
            clearTimeout(fetchTimeoutRef.current);
            sharedSocket.off('connect_error', onConnectError);
            sharedSocket.off('inbox_threads', onInboxThreads);
            sharedSocket.off('whatsapp_chats', onWaChats);
            sharedSocket.off('telegram_threads', onTgThreads);
            sharedSocket.off('whatsapp_message', onWaMessage);
            sharedSocket.off('telegram_incoming_message', onTgMessage);
            sharedSocket.off('send_message_ok', onSendOk);
            sharedSocket.off('send_message_error', onSendErr);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sharedSocket, socketConnected, userData?.uid]);

    /* ── Filter / search ────────────────────────────────────────────────────── */
    const filtered = useMemo(() => threads.filter(t => {
        const matchesPlatform = activePlatform === 'all' || t.platform === activePlatform;
        // Telegram sub-tab filter
        const matchesTgSub = activePlatform !== 'telegram' || tgSubTab === 'all' ||
            (tgSubTab === 'flowsync' && t.botId === 'flowsync') ||
            (tgSubTab === 'personal' && t.botId && t.botId !== 'flowsync');
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'unread' ? t.unread :
                    filter === 'flagged' ? t.flagged : true;
        const matchesSearch = !searchQuery.trim() ||
            t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.messages?.some(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesPlatform && matchesTgSub && matchesFilter && matchesSearch;
    }), [threads, activePlatform, tgSubTab, filter, searchQuery]);

    const activeThread = selected !== null ? threads.find(t => t.id === selected) : null;

    /* ── Retry fetch ────────────────────────────────────────────────────────── */
    const retryFetch = useCallback(() => {
        sessionStorage.removeItem(CACHE_KEY);
        didFetchRef.current = false;
        setSendError('');
        setFetchState('loading');
        setFetchProgress({ current: 0, total: 0, message: 'Retrying…' });
        if (socketRef.current?.connected) {
            socketRef.current.emit('get_inbox');
            socketRef.current.emit('get_telegram_messages');
        }
    }, []);

    /* ── Select thread → generate context-aware AI ─────────────────────────── */
    const selectThread = useCallback((id) => {
        setSelected(id);
        setSendError('');
        const thread = threads.find(t => t.id === id);
        if (thread) {
            setAiLoading(true);
            setAiSuggestions([]);
            setAiSummary('');
            setAiIntent('');
            setThreads(prev => {
                const next = prev.map(t => t.id === id ? { ...t, unread: false } : t);
                saveCache(next);
                return next;
            });
            setTimeout(() => {
                const { intent, suggestions, summary } = generateAISuggestions(thread.messages, thread.name);
                setAiIntent(intent);
                setAiSuggestions(suggestions);
                setAiSummary(summary);
                setAiLoading(false);
            }, 500);
        }
    }, [threads]);

    /* ── Send reply (real socket) ────────────────────────────────────────────── */
    const sendReply = useCallback(() => {
        if (!replyText.trim() || !selected || sendingReply) return;
        const thread = threads.find(t => t.id === selected);
        if (!thread) return;

        const msgObj = { text: replyText, time: 'Just now', incoming: false };

        // Optimistically add to UI
        setThreads(prev => {
            const next = prev.map(t =>
                t.id === selected ? { ...t, messages: [...t.messages, msgObj] } : t
            );
            saveCache(next);
            return next;
        });

        const text = replyText;
        setReplyText('');
        setSendingReply(true);
        setSendError('');

        const socket = socketRef.current;
        if (!socket?.connected) {
            setSendingReply(false);
            setSendError('Not connected to server');
            return;
        }

        if (thread.platform === 'whatsapp') {
            socket.emit('send_whatsapp_message', { chatId: thread.id, text });
        } else if (thread.platform === 'telegram') {
            socket.emit('send_telegram_message', {
                botId: thread.botId || 'flowsync',
                telegramChatId: thread.telegramChatId,
                text,
            });
        } else {
            // Other platforms: just local update
            setSendingReply(false);
        }
    }, [replyText, selected, sendingReply, threads]);

    const toggleAutoReply = useCallback((ch) => {
        setAutoReply(prev => ({ ...prev, [ch]: !prev[ch] }));
    }, []);

    const pct = fetchProgress.total > 0 ? Math.round((fetchProgress.current / fetchProgress.total) * 100) : 5;

    return (
        <MainLayout>
            <div className={`ib-container ${loaded ? 'loaded' : ''}`}>

                {/* ── Sidebar ── */}
                <div className="ib-sidebar">
                    <div className="ib-header">
                        <div className="ib-title">
                            <h1>Inbox</h1>
                            {threads.length > 0 && (
                                <span className="ib-badge">{threads.filter(t => t.unread).length} new</span>
                            )}
                        </div>
                        <div className="ib-platform-tabs">
                            <button
                                className={`ib-tab ${activePlatform === 'all' ? 'active' : ''}`}
                                onClick={() => setActivePlatform('all')}
                                title="All platforms"
                                style={{ '--tab-color': '#a0a0a0' }}
                            >
                                <span className="ib-tab-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                                </span>
                                <span className="ib-tab-label">ALL</span>
                            </button>
                            {Object.entries(platformMeta).map(([key, meta]) => (
                                <button
                                    key={key}
                                    className={`ib-tab ${activePlatform === key ? 'active' : ''}`}
                                    onClick={() => setActivePlatform(key === activePlatform ? 'all' : key)}
                                    title={meta.name}
                                    style={{ '--tab-color': meta.color }}
                                >
                                    <span className="ib-tab-icon">{meta.icon}</span>
                                    <span className="ib-tab-label">{meta.abbr}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Telegram sub-tabs */}
                    {activePlatform === 'telegram' && (
                        <div style={{
                            display: 'flex', gap: '0', margin: '0 16px 8px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'flowsync', label: '⚡ FlowSync' },
                                { key: 'personal', label: '🧱 Personal' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setTgSubTab(tab.key)}
                                    style={{
                                        flex: 1, padding: '8px 4px',
                                        background: 'none', border: 'none',
                                        borderBottom: tgSubTab === tab.key ? '2px solid #0088CC' : '2px solid transparent',
                                        cursor: 'pointer',
                                        color: tgSubTab === tab.key ? '#0099DD' : 'rgba(255,255,255,0.35)',
                                        fontSize: '11px', fontWeight: 600,
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="ib-search-filter">
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="ib-search-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="ib-filter-tags">
                            {['All', 'Unread', 'Flagged'].map(f => (
                                <button
                                    key={f}
                                    className={`ib-filter-tag ${filter === f.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => setFilter(f.toLowerCase())}
                                >{f}</button>
                            ))}
                        </div>
                    </div>

                    <div className="ib-thread-list">
                        {/* No platforms connected / Restoring session */}
                        {fetchState === 'not_connected' && threads.length === 0 && (
                            <div className="ib-not-connected">
                                <div className="ib-not-connected-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                </div>
                                <p>No accounts connected</p>
                                <span>Go to <strong>Accounts</strong> to connect your platforms to the Inbox.</span>
                            </div>
                        )}

                        {/* Connecting / pre-fetch spinner */}
                        {fetchState === 'connecting' && threads.length === 0 && (
                            <div className="ib-progress-container">
                                <div className="ib-progress-label">
                                    <span>Connecting to WhatsApp…</span>
                                </div>
                                <div className="ib-progress-track">
                                    <div className="ib-progress-bar" style={{ width: '30%', animation: 'ib-pulse 1.4s ease-in-out infinite' }} />
                                </div>
                                <p className="ib-progress-sub">Waiting for session to restore…</p>
                            </div>
                        )}

                        {/* Initial loading progress */}
                        {fetchState === 'loading' && threads.filter(t => t.platform === 'whatsapp').length === 0 && (
                            <div className="ib-progress-container">
                                <div className="ib-progress-label">
                                    <span>{fetchProgress.message || 'Loading chats...'}</span>
                                    <span>{pct}%</span>
                                </div>
                                <div className="ib-progress-track">
                                    <div className="ib-progress-bar" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="ib-progress-sub">This may take a moment the first time</p>
                            </div>
                        )}

                        {/* Fetch error */}
                        {fetchState === 'error' && threads.length === 0 && (
                            <div className="ib-fetch-error">
                                <div className="ib-fetch-error-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                                    </svg>
                                </div>
                                <p>Failed to fetch chats</p>
                                <span>Check that your backend is running and WhatsApp is connected.</span>
                                <button className="ib-retry-btn" onClick={retryFetch}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-4.6" />
                                    </svg>
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Background refetch bar */}
                        {fetchState === 'loading' && threads.filter(t => t.platform === 'whatsapp').length > 0 && (
                            <div className="ib-refetch-bar">
                                <div className="ib-refetch-fill" style={{ width: `${pct}%` }} />
                                <span>{fetchProgress.message}</span>
                            </div>
                        )}

                        {/* Thread list */}
                        {(['done', 'error', 'not_connected'].includes(fetchState) || threads.length > 0) ? (
                            filtered.length === 0 ? (
                                <div className="ib-empty-list">
                                    <p>{fetchState === 'done' && activePlatform !== 'all' ? `No ${activePlatform} conversations` : fetchState === 'done' ? 'No conversations found' : ''}</p>
                                </div>
                            ) : (
                                filtered.map(t => {
                                    const p = platformMeta[t.platform] || {};
                                    const lastMsg = t.messages[t.messages.length - 1];
                                    return (
                                        <div
                                            key={t.id}
                                            className={`ib-thread-card ${selected === t.id ? 'active' : ''} ${t.unread ? 'unread' : ''}`}
                                            onClick={() => selectThread(t.id)}
                                        >
                                            <div className="ib-card-avatar" style={{ '--av-color': p.color }}>
                                                {t.avatar}
                                                <div className="ib-platform-icon">{p.icon}</div>
                                            </div>
                                            <div className="ib-card-content">
                                                <div className="ib-card-top">
                                                    <span className="ib-card-name">
                                                        {t.name}
                                                        {t.platform === 'telegram' && t.botId && (
                                                            <span style={{
                                                                marginLeft: '6px',
                                                                padding: '1px 6px',
                                                                background: t.botId === 'flowsync' ? 'rgba(0,136,204,0.15)' : 'rgba(168,85,247,0.15)',
                                                                color: t.botId === 'flowsync' ? '#0099DD' : '#A855F7',
                                                                fontSize: '9px',
                                                                fontWeight: 700,
                                                                letterSpacing: '0.04em',
                                                                verticalAlign: 'middle',
                                                            }}>
                                                                {t.botId === 'flowsync' ? 'FS' : 'MY'}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="ib-card-time">{lastMsg?.time}</span>
                                                </div>
                                                <p className="ib-card-preview">{lastMsg?.text}</p>
                                            </div>
                                            {t.unread && <div className="ib-unread-dot" />}
                                        </div>
                                    );
                                })
                            )
                        ) : null}
                    </div>
                </div>

                {/* ── Main Chat Area ── */}
                <div className="ib-main">
                    {activeThread ? (
                        <>
                            <div className="ib-chat-header">
                                <div className="ib-chat-info">
                                    <div className="ib-chat-avatar"
                                        style={{ background: `color-mix(in srgb, ${platformMeta[activeThread.platform]?.color} 15%, transparent)`, color: platformMeta[activeThread.platform]?.color }}
                                    >{activeThread.avatar}</div>
                                    <div>
                                        <h2>{activeThread.name}</h2>
                                        <span>via {platformMeta[activeThread.platform]?.name}</span>
                                    </div>
                                </div>
                                <div className="ib-header-actions">
                                    <button className={`ib-ai-toggle ${showAI ? 'active' : ''}`} onClick={() => setShowAI(!showAI)}>
                                        ✦ AI Assistant
                                    </button>
                                </div>
                            </div>

                            <div className="ib-messages-area">
                                {activeThread.messages.map((m, idx) => (
                                    <div key={idx} className={`ib-message-row ${m.incoming ? 'incoming' : 'outgoing'}`}>
                                        <div className="ib-bubble">
                                            <p>{m.text}</p>
                                            <span className="ib-msg-time">{m.time}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesBottomRef} />
                            </div>

                            <div className="ib-input-area">
                                <input
                                    type="text"
                                    placeholder={`Reply via ${platformMeta[activeThread.platform]?.name}…`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                                    disabled={sendingReply}
                                />
                                <button
                                    className={`ib-send-btn ${sendingReply ? 'sending' : ''}`}
                                    onClick={sendReply}
                                    disabled={sendingReply || !replyText.trim()}
                                >
                                    {sendingReply ? (
                                        <span className="ib-send-spinner" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                        </svg>
                                    )}
                                </button>
                                {sendError && <div className="ib-send-error">{sendError}</div>}
                            </div>
                        </>
                    ) : (
                        <div className="ib-no-selection">
                            <div className="ib-placeholder-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h3>Select a conversation</h3>
                            <p>Choose a thread from the sidebar to view messages and AI insights.</p>
                        </div>
                    )}
                </div>

                {/* ── AI Panel ── */}
                {showAI && activeThread && (
                    <div className="ib-ai-sidebar">
                        <div className="ib-ai-header">
                            <h3>AI Insights</h3>
                        </div>
                        <div className="ib-ai-content">
                            {aiLoading ? (
                                <div className="ib-ai-loading">Analyzing conversation…</div>
                            ) : (
                                <>
                                    <div className="ib-ai-card">
                                        <h4>Intent Detected</h4>
                                        <div className="ib-intent-tag">{aiIntent}</div>
                                    </div>

                                    <div className="ib-ai-card">
                                        <h4>Last Message Context</h4>
                                        <p className="ib-ai-summary">{aiSummary}</p>
                                    </div>

                                    <div className="ib-ai-card">
                                        <h4>Smart Replies</h4>
                                        <div className="ib-suggestions">
                                            {aiSuggestions.map((s, i) => (
                                                <button key={i} onClick={() => setReplyText(s)}>{s}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ib-ai-card">
                                        <h4>Auto-Reply Settings</h4>
                                        {Object.entries(platformMeta).map(([key, val]) => {
                                            if (key === 'telegram') {
                                                // Per-bot toggles for Telegram
                                                return (
                                                    <div key={key}>
                                                        <div className="ib-setting-row">
                                                            <span>{val.name} (FlowSync)</span>
                                                            <label className="ib-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={autoReply['telegram_flowsync'] || false}
                                                                    onChange={() => {
                                                                        setAutoReply(prev => ({ ...prev, telegram_flowsync: !prev.telegram_flowsync }));
                                                                        socketRef.current?.emit('set_auto_reply', {
                                                                            botId: 'flowsync',
                                                                            enabled: !autoReply.telegram_flowsync,
                                                                        });
                                                                    }}
                                                                />
                                                                <span className="ib-slider"></span>
                                                            </label>
                                                        </div>
                                                        <div className="ib-setting-row">
                                                            <span>{val.name} (Personal)</span>
                                                            <label className="ib-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={autoReply['telegram_personal'] || false}
                                                                    onChange={() => {
                                                                        setAutoReply(prev => ({ ...prev, telegram_personal: !prev.telegram_personal }));
                                                                        socketRef.current?.emit('set_auto_reply', {
                                                                            botId: 'personal',
                                                                            enabled: !autoReply.telegram_personal,
                                                                        });
                                                                    }}
                                                                />
                                                                <span className="ib-slider"></span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={key} className="ib-setting-row">
                                                    <span>{val.name}</span>
                                                    <label className="ib-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={autoReply[key]}
                                                            onChange={() => toggleAutoReply(key)}
                                                        />
                                                        <span className="ib-slider"></span>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Inbox;
