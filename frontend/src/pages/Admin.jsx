import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Users, Search } from 'lucide-react';

const Admin = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Registration state
    const [newUser, setNewUser] = useState({ username: '', password: '', nombre: '', role: 'employee' });
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/admin/history');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegError('');
        setRegSuccess('');
        try {
            await axios.post('/api/auth/register', newUser);
            setRegSuccess('Usuario registrado con éxito');
            setNewUser({ username: '', password: '', nombre: '', role: 'employee' });
        } catch (err) {
            setRegError(err.response?.data?.message || 'Error al registrar');
        }
    };

    const handleDownload = () => {
        window.open('/api/admin/download-excel', '_blank');
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '1.5rem' }}>
                <h1>Panel Admin</h1>
                <button className="btn btn-primary" onClick={handleDownload} style={{ marginBottom: '1rem' }}>
                    <Download size={20} />
                    <span>Descargar Excel Completo</span>
                </button>
            </header>

            {/* NEW: Registration Form */}
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h3>Registrar Nuevo Empleado</h3>
                <form onSubmit={handleRegister} style={{ marginTop: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Nombre Completo"
                        value={newUser.nombre}
                        onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Nombre de Usuario (Login)"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                    />
                    <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '1rem', color: 'white', marginBottom: '1rem' }}
                    >
                        <option value="employee" style={{ background: '#1e293b' }}>Empleado</option>
                        <option value="admin" style={{ background: '#1e293b' }}>Administrador</option>
                    </select>
                    {regError && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{regError}</p>}
                    {regSuccess && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{regSuccess}</p>}
                    <button type="submit" className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        Crear Usuario
                    </button>
                </form>
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input type="text" placeholder="Buscar por empleado en historial..." style={{ marginBottom: '0', border: 'none', background: 'transparent' }} />
                </div>
            </div>

            <h2>Todos los Fichajes</h2>
            <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Fecha</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Horas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((row, i) => (
                                <tr key={i}>
                                    <td>{row.nombre}</td>
                                    <td>{row.fecha}</td>
                                    <td>{row.hora_entrada}</td>
                                    <td>{row.hora_salida || '--:--'}</td>
                                    <td>{row.total_horas_human || '--:--'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
