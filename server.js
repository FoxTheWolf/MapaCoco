const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_secret_key';

const app = express();
app.use(cors());
// Increase limit to 10mb for JSON payloads (base64 images can be large)
app.use(bodyParser.json({ limit: '50mb' }));

const db = new sqlite3.Database('points.db');

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  is_admin INTEGER DEFAULT 0
)`);

// Create points table if not exists
db.run(`CREATE TABLE IF NOT EXISTS points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  timestamp TEXT,
  image TEXT,
  coordinates TEXT,
  user TEXT
)`);

// Simple user seed (admin/admin, user/user, user1/user1, user2/user2, user3/user3)
db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) VALUES ('admin', 'admin', 1)`);
db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) VALUES ('user', 'user', 0)`);
db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) VALUES ('user1', 'user1', 0)`);
db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) VALUES ('user2', 'user2', 0)`);
db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) VALUES ('user3', 'user3', 0)`);

// Login endpoint
app.post('/api/login', (req, res) => {
  const {username, password} = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err || !user) return res.status(401).json({error: 'Invalid credentials'});
    const token = jwt.sign({username: user.username, is_admin: !!user.is_admin}, JWT_SECRET, {expiresIn: '1d'});
    res.json({token, user: {username: user.username, is_admin: !!user.is_admin}});
  });
});

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({error: 'No token'});
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({error: 'Invalid token'});
  }
}

// GET all points (admin) or user's points
app.get('/api/points', auth, (req, res) => {
  let sql = 'SELECT * FROM points';
  let params = [];
  if (!req.user.is_admin) {
    sql += ' WHERE user = ?';
    params = [req.user.username];
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    // Parse coordinates from string to array
    rows.forEach(row => row.coordinates = JSON.parse(row.coordinates));
    res.json(rows);
  });
});

// POST new point (attach user from token, not from body)
app.post('/api/points', auth, (req, res) => {
  const {name, description, timestamp, image, coordinates} = req.body;
  const username = req.user.username; // Use username from token
  console.log('Creating point for user:', username); // Debug log
  db.run(
    'INSERT INTO points (name, description, timestamp, image, coordinates, user) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, timestamp, image, JSON.stringify(coordinates), username],
    function(err) {
      if (err) {
        console.error('DB error:', err); // Debug log
        return res.status(500).json({error: err.message});
      }
      res.json({id: this.lastID});
    }
  );
});

// DELETE all points (admin only)
app.delete('/api/points', auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({error: 'Forbidden'});
  db.run('DELETE FROM points', [], err => {
    if (err) return res.status(500).json({error: err.message});
    res.json({success: true});
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
