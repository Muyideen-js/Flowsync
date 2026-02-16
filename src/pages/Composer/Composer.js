import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import './Composer.css';

/* ── Inline icons ── */
const Ic = {
    image: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="16" height="16" rx="2" /><circle cx="7" cy="7" r="1.5" /><path d="M18 13l-4-4-8 8" /></svg>,
    smile: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8" /><path d="M7 12s1.5 2 3 2 3-2 3-2" /><circle cx="7.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" /><circle cx="12.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" /></svg>,
    hash: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 7h12M4 13h12M8 3l-2 14M14 3l-2 14" /></svg>,
    ai: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" /><path d="M15 12l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" /></svg>,
    send: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2L9 11" /><path d="M18 2l-6 16-3-7-7-3 16-6z" /></svg>,
    clock: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M10 5v5l3 3" /></svg>,
};

const channelOptions = [
    { id: 'instagram', name: 'Instagram', abbr: 'IG', color: '#E4405F' },
    { id: 'twitter', name: 'X', abbr: 'X', color: '#1DA1F2' },
    { id: 'whatsapp', name: 'WhatsApp', abbr: 'WA', color: '#25D366' },
    { id: 'telegram', name: 'Telegram', abbr: 'TG', color: '#0088CC' },
];

const Composer = () => {
    const [loaded, setLoaded] = useState(false);
    const [content, setContent] = useState('');
    const [selectedChannels, setSelectedChannels] = useState(['instagram']);
    const [showAI, setShowAI] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    const toggleChannel = (id) => {
        setSelectedChannels(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const charCount = content.length;
    const maxChars = 2200;

    return (
        <MainLayout>
            <div className={`composer ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="cmp-head anim-c" style={{ '--i': 0 }}>
                    <div>
                        <h1>Composer</h1>
                        <p>Create and publish content across channels</p>
                    </div>
                </div>

                <div className="cmp-layout">
                    {/* ── Editor column ── */}
                    <div className="cmp-editor anim-c" style={{ '--i': 1 }}>
                        {/* Channel selector */}
                        <div className="cmp-channels">
                            <span className="cmp-label">Publish to</span>
                            <div className="cmp-ch-row">
                                {channelOptions.map(ch => (
                                    <button
                                        key={ch.id}
                                        className={`cmp-ch ${selectedChannels.includes(ch.id) ? 'active' : ''}`}
                                        style={{ '--ch': ch.color }}
                                        onClick={() => toggleChannel(ch.id)}
                                    >
                                        {ch.abbr}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text area */}
                        <div className="cmp-textarea-wrap">
                            <textarea
                                className="cmp-textarea"
                                placeholder="What's on your mind? Write your post here…"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={8}
                            />
                            <div className="cmp-counter">
                                <span className={charCount > maxChars ? 'over' : ''}>{charCount}</span>
                                <span className="cmp-counter-max">/ {maxChars}</span>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="cmp-toolbar">
                            <div className="cmp-tools">
                                <button className="cmp-tool" title="Add image">{Ic.image}</button>
                                <button className="cmp-tool" title="Emoji">{Ic.smile}</button>
                                <button className="cmp-tool" title="Hashtags">{Ic.hash}</button>
                                <button className="cmp-tool ai-tool" title="AI Assist" onClick={() => setShowAI(!showAI)}>
                                    {Ic.ai}
                                    <span>AI Assist</span>
                                </button>
                            </div>
                            <div className="cmp-submit">
                                <button className="cmp-btn secondary">
                                    {Ic.clock}
                                    <span>Schedule</span>
                                </button>
                                <button className="cmp-btn primary" disabled={!content.trim() || selectedChannels.length === 0}>
                                    {Ic.send}
                                    <span>Publish</span>
                                </button>
                            </div>
                        </div>

                        {/* AI panel */}
                        {showAI && (
                            <div className="cmp-ai-panel">
                                <div className="ai-head">
                                    <span className="ai-title">{Ic.ai} AI Suggestions</span>
                                    <button className="ai-close" onClick={() => setShowAI(false)}>×</button>
                                </div>
                                <div className="ai-options">
                                    <button className="ai-opt">Improve writing</button>
                                    <button className="ai-opt">Make shorter</button>
                                    <button className="ai-opt">Make more engaging</button>
                                    <button className="ai-opt">Add emojis</button>
                                    <button className="ai-opt">Generate hashtags</button>
                                    <button className="ai-opt">Translate</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Preview column ── */}
                    <div className="cmp-preview anim-c" style={{ '--i': 2 }}>
                        <h3 className="prev-title">Preview</h3>
                        <div className="prev-card">
                            <div className="prev-header">
                                <div className="prev-avatar">F</div>
                                <div>
                                    <span className="prev-name">FlowSync</span>
                                    <span className="prev-handle">@flowsync</span>
                                </div>
                            </div>
                            <p className="prev-content">
                                {content || 'Your post preview will appear here…'}
                            </p>
                            <div className="prev-meta">
                                <span>Just now</span>
                                <span>·</span>
                                <span>{selectedChannels.map(id => channelOptions.find(c => c.id === id)?.abbr).join(', ') || 'No channel'}</span>
                            </div>
                        </div>

                        {/* Quick tips */}
                        <div className="prev-tips">
                            <h4>Tips</h4>
                            <ul>
                                <li>Best time to post on IG: 6–9 PM</li>
                                <li>Use 3–5 relevant hashtags</li>
                                <li>Keep posts under 150 chars for X</li>
                                <li>Add a call-to-action for engagement</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Composer;
