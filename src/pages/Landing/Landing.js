import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/Button/Button';
import RotatingText from '../../components/RotatingText/RotatingText';
import {
    RiTwitterXFill, RiTelegramFill, RiInstagramFill, RiWhatsappFill,
    RiRocketLine, RiShieldCheckLine, RiCalendarScheduleLine, RiMailLine,
    RiBrainLine, RiFlashlightLine, RiLinkM, RiCheckboxCircleLine,
    RiBarChartBoxLine, RiCodeSSlashLine, RiPlugLine, RiComputerLine,
    RiFileTextLine, RiGithubFill, RiTerminalBoxLine,
    RiArrowRightLine, RiQuestionLine, RiLockLine, RiTimeLine,
    RiGroupLine, RiContractLeftRightLine, RiCustomerService2Line
} from 'react-icons/ri';
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

    const platforms = [
        { icon: <RiTwitterXFill size={14} />, name: 'X (Twitter)' },
        { icon: <RiTelegramFill size={14} />, name: 'Telegram' },
        { icon: <RiInstagramFill size={14} />, name: 'Instagram' },
        { icon: <RiWhatsappFill size={14} />, name: 'WhatsApp' },
    ];

    const features = [
        { icon: <RiRocketLine size={22} />, title: 'Multi-Platform', desc: 'Connect all accounts in one place' },
        { icon: <RiBrainLine size={22} />, title: 'AI Assistant', desc: 'Smart drafts with your approval' },
        { icon: <RiFlashlightLine size={22} />, title: 'Automation', desc: 'IF-AI-ACTION workflows' },
        { icon: <RiMailLine size={22} />, title: 'Unified Inbox', desc: 'All messages, one interface' },
        { icon: <RiCalendarScheduleLine size={22} />, title: 'Scheduling', desc: 'Plan posts across platforms' },
        { icon: <RiShieldCheckLine size={22} />, title: 'Compliant', desc: 'Official APIs, encrypted data' },
    ];

    const steps = [
        { num: '01', icon: <RiLinkM size={20} />, title: 'Connect Platforms', desc: 'Link X, Telegram, Instagram & WhatsApp with one-click OAuth. Secure and encrypted.', tags: ['OAuth 2.0', '30 seconds'] },
        { num: '02', icon: <RiFlashlightLine size={20} />, title: 'Build Workflows', desc: 'Create IF-AI-ACTION automations with our visual builder. Cross-platform triggers and actions.', tags: ['Visual builder', 'AI logic'] },
        { num: '03', icon: <RiCheckboxCircleLine size={20} />, title: 'Review & Approve', desc: 'AI drafts replies and content. Review, edit if needed, and approve with one click.', tags: ['Human review', 'One-click'] },
        { num: '04', icon: <RiBarChartBoxLine size={20} />, title: 'Scale & Grow', desc: 'Save 20+ hours per week. Real-time analytics show exactly how automation is performing.', tags: ['20h+ saved', 'Analytics'] },
    ];

    const devFeatures = [
        { icon: <RiCodeSSlashLine size={18} />, title: 'RESTful API', desc: 'Full CRUD operations' },
        { icon: <RiPlugLine size={18} />, title: 'Webhooks', desc: 'Real-time event notifications' },
        { icon: <RiComputerLine size={18} />, title: 'SDKs', desc: 'Node.js, Python, Go' },
        { icon: <RiFileTextLine size={18} />, title: 'Documentation', desc: 'Interactive API docs' },
    ];

    const faqs = [
        { q: 'Is my data secure?', a: 'Yes. We use official APIs and encrypt all data. Your credentials are never stored.' },
        { q: 'Can I try before buying?', a: 'Absolutely. Start with a 14-day free trial, no credit card required.' },
        { q: 'How does AI approval work?', a: 'AI drafts responses. You review and approve before sending. You\'re always in control.' },
        { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime with one click. No questions asked, no hidden fees.' },
        { q: 'Which platforms are supported?', a: 'X (Twitter), Telegram, Instagram, and WhatsApp. More platforms coming soon.' },
        { q: 'Do you offer support?', a: 'Yes. Email support for all plans, priority support for Pro and Enterprise.' },
    ];

    return (
        <div className="landing">
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
                        Automate Social Media<br />
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
                                <RiArrowRightLine size={16} />
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
                            {platforms.map((p, i) => (
                                <div key={i} className="p-icon icon-float" style={{ animationDelay: `${i * 0.1}s` }}>
                                    {p.icon}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="scroll-indicator">
                    <div className="scroll-line"></div>
                </div>
            </section>

            {/* Stats */}
            <section className="stats">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon"><RiGroupLine size={18} /></div>
                            <div className="stat-value">10K+</div>
                            <div className="stat-text">Users</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon"><RiMailLine size={18} /></div>
                            <div className="stat-value">2M+</div>
                            <div className="stat-text">Messages</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon"><RiTimeLine size={18} /></div>
                            <div className="stat-value">95%</div>
                            <div className="stat-text">Time Saved</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon"><RiCustomerService2Line size={18} /></div>
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
                        {features.map((f, i) => (
                            <div key={i} className="feature-card">
                                <div className="f-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
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
                        {platforms.map((p, i) => (
                            <div key={i} className="integration-item">
                                <div className="integration-icon">
                                    {React.cloneElement(p.icon, { size: 20 })}
                                </div>
                                <span>{p.name}</span>
                            </div>
                        ))}
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
                        <div className="price-card">
                            <h3>Starter</h3>
                            <div className="price">
                                <span className="price-num">$29</span>
                                <span className="price-period">/mo</span>
                            </div>
                            <ul className="price-features">
                                <li><RiCheckboxCircleLine size={14} /> 2 platforms</li>
                                <li><RiCheckboxCircleLine size={14} /> 500 messages/mo</li>
                                <li><RiCheckboxCircleLine size={14} /> Basic AI</li>
                            </ul>
                            <Link to="/dashboard">
                                <Button variant="secondary" size="small" className="cursor-target">Start Free</Button>
                            </Link>
                        </div>

                        <div className="price-card price-card-featured">
                            <div className="featured-badge">Popular</div>
                            <h3>Pro</h3>
                            <div className="price">
                                <span className="price-num">$79</span>
                                <span className="price-period">/mo</span>
                            </div>
                            <ul className="price-features">
                                <li><RiCheckboxCircleLine size={14} /> All platforms</li>
                                <li><RiCheckboxCircleLine size={14} /> Unlimited messages</li>
                                <li><RiCheckboxCircleLine size={14} /> Advanced AI</li>
                                <li><RiCheckboxCircleLine size={14} /> Priority support</li>
                            </ul>
                            <Link to="/dashboard">
                                <Button size="small" className="cursor-target">Start Free</Button>
                            </Link>
                        </div>

                        <div className="price-card">
                            <h3>Enterprise</h3>
                            <div className="price">
                                <span className="price-num">Custom</span>
                            </div>
                            <ul className="price-features">
                                <li><RiCheckboxCircleLine size={14} /> Custom integrations</li>
                                <li><RiCheckboxCircleLine size={14} /> Dedicated support</li>
                                <li><RiCheckboxCircleLine size={14} /> SLA guarantee</li>
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
                        {steps.map((step, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <div className="hiw-connector-h" />}
                                <div className="hiw-card">
                                    <div className="hiw-card-header">
                                        <div className="hiw-num"><span>{step.num}</span></div>
                                        <div className="hiw-icon">{step.icon}</div>
                                    </div>
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                    <div className="hiw-tags">
                                        {step.tags.map((t, j) => <span key={j}>{t}</span>)}
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
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
                            {devFeatures.map((d, i) => (
                                <div key={i} className="dev-feature">
                                    <div className="dev-icon">{d.icon}</div>
                                    <div>
                                        <h4>{d.title}</h4>
                                        <p>{d.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="code-example">
                            <div className="code-header">
                                <div className="code-tabs">
                                    <button className={`code-tab ${selectedLang === 'nodejs' ? 'active' : ''}`} onClick={() => setSelectedLang('nodejs')}>Node.js</button>
                                    <button className={`code-tab ${selectedLang === 'python' ? 'active' : ''}`} onClick={() => setSelectedLang('python')}>Python</button>
                                    <button className={`code-tab ${selectedLang === 'go' ? 'active' : ''}`} onClick={() => setSelectedLang('go')}>Go</button>
                                </div>
                                <button className="code-copy">
                                    <RiContractLeftRightLine size={14} />
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
                        <a href="#docs" className="dev-link">
                            <RiFileTextLine size={16} />
                            API Docs
                        </a>
                        <a href="#github" className="dev-link">
                            <RiGithubFill size={16} />
                            GitHub
                        </a>
                        <a href="#examples" className="dev-link">
                            <RiTerminalBoxLine size={16} />
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
                        {faqs.map((f, i) => (
                            <div key={i} className="faq-item">
                                <div className="faq-icon"><RiQuestionLine size={16} /></div>
                                <h3>{f.q}</h3>
                                <p>{f.a}</p>
                            </div>
                        ))}
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
