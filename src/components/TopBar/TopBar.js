import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './TopBar.css';

/* ── Page title map ── */
const PAGE_TITLES = {
    '/dashboard': 'Overview',
    '/accounts': 'Accounts',
    '/composer': 'Composer',
    '/scheduler': 'Scheduler',
    '/inbox': 'Inbox',
    '/mentions': 'Mentions',
    '/automation': 'Automation',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
    '/logs': 'Logs',
};

/* ── Icons ── */
const SearchSvg = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="9" cy="9" r="6.5" /><path d="M14 14l4 4" />
    </svg>
);
const BellSvg = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 7a5 5 0 00-10 0c0 5.5-2.5 7-2.5 7h15S15 12.5 15 7z" />
        <path d="M11.5 17a1.8 1.8 0 01-3 0" />
    </svg>
);
const CogSvg = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 5h3m4 0h7M3 10h9m4 0h1M3 15h1m4 0h9" />
        <circle cx="8.5" cy="5" r="1.5" /><circle cx="14.5" cy="10" r="1.5" /><circle cx="6.5" cy="15" r="1.5" />
    </svg>
);
const CheckSvg = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2.5 8.5l3.5 3.5 7.5-8" />
    </svg>
);
const WaSvg = () => (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10.5A7 7 0 1 1 10 3.5a7 7 0 0 1 7 7z" />
        <path d="M13 13s-1.5 1-3 1c-1.2 0-2.5-.7-3.3-1.5S5.5 10 5.5 8.5c0-1 .8-2 1.5-2 .3 0 .5.2.7.5l1 2-.8.8s.3.7.8 1.3.9.8.9.8l.8-.8 2 1c.3.2.5.4.5.7 0 .7-.7 1.2-1 1.7z" />
    </svg>
);
const TgSvg = () => (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 3.5L2.5 9l5.5 2 2 5.5 3-4 4.5 3.5-3-12z" />
        <path d="M7.5 11l4-3" />
    </svg>
);
const IgSvg = () => (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="14" height="14" rx="4" />
        <circle cx="10" cy="10" r="3.5" />
        <circle cx="14.5" cy="5.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
);
const SystemSvg = () => (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" /><path d="M10 6v4l2.5 2.5" />
    </svg>
);

/* ── Notification icon helper ── */
const NotifIcon = ({ type }) => {
    if (type === 'whatsapp') return <WaSvg />;
    if (type === 'telegram') return <TgSvg />;
    if (type === 'instagram') return <IgSvg />;
    return <SystemSvg />;
};

/* ── Time formatter ── */
const formatTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const TopBar = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notifsRef = useRef(null);
    const socketRef = useRef(null);
    const [, forceUpdate] = useState(0);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const initials = displayName.charAt(0).toUpperCase();
    const pageTitle = PAGE_TITLES[location.pathname] || 'FlowSync';
    const unreadCount = notifications.filter(n => !n.read).length;

    /* ── Add notification helper ── */
    const addNotif = useCallback((notif) => {
        setNotifications(prev => {
            const newList = [{ id: Date.now() + Math.random(), read: false, ts: Date.now(), ...notif }, ...prev];
            return newList.slice(0, 30); // keep latest 30
        });
    }, []);

    /* ── Listen for notifications on the shared socket ── */
    const { socket: sharedSocket } = useSocket() || {};
    useEffect(() => {
        if (!sharedSocket) return;

        const onWaMessage = ({ from, body }) => {
            addNotif({ type: 'whatsapp', text: `New WA message from ${from?.split('@')[0] || 'contact'}`, sub: body?.slice(0, 60) || '' });
        };
        const onWaState = ({ state }) => {
            if (state === 'ready') addNotif({ type: 'whatsapp', text: 'WhatsApp connected successfully' });
            else if (state === 'idle') addNotif({ type: 'system', text: 'WhatsApp disconnected' });
        };
        const onTgMessage = ({ from, text }) => {
            addNotif({ type: 'telegram', text: `Telegram message from ${from || 'contact'}`, sub: text?.slice(0, 60) || '' });
        };
        const onTgState = ({ state }) => {
            if (state === 'ready') addNotif({ type: 'telegram', text: 'Telegram bot connected' });
        };
        const onAutoTrigger = ({ name }) => {
            addNotif({ type: 'system', text: `Automation "${name}" triggered` });
        };
        const onPostPub = ({ platform, type }) => {
            addNotif({ type: platform || 'system', text: `${type || 'Post'} published to ${platform}` });
        };

        sharedSocket.on('wa_message', onWaMessage);
        sharedSocket.on('wa_state', onWaState);
        sharedSocket.on('tg_message', onTgMessage);
        sharedSocket.on('tg_state', onTgState);
        sharedSocket.on('automation_triggered', onAutoTrigger);
        sharedSocket.on('post_published', onPostPub);

        return () => {
            sharedSocket.off('wa_message', onWaMessage);
            sharedSocket.off('wa_state', onWaState);
            sharedSocket.off('tg_message', onTgMessage);
            sharedSocket.off('tg_state', onTgState);
            sharedSocket.off('automation_triggered', onAutoTrigger);
            sharedSocket.off('post_published', onPostPub);
        };
    }, [sharedSocket, addNotif]);

    /* ── Tick timestamps every 30s ── */
    useEffect(() => {
        const t = setInterval(() => forceUpdate(n => n + 1), 30000);
        return () => clearInterval(t);
    }, []);

    /* ── Close dropdown on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (notifsRef.current && !notifsRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => setNotifications([]);

    return (
        <header className="topbar">
            {/* ── Left: page title ── */}
            <div className="tb-left">
                <h1 className="tb-title">{pageTitle}</h1>
            </div>

            {/* ── Right: search + actions ── */}
            <div className="tb-right">
                <div className={`tb-search ${searchFocused ? 'focused' : ''}`}>
                    <SearchSvg />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                    <kbd className="tb-kbd">Ctrl K</kbd>
                </div>

                <div className="tb-actions">
                    {/* ── Notifications ── */}
                    <div className="tb-action-wrap" ref={notifsRef}>
                        <button
                            className={`tb-icon-btn ${showNotifs ? 'open' : ''}`}
                            onClick={() => setShowNotifs(prev => !prev)}
                            aria-label="Notifications"
                        >
                            <BellSvg />
                            {unreadCount > 0 && <span className="tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                        </button>

                        {showNotifs && (
                            <div className="tb-dropdown">
                                <div className="tb-dd-head">
                                    <span>Notifications</span>
                                    <div className="tb-dd-head-actions">
                                        {unreadCount > 0 && (
                                            <button className="tb-dd-link" onClick={markAllRead}>Mark all read</button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button className="tb-dd-link tb-dd-clear" onClick={clearAll}>Clear</button>
                                        )}
                                    </div>
                                </div>
                                <div className="tb-dd-list">
                                    {notifications.length === 0 ? (
                                        <div className="tb-dd-empty">
                                            <BellSvg />
                                            <span>No notifications yet</span>
                                            <span className="tb-dd-empty-sub">Events from WhatsApp, Telegram and automations will appear here</span>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`tb-dd-item ${!n.read ? 'unread' : ''}`}
                                                onClick={() => markRead(n.id)}
                                            >
                                                <div className={`tb-dd-icon tb-dd-icon-${n.type || 'system'}`}>
                                                    <NotifIcon type={n.type} />
                                                </div>
                                                <div className="tb-dd-body">
                                                    <p>{n.text}</p>
                                                    {n.sub && <span className="tb-dd-sub">{n.sub}</span>}
                                                    <span className="tb-dd-time">{formatTime(n.ts)}</span>
                                                </div>
                                                {!n.read && (
                                                    <button className="tb-dd-check" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>
                                                        <CheckSvg />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Settings ── */}
                    <Link to="/settings" className="tb-icon-btn" aria-label="Settings">
                        <CogSvg />
                    </Link>

                    {/* ── Avatar ── */}
                    <div className="tb-avatar">
                        <span>{initials}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
