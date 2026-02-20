import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import './Accounts.css';

/* ── Platform brand config ── */
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
        connectType: 'qr',
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

const initialConnectionData = {
    instagram: { connected: false, handle: null, lastSync: null, stats: {} },
    twitter: { connected: false, handle: null, lastSync: null, stats: {} },
    whatsapp: { connected: false, handle: null, lastSync: null, stats: {} },
    telegram: { connected: false, handle: null, lastSync: null, stats: {} },
};

const Accounts = () => {
    const { userData, updateUserData } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [connections, setConnections] = useState(initialConnectionData);
    const [qrModal, setQrModal] = useState(null);
    const [qrCode, setQrCode] = useState('');
    // 'idle' | 'starting' | 'scanning' | 'authenticating' | 'error'
    const [qrStatus, setQrStatus] = useState('idle');
    // Only the WhatsApp card shows a "Checking…" chip while we verify it
    const [waChecking, setWaChecking] = useState(false);

    const socketRef = useRef(null);
    const qrTimeoutRef = useRef(null);

    // ── Load Firestore state on mount ──────────────────────────────────────
    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));

        if (userData?.connectedAccounts) {
            const ca = userData.connectedAccounts;
            setConnections(prev => ({
                ...prev,
                whatsapp: ca.whatsapp?.connected
                    ? { connected: true, handle: 'WhatsApp Business', lastSync: 'Synced', stats: {} }
                    : prev.whatsapp,
                twitter: ca.twitter?.connected
                    ? { connected: true, handle: '@connected', lastSync: 'Synced', stats: {} }
                    : prev.twitter,
                instagram: ca.instagram?.connected
                    ? { connected: true, handle: '@connected', lastSync: 'Synced', stats: {} }
                    : prev.instagram,
                telegram: ca.telegram?.connected
                    ? { connected: true, handle: '@connected', lastSync: 'Synced', stats: {} }
                    : prev.telegram,
            }));
        }
    }, [userData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeout(qrTimeoutRef.current);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // ── Mark connected ─────────────────────────────────────────────────────
    const markWhatsAppConnected = useCallback(() => {
        setConnections(prev => ({
            ...prev,
            whatsapp: {
                connected: true,
                handle: 'WhatsApp Business',
                lastSync: 'Just now',
                stats: { conversations: 0, unread: 0 }
            }
        }));
        updateUserData({
            'connectedAccounts.whatsapp': {
                connected: true,
                connectedAt: new Date().toISOString()
            }
        });
    }, [updateUserData]);

    // ── Lazy socket: create only when needed, reuse if already open ────────
    const ensureSocket = useCallback(() => {
        if (socketRef.current?.connected) return socketRef.current;

        // Disconnect stale socket if exists
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socket = io('http://localhost:5000', {
            transports: ['websocket'],    // skip polling upgrade → faster
            reconnectionAttempts: 5,
            timeout: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Accounts] Socket connected');
        });

        socket.on('connect_error', (err) => {
            console.error('[Accounts] Socket error:', err.message);
            setWaChecking(false);
            setQrStatus('error');
            setQrCode('error');
        });

        // QR code received from backend — only update if value actually changed
        socket.on('qr_code', (qr) => {
            console.log('[Accounts] QR received');
            setQrCode(prev => (prev === qr ? prev : qr));
            setQrStatus('scanning');
            clearTimeout(qrTimeoutRef.current);
        });

        socket.on('whatsapp_status', (status) => {
            console.log('[Accounts] WA status:', status);
            setWaChecking(false);
            if (status.ready) {
                markWhatsAppConnected();
                setQrModal(null);
                setQrCode('');
            }
        });

        socket.on('whatsapp_authenticated', () => {
            console.log('[Accounts] WA authenticated');
            setQrStatus('authenticating');
            markWhatsAppConnected();
            setTimeout(() => {
                setQrModal(null);
                setQrCode('');
            }, 800);
        });

        socket.on('whatsapp_ready', () => {
            console.log('[Accounts] WA ready');
            setWaChecking(false);
            markWhatsAppConnected();
            setQrModal(null);
            setQrCode('');
        });

        socket.on('whatsapp_auth_failure', () => {
            setQrCode('error');
            setQrStatus('error');
        });

        socket.on('whatsapp_disconnected', () => {
            setConnections(prev => ({
                ...prev,
                whatsapp: { connected: false, handle: null, lastSync: null, stats: {} }
            }));
            updateUserData({
                'connectedAccounts.whatsapp': { connected: false, connectedAt: null }
            });
        });

        return socket;
    }, [markWhatsAppConnected, updateUserData]);

    // ── Connect handler ────────────────────────────────────────────────────
    const handleConnect = useCallback((id) => {
        const platform = platforms.find(p => p.id === id);

        if (platform?.connectType === 'qr') {
            // Open modal immediately (instant UX)
            setQrModal(id);
            setQrCode('');
            setQrStatus('starting');

            // Now lazily connect the socket (in parallel with modal opening)
            const socket = ensureSocket();

            /* Check if already ready first — backend emits whatsapp_status */
            if (socket.connected) {
                socket.emit('get_whatsapp_status');
                socket.emit('start_whatsapp');
            } else {
                // Will fire once connected
                socket.once('connect', () => {
                    socket.emit('get_whatsapp_status');
                    socket.emit('start_whatsapp');
                });
            }

            // QR timeout: if no QR arrives in 12 s, show retry
            clearTimeout(qrTimeoutRef.current);
            qrTimeoutRef.current = setTimeout(() => {
                setQrCode(prev => (prev ? prev : 'timeout'));
            }, 12000);
            return;
        }

        // Non-QR OAuth placeholder
        alert(`Opening OAuth flow for ${platform?.name}…`);
    }, [ensureSocket]);

    // ── Retry QR ──────────────────────────────────────────────────────────
    const handleRetryQr = useCallback(() => {
        setQrCode('');
        setQrStatus('starting');
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit('start_whatsapp');
        }
        clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = setTimeout(() => {
            setQrCode(prev => (prev ? prev : 'timeout'));
        }, 12000);
    }, []);

    const handleCloseQr = useCallback(() => {
        setQrModal(null);
        setQrCode('');
        setQrStatus('idle');
        clearTimeout(qrTimeoutRef.current);
    }, []);

    const handleDisconnect = useCallback((id) => {
        if (window.confirm(`Disconnect from ${id}?`)) {
            setConnections(prev => ({
                ...prev,
                [id]: { ...prev[id], connected: false, handle: null, lastSync: null, stats: {} }
            }));
        }
    }, []);

    const connectedCount = Object.values(connections).filter(c => c.connected).length;

    // ── QR modal content ───────────────────────────────────────────────────
    const renderQrContent = () => {
        if (qrStatus === 'authenticating') {
            return (
                <div className="qr-loading" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                    <span style={{ color: '#25D366', fontWeight: '600', fontSize: '14px' }}>Connected successfully!</span>
                </div>
            );
        }
        if (qrCode === 'error') {
            return (
                <div className="qr-error" style={{ textAlign: 'center', padding: '20px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p style={{ color: '#000', margin: '10px 0 4px', fontSize: '13px', fontWeight: '600' }}>Connection Failed</p>
                    <p style={{ color: '#666', margin: 0, fontSize: '11px' }}>Backend not reachable</p>
                    <button
                        onClick={handleRetryQr}
                        style={{ marginTop: '12px', padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >Retry</button>
                </div>
            );
        }
        if (qrCode === 'timeout') {
            return (
                <div className="qr-loading" style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ color: '#555', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>Still starting WhatsApp…</p>
                    <p style={{ color: '#888', fontSize: '11px', margin: '0 0 12px' }}>This can take a few seconds on first run.</p>
                    <button
                        onClick={handleRetryQr}
                        style={{ padding: '6px 14px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >Try again</button>
                </div>
            );
        }
        if (qrCode) {
            return <QRCodeSVG value={qrCode} size={180} />;
        }
        // Spinner — starting / loading
        return (
            <div className="qr-loading">
                <div className="spinner"></div>
                <span style={{ color: '#000', marginTop: '10px', fontSize: '12px' }}>
                    {qrStatus === 'starting' ? 'Starting WhatsApp…' : 'Generating QR…'}
                </span>
            </div>
        );
    };

    return (
        <MainLayout>
            <div className={`acc ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
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

                {/* ── Cards grid — always rendered, no skeleton gating ── */}
                <div className="acc-grid">
                    {platforms.map((p, idx) => {
                        const conn = connections[p.id];
                        const isWaChecking = p.id === 'whatsapp' && waChecking;
                        return (
                            <div
                                key={p.id}
                                className={`acc-card anim-i ${conn.connected ? 'connected' : ''}`}
                                style={{ '--i': idx + 1, '--brand': p.color }}
                            >
                                {/* Top row */}
                                <div className="ac-top">
                                    <div className="ac-icon" style={{ color: p.color }}>{p.icon}</div>
                                    {isWaChecking ? (
                                        <span className="ac-status checking">
                                            <span className="ac-status-dot checking-dot" />
                                            Checking…
                                        </span>
                                    ) : (
                                        <span className={`ac-status ${conn.connected ? 'on' : 'off'}`}>
                                            <span className="ac-status-dot" />
                                            {conn.connected ? 'Connected' : 'Not connected'}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="ac-info">
                                    <h3>{p.name}</h3>
                                    {conn.connected && conn.handle && (
                                        <span className="ac-handle">{conn.handle}</span>
                                    )}
                                </div>

                                {/* Connected state */}
                                {conn.connected ? (
                                    <>
                                        <div className="ac-stats">
                                            <div className="ac-stat">
                                                <span className="ac-stat-val">{conn.lastSync}</span>
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
                                            style={{ '--brand': p.color }}
                                            onClick={() => handleConnect(p.id)}
                                        >
                                            {p.connectType === 'qr' ? `Scan QR to connect ${p.name}` : `Connect ${p.name}`}
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Info banner ── */}
                {connectedCount < platforms.length && (
                    <div className="acc-banner anim-i" style={{ '--i': platforms.length + 1 }}>
                        <div className="ab-icon">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="10" cy="10" r="8" />
                                <path d="M10 6.5v4" />
                                <circle cx="10" cy="14" r="0.5" fill="currentColor" stroke="none" />
                            </svg>
                        </div>
                        <div className="ab-text">
                            <strong>{platforms.length - connectedCount} platform{platforms.length - connectedCount > 1 ? 's' : ''}</strong> not yet connected. Link them to manage all your social media from one place.
                        </div>
                    </div>
                )}

                {/* ═══ QR Code Modal ═══ */}
                {qrModal && (
                    <div className="qr-overlay" onClick={handleCloseQr}>
                        <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="qr-close" onClick={handleCloseQr}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="qr-header">
                                <div className="qr-icon-wrap" style={{ '--brand': '#25D366' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 21l1.5-5.5A9 9 0 1116.5 19L3 21z" />
                                        <path d="M9 10a1.5 1.5 0 011.5 1.5A3 3 0 0013.5 14h1A1.5 1.5 0 0116 12.5" />
                                    </svg>
                                </div>
                                <h2>Connect WhatsApp</h2>
                                <p>
                                    {qrStatus === 'authenticating'
                                        ? '✅ Authenticated! Connecting...'
                                        : qrStatus === 'starting'
                                            ? 'Starting WhatsApp session on the server…'
                                            : 'Scan this QR code with your WhatsApp mobile app to link your account.'}
                                </p>
                            </div>

                            <div className="qr-code-area">
                                <div className="qr-code" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                    {renderQrContent()}
                                    <div className="qr-scan-line" />
                                </div>
                            </div>

                            <div className="qr-steps">
                                <div className="qr-step">
                                    <span className="qr-step-num">1</span>
                                    <span>Open WhatsApp on your phone</span>
                                </div>
                                <div className="qr-step">
                                    <span className="qr-step-num">2</span>
                                    <span>Go to <strong>Settings → Linked Devices</strong></span>
                                </div>
                                <div className="qr-step">
                                    <span className="qr-step-num">3</span>
                                    <span>Tap <strong>Link a Device</strong> and scan this code</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Accounts;
