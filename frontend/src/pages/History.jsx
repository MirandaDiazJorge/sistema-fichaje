import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Filter, FileText, Edit2 } from 'lucide-react';

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingSession, setEditingSession] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const endpoint = user.role === 'admin' ? '/api/admin/history' : '/api/tracking/history';
                const res = await axios.get(endpoint);
                setHistory(res.data);
                setFilteredHistory(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user.role]);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredHistory(history);
        } else {
            const filtered = history.filter(item =>
                (item.nombre && item.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.employee_id && item.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.fecha && item.fecha.includes(searchTerm))
            );
            setFilteredHistory(filtered);
        }
    }, [searchTerm, history]);

    const handleEdit = (session) => {
        setEditingSession({ ...session });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`/api/tracking/session/${editingSession.id}`, {
                hora_entrada: editingSession.in,
                hora_salida: editingSession.out
            });
            // Refresh history
            const endpoint = user.role === 'admin' ? '/api/admin/history' : '/api/tracking/history';
            const res = await axios.get(endpoint);
            setHistory(res.data);
            setEditingSession(null);
        } catch (err) {
            console.error(err);
            alert("Error al actualizar la sesión");
        }
    };

    // Aggregate by Employee + Date
    const groupedData = filteredHistory.reduce((acc, curr) => {
        const key = `${curr.employee_id}_${curr.fecha}`;
        if (!acc[key]) {
            acc[key] = { ...curr, sessions: [], total_decimal: 0 };
        }
        acc[key].sessions.push({
            id: curr.id,
            in: curr.hora_entrada,
            out: curr.hora_salida,
            fecha: curr.fecha
        });
        acc[key].total_decimal += parseFloat(curr.total_horas_decimal || 0);
        return acc;
    }, {});

    const finalHistory = Object.values(groupedData).sort((a, b) => b.fecha.localeCompare(a.fecha)).map(item => {
        const hrs = Math.floor(item.total_decimal);
        const mins = Math.round((item.total_decimal - hrs) * 60);
        return {
            ...item,
            total_human: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
        };
    });

    return (
        <div className="container-lg" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h1>{user.role === 'admin' ? 'Historial Global' : 'Mi Historial'}</h1>
            </header>

            <div className="glass-card" style={{ padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, ID o fecha..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginBottom: '0', border: 'none', background: 'transparent', width: '100%' }}
                />
            </div>

            {loading ? (
                <p>Cargando registros...</p>
            ) : (
                <div className="glass-card" style={{ padding: '0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    {user.role === 'admin' && <th style={{ whiteSpace: 'nowrap' }}>Empleado</th>}
                                    <th style={{ whiteSpace: 'nowrap' }}>Fecha</th>
                                    <th style={{ whiteSpace: 'nowrap' }}>Sesiones (In - Out)</th>
                                    <th style={{ whiteSpace: 'nowrap' }}>Total Día</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalHistory.map((row, i) => (
                                    <tr key={i}>
                                        {user.role === 'admin' && <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{row.nombre || row.employee_id}</td>}
                                        <td style={{ whiteSpace: 'nowrap' }}>{row.fecha}</td>
                                        <td style={{ fontSize: '0.75rem' }}>
                                            {row.sessions.map((s, idx) => (
                                                <div key={idx} style={{
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '1rem',
                                                    padding: '2px 0'
                                                }}>
                                                    <span>{s.in} - {s.out || '--:--'}</span>
                                                    <button
                                                        onClick={() => handleEdit(s)}
                                                        title="Editar sesión"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            color: 'var(--text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </td>
                                        <td style={{ fontWeight: '600', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{row.total_human}</td>
                                    </tr>
                                ))}
                                {finalHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={user.role === 'admin' ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No hay registros que coincidan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {editingSession && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Editar Sesión</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{editingSession.fecha}</p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Hora Entrada</label>
                            <input
                                type="time"
                                value={editingSession.in}
                                onChange={(e) => setEditingSession({ ...editingSession, in: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Hora Salida</label>
                            <input
                                type="time"
                                value={editingSession.out || ""}
                                onChange={(e) => setEditingSession({ ...editingSession, out: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                            <button className="btn-secondary" onClick={() => setEditingSession(null)} style={{ flex: 1, padding: '0.6rem' }}>
                                Cancelar
                            </button>
                            <button className="btn-primary" onClick={handleUpdate} style={{ flex: 1, padding: '0.6rem' }}>
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
