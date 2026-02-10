import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Logs.css';

const Logs = () => {
    const [filter, setFilter] = useState('all');

    const logs = [
        { id: 1, type: 'success', action: 'Auto-reply sent', platform: 'X', details: 'Responded to support query from @techuser', time: '2m ago' },
        { id: 2, type: 'success', action: 'Post published', platform: 'Telegram', details: 'Scheduled post went live successfully', time: '15m ago' },
        { id: 3, type: 'info', action: 'Message classified', platform: 'WhatsApp', details: 'Incoming message tagged as sales inquiry', time: '1h ago' },
        { id: 4, type: 'success', action: 'Automation triggered', platform: 'X', details: 'Welcome message sent to 5 new followers', time: '2h ago' },
        { id: 5, type: 'error', action: 'Post failed', platform: 'Instagram', details: 'Rate limit exceeded, post rescheduled', time: '3h ago' },
        { id: 6, type: 'info', action: 'Workflow executed', platform: 'Telegram', details: 'Auto-classification rule processed 12 messages', time: '4h ago' },
        { id: 7, type: 'success', action: 'Reply approved', platform: 'X', details: 'AI-generated response sent after review', time: '5h ago' }
    ];

    const filters = ['all', 'success', 'error', 'info'];

    const filteredLogs = logs.filter(log =>
        filter === 'all' || log.type === filter
    );

    const stats = [
        { label: 'Total Events', value: '247' },
        { label: 'Success', value: '234' },
        { label: 'Errors', value: '8' },
        { label: 'Info', value: '5' }
    ];

    return (
        <div className="logs-layout">
            <Sidebar />

            <main className="logs-main">
                <div className="logs-header">
                    <div>
                        <h1>Logs</h1>
                        <p>Activity history</p>
                    </div>
                    <div className="log-filters">
                        {filters.map(f => (
                            <button
                                key={f}
                                className={`filter-btn ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="logs-stats">
                    {stats.map((stat, index) => (
                        <div key={index} className="log-stat">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="logs-list">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className="log-item">
                            <div className={`log-indicator ${log.type}`}></div>
                            <div className="log-content">
                                <div className="log-main">
                                    <span className="log-action">{log.action}</span>
                                    <span className="log-platform">{log.platform}</span>
                                </div>
                                <p className="log-details">{log.details}</p>
                                <span className="log-time">{log.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Logs;
