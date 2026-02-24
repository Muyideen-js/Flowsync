import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoKey, GoPencil } from 'react-icons/go';
import { PiPlugsConnectedLight } from 'react-icons/pi';
import { CiInboxIn, CiCalendar, CiSettings } from 'react-icons/ci';
import { TfiStatsUp } from 'react-icons/tfi';
import './Sidebar.css';

/* ── SVG icons kept only for items react-icons doesn't cover ── */
const GridIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="2.5" width="6" height="6" /><rect x="11.5" y="2.5" width="6" height="6" />
        <rect x="2.5" y="11.5" width="6" height="6" /><rect x="11.5" y="11.5" width="6" height="6" />
    </svg>
);
const DocsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2.5h8l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-14a1 1 0 011-1z" />
        <path d="M12 2.5v4h4" /><path d="M6.5 10h7" /><path d="M6.5 13h5" />
    </svg>
);
const LogoutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 17.5H4.17a1.67 1.67 0 01-1.67-1.67V4.17A1.67 1.67 0 014.17 2.5H7.5" />
        <path d="M13.33 14.17L17.5 10l-4.17-4.17" /><path d="M17.5 10H7.5" />
    </svg>
);

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const mainNav = [
        { id: 'dashboard', label: 'Overview', icon: <GridIcon />, path: '/dashboard' },
        { id: 'accounts', label: 'Accounts', icon: <PiPlugsConnectedLight size={17} />, path: '/accounts' },
        { id: 'composer', label: 'Composer', icon: <GoPencil size={16} />, path: '/composer' },
        { id: 'scheduler', label: 'Schedule', icon: <CiCalendar size={18} />, path: '/scheduler' },
        { id: 'inbox', label: 'Inbox', icon: <CiInboxIn size={18} />, path: '/inbox' },
    ];

    const insightsNav = [
        { id: 'analytics', label: 'Analytics', icon: <TfiStatsUp size={15} />, path: '/analytics' },
        { id: 'settings', label: 'Settings', icon: <CiSettings size={18} />, path: '/settings' },
    ];

    const developerNav = [
        { id: 'developer', label: 'API Keys', icon: <GoKey size={16} />, path: '/developer' },
        { id: 'docs', label: 'API Docs', icon: <DocsIcon />, path: '/developer?tab=docs' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path.includes('?')) {
            return location.pathname === path.split('?')[0] && location.search.includes(path.split('?')[1]);
        }
        return location.pathname === path;
    };

    const renderNav = (items) => items.map((item) => (
        <Link
            key={item.id}
            to={item.path}
            className={`nav-row ${isActive(item.path) ? 'active' : ''}`}
        >
            <span className="nav-row-icon">{item.icon}</span>
            <span className="nav-row-text">{item.label}</span>
        </Link>
    ));

    return (
        <aside className="sidebar">
            {/* ── Workspace header ── */}
            <div className="sidebar-workspace">
                <Link to="/" className="ws-trigger">
                    <div className="ws-avatar"><span>F</span></div>
                    <div className="ws-info">
                        <span className="ws-name">FlowSync</span>
                        <span className="ws-plan">Pro Plan</span>
                    </div>
                </Link>
            </div>

            {/* ── Navigation ── */}
            <nav className="sidebar-scroll">
                <div className="nav-section">
                    {renderNav(mainNav)}
                </div>

                <div className="nav-section">
                    <span className="nav-section-label">Insights</span>
                    {renderNav(insightsNav)}
                </div>

                <div className="nav-section dev-section">
                    <span className="nav-section-label">Developer</span>
                    {renderNav(developerNav)}
                </div>
            </nav>

            {/* ── Sign out ── */}
            <div className="sidebar-signout">
                <button className="signout-btn" onClick={handleLogout}>
                    <span className="nav-row-icon"><LogoutIcon /></span>
                    <span className="signout-text">Sign out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
