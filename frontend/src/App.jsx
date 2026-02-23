import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home, History as HistoryIcon, User, Settings, LogOut } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Admin from './pages/Admin';

const PrivateRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return children;

    return (
        <>
            <main style={{ paddingBottom: '90px' }}>{children}</main>
            <nav className="nav">
                <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <Home size={24} />
                    <span>Inicio</span>
                </Link>
                <Link to="/history" className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
                    <HistoryIcon size={24} />
                    <span>Historial</span>
                </Link>
                {user.role === 'admin' && (
                    <Link to="/admin" className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}>
                        <Settings size={24} />
                        <span>Admin</span>
                    </Link>
                )}
                <button onClick={logout} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={24} />
                    <span>Salir</span>
                </button>
            </nav>
        </>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                        <Route path="/admin" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>} />
                    </Routes>
                </Layout>
            </AuthProvider>
        </Router>
    );
}

export default App;
