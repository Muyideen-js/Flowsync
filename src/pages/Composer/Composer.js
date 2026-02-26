import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import twitterService from '../../services/twitterService';
import './Composer.css';

/* ── Inline SVG icons — no emojis ── */
const Ic = {
    image: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="16" height="16" /><circle cx="7" cy="7" r="1.5" /><path d="M18 13l-4-4-8 8" /></svg>,
    hash: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 7h12M4 13h12M8 3l-2 14M14 3l-2 14" /></svg>,
    ai: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" /><path d="M15 12l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" /></svg>,
    send: <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2L9 11" /><path d="M18 2l-6 16-3-7-7-3 16-6z" /></svg>,
    clock: <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M10 5v5l3 3" /></svg>,
    copy: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="5" y="5" width="9" height="9" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" /></svg>,
    edit: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3z" /><path d="M9.5 3.5l3 3" /></svg>,
    save: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13.5 5.5v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h6z" /><path d="M9.5 1.5v4h4" /><path d="M5 9l2 2 4-4" /></svg>,
    spark: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1l1.2 3.8L13 6l-3.8 1.2L8 11l-1.2-3.8L3 6l3.8-1.2z" /><path d="M12 10l.6 1.4L14 12l-1.4.6L12 14l-.6-1.4L10 12l1.4-.6z" /></svg>,
    check: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8.5l3.5 3.5 6.5-8" /></svg>,
    refresh: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13.5 2.5v4h-4" /><path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.5l1.6 2" /><path d="M2.5 13.5v-4h4" /><path d="M13.5 8a5.5 5.5 0 0 1-9.4 3.5l-1.6-2" /></svg>,
    eye: <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1.5 10s3.5-6 8.5-6 8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6z" /><circle cx="10" cy="10" r="2.5" /></svg>,
    close: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>,
    write: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3z" /></svg>,
};

const channelOptions = [
    { id: 'instagram', name: 'Instagram', abbr: 'IG', color: '#E4405F' },
    { id: 'twitter', name: 'X (Twitter)', abbr: 'X', color: '#e0e0e0' },
    { id: 'whatsapp', name: 'WhatsApp', abbr: 'WA', color: '#25D366' },
    { id: 'telegram', name: 'Telegram', abbr: 'TG', color: '#0088CC' },
];

const contentTypes = {
    instagram: ['Post', 'Reel', 'Story', 'Carousel'],
    twitter: ['Tweet', 'Thread'],
    whatsapp: ['DM Reply', 'Broadcast', 'Quick Reply'],
    telegram: ['Channel Post', 'Broadcast', 'Group Message'],
};

const toneOptions = ['Professional', 'Casual', 'Humorous', 'Confident', 'Inspirational', 'Luxury'];
const goalOptions = ['Engagement', 'Sales', 'Community', 'Announcement', 'Support', 'Awareness'];

const generateVariations = (content, tone, goal, audience, keywords) => {
    const toneStyles = {
        Professional: ['data-driven', 'authoritative', 'polished'],
        Casual: ['friendly', 'relatable', 'conversational'],
        Humorous: ['witty', 'playful', 'entertaining'],
        Confident: ['bold', 'powerful', 'assertive'],
        Inspirational: ['uplifting', 'motivational', 'visionary'],
        Luxury: ['exclusive', 'refined', 'premium'],
    };
    const hashtagSets = {
        Engagement: '#Engage #Community #GrowTogether',
        Sales: '#SpecialOffer #DealOfTheDay #ShopNow',
        Community: '#JoinUs #Together #BuildCommunity',
        Announcement: '#BigNews #Launch #ComingSoon',
        Support: '#HereToHelp #CustomerFirst #Support',
        Awareness: '#DidYouKnow #Trending #Awareness',
    };
    const style = toneStyles[tone] || toneStyles.Professional;
    const hashtags = hashtagSets[goal] || hashtagSets.Engagement;
    const topic = content.trim() || 'AI-powered social media automation';
    const kw = keywords.trim() || 'automation, AI';
    const aud = audience.trim() || 'tech-savvy professionals';

    return [
        {
            id: 1, label: `${style[0]} approach`, score: 92,
            text: `${topic}\n\nWe're transforming how ${aud} manage their social presence. Our AI handles the heavy lifting so you can focus on what matters.\n\nKey benefits:\n• Save 10+ hours per week\n• ${kw.split(',')[0]?.trim()} powered insights\n• Real-time engagement tracking\n\n${hashtags}`,
        },
        {
            id: 2, label: `${style[1]} approach`, score: 88,
            text: `Ever wished ${topic.toLowerCase()} was effortless?\n\nFor ${aud}, time is everything. That's why we built something special — an AI assistant that adapts to your brand voice.\n\nThe future of ${kw.split(',')[0]?.trim()} is here. Are you ready?\n\n${hashtags}`,
        },
        {
            id: 3, label: `${style[2]} approach`, score: 85,
            text: `Attention ${aud}:\n\n${topic} just got a major upgrade.\n\nHere's what ${kw.split(',')[0]?.trim()} means for you:\n→ Smarter scheduling\n→ AI-generated replies\n→ Cross-platform analytics\n→ One dashboard to rule them all\n\nStart free today\n\n${hashtags}`,
        },
    ];
};

const Composer = () => {
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [content, setContent] = useState('');
    const [selectedChannels, setSelectedChannels] = useState(['instagram']);
    const [selectedType, setSelectedType] = useState('Post');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [variations, setVariations] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [editingVariation, setEditingVariation] = useState(null);
    const [editText, setEditText] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [brandVoice, setBrandVoice] = useState(false);
    const [tone, setTone] = useState('Professional');
    const [goal, setGoal] = useState('Engagement');
    const [audience, setAudience] = useState('');
    const [keywords, setKeywords] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [publishedToast, setPublishedToast] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState('write');

    useEffect(() => { requestAnimationFrame(() => setLoaded(true)); }, []);

    const availableTypes = [...new Set(selectedChannels.flatMap(ch => contentTypes[ch] || []))];
    useEffect(() => {
        if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
            setSelectedType(availableTypes[0]);
        }
    }, [selectedChannels]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleChannel = useCallback((id) => {
        setSelectedChannels(prev =>
            prev.includes(id) ? (prev.length > 1 ? prev.filter(c => c !== id) : prev) : [...prev, id]
        );
    }, []);

    const charCount = content.length;
    const maxChars = selectedChannels.includes('twitter') ? 280 : 2200;
    const overLimit = charCount > maxChars;

    const handleGenerate = useCallback(() => {
        setAiGenerating(true);
        setVariations([]);
        setSelectedVariation(null);
        setTimeout(() => {
            setVariations(generateVariations(content, tone, goal, audience, keywords));
            setAiGenerating(false);
        }, 1600);
    }, [content, tone, goal, audience, keywords]);

    const applyVariation = useCallback((v) => {
        setContent(v.text);
        setSelectedVariation(v.id);
        setActiveTab('write');
    }, []);

    const startEdit = useCallback((v) => { setEditingVariation(v.id); setEditText(v.text); }, []);
    const saveEdit = useCallback(() => {
        setVariations(prev => prev.map(v => v.id === editingVariation ? { ...v, text: editText } : v));
        setEditingVariation(null);
    }, [editingVariation, editText]);

    const copyVariation = useCallback((v) => {
        navigator.clipboard.writeText(v.text);
        setCopiedId(v.id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const handlePublish = useCallback(async () => {
        if (!content.trim() || selectedChannels.length === 0 || publishing) return;
        setPublishing(true);

        const results = [];
        const errors = [];

        // Post to X/Twitter if selected
        if (selectedChannels.includes('twitter')) {
            try {
                const token = await user.getIdToken();
                const res = await twitterService.postTweet(content, token);
                if (res.success) {
                    results.push('X');
                } else {
                    errors.push(`X: ${res.error || 'Failed'}`);
                }
            } catch (err) {
                errors.push(`X: ${err.response?.data?.error || err.message}`);
            }
        }

        // Other platforms — placeholder for future
        const otherChannels = selectedChannels.filter(c => c !== 'twitter');
        if (otherChannels.length > 0) {
            const labels = otherChannels.map(c => channelOptions.find(o => o.id === c)?.abbr).join(', ');
            results.push(labels + ' (queued)');
        }

        setPublishing(false);

        if (errors.length > 0) {
            setPublishedToast(`Error: ${errors.join('; ')}`);
        } else {
            setPublishedToast(`Published to ${results.join(', ')}`);
        }
        setTimeout(() => setPublishedToast(''), 4000);
    }, [content, selectedChannels, publishing, user]);

    const contentScore = Math.min(
        Math.round(
            (charCount > 50 ? 30 : 0) +
            (content.includes('#') ? 25 : 0) +
            (content.length > 100 ? 25 : 0) +
            (content.includes('?') ? 20 : 0)
        ), 100
    );

    return (
        <MainLayout>
            <div className={`cs-root ${loaded ? 'loaded' : ''}`}>

                {/* ══ WORKSPACE (left panel) ════════════════ */}
                <div className="cs-workspace">

                    {/* — Tab row — */}
                    <div className="cs-topbar cs-anim" style={{ '--i': 0 }}>
                        <div className="cs-tabs">
                            <button className={`cs-tab ${activeTab === 'write' ? 'active' : ''}`} onClick={() => setActiveTab('write')}>
                                <span className="cs-tab-ic">{Ic.write}</span>
                                Write
                            </button>
                            <button className={`cs-tab cs-tab-ai ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
                                <span className="cs-tab-ic">{Ic.ai}</span>
                                AI Studio
                            </button>
                        </div>
                        <div className="cs-topbar-right">
                            <label className="cs-brand-toggle">
                                <input type="checkbox" checked={brandVoice} onChange={() => setBrandVoice(v => !v)} />
                                <span className="cs-brand-track" />
                                <span className="cs-brand-text">{Ic.spark} Brand Voice</span>
                            </label>
                            <button className={`cs-preview-btn ${showPreview ? 'active' : ''}`} onClick={() => setShowPreview(v => !v)}>
                                {Ic.eye}
                                <span>Preview</span>
                            </button>
                        </div>
                    </div>

                    {/* — Channel row — */}
                    <div className="cs-channel-bar cs-anim" style={{ '--i': 1 }}>
                        <span className="cs-label">Publish to</span>
                        <div className="cs-channels">
                            {channelOptions.map(ch => (
                                <button
                                    key={ch.id}
                                    className={`cs-ch ${selectedChannels.includes(ch.id) ? 'active' : ''}`}
                                    style={{ '--ch': ch.color }}
                                    onClick={() => toggleChannel(ch.id)}
                                >
                                    {ch.abbr}
                                </button>
                            ))}
                        </div>
                        {availableTypes.length > 0 && (
                            <>
                                <span className="cs-label cs-label-gap">Type</span>
                                <div className="cs-types">
                                    {availableTypes.map(t => (
                                        <button key={t} className={`cs-type ${selectedType === t ? 'active' : ''}`} onClick={() => setSelectedType(t)}>{t}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── WRITE TAB ── */}
                    {activeTab === 'write' && (
                        <div className="cs-write-panel cs-anim" style={{ '--i': 2 }}>
                            <div className="cs-editor-wrap">
                                <textarea
                                    className="cs-editor"
                                    placeholder={`Write your ${selectedType.toLowerCase()} here...\n\nSwitch to AI Studio to generate content ideas.`}
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                                {brandVoice && (
                                    <div className="cs-brand-badge">
                                        {Ic.spark} Brand Voice Active
                                    </div>
                                )}
                            </div>

                            <div className="cs-toolbar">
                                <div className="cs-tools-left">
                                    <button className="cs-tool" title="Add image">{Ic.image}</button>
                                    <button className="cs-tool" title="Hashtags">{Ic.hash}</button>
                                    <span className={`cs-char-count ${overLimit ? 'over' : ''}`}>
                                        {charCount}<span className="cs-char-max">/{maxChars}</span>
                                    </span>
                                </div>
                                <div className="cs-tools-right">
                                    <button className="cs-btn secondary">
                                        {Ic.save} <span>Draft</span>
                                    </button>
                                    <button className="cs-btn secondary">
                                        {Ic.clock} <span>Schedule</span>
                                    </button>
                                    <button
                                        className="cs-btn primary"
                                        disabled={!content.trim() || selectedChannels.length === 0 || overLimit || publishing}
                                        onClick={handlePublish}
                                    >
                                        {Ic.send} <span>{publishing ? 'Publishing…' : 'Publish'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── AI STUDIO TAB ── */}
                    {activeTab === 'ai' && (
                        <div className="cs-ai-panel cs-anim" style={{ '--i': 2 }}>
                            <div className="cs-ai-controls">
                                <div className="cs-ai-row">
                                    <div className="cs-ai-group">
                                        <label>Tone</label>
                                        <div className="cs-pills">
                                            {toneOptions.map(t => (
                                                <button key={t} className={`cs-pill ${tone === t ? 'active' : ''}`} onClick={() => setTone(t)}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="cs-ai-group">
                                        <label>Goal</label>
                                        <div className="cs-pills">
                                            {goalOptions.map(g => (
                                                <button key={g} className={`cs-pill ${goal === g ? 'active' : ''}`} onClick={() => setGoal(g)}>{g}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="cs-ai-row">
                                    <div className="cs-ai-group">
                                        <label>Target Audience</label>
                                        <input className="cs-ai-input" type="text" placeholder="e.g. Tech founders, Gen Z creators" value={audience} onChange={e => setAudience(e.target.value)} />
                                    </div>
                                    <div className="cs-ai-group">
                                        <label>Keywords</label>
                                        <input className="cs-ai-input" type="text" placeholder="e.g. AI, automation, productivity" value={keywords} onChange={e => setKeywords(e.target.value)} />
                                    </div>
                                </div>
                                {brandVoice && (
                                    <div className="cs-brand-note">
                                        {Ic.spark} Brand voice is <strong>active</strong> — AI will match your saved tone and style
                                    </div>
                                )}
                                <button className="cs-generate-btn" onClick={handleGenerate} disabled={aiGenerating}>
                                    {aiGenerating ? (
                                        <><span className="cs-spinner" /> Generating...</>
                                    ) : (
                                        <>{Ic.ai} Generate 3 Variations</>
                                    )}
                                </button>
                            </div>

                            {variations.length > 0 && (
                                <div className="cs-variations">
                                    <div className="cs-var-header">
                                        <span>Generated Variations</span>
                                        <button className="cs-regen" onClick={handleGenerate}>{Ic.refresh} Regenerate</button>
                                    </div>
                                    <div className="cs-var-grid">
                                        {variations.map(v => (
                                            <div key={v.id} className={`cs-var-card ${selectedVariation === v.id ? 'selected' : ''}`}>
                                                <div className="cs-var-top">
                                                    <span className="cs-var-label">{v.label}</span>
                                                    <span className="cs-var-score">{v.score}%</span>
                                                </div>
                                                {editingVariation === v.id ? (
                                                    <div className="cs-var-edit">
                                                        <textarea className="cs-var-textarea" value={editText} onChange={e => setEditText(e.target.value)} rows={5} />
                                                        <div className="cs-var-edit-actions">
                                                            <button className="cs-var-act use" onClick={saveEdit}>{Ic.check} Save</button>
                                                            <button className="cs-var-act" onClick={() => setEditingVariation(null)}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="cs-var-text">{v.text}</p>
                                                )}
                                                <div className="cs-var-actions">
                                                    <button className="cs-var-act use" onClick={() => applyVariation(v)}>
                                                        {selectedVariation === v.id ? <>{Ic.check} Applied</> : 'Use this'}
                                                    </button>
                                                    <button className="cs-var-act" onClick={() => startEdit(v)}>{Ic.edit} Edit</button>
                                                    <button className="cs-var-act" onClick={() => copyVariation(v)}>
                                                        {copiedId === v.id ? <>{Ic.check} Copied</> : <>{Ic.copy} Copy</>}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ══ PREVIEW PANEL (right) ════════════════ */}
                {showPreview && (
                    <div className="cs-preview-panel cs-anim" style={{ '--i': 1 }}>
                        <div className="cs-prev-header">
                            <h3>Live Preview</h3>
                            <button className="cs-prev-close" onClick={() => setShowPreview(false)}>{Ic.close}</button>
                        </div>
                        <div className="cs-prev-scroll">
                            {selectedChannels.map(chId => {
                                const ch = channelOptions.find(c => c.id === chId);
                                return (
                                    <div key={chId} className="cs-prev-card" style={{ '--ch': ch.color }}>
                                        <div className="cs-prev-card-header">
                                            <div className="cs-prev-avatar">{ch.abbr.charAt(0)}</div>
                                            <div className="cs-prev-info">
                                                <span className="cs-prev-name">FlowSync</span>
                                                <span className="cs-prev-handle">@flowsync · {ch.name}</span>
                                            </div>
                                            <span className="cs-prev-ch-label">{ch.abbr}</span>
                                        </div>
                                        <p className="cs-prev-content">
                                            {content || `Your ${selectedType.toLowerCase()} will appear here...`}
                                        </p>
                                        <div className="cs-prev-meta">
                                            <span>Just now</span>
                                            <span>·</span>
                                            <span>{selectedType}</span>
                                        </div>
                                        <div className="cs-prev-stats">
                                            <span>0 Likes</span>
                                            <span>0 Comments</span>
                                            <span>0 Shares</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {content.trim() && (
                                <div className="cs-score-card">
                                    <div className="cs-score-row">
                                        <span className="cs-score-heading">Content Score</span>
                                        <span className="cs-score-num">{contentScore}/100</span>
                                    </div>
                                    <div className="cs-score-track">
                                        <div className="cs-score-fill" style={{ width: `${contentScore}%`, background: contentScore >= 70 ? '#00c93a' : contentScore >= 40 ? '#f59e0b' : '#ef4444' }} />
                                    </div>
                                    <div className="cs-score-items">
                                        {[
                                            { label: 'Length', pass: charCount > 50, msg: charCount > 50 ? 'Good' : 'Too short' },
                                            { label: 'Hashtags', pass: content.includes('#'), msg: content.includes('#') ? 'Found' : 'Missing' },
                                            { label: 'Body length', pass: content.length > 100, msg: content.length > 100 ? 'Good' : 'Too brief' },
                                            { label: 'CTA', pass: content.includes('?'), msg: content.includes('?') ? 'Found' : 'Add one' },
                                        ].map((s, i) => (
                                            <div key={i} className="cs-score-item">
                                                <span className="cs-score-dot" style={{ background: s.pass ? '#00c93a' : '#f59e0b' }} />
                                                <span>{s.label}: {s.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="cs-tips">
                                <h4>{selectedType} Tips</h4>
                                <ul>
                                    {selectedType === 'Tweet' || selectedType === 'Thread' ? (
                                        <><li>Keep under 280 chars for tweets</li><li>Use 1-2 hashtags on X</li><li>Ask a question to boost engagement</li><li>Tag relevant accounts for reach</li></>
                                    ) : selectedType === 'Reel' || selectedType === 'Story' ? (
                                        <><li>Keep text overlay short</li><li>Use trending audio for Reels</li><li>Add CTA in first 3 seconds</li><li>Use 3-5 relevant hashtags</li></>
                                    ) : selectedType === 'Broadcast' ? (
                                        <><li>Keep broadcasts concise</li><li>Send during business hours</li><li>Include a clear CTA</li><li>Personalize with {'{{name}}'}</li></>
                                    ) : (
                                        <><li>Best time: 6-9 PM local</li><li>Use 3-5 relevant hashtags</li><li>Start with a strong hook</li><li>End with a call-to-action</li></>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {publishedToast && (
                    <div className="cs-toast">{Ic.check} {publishedToast}</div>
                )}
            </div>
        </MainLayout >
    );
};

export default Composer;
