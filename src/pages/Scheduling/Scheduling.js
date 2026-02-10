import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Button from '../../components/Button/Button';
import './Scheduling.css';

const Scheduling = () => {
    const [selectedView, setSelectedView] = useState('upcoming');

    const scheduledPosts = [
        { id: 1, platform: 'X', content: 'Announcing our new AI-powered features for social automation', date: 'Feb 10', time: '10:00 AM', status: 'scheduled' },
        { id: 2, platform: 'Telegram', content: 'Weekly community update: Product roadmap and upcoming releases', date: 'Feb 10', time: '2:00 PM', status: 'scheduled' },
        { id: 3, platform: 'Instagram', content: 'Behind the scenes: How we built FlowSync automation engine', date: 'Feb 11', time: '9:00 AM', status: 'queued' },
        { id: 4, platform: 'X', content: 'Tips for maximizing engagement with AI-assisted replies', date: 'Feb 12', time: '3:00 PM', status: 'queued' },
        { id: 5, platform: 'WhatsApp', content: 'Monthly newsletter: Industry trends and best practices', date: 'Feb 14', time: '10:00 AM', status: 'draft' }
    ];

    const views = ['upcoming', 'draft', 'published'];

    const filteredPosts = scheduledPosts.filter(post => {
        if (selectedView === 'upcoming') return post.status === 'scheduled' || post.status === 'queued';
        if (selectedView === 'draft') return post.status === 'draft';
        return false;
    });

    return (
        <div className="scheduling-layout">
            <Sidebar />

            <main className="scheduling-main">
                <div className="scheduling-header">
                    <div>
                        <h1>Scheduling</h1>
                        <p>Content calendar</p>
                    </div>
                    <div className="header-actions">
                        <div className="view-tabs">
                            {views.map(view => (
                                <button
                                    key={view}
                                    className={`view-tab ${selectedView === view ? 'active' : ''}`}
                                    onClick={() => setSelectedView(view)}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                        <Button size="small">New Post</Button>
                    </div>
                </div>

                <div className="posts-list">
                    {filteredPosts.map((post) => (
                        <div key={post.id} className="post-item">
                            <div className="post-main">
                                <div className="post-header">
                                    <span className="post-platform">{post.platform}</span>
                                    <span className={`post-status ${post.status}`}>{post.status}</span>
                                </div>
                                <p className="post-content">{post.content}</p>
                                <div className="post-schedule">
                                    <span>{post.date}</span>
                                    <span>{post.time}</span>
                                </div>
                            </div>
                            <div className="post-actions">
                                <Button variant="ghost" size="small">Edit</Button>
                                <Button variant="ghost" size="small">Delete</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Scheduling;
