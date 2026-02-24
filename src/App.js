import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import CommandCenter from './pages/CommandCenter/CommandCenter';
import Accounts from './pages/Accounts/Accounts';
import Dashboard from './pages/Dashboard/Dashboard';
import Inbox from './pages/Inbox/Inbox';
import Scheduling from './pages/Scheduling/Scheduling';
import Composer from './pages/Composer/Composer';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Logs from './pages/Logs/Logs';
import Developer from './pages/Developer/Developer';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected */}
                    <Route path="/dashboard" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
                    <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                    <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/composer" element={<ProtectedRoute><Composer /></ProtectedRoute>} />
                    <Route path="/scheduler" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
                    <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
                    <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
                    <Route path="/developer" element={<ProtectedRoute><Developer /></ProtectedRoute>} />

                    {/* Legacy / old routes → redirects */}
                    <Route path="/old-dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/mentions" element={<Navigate to="/inbox" replace />} />
                    <Route path="/automation" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/broadcasts" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/templates" element={<Navigate to="/composer" replace />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
