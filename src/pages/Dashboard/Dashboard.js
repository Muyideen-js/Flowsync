import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Button from '../../components/Button/Button';
import telegramService from '../../services/telegramService';
import twitterService from '../../services/twitterService';
import './Dashboard.css';

const Dashboard = () => {
    const [platformStatus, setPlatformStatus] = useState({
        telegram: { connected: false, loading: false, userData: null },
        twitter: { connected: false, loading: false, userData: null },
        instagram: { connected: false, loading: false, userData: null },
        whatsapp: { connected: false, loading: false, userData: null }
    });

    const platforms = [
        {
            id: 'twitter',
            name: 'X (Twitter)',
            description: 'Connect to manage tweets and DMs',
            color: '#1DA1F2'
        },
        {
            id: 'telegram',
            name: 'Telegram',
            description: 'Automate channel and group messages',
            color: '#0088cc'
        },
        {
            id: 'instagram',
            name: 'Instagram',
            description: 'Schedule posts and manage comments',
            color: '#E4405F'
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            description: 'Handle business messages with AI',
            color: '#25D366'
        }
    ];

    const quickActions = [
        { title: 'Create Post', description: 'Schedule content across platforms' },
        { title: 'New Automation', description: 'Set up AI-powered workflows' },
        { title: 'View Inbox', description: 'Check unified messages' },
        { title: 'Analytics', description: 'Track performance metrics' }
    ];

    // Check platform connections on mount and after OAuth redirect
    useEffect(() => {
        checkPlatformStatus();

        // Check URL params for OAuth callbacks
        const params = new URLSearchParams(window.location.search);
        if (params.get('twitter') === 'connected') {
            alert('✅ Twitter connected successfully!');
            window.history.replaceState({}, '', '/dashboard');
            checkPlatformStatus();
        }
    }, []);

    const checkPlatformStatus = async () => {
        // Check Telegram status
        const telegramStatus = await telegramService.checkStatus();
        if (telegramStatus.connected) {
            setPlatformStatus(prev => ({
                ...prev,
                telegram: {
                    connected: true,
                    loading: false,
                    userData: telegramStatus.data
                }
            }));
        }

        // Check Twitter status
        const twitterStatus = await twitterService.checkStatus();
        if (twitterStatus.connected) {
            setPlatformStatus(prev => ({
                ...prev,
                twitter: {
                    connected: true,
                    loading: false,
                    userData: twitterStatus.data
                }
            }));
        }
    };

    const handleConnect = async (platformId) => {
        setPlatformStatus(prev => ({
            ...prev,
            [platformId]: { ...prev[platformId], loading: true }
        }));

        try {
            if (platformId === 'telegram') {
                // Get Telegram auth URL and open in new window
                const result = await telegramService.getAuthUrl();
                window.open(result.authUrl, '_blank', 'width=600,height=700');

                alert('📱 Please authorize the bot in Telegram, then come back and refresh this page.');

                setPlatformStatus(prev => ({
                    ...prev,
                    telegram: { ...prev.telegram, loading: false }
                }));

            } else if (platformId === 'twitter') {
                // Get Twitter OAuth URL and redirect
                const result = await twitterService.getAuthUrl();

                // Open in popup window
                const width = 600;
                const height = 700;
                const left = (window.screen.width / 2) - (width / 2);
                const top = (window.screen.height / 2) - (height / 2);

                window.open(
                    result.authUrl,
                    'Twitter Authorization',
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                setPlatformStatus(prev => ({
                    ...prev,
                    twitter: { ...prev.twitter, loading: false }
                }));

            } else {
                alert('This platform integration is coming soon!');
                setPlatformStatus(prev => ({
                    ...prev,
                    [platformId]: { connected: false, loading: false }
                }));
            }
        } catch (error) {
            alert(`❌ Connection failed: ${error.message}`);
            setPlatformStatus(prev => ({
                ...prev,
                [platformId]: { connected: false, loading: false }
            }));
        }
    };

    const connectedCount = Object.values(platformStatus).filter(p => p.connected).length;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome to FlowSync</h1>
                        <p>{connectedCount} of 4 platforms connected</p>
                    </div>
                </div>

                {/* Connect Platforms Section */}
                <div className="section">
                    <h2>Connect Platforms</h2>
                    <div className="platforms-grid">
                        {platforms.map((platform, index) => {
                            const status = platformStatus[platform.id];
                            return (
                                <div key={index} className="platform-card">
                                    <div className="platform-header">
                                        <h3>{platform.name}</h3>
                                        <span className={`status-badge ${status.connected ? 'connected' : 'disconnected'}`}>
                                            {status.connected ? 'connected' : 'disconnected'}
                                        </span>
                                    </div>
                                    <p className="platform-description">
                                        {status.connected && status.userData
                                            ? `@${status.userData.username || status.userData.firstName}`
                                            : platform.description}
                                    </p>
                                    <Button
                                        size="small"
                                        className="connect-btn"
                                        onClick={() => handleConnect(platform.id)}
                                        disabled={status.loading || status.connected}
                                    >
                                        {status.loading ? 'Connecting...' : status.connected ? 'Connected' : 'Connect'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="section">
                    <h2>Quick Actions</h2>
                    <div className="actions-grid">
                        {quickActions.map((action, index) => (
                            <div key={index} className="action-card">
                                <h3>{action.title}</h3>
                                <p>{action.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Getting Started */}
                <div className="section">
                    <div className="getting-started">
                        <h2>Getting Started</h2>
                        <div className="steps-list">
                            <div className="step-item">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h4>Connect Your Platforms</h4>
                                    <p>Link your social media accounts to start automating</p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h4>Create Automation Rules</h4>
                                    <p>Set up AI-powered workflows for your content</p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h4>Schedule & Automate</h4>
                                    <p>Let FlowSync handle your social media presence</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
