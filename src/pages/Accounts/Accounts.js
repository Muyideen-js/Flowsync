import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import twitterService from '../../services/twitterService';
import './Accounts.css';

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

const Accounts = () => {
    const { user, userData, updateUserData, loading: userLoading } = useAuth();
    const { socket: sharedSocket, connected: socketConnected, connectionStates, requestStateSync } = useSocket() || {};

    const [loaded, setLoaded] = useState(false);

    // Modal states
    const [tgModal, setTgModal] = useState(false);
    const [tgBotToken, setTgBotToken] = useState('');
    const [tgSaving, setTgSaving] = useState(false);

    const [waModal, setWaModal] = useState(false);
    const [waAccessToken, setWaAccessToken] = useState('');
    const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
    const [waWabaId, setWaWabaId] = useState('');
    const [waSaving, setWaSaving] = useState(false);

    const socketRef = useRef(null);

    // Load saved token from Firestore userData
    useEffect(() => {
        if (userData?.connectedAccounts?.telegram?.botToken) {
            setTgBotToken(userData.connectedAccounts.telegram.botToken);
        }
    }, [userData]);

    /* ── Load page ──────────────────────────────────────── */
    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    /* ── Re-sync connection state on mount / navigation ── */
    useEffect(() => {
        if (sharedSocket && socketConnected) {
            socketRef.current = sharedSocket;
            requestStateSync();
        }
    }, [sharedSocket, socketConnected, requestStateSync]);

    /* ── Listen for tg/wa events for modal feedback ── */
    useEffect(() => {
        if (!sharedSocket) return;

        const onTgConnected = (data) => {
            setTgSaving(false);
            setTgModal(false);
        };
        const onTgError = ({ error }) => {
            setTgSaving(false);
            const msg = error?.includes('404') || error?.includes('401')
                ? 'Invalid bot token. Copy the token exactly from @BotFather and try again.'
                : `Telegram error: ${error}`;
            alert(msg);
        };
        const onWaError = ({ error }) => {
            setWaSaving(false);
            alert(`WhatsApp error: ${error}`);
        };

        sharedSocket.on('tg_connected', onTgConnected);
        sharedSocket.on('tg_error', onTgError);
        sharedSocket.on('wa_error', onWaError);

        return () => {
            sharedSocket.off('tg_connected', onTgConnected);
            sharedSocket.off('tg_error', onTgError);
            sharedSocket.off('wa_error', onWaError);
        };
    }, [sharedSocket]);

    /* ── Derived state from connectionStates (from backend via SocketContext) ── */
    const isLoading = connectionStates === null; // Still waiting for backend
    const getConnected = (platformId) => {
        if (!connectionStates) return null; // loading
        return connectionStates[platformId]?.connected || false;
    };
    const getHandle = (platformId) => {
        if (!connectionStates) return null;
        const s = connectionStates[platformId];
        if (!s?.connected) return null;
        if (platformId === 'telegram') return s.username ? `@${s.username}` : 'Bot connected';
        if (platformId === 'twitter') return s.username ? `@${s.username}` : 'Connected';
        if (platformId === 'whatsapp') return s.displayPhone || 'Connected';
        return 'Connected';
    };

    /* ── Handlers ─────────────────────────────────────────── */
    const handleConnectWA = useCallback(() => {
        setWaModal(true);
    }, []);

    const handleSaveWA = useCallback(async () => {
        if (!waAccessToken.trim() || !waPhoneNumberId.trim()) {
            alert('Please enter your Access Token and Phone Number ID.');
            return;
        }
        setWaSaving(true);
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit('connect_whatsapp', {
                accessToken: waAccessToken.trim(),
                phoneNumberId: waPhoneNumberId.trim(),
                wabaId: waWabaId.trim() || null,
            });
        }
        // The connection_states event from backend will update connectionStates
        // Close modal after a brief delay for UX
        setTimeout(() => {
            setWaSaving(false);
            setWaModal(false);
        }, 2000);
    }, [waAccessToken, waPhoneNumberId, waWabaId]);

    const handleConnectTelegram = useCallback(() => {
        setTgModal(true);
    }, []);

    const handleSaveTelegram = useCallback(() => {
        const token = tgBotToken.trim();
        if (!token) { alert('Please enter your bot token.'); return; }
        setTgSaving(true);
        // Save to Firestore for persistence
        updateUserData({
            'connectedAccounts.telegram': {
                connected: true,
                botToken: token,
                connectedAt: new Date().toISOString(),
            }
        });
        // Start the bot on backend
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit('connect_telegram_bot', { botToken: token });
        }
    }, [tgBotToken, updateUserData]);

    const handleConnectTwitter = useCallback(async () => {
        if (!user) { alert('Please log in first.'); return; }
        try {
            const token = await user.getIdToken();
            const res = await twitterService.getAuthUrl(token);
            if (res.success && res.authUrl) {
                const popup = window.open(res.authUrl, 'twitter_oauth', 'width=600,height=700,scrollbars=yes');
                const checkPopup = setInterval(() => {
                    if (!popup || popup.closed) {
                        clearInterval(checkPopup);
                        // Backend will emit connection_states via socket after OAuth
                        requestStateSync();
                    }
                }, 1000);
            } else {
                alert('Could not get Twitter auth URL. Check your backend.');
            }
        } catch (err) {
            console.error('Twitter OAuth error:', err);
            alert('Failed to connect Twitter. Make sure your backend is running.');
        }
    }, [user, requestStateSync]);

    const handleConnect = useCallback((id) => {
        if (id === 'whatsapp') { handleConnectWA(); return; }
        if (id === 'telegram') { handleConnectTelegram(); return; }
        if (id === 'twitter') { handleConnectTwitter(); return; }
        alert(`${id} OAuth not yet implemented.`);
    }, [handleConnectWA, handleConnectTelegram, handleConnectTwitter]);

    const handleDisconnect = useCallback(async (id) => {
        if (!window.confirm(`Disconnect from ${id}?`)) return;
        const socket = socketRef.current;
        if (id === 'whatsapp') {
            if (socket?.connected) socket.emit('disconnect_whatsapp');
            updateUserData({ 'connectedAccounts.whatsapp': { connected: false, connectedAt: null } });
            return;
        }
        if (id === 'telegram') {
            setTgBotToken('');
            updateUserData({
                'connectedAccounts.telegram': { connected: false, botToken: null, connectedAt: null }
            });
            if (socket?.connected) socket.emit('disconnect_telegram_bot');
            return;
        }
        if (id === 'twitter') {
            const token = await user.getIdToken();
            await twitterService.disconnect(token);
            updateUserData({ 'connectedAccounts.twitter': { connected: false, connectedAt: null } });
            return;
        }
    }, [updateUserData, user]);

    const connectedCount = platforms.filter(p => getConnected(p.id)).length;

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
                        const connected = getConnected(p.id);
                        const handle = getHandle(p.id);
                        const isPlatformLoading = connected === null;

                        return (
                            <div
                                key={p.id}
                                className={`acc-card anim-i ${connected ? 'connected' : ''}`}
                                style={{ '--i': idx + 1, '--brand': p.color }}
                            >
                                <div className="ac-top">
                                    <div className="ac-icon" style={{ color: p.color }}>{p.icon}</div>
                                    <span className={`ac-status ${isPlatformLoading ? 'checking' : connected ? 'on' : 'off'}`}>
                                        <span className={`ac-status-dot ${isPlatformLoading ? 'checking-dot' : ''}`} />
                                        {isPlatformLoading
                                            ? 'Checking…'
                                            : userLoading
                                                ? 'Loading…'
                                                : connected
                                                    ? 'Connected'
                                                    : 'Not connected'}
                                    </span>
                                </div>

                                <div className="ac-info">
                                    <h3>{p.name}</h3>
                                    {connected && handle && <span className="ac-handle">{handle}</span>}
                                </div>

                                {connected ? (
                                    <>
                                        <div className="ac-stats">
                                            <div className="ac-stat">
                                                <span className="ac-stat-val">Synced</span>
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
                                            style={{ '--brand': p.color, opacity: isPlatformLoading ? 0.6 : 1 }}
                                            onClick={() => handleConnect(p.id)}
                                            disabled={isPlatformLoading}
                                        >
                                            {isPlatformLoading ? 'Checking…' : `Connect ${p.name}`}
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

                {/* ════ WhatsApp Cloud API Modal ════ */}
                {waModal && (
                    <div
                        onClick={() => setWaModal(false)}
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
                                background: 'rgba(8,14,24,0.97)',
                                border: '1px solid rgba(37,211,102,0.2)',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                                overflow: 'hidden',
                                animation: 'tgSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
                                position: 'relative',
                            }}
                        >
                            {/* Green accent bar */}
                            <div style={{ height: '3px', background: '#25D366' }} />

                            {/* Close */}
                            <button
                                onClick={() => setWaModal(false)}
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
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>WhatsApp Cloud API</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>Enter your Meta Cloud API credentials</div>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 28px' }} />

                            {/* Body */}
                            <div style={{ padding: '20px 28px 24px' }}>
                                <a
                                    href="https://developers.facebook.com/apps/"
                                    target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 14px', marginBottom: '20px',
                                        background: 'rgba(37,211,102,0.08)',
                                        border: '1px solid rgba(37,211,102,0.2)',
                                        color: '#25D366', fontSize: '12px', fontWeight: 600,
                                        textDecoration: 'none', letterSpacing: '0.02em',
                                    }}
                                >
                                    <span>Get credentials from Meta Developer Portal</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </a>

                                {/* Access Token */}
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    ACCESS TOKEN
                                </div>
                                <input
                                    type="text"
                                    value={waAccessToken}
                                    onChange={e => setWaAccessToken(e.target.value)}
                                    placeholder="EAAxxxxxxx..."
                                    autoFocus
                                    style={{
                                        width: '100%', padding: '11px 14px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${waAccessToken.trim() ? 'rgba(37,211,102,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                        color: '#e0e0e0', fontSize: '13px',
                                        fontFamily: 'monospace', outline: 'none',
                                        boxSizing: 'border-box', marginBottom: '16px',
                                    }}
                                />

                                {/* Phone Number ID */}
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    PHONE NUMBER ID
                                </div>
                                <input
                                    type="text"
                                    value={waPhoneNumberId}
                                    onChange={e => setWaPhoneNumberId(e.target.value)}
                                    placeholder="1027459597111064"
                                    style={{
                                        width: '100%', padding: '11px 14px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${waPhoneNumberId.trim() ? 'rgba(37,211,102,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                        color: '#e0e0e0', fontSize: '13px',
                                        fontFamily: 'monospace', outline: 'none',
                                        boxSizing: 'border-box', marginBottom: '16px',
                                    }}
                                />

                                {/* WABA ID (optional) */}
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    WABA ID <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
                                </div>
                                <input
                                    type="text"
                                    value={waWabaId}
                                    onChange={e => setWaWabaId(e.target.value)}
                                    placeholder="1588002115757208"
                                    style={{
                                        width: '100%', padding: '11px 14px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid rgba(255,255,255,0.1)`,
                                        color: '#e0e0e0', fontSize: '13px',
                                        fontFamily: 'monospace', outline: 'none',
                                        boxSizing: 'border-box', marginBottom: '20px',
                                    }}
                                />

                                {/* Connect button */}
                                <button
                                    onClick={handleSaveWA}
                                    disabled={!waAccessToken.trim() || !waPhoneNumberId.trim() || waSaving}
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: (waAccessToken.trim() && waPhoneNumberId.trim())
                                            ? '#25D366' : 'rgba(255,255,255,0.06)',
                                        border: 'none',
                                        cursor: (waAccessToken.trim() && waPhoneNumberId.trim()) ? 'pointer' : 'not-allowed',
                                        color: (waAccessToken.trim() && waPhoneNumberId.trim()) ? '#fff' : 'rgba(255,255,255,0.25)',
                                        fontSize: '13px', fontWeight: 700,
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {waSaving ? 'Connecting…' : 'Connect WhatsApp'}
                                </button>
                            </div>
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
                            <div style={{ height: '3px', background: '#0088CC' }} />

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

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 28px' }} />

                            {/* Body */}
                            <div style={{ padding: '20px 28px 24px' }}>
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
                                    }}
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
                                    onKeyDown={e => e.key === 'Enter' && handleSaveTelegram()}
                                    placeholder="1234567890:ABCDEFghijklmnopqrstuvwxyz"
                                    autoFocus
                                    style={{
                                        width: '100%', padding: '11px 14px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${tgBotToken.trim() ? 'rgba(0,136,204,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                        color: '#e0e0e0', fontSize: '13px',
                                        fontFamily: 'monospace', outline: 'none',
                                        boxSizing: 'border-box', marginBottom: '20px',
                                    }}
                                />

                                {/* Connect button */}
                                <button
                                    onClick={handleSaveTelegram}
                                    disabled={!tgBotToken.trim() || tgSaving}
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: tgBotToken.trim() ? '#0088CC' : 'rgba(255,255,255,0.06)',
                                        border: 'none',
                                        cursor: tgBotToken.trim() ? 'pointer' : 'not-allowed',
                                        color: tgBotToken.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                                        fontSize: '13px', fontWeight: 700,
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {tgSaving ? 'Connecting…' : 'Connect Bot'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Keyframe animations */}
                <style>{`
                    @keyframes tgFadeIn { from { opacity: 0 } to { opacity: 1 } }
                    @keyframes tgSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
                `}</style>

            </div>
        </MainLayout>
    );
};

export default Accounts;
