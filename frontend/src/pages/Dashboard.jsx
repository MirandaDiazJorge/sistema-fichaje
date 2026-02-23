import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // New state for manual time
    const [manualTime, setManualTime] = useState("");

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        // Set initial manual time to current HH:MM
        const now = new Date();
        setManualTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/tracking/status');
            setStatus(res.data.id ? res.data : null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            // Append :00 for seconds if only HH:MM is provided
            const timeToSend = manualTime.length === 5 ? `${manualTime}:00` : manualTime;
            await axios.post('/api/tracking/clock-in', { hora_entrada: timeToSend });
            fetchStatus();
            alert('Entrada registrada correctamente');
        } catch (err) {
            alert(err.response?.data?.message || 'Error al fichar');
        }
    };

    const handleClockOut = async () => {
        try {
            const timeToSend = manualTime.length === 5 ? `${manualTime}:00` : manualTime;
            await axios.post('/api/tracking/clock-out', { hora_salida: timeToSend });
            fetchStatus();
            alert('Salida registrada correctamente');
        } catch (err) {
            alert(err.response?.data?.message || 'Error al fichar');
        }
    };

    if (loading) return <div className="container">Cargando...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Hola, {user.nombre}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{currentTime.toLocaleDateString()}</p>
                </div>
            </header>

            <div className={`status-badge ${status && !status.hora_salida ? 'status-active' : 'status-inactive'}`} style={{ alignSelf: 'center', marginBottom: '2rem' }}>
                {status && !status.hora_salida ? 'Trabajando' : 'Fuera'}
            </div>

            <div className="glass-card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Introduce la hora manualmente:</p>
                <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    style={{ fontSize: '2.5rem', textAlign: 'center', width: 'auto', display: 'inline-block', padding: '0.5rem 1rem' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleClockIn}
                    disabled={!!status}
                    style={{ flexDirection: 'column', height: '120px', backgroundColor: status ? 'var(--bg-card)' : 'var(--primary)' }}
                >
                    <LogIn size={24} />
                    <span>Fichar Entrada</span>
                </button>
                <button
                    className="btn btn-outline"
                    onClick={handleClockOut}
                    disabled={!status || !!status.hora_salida}
                    style={{ flexDirection: 'column', height: '120px', borderColor: status && !status.hora_salida ? 'var(--danger)' : 'var(--glass-border)', color: status && !status.hora_salida ? 'var(--danger)' : 'white' }}
                >
                    <LogOut size={24} />
                    <span>Fichar Salida</span>
                </button>
            </div>

            <div className="glass-card">
                <h3>Jornada de Hoy</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Entrada</span>
                    <span style={{ fontWeight: '600' }}>{status?.hora_entrada || '--:--'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Salida</span>
                    <span style={{ fontWeight: '600' }}>{status?.hora_salida || '--:--'}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>Total hoy</span>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{status?.hora_salida ? '--:--' : 'En curso'}</span>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
