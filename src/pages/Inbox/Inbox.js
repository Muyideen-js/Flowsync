import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Button from '../../components/Button/Button';
import './Inbox.css';

const Inbox = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');

    const messages = [
        { id: 1, platform: 'X', from: '@user123', content: 'Hey! Love your product. When is the next update?', time: '5m', status: 'pending' },
        { id: 2, platform: 'Telegram', from: 'John Doe', content: 'Interested in your services. Can we schedule a call?', time: '15m', status: 'pending' },
        { id: 3, platform: 'Instagram', from: '@creator_pro', content: 'Amazing content! Keep it up', time: '1h', status: 'read' },
        { id: 4, platform: 'X', from: '@techuser', content: 'Question about your API documentation', time: '2h', status: 'read' },
        { id: 5, platform: 'WhatsApp', from: 'Support Team', content: 'New inquiry from website contact form', time: '3h', status: 'pending' }
    ];

    const filters = ['all', 'pending', 'read'];

    const filteredMessages = messages.filter(msg =>
        selectedFilter === 'all' || msg.status === selectedFilter
    );

    return (
        <div className="inbox-layout">
            <Sidebar />

            <main className="inbox-main">
                <div className="inbox-header">
                    <div>
                        <h1>Inbox</h1>
                        <p>Unified messages</p>
                    </div>
                    <div className="inbox-filters">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                className={`filter-btn ${selectedFilter === filter ? 'active' : ''}`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="messages-list">
                    {filteredMessages.map((message) => (
                        <div key={message.id} className="message-item">
                            <div className="message-main">
                                <div className="message-header">
                                    <span className="message-from">{message.from}</span>
                                    <span className="message-platform">{message.platform}</span>
                                </div>
                                <p className="message-content">{message.content}</p>
                            </div>
                            <div className="message-meta">
                                <span className="message-time">{message.time}</span>
                                <Button size="small">Reply</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Inbox;
