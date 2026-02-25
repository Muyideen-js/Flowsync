import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/Button/Button';
import TargetCursor from '../../components/TargetCursor/TargetCursor';
import RotatingText from '../../components/RotatingText/RotatingText';
import './Landing.css';

const Landing = () => {
    const [selectedLang, setSelectedLang] = useState('nodejs');
    const fullText = 'Automate Social Media with AI';

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < fullText.length) {
                index++;
            } else {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [fullText]);

    return (
        <div className="landing">
            <TargetCursor
                spinDuration={2}
                hideDefaultCursor
                parallaxOn
                hoverDuration={0.2}
            />
            <Navbar transparent />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="grid-pattern"></div>
                    <div className="glow glow-1"></div>
                    <div className="glow glow-2"></div>
                    <div className="glow glow-3"></div>
                    <div className="particles">
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                    </div>
                </div>

                <div className="hero-container">

                    <h1 className="hero-h1">
                        !Automate Social Media<br />
                        with{' '}
                        <RotatingText
                            texts={['AI', 'Automation', 'Intelligence', 'FlowSync']}
                            mainClassName="rotating-word"
                            staggerFrom="last"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-120%' }}
                            staggerDuration={0.025}
                            splitLevelClassName="overflow-hidden"
                            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                            rotationInterval={3000}
                        />
                    </h1>

                    <p className="hero-p hero-fade-in">
                        Unified dashboard for <span className="rotating-text">X, Telegram, Instagram & WhatsApp</span>.<br />
                        Smart workflows. Human control. Zero hassle.
                    </p>

                    <div className="hero-btns hero-fade-in">
                        <Link to="/dashboard">
                            <Button size="medium" className="cursor-target btn-pulse">
                                Get Started Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="secondary" size="medium" className="cursor-target">
                                View Demo
                            </Button>
                        </Link>
                    </div>

                    <div className="platforms hero-fade-in">
                        <span>Integrates with</span>
                        <div className="platform-icons">
                            <div className="p-icon icon-float">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </div>
                            <div className="p-icon icon-float" style={{ animationDelay: '0.1s' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                                </svg>
                            </div>
                            <div className="p-icon icon-float" style={{ animationDelay: '0.2s' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </div>
                            <div className="p-icon icon-float" style={{ animationDelay: '0.3s' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="scroll-indicator">
                    <div className="scroll-line"></div>
                </div>
            </section>

            {/* Stats */}
            <section className="stats">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item cursor-target">
                            <div className="stat-value">10K+</div>
                            <div className="stat-text">Users</div>
                        </div>
                        <div className="stat-item cursor-target">
                            <div className="stat-value">2M+</div>
                            <div className="stat-text">Messages</div>
                        </div>
                        <div className="stat-item cursor-target">
                            <div className="stat-value">95%</div>
                            <div className="stat-text">Time Saved</div>
                        </div>
                        <div className="stat-item cursor-target">
                            <div className="stat-value">24/7</div>
                            <div className="stat-text">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features" id="features">
                <div className="container">
                    <div className="section-head">
                        <span className="tag">Features</span>
                        <h2>Everything You Need</h2>
                        <p className="section-desc">Powerful tools to automate your social presence</p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card cursor-target">
                            <div className="f-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 1v6m0 6v6" />
                                </svg>
                            </div>
                            <h3>Multi-Platform</h3>
                            <p>Connect all accounts in one place</p>
                        </div>

                        <div className="feature-card cursor-target">
                            <div className="f-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                </svg>
                            </div>
                            <h3>AI Assistant</h3>
                            <p>Smart drafts with your approval</p>
                        </div>

                        <div className="feature-card cursor-target">
                            <div className="f-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <h3>Automation</h3>
                            <p>IF-AI-ACTION workflows</p>
                        </div>

                        <div className="feature-card cursor-target">
                            <div className="f-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h3>Unified Inbox</h3>
                            <p>All messages, one interface</p>
                        </div>

                        <div className="feature-card cursor-target">
                            <div className="f-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <h3>Scheduling</h3>
                            <p>Plan posts across platforms</p>
                        </div>

                        <div className="feature-card cursor-target">
                            <div className="f-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h3>Compliant</h3>
                            <p>Official APIs, encrypted data</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integration Showcase */}
            <section className="integrations">
                <div className="container">
                    <div className="section-head">
                        <span className="tag">Integrations</span>
                        <h2>Seamless Connections</h2>
                    </div>

                    <div className="integration-grid">
                        <div className="integration-item cursor-target">
                            <div className="integration-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </div>
                            <span>X (Twitter)</span>
                        </div>

                        <div className="integration-item cursor-target">
                            <div className="integration-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                                </svg>
                            </div>
                            <span>Telegram</span>
                        </div>

                        <div className="integration-item cursor-target">
                            <div className="integration-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </div>
                            <span>Instagram</span>
                        </div>

                        <div className="integration-item cursor-target">
                            <div className="integration-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </div>
                            <span>WhatsApp</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            <section className="pricing" id="pricing">
                <div className="container">
                    <div className="section-head">
                        <span className="tag">Pricing</span>
                        <h2>Simple Pricing</h2>
                    </div>

                    <div className="pricing-grid">
                        <div className="price-card cursor-target">
                            <h3>Starter</h3>
                            <div className="price">
                                <span className="price-num">$29</span>
                                <span className="price-period">/mo</span>
                            </div>
                            <ul className="price-features">
                                <li>2 platforms</li>
                                <li>500 messages/mo</li>
                                <li>Basic AI</li>
                            </ul>
                            <Link to="/dashboard">
                                <Button variant="secondary" size="small" className="cursor-target">Start Free</Button>
                            </Link>
                        </div>

                        <div className="price-card price-card-featured cursor-target">
                            <div className="featured-badge">Popular</div>
                            <h3>Pro</h3>
                            <div className="price">
                                <span className="price-num">$79</span>
                                <span className="price-period">/mo</span>
                            </div>
                            <ul className="price-features">
                                <li>All platforms</li>
                                <li>Unlimited messages</li>
                                <li>Advanced AI</li>
                                <li>Priority support</li>
                            </ul>
                            <Link to="/dashboard">
                                <Button size="small" className="cursor-target">Start Free</Button>
                            </Link>
                        </div>

                        <div className="price-card cursor-target">
                            <h3>Enterprise</h3>
                            <div className="price">
                                <span className="price-num">Custom</span>
                            </div>
                            <ul className="price-features">
                                <li>Custom integrations</li>
                                <li>Dedicated support</li>
                                <li>SLA guarantee</li>
                            </ul>
                            <a href="#contact">
                                <Button variant="secondary" size="small" className="cursor-target">Contact Us</Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works" id="how-it-works">
                <div className="container">
                    <div className="section-head">
                        <span className="tag">Process</span>
                        <h2>How It Works</h2>
                        <p className="section-desc">Get up and running in minutes, not days</p>
                    </div>

                    <div className="hiw-grid">
                        <div className="hiw-card cursor-target">
                            <div className="hiw-card-glow" />
                            <div className="hiw-card-header">
                                <div className="hiw-num"><span>01</span></div>
                                <div className="hiw-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6a5 5 0 0 1 0-10h3" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                            </div>
                            <h3>Connect Platforms</h3>
                            <p>Link X, Telegram, Instagram & WhatsApp with one-click OAuth. Secure and encrypted.</p>
                            <div className="hiw-tags">
                                <span>OAuth 2.0</span>
                                <span>30 seconds</span>
                            </div>
                        </div>

                        <div className="hiw-connector-h" />

                        <div className="hiw-card cursor-target">
                            <div className="hiw-card-glow" />
                            <div className="hiw-card-header">
                                <div className="hiw-num"><span>02</span></div>
                                <div className="hiw-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                            </div>
                            <h3>Build Workflows</h3>
                            <p>Create IF-AI-ACTION automations with our visual builder. Cross-platform triggers and actions.</p>
                            <div className="hiw-tags">
                                <span>Visual builder</span>
                                <span>AI logic</span>
                            </div>
                        </div>

                        <div className="hiw-connector-h" />

                        <div className="hiw-card cursor-target">
                            <div className="hiw-card-glow" />
                            <div className="hiw-card-header">
                                <div className="hiw-num"><span>03</span></div>
                                <div className="hiw-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                </div>
                            </div>
                            <h3>Review & Approve</h3>
                            <p>AI drafts replies and content. Review, edit if needed, and approve with one click.</p>
                            <div className="hiw-tags">
                                <span>Human review</span>
                                <span>One-click</span>
                            </div>
                        </div>

                        <div className="hiw-connector-h" />

                        <div className="hiw-card cursor-target">
                            <div className="hiw-card-glow" />
                            <div className="hiw-card-header">
                                <div className="hiw-num"><span>04</span></div>
                                <div className="hiw-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                            </div>
                            <h3>Scale & Grow</h3>
                            <p>Save 20+ hours per week. Real-time analytics show exactly how automation is performing.</p>
                            <div className="hiw-tags">
                                <span>20h+ saved</span>
                                <span>Analytics</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Developer Section */}
            <section className="developer">
                <div className="container">
                    <div className="section-head">
                        <span className="tag">Developers</span>
                        <h2>Built for Developers</h2>
                        <p className="section-desc">Powerful API, webhooks, and SDKs</p>
                    </div>

                    <div className="dev-content">
                        <div className="dev-features">
                            <div className="dev-feature cursor-target">
                                <div className="dev-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="16 18 22 12 16 6" />
                                        <polyline points="8 6 2 12 8 18" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>RESTful API</h4>
                                    <p>Full CRUD operations</p>
                                </div>
                            </div>

                            <div className="dev-feature cursor-target">
                                <div className="dev-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>Webhooks</h4>
                                    <p>Real-time event notifications</p>
                                </div>
                            </div>

                            <div className="dev-feature cursor-target">
                                <div className="dev-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>SDKs</h4>
                                    <p>Node.js, Python, Go</p>
                                </div>
                            </div>

                            <div className="dev-feature cursor-target">
                                <div className="dev-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>Documentation</h4>
                                    <p>Interactive API docs</p>
                                </div>
                            </div>
                        </div>

                        <div className="code-example cursor-target">
                            <div className="code-header">
                                <div className="code-tabs">
                                    <button
                                        className={`code-tab ${selectedLang === 'nodejs' ? 'active' : ''}`}
                                        onClick={() => setSelectedLang('nodejs')}
                                    >
                                        Node.js
                                    </button>
                                    <button
                                        className={`code-tab ${selectedLang === 'python' ? 'active' : ''}`}
                                        onClick={() => setSelectedLang('python')}
                                    >
                                        Python
                                    </button>
                                    <button
                                        className={`code-tab ${selectedLang === 'go' ? 'active' : ''}`}
                                        onClick={() => setSelectedLang('go')}
                                    >
                                        Go
                                    </button>
                                </div>
                                <button className="code-copy">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                            </div>

                            {selectedLang === 'nodejs' && (
                                <pre className="code-block"><code><span className="code-keyword">import</span> {'{ FlowSync }'} <span className="code-keyword">from</span> <span className="code-string">'@flowsync/sdk'</span>;
                                    {'\n'}
                                    <span className="code-keyword">const</span> <span className="code-variable">client</span> = <span className="code-keyword">new</span> <span className="code-function">FlowSync</span>({'{'}
                                    <span className="code-property">apiKey</span>: process.env.<span className="code-property">SOCIALFLOW_API_KEY</span>
                                    {'}'});
                                    {'\n'}
                                    <span className="code-comment">{'//'} Send automated reply</span>
                                    {'\n'}<span className="code-keyword">await</span> client.messages.<span className="code-function">reply</span>({'{'}
                                    <span className="code-property">platform</span>: <span className="code-string">'twitter'</span>,
                                    <span className="code-property">messageId</span>: <span className="code-string">'msg_123'</span>,
                                    <span className="code-property">content</span>: <span className="code-string">'Thanks for reaching out!'</span>
                                    {'}'});
                                    {'\n'}
                                    <span className="code-comment">{'//'} Create automation rule</span>
                                    {'\n'}<span className="code-keyword">await</span> client.automations.<span className="code-function">create</span>({'{'}
                                    <span className="code-property">trigger</span>: <span className="code-string">'new_mention'</span>,
                                    <span className="code-property">action</span>: <span className="code-string">'ai_draft_reply'</span>,
                                    <span className="code-property">platforms</span>: [<span className="code-string">'twitter'</span>, <span className="code-string">'instagram'</span>]
                                    {'}'});</code></pre>
                            )}

                            {selectedLang === 'python' && (
                                <pre className="code-block"><code><span className="code-keyword">from</span> flowsync <span className="code-keyword">import</span> FlowSync
                                    {'\n'}
                                    <span className="code-variable">client</span> = <span className="code-function">FlowSync</span>(
                                    <span className="code-property">api_key</span>=os.environ[<span className="code-string">'SOCIALFLOW_API_KEY'</span>]
                                    )
                                    {'\n'}
                                    <span className="code-comment"># Send automated reply</span>
                                    {'\n'}client.messages.<span className="code-function">reply</span>(
                                    <span className="code-property">platform</span>=<span className="code-string">'twitter'</span>,
                                    <span className="code-property">message_id</span>=<span className="code-string">'msg_123'</span>,
                                    <span className="code-property">content</span>=<span className="code-string">'Thanks for reaching out!'</span>
                                    )
                                    {'\n'}
                                    <span className="code-comment"># Create automation rule</span>
                                    {'\n'}client.automations.<span className="code-function">create</span>(
                                    <span className="code-property">trigger</span>=<span className="code-string">'new_mention'</span>,
                                    <span className="code-property">action</span>=<span className="code-string">'ai_draft_reply'</span>,
                                    <span className="code-property">platforms</span>=[<span className="code-string">'twitter'</span>, <span className="code-string">'instagram'</span>]
                                    )</code></pre>
                            )}

                            {selectedLang === 'go' && (
                                <pre className="code-block"><code><span className="code-keyword">package</span> main
                                    {'\n'}
                                    <span className="code-keyword">import</span> (
                                    <span className="code-string">"github.com/socialflow/sdk-go"</span>
                                    <span className="code-string">"os"</span>
                                    )
                                    {'\n'}
                                    <span className="code-keyword">func</span> <span className="code-function">main</span>() {'{'}
                                    <span className="code-variable">client</span> := socialflow.<span className="code-function">NewClient</span>(
                                    os.<span className="code-function">Getenv</span>(<span className="code-string">"SOCIALFLOW_API_KEY"</span>),
                                    )
                                    {'\n'}
                                    <span className="code-comment">{'//'} Send automated reply</span>
                                    {'\n'}    client.Messages.<span className="code-function">Reply</span>(&socialflow.ReplyParams{'{'}
                                    <span className="code-property">Platform</span>:  <span className="code-string">"twitter"</span>,
                                    <span className="code-property">MessageID</span>: <span className="code-string">"msg_123"</span>,
                                    <span className="code-property">Content</span>:   <span className="code-string">"Thanks for reaching out!"</span>,
                                    {'}'})
                                    {'\n'}
                                    <span className="code-comment">{'//'} Create automation rule</span>
                                    {'\n'}    client.Automations.<span className="code-function">Create</span>(&socialflow.AutomationParams{'{'}
                                    <span className="code-property">Trigger</span>:   <span className="code-string">"new_mention"</span>,
                                    <span className="code-property">Action</span>:    <span className="code-string">"ai_draft_reply"</span>,
                                    <span className="code-property">Platforms</span>: []<span className="code-keyword">string</span>{'{'}
                                    <span className="code-string">"twitter"</span>, <span className="code-string">"instagram"</span>,
                                    {'}'},
                                    {'}'})
                                    {'}'}</code></pre>
                            )}
                        </div>
                    </div>

                    <div className="dev-links">
                        <a href="#docs" className="dev-link cursor-target">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            API Docs
                        </a>
                        <a href="#github" className="dev-link cursor-target">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                        <a href="#examples" className="dev-link cursor-target">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                            Examples
                        </a>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="faq">
                <div className="container">
                    <div className="section-head">
                        <span className="tag">FAQ</span>
                        <h2>Common Questions</h2>
                    </div>

                    <div className="faq-grid">
                        <div className="faq-item cursor-target">
                            <h3>Is my data secure?</h3>
                            <p>Yes. We use official APIs and encrypt all data. Your credentials are never stored.</p>
                        </div>

                        <div className="faq-item cursor-target">
                            <h3>Can I try before buying?</h3>
                            <p>Absolutely. Start with a 14-day free trial, no credit card required.</p>
                        </div>

                        <div className="faq-item cursor-target">
                            <h3>How does AI approval work?</h3>
                            <p>AI drafts responses. You review and approve before sending. You're always in control.</p>
                        </div>

                        <div className="faq-item cursor-target">
                            <h3>Can I cancel anytime?</h3>
                            <p>Yes. Cancel anytime with one click. No questions asked, no hidden fees.</p>
                        </div>

                        <div className="faq-item cursor-target">
                            <h3>Which platforms are supported?</h3>
                            <p>X (Twitter), Telegram, Instagram, and WhatsApp. More platforms coming soon.</p>
                        </div>

                        <div className="faq-item cursor-target">
                            <h3>Do you offer support?</h3>
                            <p>Yes. Email support for all plans, priority support for Pro and Enterprise.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="f-brand">
                            <h3>FlowSync</h3>
                            <p>Automate smarter</p>
                        </div>

                        <div className="f-col">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#docs">Docs</a>
                        </div>

                        <div className="f-col">
                            <h4>Company</h4>
                            <a href="#about">About</a>
                            <a href="#blog">Blog</a>
                            <a href="#contact">Contact</a>
                        </div>

                        <div className="f-col">
                            <h4>Legal</h4>
                            <a href="#privacy">Privacy</a>
                            <a href="#terms">Terms</a>
                        </div>
                    </div>

                    <div className="f-bottom">
                        <p>&copy; 2026 FlowSync</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
