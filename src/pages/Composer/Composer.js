import React, { useState, useEffect, useCallback } from 'react';
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
    copy: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" /></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3z" /><path d="M9.5 3.5l3 3" /></svg>,
    save: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13.5 5.5v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h6z" /><path d="M9.5 1.5v4h4" /><path d="M5 9l2 2 4-4" /></svg>,
    spark: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1l1.2 3.8L13 6l-3.8 1.2L8 11l-1.2-3.8L3 6l3.8-1.2z" /><path d="M12 10l.6 1.4L14 12l-1.4.6L12 14l-.6-1.4L10 12l1.4-.6z" /></svg>,
    check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-8" /></svg>,
    refresh: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13.5 2.5v4h-4" /><path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.5l1.6 2" /><path d="M2.5 13.5v-4h4" /><path d="M13.5 8a5.5 5.5 0 0 1-9.4 3.5l-1.6-2" /></svg>,
};

/* ── Channel & content type config ── */
const channelOptions = [
    { id: 'instagram', name: 'Instagram', abbr: 'IG', color: '#E4405F' },
    { id: 'twitter', name: 'X (Twitter)', abbr: 'X', color: '#1DA1F2' },
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

/* ── Mock AI generation ── */
const generateVariations = (content, tone, goal, audience, keywords, channels) => {
    const toneStyles = {
        Professional: ['data-driven', 'authoritative', 'polished'],
        Casual: ['friendly', 'relatable', 'conversational'],
        Humorous: ['witty', 'playful', 'entertaining'],
        Confident: ['bold', 'powerful', 'assertive'],
        Inspirational: ['uplifting', 'motivational', 'visionary'],
        Luxury: ['exclusive', 'refined', 'premium'],
    };

    const hashtagSets = {
        Engagement: '#Engage #Community #GrowTogether #SocialMedia',
        Sales: '#SpecialOffer #DealOfTheDay #ShopNow #Limited',
        Community: '#JoinUs #Together #BuildCommunity #Share',
        Announcement: '#BigNews #Launch #ComingSoon #Exciting',
        Support: '#HereToHelp #CustomerFirst #Support #FAQ',
        Awareness: '#DidYouKnow #Trending #BreakingNews #Awareness',
    };

    const style = toneStyles[tone] || toneStyles.Professional;
    const hashtags = hashtagSets[goal] || hashtagSets.Engagement;
    const topic = content.trim() || 'AI-powered social media automation';
    const kw = keywords.trim() || 'automation, AI';
    const aud = audience.trim() || 'tech-savvy professionals';

    return [
        {
            id: 1,
            label: `${style[0]} approach`,
            text: `🚀 ${topic}\n\nWe're transforming how ${aud} manage their social presence. Our AI handles the heavy lifting so you can focus on what matters.\n\nKey benefits:\n• Save 10+ hours per week\n• ${kw.split(',')[0]?.trim()} powered insights\n• Real-time engagement tracking\n\n${hashtags}`,
            score: 92,
        },
        {
            id: 2,
            label: `${style[1]} approach`,
            text: `💡 Ever wished ${topic.toLowerCase()} was effortless?\n\nFor ${aud}, time is everything. That's why we built something special — an AI assistant that adapts to your brand voice, schedules at peak hours, and responds to your audience instantly.\n\nThe future of ${kw.split(',')[0]?.trim()} is here. Are you ready?\n\n${hashtags}`,
            score: 88,
        },
        {
            id: 3,
            label: `${style[2]} approach`,
            text: `✨ Attention ${aud}:\n\n${topic} just got a major upgrade.\n\nHere's what ${kw.split(',')[0]?.trim()} means for you:\n→ Smarter scheduling\n→ AI-generated replies\n→ Cross-platform analytics\n→ One dashboard to rule them all\n\nStart free today 👇\n\n${hashtags}`,
            score: 85,
        },
    ];
};

const Composer = () => {
    const [loaded, setLoaded] = useState(false);
    const [content, setContent] = useState('');
    const [selectedChannels, setSelectedChannels] = useState(['instagram']);
    const [selectedType, setSelectedType] = useState('Post');
    const [showAI, setShowAI] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [variations, setVariations] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [editingVariation, setEditingVariation] = useState(null);
    const [editText, setEditText] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [brandVoice, setBrandVoice] = useState(false);
    const [publishedToast, setPublishedToast] = useState('');

    /* AI control states */
    const [tone, setTone] = useState('Professional');
    const [goal, setGoal] = useState('Engagement');
    const [audience, setAudience] = useState('');
    const [keywords, setKeywords] = useState('');

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    /* Available content types based on selected channels */
    const availableTypes = [...new Set(
        selectedChannels.flatMap(ch => contentTypes[ch] || [])
    )];

    /* Fix selected type when channels change */
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

    /* AI Generation */
    const handleGenerate = useCallback(() => {
        setAiGenerating(true);
        setVariations([]);
        setSelectedVariation(null);
        setTimeout(() => {
            const v = generateVariations(content, tone, goal, audience, keywords, selectedChannels);
            setVariations(v);
            setAiGenerating(false);
        }, 1800);
    }, [content, tone, goal, audience, keywords, selectedChannels]);

    /* Apply variation */
    const applyVariation = useCallback((v) => {
        setContent(v.text);
        setSelectedVariation(v.id);
    }, []);

    /* Edit variation inline */
    const startEdit = useCallback((v) => {
        setEditingVariation(v.id);
        setEditText(v.text);
    }, []);

    const saveEdit = useCallback(() => {
        setVariations(prev => prev.map(v =>
            v.id === editingVariation ? { ...v, text: editText } : v
        ));
        setEditingVariation(null);
    }, [editingVariation, editText]);

    /* Copy to clipboard */
    const copyVariation = useCallback((v) => {
        navigator.clipboard.writeText(v.text);
        setCopiedId(v.id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    /* Publish toast */
    const handlePublish = useCallback(() => {
        if (!content.trim() || selectedChannels.length === 0) return;
        setPublishedToast(`Published to ${selectedChannels.map(c => channelOptions.find(o => o.id === c)?.abbr).join(', ')}!`);
        setTimeout(() => setPublishedToast(''), 3000);
    }, [content, selectedChannels]);

    return (
        <MainLayout>
            <div className={`composer ${loaded ? 'loaded' : ''}`}>
                {/* ── Header ── */}
                <div className="cmp-head anim-c" style={{ '--i': 0 }}>
                    <div>
                        <h1>AI Content Studio</h1>
                        <p>Create, generate, and publish content across all channels</p>
                    </div>
                    <div className="cmp-head-right">
                        <label className="cmp-brand-toggle">
                            <input type="checkbox" checked={brandVoice} onChange={() => setBrandVoice(!brandVoice)} />
                            <span className="cmp-brand-slider" />
                            <span className="cmp-brand-label">{Ic.spark} Brand Voice</span>
                        </label>
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

                        {/* Content type selector */}
                        {availableTypes.length > 0 && (
                            <div className="cmp-types">
                                <span className="cmp-label">Content type</span>
                                <div className="cmp-type-row">
                                    {availableTypes.map(t => (
                                        <button
                                            key={t}
                                            className={`cmp-type ${selectedType === t ? 'active' : ''}`}
                                            onClick={() => setSelectedType(t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Text area */}
                        <div className="cmp-textarea-wrap">
                            <textarea
                                className="cmp-textarea"
                                placeholder={`Write your ${selectedType.toLowerCase()} here… or use AI to generate content below`}
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
                                    <span>AI Studio</span>
                                </button>
                            </div>
                            <div className="cmp-submit">
                                <button className="cmp-btn secondary">
                                    {Ic.save}
                                    <span>Template</span>
                                </button>
                                <button className="cmp-btn secondary">
                                    {Ic.clock}
                                    <span>Schedule</span>
                                </button>
                                <button
                                    className="cmp-btn primary"
                                    disabled={!content.trim() || selectedChannels.length === 0}
                                    onClick={handlePublish}
                                >
                                    {Ic.send}
                                    <span>Publish</span>
                                </button>
                            </div>
                        </div>

                        {/* ── AI Controls Panel ── */}
                        {showAI && (
                            <div className="cmp-ai-panel">
                                <div className="ai-head">
                                    <span className="ai-title">{Ic.ai} AI Content Generator</span>
                                    <button className="ai-close" onClick={() => setShowAI(false)}>×</button>
                                </div>

                                <div className="ai-controls">
                                    {/* Tone selector */}
                                    <div className="ai-control-group">
                                        <label className="ai-ctrl-label">Tone</label>
                                        <div className="ai-pills">
                                            {toneOptions.map(t => (
                                                <button
                                                    key={t}
                                                    className={`ai-pill ${tone === t ? 'active' : ''}`}
                                                    onClick={() => setTone(t)}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Goal selector */}
                                    <div className="ai-control-group">
                                        <label className="ai-ctrl-label">Goal</label>
                                        <div className="ai-pills">
                                            {goalOptions.map(g => (
                                                <button
                                                    key={g}
                                                    className={`ai-pill ${goal === g ? 'active' : ''}`}
                                                    onClick={() => setGoal(g)}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text inputs */}
                                    <div className="ai-input-row">
                                        <div className="ai-input-group">
                                            <label className="ai-ctrl-label">Target audience</label>
                                            <input
                                                className="ai-input"
                                                type="text"
                                                placeholder="e.g. Tech founders, Gen Z creators"
                                                value={audience}
                                                onChange={e => setAudience(e.target.value)}
                                            />
                                        </div>
                                        <div className="ai-input-group">
                                            <label className="ai-ctrl-label">Keywords</label>
                                            <input
                                                className="ai-input"
                                                type="text"
                                                placeholder="e.g. AI, automation, productivity"
                                                value={keywords}
                                                onChange={e => setKeywords(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Brand voice indicator */}
                                    {brandVoice && (
                                        <div className="ai-brand-note">
                                            {Ic.spark} Brand voice is <strong>active</strong> — AI will match your saved tone and style
                                        </div>
                                    )}

                                    {/* Generate button */}
                                    <button
                                        className="ai-generate-btn"
                                        onClick={handleGenerate}
                                        disabled={aiGenerating}
                                    >
                                        {aiGenerating ? (
                                            <>
                                                <span className="ai-spinner" />
                                                Generating…
                                            </>
                                        ) : (
                                            <>
                                                {Ic.ai}
                                                Generate 3 Variations
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* ── AI Variations Output ── */}
                                {variations.length > 0 && (
                                    <div className="ai-variations">
                                        <div className="ai-var-header">
                                            <span className="ai-var-title">Generated Variations</span>
                                            <button className="ai-regen" onClick={handleGenerate}>
                                                {Ic.refresh} Regenerate
                                            </button>
                                        </div>
                                        {variations.map(v => (
                                            <div
                                                key={v.id}
                                                className={`ai-var-card ${selectedVariation === v.id ? 'selected' : ''}`}
                                            >
                                                <div className="ai-var-top">
                                                    <span className="ai-var-label">{v.label}</span>
                                                    <span className="ai-var-score">
                                                        {v.score}% match
                                                    </span>
                                                </div>

                                                {editingVariation === v.id ? (
                                                    <div className="ai-var-edit">
                                                        <textarea
                                                            className="ai-var-textarea"
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            rows={5}
                                                        />
                                                        <div className="ai-var-edit-actions">
                                                            <button className="ai-var-action" onClick={saveEdit}>
                                                                {Ic.check} Save
                                                            </button>
                                                            <button className="ai-var-action" onClick={() => setEditingVariation(null)}>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="ai-var-text">{v.text}</p>
                                                )}

                                                <div className="ai-var-actions">
                                                    <button className="ai-var-action use" onClick={() => applyVariation(v)}>
                                                        {selectedVariation === v.id ? <>{Ic.check} Applied</> : 'Use this'}
                                                    </button>
                                                    <button className="ai-var-action" onClick={() => startEdit(v)}>
                                                        {Ic.edit} Edit
                                                    </button>
                                                    <button className="ai-var-action" onClick={() => copyVariation(v)}>
                                                        {copiedId === v.id ? <>{Ic.check} Copied!</> : <>{Ic.copy} Copy</>}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Preview column ── */}
                    <div className="cmp-preview anim-c" style={{ '--i': 2 }}>
                        <h3 className="prev-title">Live Preview</h3>

                        {/* Platform-specific previews */}
                        {selectedChannels.map(chId => {
                            const ch = channelOptions.find(c => c.id === chId);
                            return (
                                <div key={chId} className="prev-card" style={{ '--ch': ch.color }}>
                                    <div className="prev-header">
                                        <div className="prev-avatar" style={{ background: ch.color }}>
                                            {ch.abbr.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="prev-name">FlowSync</span>
                                            <span className="prev-handle">@flowsync · {ch.name}</span>
                                        </div>
                                        <span className="prev-badge" style={{ background: ch.color }}>{ch.abbr}</span>
                                    </div>
                                    <p className="prev-content">
                                        {content || `Your ${selectedType.toLowerCase()} preview will appear here…`}
                                    </p>
                                    <div className="prev-meta">
                                        <span>Just now</span>
                                        <span>·</span>
                                        <span>{selectedType}</span>
                                    </div>
                                    <div className="prev-engagement">
                                        <span>❤️ 0</span>
                                        <span>💬 0</span>
                                        <span>🔄 0</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* AI Score Card */}
                        {content.trim() && (
                            <div className="prev-score-card">
                                <h4>Content Score</h4>
                                <div className="prev-score-ring">
                                    <svg viewBox="0 0 36 36" className="score-svg">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" stroke="var(--accent)" strokeWidth="3"
                                            strokeDasharray={`${Math.min(charCount / maxChars * 100, 100)} 100`}
                                            strokeLinecap="round" />
                                    </svg>
                                    <span className="score-number">{Math.min(Math.round(charCount / maxChars * 100), 100)}</span>
                                </div>
                                <div className="prev-score-details">
                                    <div className="score-item">
                                        <span className="score-dot" style={{ background: charCount > 50 ? '#00c93a' : '#ff6b6b' }} />
                                        <span>Length: {charCount > 50 ? 'Good' : 'Too short'}</span>
                                    </div>
                                    <div className="score-item">
                                        <span className="score-dot" style={{ background: content.includes('#') ? '#00c93a' : '#ffa726' }} />
                                        <span>Hashtags: {content.includes('#') ? 'Found' : 'Missing'}</span>
                                    </div>
                                    <div className="score-item">
                                        <span className="score-dot" style={{ background: /[🚀💡✨❤️🎯🔥]/.test(content) ? '#00c93a' : '#ffa726' }} />
                                        <span>Emojis: {/[🚀💡✨❤️🎯🔥]/.test(content) ? 'Found' : 'Consider adding'}</span>
                                    </div>
                                    <div className="score-item">
                                        <span className="score-dot" style={{ background: content.includes('?') || content.includes('👇') ? '#00c93a' : '#ffa726' }} />
                                        <span>CTA: {content.includes('?') || content.includes('👇') ? 'Found' : 'Add one'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick tips */}
                        <div className="prev-tips">
                            <h4>Tips for {selectedType}</h4>
                            <ul>
                                {selectedType === 'Tweet' || selectedType === 'Thread' ? (
                                    <>
                                        <li>Keep under 280 characters for tweets</li>
                                        <li>Use 1-2 hashtags max on X</li>
                                        <li>Ask a question to boost engagement</li>
                                        <li>Tag relevant accounts for reach</li>
                                    </>
                                ) : selectedType === 'Reel' || selectedType === 'Story' ? (
                                    <>
                                        <li>Keep text overlay short and readable</li>
                                        <li>Use trending audio for Reels</li>
                                        <li>Add CTA in the first 3 seconds</li>
                                        <li>Use 3-5 relevant hashtags</li>
                                    </>
                                ) : selectedType === 'Broadcast' ? (
                                    <>
                                        <li>Keep broadcasts concise and actionable</li>
                                        <li>Personalize with {"{{name}}"} variables</li>
                                        <li>Send during business hours</li>
                                        <li>Include a clear call-to-action</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Best time to post: 6–9 PM local</li>
                                        <li>Use 3–5 relevant hashtags</li>
                                        <li>Start with a hook to grab attention</li>
                                        <li>End with a call-to-action</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Toast notification */}
                {publishedToast && (
                    <div className="cmp-toast">
                        {Ic.check} {publishedToast}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Composer;
