import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import CommandCenter from './pages/CommandCenter/CommandCenter';
import Accounts from './pages/Accounts/Accounts';
import Dashboard from './pages/Dashboard/Dashboard';
import Inbox from './pages/Inbox/Inbox';
import Automation from './pages/Automation/Automation';
import Scheduling from './pages/Scheduling/Scheduling';
import Composer from './pages/Composer/Composer';
import Mentions from './pages/Mentions/Mentions';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Logs from './pages/Logs/Logs';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<CommandCenter />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/old-dashboard" element={<Dashboard />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/mentions" element={<Mentions />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/composer" element={<Composer />} />
                <Route path="/scheduler" element={<Scheduling />} />
                <Route path="/scheduling" element={<Scheduling />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
