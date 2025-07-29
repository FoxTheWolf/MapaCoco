const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
// Increase limit to 10mb for JSON payloads (base64 images can be large)
app.use(bodyParser.json({ limit: '50mb' }));

const db = new sqlite3.Database('points.db');

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  timestamp TEXT,
  image TEXT,
  coordinates TEXT
)`);

// GET all points
app.get('/api/points', (req, res) => {
  db.all('SELECT * FROM points', [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    // Parse coordinates from string to array
    rows.forEach(row => row.coordinates = JSON.parse(row.coordinates));
    res.json(rows);
  });
});

// POST new point
app.post('/api/points', (req, res) => {
  const {name, description, timestamp, image, coordinates} = req.body;
  db.run(
    'INSERT INTO points (name, description, timestamp, image, coordinates) VALUES (?, ?, ?, ?, ?)',
    [name, description, timestamp, image, JSON.stringify(coordinates)],
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({id: this.lastID});
    }
  );
});

// DELETE all points
app.delete('/api/points', (req, res) => {
  db.run('DELETE FROM points', [], err => {
    if (err) return res.status(500).json({error: err.message});
    res.json({success: true});
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
