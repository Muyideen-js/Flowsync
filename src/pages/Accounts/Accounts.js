import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';
import './Accounts.css';

const SOCKET_URL = 'https://flowsync-3fd5.onrender.com';

/**
 * WhatsApp UI State Machine
 *
 * checking     → "Checking…"       (initial — waiting for server response)
 * idle         → "Not connected"   (server confirmed: no session)
 * restoring    → "Restoring…"      (session exists, Puppeteer loading)
 * qr           → "Scan QR code"    (QR modal auto-opens)
 * authenticated→ "Authenticated…"  (QR scanned, keys accepted)
 * ready        → "Connected" ✅
 * error        → "Connection error"
 */
const WA_LABEL = {
    checking: 'Checking…',
    idle: 'Not connected',
    restoring: 'Generating QR…',
    qr: 'Scan QR code',
    authenticated: 'Authenticated…',
    ready: 'Connected',
    error: 'Connection error',
};

const WA_STATUS_CLASS = {
    checking: 'off',
    idle: 'off',
    restoring: 'checking',
    qr: 'checking',
    authenticated: 'checking',
    ready: 'on',
    error: 'off',
};

/* ── Platform config ──────────────────────────────────── */
const platforms = [
    {
        id: 'instagram', name: 'Instagram', color: '#E4405F', abbr: 'IG',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    {
        id: 'twitter', name: 'X (Twitter)', color: '#1DA1F2', abbr: 'X',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l6.5 8L4 20h2l5.3-6.5L15.5 20H21l-7-8.5L20.5 4H18.5l-5 6L9 4H4z" />
            </svg>
        ),
    },
    {
        id: 'whatsapp', name: 'WhatsApp', color: '#25D366', abbr: 'WA',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21l1.5-5.5A9 9 0 1116.5 19L3 21z" />
                <path d="M9 10a1.5 1.5 0 011.5 1.5A3 3 0 0013.5 14h1A1.5 1.5 0 0116 12.5" />
            </svg>
        ),
    },
    {
        id: 'telegram', name: 'Telegram', color: '#0088CC', abbr: 'TG',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22l-4-9-9-4L22 2z" />
            </svg>
        ),
    },
];

const initialConnections = {
    instagram: { connected: false, handle: null, lastSync: null },
    twitter: { connected: false, handle: null, lastSync: null },
    telegram: { connected: false, handle: null, lastSync: null },
};

const Accounts = () => {
    const { userData, updateUserData, loading: userLoading } = useAuth();

    const [loaded, setLoaded] = useState(false);
    const [connections, setConnections] = useState(initialConnections);

    const [waState, setWaState] = useState('checking');
    const [qrModal, setQrModal] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [tgModal, setTgModal] = useState(false);
    const [tgChatId, setTgChatId] = useState('');
    const [tgBotToken, setTgBotToken] = useState('');
    const [tgSaving, setTgSaving] = useState(false);

    const socketRef = useRef(null);
    const userIdRef = useRef(null);
    const userOpenedModal = useRef(false);
    // Track explicit user-triggered disconnects so auto-reconnect skips them
    const tgExplicitDisconnect = useRef(false);

    // Derived
    const waReady = waState === 'ready';
    const waBusy = ['restoring', 'authenticated', 'qr', 'checking'].includes(waState);
    // Only lock the modal shut during 'authenticated' — user just scanned and we must not interrupt
    const waModalLock = waState === 'authenticated';
    const waLabel = WA_LABEL[waState] || 'Not connected';
    const waClass = WA_STATUS_CLASS[waState] || 'off';
    const qrSrc = qrCode
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`
        : null;

    /* ── Load page ──────────────────────────────────────── */
    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    /* ── Load other platform states from Firestore ──────── */
    useEffect(() => {
        if (!userData?.connectedAccounts) return;
        const ca = userData.connectedAccounts;
        setConnections(prev => ({
            ...prev,
            twitter: ca.twitter?.connected ? { connected: true, handle: ca.twitter.handle || '@connected', lastSync: 'Synced' } : prev.twitter,
            instagram: ca.instagram?.connected ? { connected: true, handle: ca.instagram.handle || '@connected', lastSync: 'Synced' } : prev.instagram,
            // Only show telegram connected from Firestore if user has not explicitly disconnected this session
            telegram: (ca.telegram?.connected && !tgExplicitDisconnect.current)
                ? { connected: true, handle: ca.telegram.chatId || ca.telegram.handle || 'Bot connected', lastSync: 'Synced' }
                : prev.telegram,
        }));
        if (ca.telegram?.botToken) setTgBotToken(ca.telegram.botToken);
    }, [userData]);

    /* ── Persistent socket — created once user is known ─── */
    useEffect(() => {
        // Wait until we have userData (Firebase UID)
        if (!userData?.uid) return;
        userIdRef.current = userData.uid;

        // Avoid recreating if already connected for same user
        if (socketRef.current?.connected) return;
        if (socketRef.current) socketRef.current.disconnect();

        const socket = io(SOCKET_URL, {
            auth: { userId: userData.uid },   // ← private room key
            transports: ['websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
            timeout: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Accounts] Socket connected for user:', userData.uid.substring(0, 8));
            socket.emit('get_whatsapp_status');
            socket.emit('start_whatsapp');
            // Auto-reconnect Telegram bot from saved Firestore token ONLY if not explicitly disconnected
            if (!tgExplicitDisconnect.current) {
                const savedToken = userData.connectedAccounts?.telegram?.botToken;
                if (savedToken) {
                    socket.emit('connect_telegram_bot', { botToken: savedToken });
                }
            }
        });

        /* ─── Telegram state events ─── */
        socket.on('tg_connected', (data) => {
            const handle = data.username ? `@${data.username}` : 'Bot connected';
            setConnections(prev => ({ ...prev, telegram: { connected: true, handle, lastSync: 'Just now' } }));
        });

        socket.on('tg_state', ({ state }) => {
            // Always reflect actual bot state — idle/error means disconnected
            if (state === 'idle' || state === 'error') {
                setConnections(prev => ({ ...prev, telegram: { connected: false, handle: null, lastSync: null } }));
            }
        });

        socket.on('connect_error', (err) => {
            console.error('[Accounts] Socket error:', err.message);
            setWaState(prev => prev === 'checking' ? 'idle' : prev);
        });

        socket.on('tg_error', ({ error }) => {
            console.error('[Accounts] Telegram error:', error);
            // Show an inline error — alert used since Accounts has no toast system
            const msg = error?.includes('404') || error?.includes('401')
                ? '❌ Invalid bot token. Copy the token exactly from @BotFather and try again.'
                : `❌ Telegram error: ${error}`;
            alert(msg);
        });

        /* ─── WhatsApp state events ─── */
        socket.on('wa_state', ({ state }) => {
            setWaState(state);
            // Only auto-open modal if the USER explicitly clicked the button
            if (state === 'qr' && userOpenedModal.current) setQrModal(true);
            if (state === 'ready') {
                setQrModal(false);
                setQrCode('');
                userOpenedModal.current = false;
                updateUserData({
                    'connectedAccounts.whatsapp': { connected: true, connectedAt: new Date().toISOString() }
                });
            }
            if (state === 'idle' || state === 'error') {
                setQrCode('');
                // Only close modal if user had it open
                if (userOpenedModal.current) setQrModal(false);
                userOpenedModal.current = false;
            }
        });

        socket.on('qr_code', (qr) => {
            setQrCode(qr);
            setWaState('qr');
            // Only open modal if user wanted it
            if (userOpenedModal.current) setQrModal(true);
        });

        socket.on('whatsapp_ready', () => {
            setWaState('ready');
            setQrModal(false);
            setQrCode('');
            updateUserData({
                'connectedAccounts.whatsapp': { connected: true, connectedAt: new Date().toISOString() }
            });
        });

        socket.on('whatsapp_authenticated', () => {
            setWaState(prev => prev === 'ready' ? 'ready' : 'authenticated');
        });

        socket.on('whatsapp_disconnected', () => {
            setWaState('idle');
            setQrModal(false);
            setQrCode('');
            updateUserData({ 'connectedAccounts.whatsapp': { connected: false, connectedAt: null } });
        });

        socket.on('whatsapp_auth_failure', () => {
            setWaState('error');
        });

        socket.on('whatsapp_status', ({ ready }) => {
            if (ready) setWaState('ready');
        });

        /* ─── Telegram events ─── */
        socket.on('telegram_connected', (data) => {
            const handle = data.username ? `@${data.username}` : 'Connected Bot';
            setConnections(prev => ({ ...prev, telegram: { connected: true, handle, lastSync: 'Just now' } }));
            updateUserData({ 'connectedAccounts.telegram': { connected: true, connectedAt: new Date().toISOString() } });
        });

        socket.on('telegram_connect_error', (data) => {
            console.error('[Accounts] TG error:', data?.error);
            alert(`Telegram connection failed: ${data?.error || 'Unknown error'}`);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData?.uid]);

    /* ── Handlers ─────────────────────────────────────────── */
    const handleConnectWA = useCallback(() => {
        // ✅ Always open modal first — never block on socket state
        userOpenedModal.current = true;
        setQrModal(true);

        const socket = socketRef.current;

        // If QR is already ready (from pre-warm), just show it — no need to re-emit
        if (waState === 'qr' || waState === 'ready') return;

        // Move to restoring so the spinner shows if we're starting fresh
        setWaState(prev => ['idle', 'error'].includes(prev) ? 'restoring' : prev);

        if (!socket?.connected) {
            // Socket not ready yet — it will auto-emit start_whatsapp on connect
            return;
        }

        socket.emit('start_whatsapp', (ack) => {
            if (ack?.ready) {
                setWaState('ready');
                userOpenedModal.current = false;
                setTimeout(() => setQrModal(false), 1200);
            }
        });
    }, [waState]);

    const handleResetWA = useCallback(() => {
        const socket = socketRef.current;
        if (socket?.connected) socket.emit('reset_whatsapp');
        userOpenedModal.current = false;
        setWaState('idle');
        setQrModal(false);
        setQrCode('');
        updateUserData({ 'connectedAccounts.whatsapp': { connected: false, connectedAt: null } });
    }, [updateUserData]);

    const handleConnectTelegram = useCallback(() => {
        setTgModal(true);
    }, []);

    const handleSaveTgChatId = useCallback(() => {
        const token = tgBotToken.trim();
        const chatId = tgChatId.trim();
        if (!token) { alert('Please enter your bot token.'); return; }
        setTgSaving(true);
        // Save to Firestore for persistence
        updateUserData({
            'connectedAccounts.telegram': {
                connected: true,
                chatId,
                handle: chatId || 'Bot',
                botToken: token,
                connectedAt: new Date().toISOString(),
            }
        });
        // Start the bot on backend
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit('connect_telegram_bot', { botToken: token, chatId });
        }
        setConnections(prev => ({ ...prev, telegram: { connected: true, handle: chatId || '@bot', lastSync: 'Just now' } }));
        setTgSaving(false);
        setTgModal(false);
    }, [tgChatId, tgBotToken, updateUserData]);

    const handleConnect = useCallback((id) => {
        if (id === 'whatsapp') { handleConnectWA(); return; }
        if (id === 'telegram') { handleConnectTelegram(); return; }
        alert(`Opening OAuth flow for ${id}…`);
    }, [handleConnectWA, handleConnectTelegram]);

    const handleDisconnect = useCallback((id) => {
        if (!window.confirm(`Disconnect from ${id}?`)) return;
        if (id === 'whatsapp') { handleResetWA(); return; }
        if (id === 'telegram') {
            // Mark explicit disconnect so auto-reconnect is skipped
            tgExplicitDisconnect.current = true;
            // Clear local state immediately
            setConnections(prev => ({ ...prev, telegram: { connected: false, handle: null, lastSync: null } }));
            setTgBotToken('');
            setTgChatId('');
            // Clear from Firestore so refresh doesn't restore it
            updateUserData({
                'connectedAccounts.telegram': { connected: false, botToken: null, chatId: null, handle: null, connectedAt: null }
            });
            // Stop bot on backend
            const socket = socketRef.current;
            if (socket?.connected) socket.emit('disconnect_telegram_bot');
            return;
        }
        setConnections(prev => ({ ...prev, [id]: { connected: false, handle: null, lastSync: null } }));
    }, [handleResetWA, updateUserData]);

    const connectedCount = [
        waReady,
        connections.instagram.connected,
        connections.twitter.connected,
        connections.telegram.connected,
    ].filter(Boolean).length;

    /* ── Render ───────────────────────────────────────────── */
    return (
        <MainLayout>
            <div className={`acc ${loaded ? 'loaded' : ''}`}>

                {/* Header */}
                <div className="acc-head anim-i" style={{ '--i': 0 }}>
                    <div>
                        <h1>Accounts</h1>
                        <p>Manage your social platform connections</p>
                    </div>
                    <div className="acc-counter">
                        <span className="acc-count">{connectedCount}/{platforms.length}</span>
                        <span className="acc-count-label">Connected</span>
                    </div>
                </div>

                {/* Cards */}
                <div className="acc-grid">
                    {platforms.map((p, idx) => {
                        const isWa = p.id === 'whatsapp';
                        const conn = isWa ? null : connections[p.id];
                        const isConn = isWa ? waReady : conn.connected;

                        return (
                            <div
                                key={p.id}
                                className={`acc-card anim-i ${isConn ? 'connected' : ''}`}
                                style={{ '--i': idx + 1, '--brand': p.color }}
                            >
                                <div className="ac-top">
                                    <div className="ac-icon" style={{ color: p.color }}>{p.icon}</div>
                                    <span className={`ac-status ${isWa ? waClass : (isConn ? 'on' : 'off')}`}>
                                        <span className={`ac-status-dot ${(isWa && waBusy) ? 'checking-dot' : ''}`} />
                                        {isWa
                                            ? waLabel
                                            : userLoading ? 'Loading…' : isConn ? 'Connected' : 'Not connected'}
                                    </span>
                                </div>

                                <div className="ac-info">
                                    <h3>{p.name}</h3>
                                    {isConn && !isWa && conn.handle && <span className="ac-handle">{conn.handle}</span>}
                                </div>

                                {isConn ? (
                                    <>
                                        <div className="ac-stats">
                                            <div className="ac-stat">
                                                <span className="ac-stat-val">{isWa ? 'Just now' : conn.lastSync}</span>
                                                <span className="ac-stat-key">last sync</span>
                                            </div>
                                        </div>
                                        <div className="ac-actions">
                                            <button className="ac-btn" onClick={() => handleConnect(p.id)}>Reconnect</button>
                                            <button className="ac-btn danger" onClick={() => handleDisconnect(p.id)}>Disconnect</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ul className="ac-benefits">
                                            <li>Automated posting &amp; scheduling</li>
                                            <li>AI-powered responses</li>
                                            <li>Unified inbox</li>
                                            <li>Analytics &amp; insights</li>
                                        </ul>
                                        <button
                                            className="ac-connect"
                                            style={{ '--brand': p.color, opacity: (isWa && ['restoring', 'authenticated', 'checking'].includes(waState)) ? 0.6 : 1 }}
                                            onClick={() => handleConnect(p.id)}
                                            disabled={isWa && ['restoring', 'authenticated'].includes(waState)}
                                        >
                                            {isWa && waState === 'qr'
                                                ? '📱 Scan QR Code'
                                                : isWa && ['restoring', 'checking', 'authenticated'].includes(waState)
                                                    ? waLabel
                                                    : `Connect ${p.name}`}
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Banner */}
                {connectedCount < platforms.length && (
                    <div className="acc-banner anim-i" style={{ '--i': platforms.length + 1 }}>
                        <div className="ab-icon">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="10" cy="10" r="8" /><path d="M10 6.5v4" />
                                <circle cx="10" cy="14" r="0.5" fill="currentColor" stroke="none" />
                            </svg>
                        </div>
                        <div className="ab-text">
                            <strong>{platforms.length - connectedCount} platform{platforms.length - connectedCount > 1 ? 's' : ''}</strong> not yet connected. Link them to manage all your social media from one place.
                        </div>
                    </div>
                )}

                {/* ════ WhatsApp QR Modal ════ */}
                {qrModal && (
                    <div
                        onClick={() => !waModalLock && setQrModal(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'tgFadeIn 0.2s ease',
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '400px',
                                background: 'rgba(8,14,24,0.97)',
                                border: '1px solid rgba(37,211,102,0.2)',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                                overflow: 'hidden',
                                animation: 'tgSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
                                position: 'relative',
                            }}
                        >
                            {/* Green accent bar */}
                            <div style={{ height: '3px', background: 'linear-gradient(90deg, #25D366 0%, #1ebe5d 50%, transparent 100%)' }} />

                            {/* Close */}
                            {!waModalLock && (
                                <button
                                    onClick={() => setQrModal(false)}
                                    style={{
                                        position: 'absolute', top: '16px', right: '16px',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            )}

                            {/* Header */}
                            <div style={{ padding: '26px 28px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '38px', height: '38px', flexShrink: 0,
                                    background: 'rgba(37,211,102,0.1)',
                                    border: '1px solid rgba(37,211,102,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.8"><path d="M3 21l1.5-5.5A9 9 0 1116.5 19L3 21z" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>WhatsApp</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>Scan QR to link your account</div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 28px' }} />

                            {/* QR area */}
                            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '200px', justifyContent: 'center', gap: '10px' }}>
                                {(waState === 'restoring' || (waState === 'qr' && !qrSrc)) && (
                                    <>
                                        <div className="qr-spinner" style={{ width: '32px', height: '32px', borderTopColor: '#25D366' }} />
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>Generating QR code…</div>
                                        {waState === 'restoring' && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>10–20 s on first launch</div>}
                                    </>
                                )}
                                {waState === 'qr' && qrSrc && (
                                    <img src={qrSrc} alt="WhatsApp QR" style={{ width: '200px', height: '200px', display: 'block' }} />
                                )}
                                {waState === 'authenticated' && (
                                    <>
                                        <div className="qr-spinner" style={{ width: '32px', height: '32px', borderTopColor: '#25D366' }} />
                                        <div style={{ fontSize: '13px', color: '#25D366', fontWeight: 600 }}>QR scanned — syncing…</div>
                                    </>
                                )}
                                {waState === 'ready' && (
                                    <>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#25D366' }}>WhatsApp Connected</div>
                                    </>
                                )}
                                {waState === 'error' && (
                                    <>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        <div style={{ fontSize: '13px', color: 'rgba(239,68,68,0.9)' }}>Connection failed</div>
                                        <button
                                            onClick={handleConnectWA}
                                            style={{
                                                marginTop: '8px', padding: '8px 20px',
                                                background: 'rgba(37,211,102,0.1)',
                                                border: '1px solid rgba(37,211,102,0.3)',
                                                color: '#25D366', fontSize: '12px', fontWeight: 600,
                                                cursor: 'pointer', fontFamily: 'inherit',
                                                transition: 'background 0.15s',
                                            }}
                                        >Retry</button>
                                    </>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 28px' }} />

                            {/* Steps */}
                            <div style={{ padding: '14px 28px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[['1', 'Open WhatsApp on your phone'], ['2', 'Tap Menu → Linked Devices'], ['3', 'Tap "Link a Device" and scan']].map(([n, t]) => (
                                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '18px', height: '18px', flexShrink: 0,
                                            background: 'rgba(37,211,102,0.12)',
                                            border: '1px solid rgba(37,211,102,0.2)',
                                            fontSize: '10px', fontWeight: 700, color: '#25D366',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>{n}</span>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{t}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Reset */}
                            {!waBusy && waState !== 'ready' && (
                                <div style={{ padding: '0 28px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button
                                        onClick={handleResetWA}
                                        style={{
                                            width: '100%', padding: '9px',
                                            background: 'rgba(239,68,68,0.07)',
                                            border: '1px solid rgba(239,68,68,0.18)',
                                            color: 'rgba(239,68,68,0.7)', fontSize: '12px',
                                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                                            letterSpacing: '0.04em', transition: 'background 0.15s',
                                        }}
                                    >Reset &amp; Start Over</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════ Telegram Connect Modal ════ */}
                {tgModal && (
                    <div
                        onClick={() => setTgModal(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'tgFadeIn 0.2s ease',
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '420px',
                                background: 'rgba(8, 14, 24, 0.96)',
                                border: '1px solid rgba(0,136,204,0.25)',
                                boxShadow: '0 0 60px rgba(0,136,204,0.12), 0 24px 48px rgba(0,0,0,0.6)',
                                padding: '0',
                                overflow: 'hidden',
                                animation: 'tgSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
                                position: 'relative',
                            }}
                        >
                            {/* Top accent bar */}
                            <div style={{
                                height: '3px',
                                background: 'linear-gradient(90deg, #0088CC 0%, #00AAEE 50%, transparent 100%)',
                            }} />

                            {/* Close */}
                            <button
                                onClick={() => setTgModal(false)}
                                style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.3)', padding: '4px',
                                    display: 'flex', transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>

                            {/* Header */}
                            <div style={{ padding: '26px 28px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '38px', height: '38px',
                                    background: 'rgba(0,136,204,0.1)',
                                    border: '1px solid rgba(0,136,204,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0088CC" strokeWidth="1.8"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4L22 2z" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Telegram Bot</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>Bring your own bot from @BotFather</div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 28px' }} />

                            {/* Body */}
                            <div style={{ padding: '20px 28px 24px' }}>

                                {/* BotFather link */}
                                <a
                                    href="https://t.me/BotFather"
                                    target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 14px', marginBottom: '20px',
                                        background: 'rgba(0,136,204,0.08)',
                                        border: '1px solid rgba(0,136,204,0.2)',
                                        color: '#0099DD', fontSize: '12px', fontWeight: 600,
                                        textDecoration: 'none', letterSpacing: '0.02em',
                                        transition: 'background 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,136,204,0.15)'; e.currentTarget.style.borderColor = 'rgba(0,136,204,0.4)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,136,204,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,136,204,0.2)'; }}
                                >
                                    <span>① Open @BotFather → /newbot → copy token</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </a>

                                {/* Token input */}
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    BOT TOKEN
                                </div>
                                <input
                                    type="text"
                                    value={tgBotToken}
                                    onChange={e => setTgBotToken(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveTgChatId()}
                                    placeholder="1234567890:ABCDEFghijklmnopqrstuvwxyz"
                                    autoFocus
                                    style={{
                                        width: '100%', padding: '11px 14px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${tgBotToken.trim() ? 'rgba(0,136,204,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                        color: '#e0e0e0', fontSize: '13px',
                                        fontFamily: 'monospace', outline: 'none',
                                        boxSizing: 'border-box', marginBottom: '20px',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                        boxShadow: tgBotToken.trim() ? '0 0 0 1px rgba(0,136,204,0.15) inset' : 'none',
                                        letterSpacing: '0.01em',
                                    }}
                                />

                                {/* Connect button */}
                                <button
                                    onClick={handleSaveTgChatId}
                                    disabled={!tgBotToken.trim() || tgSaving}
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: tgBotToken.trim()
                                            ? 'linear-gradient(90deg, #0077BB 0%, #0099DD 100%)'
                                            : 'rgba(255,255,255,0.06)',
                                        border: 'none', cursor: tgBotToken.trim() ? 'pointer' : 'not-allowed',
                                        color: tgBotToken.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                                        fontSize: '13px', fontWeight: 700,
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        transition: 'all 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {tgSaving ? 'Connecting…' : 'Connect Bot'}
                                </button>
                            </div>{/* /body */}

                            {/* Keyframe animations */}
                            <style>{`
                                @keyframes tgFadeIn { from { opacity: 0 } to { opacity: 1 } }
                                @keyframes tgSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
                            `}</style>
                        </div>
                    </div>
                )}


            </div>
        </MainLayout>
    );
};

export default Accounts;
