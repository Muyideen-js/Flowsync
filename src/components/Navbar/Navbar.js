import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = ({ transparent = false }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const initials = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        setShowUserMenu(false);
        await logout();
        navigate('/login');
    };

    return (
        <nav className={`navbar ${transparent ? 'navbar-transparent' : ''}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div className="logo-f-avatar">
                        <span>F</span>
                    </div>
                    <span className="logo-text">
                        Flow<span className="logo-accent">Sync</span>
                    </span>
                </Link>

                <div className="navbar-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#pricing" className="nav-link">Pricing</a>
                    <a href="#about" className="nav-link">About</a>

                    {user ? (
                        /* Signed-in user — show avatar + dropdown */
                        <div className="nav-user-wrap" ref={menuRef}>
                            <button
                                className="nav-user-btn"
                                onClick={() => setShowUserMenu(prev => !prev)}
                            >
                                <div className="nav-user-avatar">
                                    <span>{initials}</span>
                                </div>
                                <span className="nav-user-name">{displayName}</span>
                                <svg className={`nav-chevron ${showUserMenu ? 'open' : ''}`} width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M4 6l4 4 4-4" />
                                </svg>
                            </button>

                            {showUserMenu && (
                                <div className="nav-user-dropdown">
                                    <Link
                                        to="/dashboard"
                                        className="nav-dd-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="5" height="5" rx="1" />
                                            <rect x="9" y="2" width="5" height="5" rx="1" />
                                            <rect x="2" y="9" width="5" height="5" rx="1" />
                                            <rect x="9" y="9" width="5" height="5" rx="1" />
                                        </svg>
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="nav-dd-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                            <path d="M2.5 4h2.5m3 0h5.5M2.5 8h7m3 0h1M2.5 12h1m3 0h7" />
                                            <circle cx="7" cy="4" r="1.2" />
                                            <circle cx="11.5" cy="8" r="1.2" />
                                            <circle cx="5.5" cy="12" r="1.2" />
                                        </svg>
                                        Settings
                                    </Link>
                                    <div className="nav-dd-divider" />
                                    <button className="nav-dd-item nav-dd-logout" onClick={handleLogout}>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" />
                                            <path d="M10.5 11.5L14 8l-3.5-3.5" />
                                            <path d="M14 8H6" />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Not signed in — show login/signup */
                        <>
                            <Link to="/login" className="nav-link-btn">
                                Sign In
                            </Link>
                            <Link to="/signup" className="nav-link-btn-primary">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
