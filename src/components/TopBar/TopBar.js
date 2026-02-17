import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const LogoutSvg = () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 17.5H4.17a1.67 1.67 0 01-1.67-1.67V4.17A1.67 1.67 0 014.17 2.5H7.5" />
        <path d="M13.33 14.17L17.5 10l-4.17-4.17" />
        <path d="M17.5 10H7.5" />
    </svg>
);

const TopBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showAvatar, setShowAvatar] = useState(false);
    const notifsRef = useRef(null);
    const avatarRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const notifications = [
        { id: 1, text: 'New mention on Instagram', time: '2m', unread: true },
        { id: 2, text: 'New DM on WhatsApp', time: '15m', unread: true },
        { id: 3, text: '5 new comments on your post', time: '1h', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const userEmail = user?.email || '';
    const initials = displayName.charAt(0).toUpperCase();

    // close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifsRef.current && !notifsRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
            if (avatarRef.current && !avatarRef.current.contains(e.target)) {
                setShowAvatar(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        setShowAvatar(false);
        await logout();
        navigate('/login');
    };

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

                    {/* Avatar with dropdown */}
                    <div className="tb-action-wrap" ref={avatarRef}>
                        <div
                            className={`tb-avatar ${showAvatar ? 'active' : ''}`}
                            onClick={() => setShowAvatar(prev => !prev)}
                        >
                            <span>{initials}</span>
                        </div>

                        {showAvatar && (
                            <div className="tb-dropdown tb-avatar-dropdown">
                                <div className="tb-dd-user">
                                    <div className="tb-dd-avatar">
                                        <span>{initials}</span>
                                    </div>
                                    <div className="tb-dd-user-info">
                                        <span className="tb-dd-name">{displayName}</span>
                                        <span className="tb-dd-email">{userEmail}</span>
                                    </div>
                                </div>
                                <div className="tb-dd-divider" />
                                <div className="tb-dd-list">
                                    <Link to="/settings" className="tb-dd-item" onClick={() => setShowAvatar(false)}>
                                        <CogSvg />
                                        <p>Settings</p>
                                    </Link>
                                </div>
                                <div className="tb-dd-divider" />
                                <button className="tb-dd-logout" onClick={handleLogout}>
                                    <LogoutSvg />
                                    <span>Sign out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
