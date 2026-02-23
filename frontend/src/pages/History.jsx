import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Filter, FileText } from 'lucide-react';

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    // Aggregate by Employee + Date
    const groupedData = filteredHistory.reduce((acc, curr) => {
        const key = `${curr.employee_id}_${curr.fecha}`;
        if (!acc[key]) {
            acc[key] = { ...curr, sessions: [], total_decimal: 0 };
        }
        acc[key].sessions.push({ in: curr.hora_entrada, out: curr.hora_salida });
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
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                    {user.role === 'admin' && <th>Empleado</th>}
                                    <th>Fecha</th>
                                    <th>Sesiones (In - Out)</th>
                                    <th>Total Día</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalHistory.map((row, i) => (
                                    <tr key={i}>
                                        {user.role === 'admin' && <td style={{ fontSize: '0.85rem' }}>{row.nombre || row.employee_id}</td>}
                                        <td>{row.fecha}</td>
                                        <td style={{ fontSize: '0.75rem' }}>
                                            {row.sessions.map((s, idx) => (
                                                <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                                                    {s.in} - {s.out || '--:--'}
                                                </div>
                                            ))}
                                        </td>
                                        <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.total_human}</td>
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
        </div>
    );
};

export default History;
