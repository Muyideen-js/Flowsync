import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './TopBar.css';

/* ── Inline TopBar icons ── */
const SearchSvg = () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="9" cy="9" r="6.5" />
        <path d="M14 14l4 4" />
    </svg>
);

const BellSvg = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 7a5 5 0 00-10 0c0 5.5-2.5 7-2.5 7h15S15 12.5 15 7z" />
        <path d="M11.5 17a1.8 1.8 0 01-3 0" />
    </svg>
);

const CogSvg = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 5h3m4 0h7M3 10h9m4 0h1M3 15h1m4 0h9" />
        <circle cx="8.5" cy="5" r="1.5" />
        <circle cx="14.5" cy="10" r="1.5" />
        <circle cx="6.5" cy="15" r="1.5" />
    </svg>
);

const TopBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifsRef = useRef(null);
    const { user } = useAuth();

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const initials = displayName.charAt(0).toUpperCase();

    const notifications = [
        { id: 1, text: 'New mention on Instagram', time: '2m', unread: true },
        { id: 2, text: 'New DM on WhatsApp', time: '15m', unread: true },
        { id: 3, text: '5 new comments on your post', time: '1h', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifsRef.current && !notifsRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <header className="topbar">
            {/* ── Left: page title ── */}
            <div className="tb-left">
                <h1 className="tb-title">Overview</h1>
            </div>

            {/* ── Right: search + actions ── */}
            <div className="tb-right">
                <div className={`tb-search ${searchFocused ? 'focused' : ''}`}>
                    <SearchSvg />
                    <input
                        type="text"
                        placeholder="Search…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                    <kbd className="tb-kbd">⌘K</kbd>
                </div>

                <div className="tb-actions">
                    {/* Notifications */}
                    <div className="tb-action-wrap" ref={notifsRef}>
                        <button
                            className={`tb-icon-btn ${showNotifs ? 'open' : ''}`}
                            onClick={() => setShowNotifs(prev => !prev)}
                            aria-label="Notifications"
                        >
                            <BellSvg />
                            {unreadCount > 0 && <span className="tb-badge">{unreadCount}</span>}
                        </button>

                        {showNotifs && (
                            <div className="tb-dropdown">
                                <div className="tb-dd-head">
                                    <span>Notifications</span>
                                    <button className="tb-dd-link">Mark all read</button>
                                </div>
                                <div className="tb-dd-list">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`tb-dd-item ${n.unread ? 'unread' : ''}`}>
                                            <p>{n.text}</p>
                                            <span className="tb-dd-time">{n.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <Link to="/settings" className="tb-icon-btn" aria-label="Settings">
                        <CogSvg />
                    </Link>

                    {/* Avatar (display only, no dropdown) */}
                    <div className="tb-avatar">
                        <span>{initials}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
