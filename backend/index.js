const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const { query, initDb } = require('./db');

// --- ROUTES ---

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query("SELECT * FROM users WHERE username = ?", [username]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, nombre: user.nombre }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, nombre: user.nombre } });
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Register (Admin only)
app.post('/api/auth/register', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, nombre, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        await query("INSERT INTO users (username, password, nombre, role) VALUES (?, ?, ?, ?)",
            [username, hashedPassword, nombre, role || 'employee']);
        res.json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Username already exists or error' });
    }
});

// Get current status
app.get('/api/tracking/status', authenticateToken, async (req, res) => {
    try {
        const result = await query("SELECT * FROM sessions WHERE employee_id = ? ORDER BY id DESC LIMIT 1", [req.user.username]);
        const row = result.rows[0];
        const today = new Date().toISOString().split('T')[0];
        if (row && !row.hora_salida && row.fecha === today) {
            res.json(row);
        } else {
            res.json({ message: 'No active session' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Clock-in
app.post('/api/tracking/clock-in', authenticateToken, async (req, res) => {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const server_time = now.toTimeString().split(' ')[0];
    const hora_entrada = req.body.hora_entrada || server_time;
    const employee_id = req.user.username;
    const nombre = req.user.nombre;
    const dispositivo = req.headers['user-agent'];

    try {
        const check = await query("SELECT * FROM sessions WHERE employee_id = ? AND hora_salida IS NULL", [employee_id]);
        if (check.rowCount > 0) return res.status(400).json({ message: 'Ya tienes una sesión abierta.' });

        const insert = await query("INSERT INTO sessions (employee_id, fecha, hora_entrada) VALUES (?, ?, ?)",
            [employee_id, fecha, hora_entrada]);

        // This is a bit tricky for SQLite vs PG since lastID is in different places, 
        // but for simplicity we can get the latest id for this user
        const last = await query("SELECT id FROM sessions WHERE employee_id = ? ORDER BY id DESC LIMIT 1", [employee_id]);
        const session_id = last.rows[0].id;

        await upsertFichaje({ session_id, employee_id, nombre, fecha, hora_entrada, dispositivo });
        res.json({ message: 'Entrada registrada con éxito', hora_entrada });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Clock-out
app.post('/api/tracking/clock-out', authenticateToken, async (req, res) => {
    const now = new Date();
    const server_time = now.toTimeString().split(' ')[0];
    const hora_salida = req.body.hora_salida || server_time;
    const employee_id = req.user.username;

    try {
        const result = await query("SELECT * FROM sessions WHERE employee_id = ? AND hora_salida IS NULL ORDER BY id DESC LIMIT 1", [employee_id]);
        const row = result.rows[0];
        if (!row) return res.status(400).json({ message: 'No hay ninguna sesión abierta.' });

        const start = new Date(`${row.fecha}T${row.hora_entrada}`);
        let end = new Date(`${row.fecha}T${hora_salida}`);
        if (end < start) end.setDate(end.getDate() + 1);

        const diffMs = end - start;
        const diffHrs = diffMs / (1000 * 60 * 60);
        const hrs = Math.floor(diffHrs);
        const mins = Math.floor((diffHrs - hrs) * 60);
        const total_horas_human = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        const total_horas_decimal = diffHrs.toFixed(2);

        await query("UPDATE sessions SET hora_salida = ? WHERE id = ?", [hora_salida, row.id]);

        await upsertFichaje({
            session_id: row.id,
            employee_id,
            nombre: req.user.nombre,
            fecha: row.fecha,
            hora_salida,
            total_horas_human,
            total_horas_decimal
        });
        res.json({ message: 'Salida registrada con éxito', hora_salida, total_horas_human });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Get personal history
app.get('/api/tracking/history', authenticateToken, async (req, res) => {
    try {
        const result = await query(
            "SELECT s.*, u.nombre FROM sessions s JOIN users u ON s.employee_id = u.username WHERE s.employee_id = ? ORDER BY s.fecha DESC, s.id DESC",
            [req.user.username]
        );

        // Map DB fields to what the frontend expects (total calculation happens on frontend now)
        // We'll calculate a basic decimal total here to keep it compatible with existing aggregators
        const history = result.rows.map(row => {
            let total_horas_decimal = 0;
            if (row.hora_entrada && row.hora_salida) {
                const start = new Date(`${row.fecha}T${row.hora_entrada}`);
                let end = new Date(`${row.fecha}T${row.hora_salida}`);
                if (end < start) end.setDate(end.getDate() + 1);
                total_horas_decimal = (end - start) / (1000 * 60 * 60);
            }
            return {
                ...row,
                total_horas_decimal: total_horas_decimal.toFixed(2)
            };
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error reading history' });
    }
});

// Admin: Get all history
app.get('/api/admin/history', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await query(
            "SELECT s.*, u.nombre FROM sessions s JOIN users u ON s.employee_id = u.username ORDER BY s.fecha DESC, u.nombre ASC"
        );
        const history = result.rows.map(row => {
            let total_horas_decimal = 0;
            if (row.hora_entrada && row.hora_salida) {
                const start = new Date(`${row.fecha}T${row.hora_entrada}`);
                let end = new Date(`${row.fecha}T${row.hora_salida}`);
                if (end < start) end.setDate(end.getDate() + 1);
                total_horas_decimal = (end - start) / (1000 * 60 * 60);
            }
            return {
                ...row,
                total_horas_decimal: total_horas_decimal.toFixed(2)
            };
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error reading global history' });
    }
});

// Download Excel
app.get('/api/admin/download-excel', authenticateToken, isAdmin, (req, res) => {
    res.download(excelPath, 'fichajes_completo.xlsx');
});

// Initialize and Start
Promise.all([initDb(), initExcel()]).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Initialization error:", err);
});
