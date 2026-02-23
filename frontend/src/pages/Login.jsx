import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="container" style={{ paddingTop: '15vh' }}>
            <div className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ background: 'var(--primary)', width: '60px', height: '60px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Clock size={32} color="white" />
                </div>
                <h1>Fichaje Pro</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Control Horario Inteligente</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }}>
                            <User size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ paddingLeft: '3rem' }}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }}>
                            <Lock size={18} />
                        </span>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingLeft: '3rem' }}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary">Entrar</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
