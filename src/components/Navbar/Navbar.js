import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ transparent = false }) => {
    return (
        <nav className={`navbar ${transparent ? 'navbar-transparent' : ''}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <div className="flow-circle"></div>
                        <div className="flow-wave"></div>
                    </div>
                    <span className="logo-text">
                        Flow<span className="logo-accent">Sync</span>
                    </span>
                </Link>

                <div className="navbar-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#pricing" className="nav-link">Pricing</a>
                    <a href="#about" className="nav-link">About</a>
                    <Link to="/login" className="nav-link-btn">
                        Sign In
                    </Link>
                    <Link to="/signup" className="nav-link-btn-primary">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
