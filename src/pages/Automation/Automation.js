import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Button from '../../components/Button/Button';
import './Automation.css';

const Automation = () => {
    const [rules, setRules] = useState([
        { id: 1, name: 'Smart Reply Assistant', trigger: 'DM received', action: 'Generate AI reply', enabled: true },
        { id: 2, name: 'Lead Qualification', trigger: 'Contains keywords', action: 'Tag as sales lead', enabled: true },
        { id: 3, name: 'Sentiment Analysis', trigger: 'New comment', action: 'Analyze sentiment', enabled: true },
        { id: 4, name: 'Spam Detection', trigger: 'Unknown sender', action: 'Flag for review', enabled: false },
        { id: 5, name: 'Welcome Sequence', trigger: 'New follower', action: 'Send welcome DM', enabled: true }
    ]);

    const toggleRule = (id) => {
        setRules(rules.map(rule =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        ));
    };

    return (
        <div className="automation-layout">
            <Sidebar />

            <main className="automation-main">
                <div className="automation-header">
                    <div>
                        <h1>Automation</h1>
                        <p>AI-powered workflows</p>
                    </div>
                    <Button size="small">New Rule</Button>
                </div>

                <div className="rules-list">
                    {rules.map((rule) => (
                        <div key={rule.id} className="rule-item">
                            <div className="rule-main">
                                <div className="rule-header">
                                    <h3>{rule.name}</h3>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={rule.enabled}
                                            onChange={() => toggleRule(rule.id)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <div className="rule-flow">
                                    <span className="flow-step">IF: {rule.trigger}</span>
                                    <span className="flow-arrow">→</span>
                                    <span className="flow-step">THEN: {rule.action}</span>
                                </div>
                            </div>
                            <div className="rule-actions">
                                <Button variant="ghost" size="small">Edit</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Automation;
