import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
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

const connectionData = {
    instagram: { connected: false, handle: null, lastSync: null, stats: {} },
    twitter: { connected: false, handle: null, lastSync: null, stats: {} },
    whatsapp: { connected: true, handle: '+1 (555) 123-4567', lastSync: '2 min ago', stats: { conversations: 45, unread: 3 } },
    telegram: { connected: false, handle: null, lastSync: null, stats: {} },
};

const Accounts = () => {
    const [loaded, setLoaded] = useState(false);
    const [connections, setConnections] = useState(connectionData);

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const connectedCount = Object.values(connections).filter(c => c.connected).length;

    const handleConnect = (id) => {
        alert(`Opening connection flow for ${id}…`);
    };

    const handleDisconnect = (id) => {
        if (window.confirm(`Disconnect from ${id}?`)) {
            setConnections(prev => ({
                ...prev,
                [id]: { ...prev[id], connected: false, handle: null, lastSync: null, stats: {} }
            }));
        }
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

                {/* ── Cards grid ── */}
                <div className="acc-grid">
                    {platforms.map((p, idx) => {
                        const conn = connections[p.id];
                        return (
                            <div
                                key={p.id}
                                className={`acc-card anim-i ${conn.connected ? 'connected' : ''}`}
                                style={{ '--i': idx + 1, '--brand': p.color }}
                            >
                                {/* Top row */}
                                <div className="ac-top">
                                    <div className="ac-icon" style={{ color: p.color }}>
                                        {p.icon}
                                    </div>
                                    <span className={`ac-status ${conn.connected ? 'on' : 'off'}`}>
                                        <span className="ac-status-dot" />
                                        {conn.connected ? 'Connected' : 'Not connected'}
                                    </span>
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
                                        {/* Stats row */}
                                        <div className="ac-stats">
                                            {Object.entries(conn.stats).map(([key, val]) => (
                                                <div key={key} className="ac-stat">
                                                    <span className="ac-stat-val">{val}</span>
                                                    <span className="ac-stat-key">{key.replace('_', ' ')}</span>
                                                </div>
                                            ))}
                                            <div className="ac-stat">
                                                <span className="ac-stat-val">{conn.lastSync}</span>
                                                <span className="ac-stat-key">last sync</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="ac-actions">
                                            <button className="ac-btn" onClick={() => handleConnect(p.id)}>Reconnect</button>
                                            <button className="ac-btn danger" onClick={() => handleDisconnect(p.id)}>Disconnect</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Unconnected benefits */}
                                        <ul className="ac-benefits">
                                            <li>Automated posting & scheduling</li>
                                            <li>AI-powered responses</li>
                                            <li>Unified inbox</li>
                                            <li>Analytics & insights</li>
                                        </ul>

                                        <button
                                            className="ac-connect"
                                            style={{ '--brand': p.color }}
                                            onClick={() => handleConnect(p.id)}
                                        >
                                            Connect {p.name}
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
            </div>
        </MainLayout>
    );
};

export default Accounts;
