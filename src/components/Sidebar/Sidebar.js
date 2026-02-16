import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

/* ─── Inline SVG Icons (1.5px stroke, 20×20) ─── */

const icons = {
    /* Overview — 4-square grid */
    grid: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
            <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
            <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
            <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
        </svg>
    ),
    /* Accounts — power plug */
    plug: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 3v3.5" />
            <path d="M13.5 3v3.5" />
            <path d="M4 6.5h12v3a6 6 0 01-12 0v-3z" />
            <path d="M10 15.5V17" />
        </svg>
    ),
    /* Composer — pen nib */
    quill: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2.5a2 2 0 012.83 2.83L7.17 15.5 2.5 17l1.5-4.67L14.5 2.5z" />
            <path d="M12.5 4.5l3 3" />
        </svg>
    ),
    /* Schedule — calendar */
    calendar: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="3.5" width="15" height="14" rx="2" />
            <path d="M2.5 8h15" />
            <path d="M6.5 2v3" />
            <path d="M13.5 2v3" />
            <circle cx="7" cy="12" r="0.75" fill="currentColor" stroke="none" />
            <circle cx="10" cy="12" r="0.75" fill="currentColor" stroke="none" />
            <circle cx="13" cy="12" r="0.75" fill="currentColor" stroke="none" />
        </svg>
    ),
    /* Inbox — open envelope with arrow */
    inbox: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 10h4l1.5 2.5h4L13.5 10h4" />
            <path d="M4.3 5.3L2.5 10v5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-5l-1.8-4.7a1.5 1.5 0 00-1.4-1h-8.6a1.5 1.5 0 00-1.4 1z" />
        </svg>
    ),
    /* Mentions — speech bubble with @ */
    mention: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 12.5a1.5 1.5 0 01-1.5 1.5h-8L3 17.5V5a1.5 1.5 0 011.5-1.5h10A1.5 1.5 0 0116 5v7.5z" />
            <circle cx="10" cy="9" r="2" />
            <path d="M12 7v3.2a.8.8 0 001.6 0V9" />
        </svg>
    ),
    /* Automation — workflow / nodes */
    workflow: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="4.5" cy="5" r="2" />
            <circle cx="15.5" cy="5" r="2" />
            <circle cx="10" cy="15" r="2" />
            <path d="M6.2 6.2L8.5 13" />
            <path d="M13.8 6.2l-2.3 6.8" />
        </svg>
    ),
    /* Analytics — trend line with dot */
    trend: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l4-5.5 3.5 3L17 5" />
            <path d="M14 5h3v3" />
        </svg>
    ),
    /* Settings — sliders */
    sliders: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h3m4 0h7" />
            <path d="M3 10h9m4 0h1" />
            <path d="M3 15h1m4 0h9" />
            <circle cx="8.5" cy="5" r="1.5" />
            <circle cx="14.5" cy="10" r="1.5" />
            <circle cx="6.5" cy="15" r="1.5" />
        </svg>
    ),
};

const Sidebar = () => {
    const location = useLocation();
    const [hoveredItem, setHoveredItem] = useState(null);

    const mainNav = [
        { id: 'command-center', label: 'Overview', icon: 'grid', path: '/dashboard' },
        { id: 'accounts', label: 'Accounts', icon: 'plug', path: '/accounts' },
        { id: 'composer', label: 'Composer', icon: 'quill', path: '/composer' },
        { id: 'scheduler', label: 'Schedule', icon: 'calendar', path: '/scheduler' },
    ];

    const engageNav = [
        { id: 'inbox', label: 'Inbox', icon: 'inbox', path: '/inbox' },
        { id: 'mentions', label: 'Mentions', icon: 'mention', path: '/mentions' },
        { id: 'automation', label: 'Automation', icon: 'workflow', path: '/automation' },
    ];

    const insightsNav = [
        { id: 'analytics', label: 'Analytics', icon: 'trend', path: '/analytics' },
        { id: 'settings', label: 'Settings', icon: 'sliders', path: '/settings' },
    ];

    const channels = [
        { id: 'instagram', name: 'IG', color: '#E4405F', connected: true },
        { id: 'twitter', name: 'X', color: '#1DA1F2', connected: true },
        { id: 'whatsapp', name: 'WA', color: '#25D366', connected: false },
        { id: 'telegram', name: 'TG', color: '#0088cc', connected: true },
    ];

    const renderSection = (title, items) => (
        <div className="nav-section">
            {title && <span className="nav-section-label">{title}</span>}
            {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`nav-row ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                    >
                        <span className="nav-row-icon">{icons[item.icon]}</span>
                        <span className="nav-row-text">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );

    return (
        <aside className="sidebar">
            {/* ── Workspace header ── */}
            <div className="sidebar-workspace">
                <Link to="/" className="ws-trigger">
                    <div className="ws-avatar">
                        <span>F</span>
                    </div>
                    <div className="ws-info">
                        <span className="ws-name">FlowSync</span>
                        <span className="ws-plan">Pro Plan</span>
                    </div>
                </Link>
            </div>

            {/* ── Navigation ── */}
            <nav className="sidebar-scroll">
                {renderSection(null, mainNav)}
                {renderSection('Engage', engageNav)}
                {renderSection('Insights', insightsNav)}
            </nav>

            {/* ── Channels strip ── */}
            <div className="sidebar-channels">
                <span className="channels-label">Channels</span>
                <div className="channels-row">
                    {channels.map(ch => (
                        <div
                            key={ch.id}
                            className={`ch-pill ${ch.connected ? 'on' : 'off'}`}
                            style={{ '--ch': ch.color }}
                            title={ch.name}
                        >
                            <span className="ch-letter">{ch.name}</span>
                            <span className="ch-dot" />
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
