const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        nombre TEXT,
        role TEXT DEFAULT 'employee'
      )`, (err) => {
        if (err) return reject(err);

        // Check if admin exists, if not create default
        db.get("SELECT * FROM users WHERE username = 'admin'", [], (err, row) => {
          if (!row) {
            const hashedPassword = bcrypt.hashSync('admin1234', 10);
            db.run("INSERT INTO users (username, password, nombre, role) VALUES (?, ?, ?, ?)",
              ['admin', hashedPassword, 'Administrador', 'admin']);
          }
        });
      });

      // Daily sessions table (to track current state in DB for faster validation, 
      // although Excel is the final storage)
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT,
        fecha TEXT,
        hora_entrada TEXT,
        hora_salida TEXT
      )`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

module.exports = { db, initDb };
