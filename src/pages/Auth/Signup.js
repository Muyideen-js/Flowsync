import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../../firebase';
import './Login.css';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false
    });
    const [currentAd, setCurrentAd] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const ads = [
        {
            title: "Join 10K+ Users",
            description: "Start automating your social media today",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="16 12 12 8 8 12" />
                    <line x1="12" y1="16" x2="12" y2="8" />
                </svg>
            )
        },
        {
            title: "Free Trial Available",
            description: "No credit card required to get started",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            )
        },
        {
            title: "24/7 Support",
            description: "Our team is here to help you succeed",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            )
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAd((prev) => (prev + 1) % ads.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, { displayName: formData.name });

            // Save user to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                displayName: formData.name,
                email: formData.email,
                photoURL: null,
                provider: 'email',
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                connectedAccounts: {
                    whatsapp: { connected: false, connectedAt: null },
                    twitter: { connected: false, connectedAt: null },
                    instagram: { connected: false, connectedAt: null },
                    telegram: { connected: false, connectedAt: null }
                }
            });

            navigate('/dashboard');
        } catch (err) {
            const code = err.code;
            if (code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else if (code === 'auth/weak-password') {
                setError('Password is too weak');
            } else if (code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // Create Firestore doc if first-time Google login
            const userRef = doc(db, 'users', result.user.uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
                await setDoc(userRef, {
                    uid: result.user.uid,
                    displayName: result.user.displayName || '',
                    email: result.user.email || '',
                    photoURL: result.user.photoURL || null,
                    provider: 'google',
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                    connectedAccounts: {
                        whatsapp: { connected: false, connectedAt: null },
                        twitter: { connected: false, connectedAt: null },
                        instagram: { connected: false, connectedAt: null },
                        telegram: { connected: false, connectedAt: null }
                    }
                });
            } else {
                await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
            }
            navigate('/dashboard');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Google sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGithub = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, githubProvider);
            // Create Firestore doc if first-time GitHub login
            const userRef = doc(db, 'users', result.user.uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
                await setDoc(userRef, {
                    uid: result.user.uid,
                    displayName: result.user.displayName || '',
                    email: result.user.email || '',
                    photoURL: result.user.photoURL || null,
                    provider: 'github',
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                    connectedAccounts: {
                        whatsapp: { connected: false, connectedAt: null },
                        twitter: { connected: false, connectedAt: null },
                        instagram: { connected: false, connectedAt: null },
                        telegram: { connected: false, connectedAt: null }
                    }
                });
            } else {
                await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
            }
            navigate('/dashboard');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('GitHub sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left Side - Ads Carousel */}
            <div className="login-left">
                <div className="ads-container">
                    <Link to="/" className="brand-logo">
                        <div className="brand-f-avatar">
                            <span>F</span>
                        </div>
                        <span className="brand-text">
                            Flow<span className="brand-accent">Sync</span>
                        </span>
                    </Link>

                    <div className="ad-carousel">
                        {ads.map((ad, index) => (
                            <div key={index} className={`ad-slide ${index === currentAd ? 'active' : ''}`}>
                                <div className="ad-icon">{ad.icon}</div>
                                <h2>{ad.title}</h2>
                                <p>{ad.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="ad-dots">
                        {ads.map((_, index) => (
                            <div
                                key={index}
                                className={`ad-dot ${index === currentAd ? 'active' : ''}`}
                                onClick={() => setCurrentAd(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="login-right">
                <div className="login-form-container">
                    <div className="form-header">
                        <h2>Create Account</h2>
                        <p>Get started with your free account</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="password-input">
                                <svg className="password-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="password-input">
                                <svg className="password-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <label className="check-label">
                            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} required />
                            <span>I agree to the Terms and Privacy Policy</span>
                        </label>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? <span className="btn-spinner" /> : 'Create Account'}
                        </button>
                    </form>

                    <div className="divider-line">
                        <span>or</span>
                    </div>

                    <div className="social-buttons">
                        <button className="social-button" onClick={handleGoogle} disabled={loading}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button className="social-button" onClick={handleGithub} disabled={loading}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                    <div className="signup-text">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
