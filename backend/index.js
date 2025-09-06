
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

// --- Database Connection Configuration ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pvk123',
  database: 'cash_ledger'
});

// Attempt to connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Successfully connected to MySQL database!');
});

// --- API Endpoints ---

// GET all cash entries
app.get('/api/cash-entries', (req, res) => {
  const query = 'SELECT * FROM cash_entries ORDER BY timestamp DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching entries:', err);
      return res.status(500).json({ error: 'Failed to fetch entries' });
    }

    // Fix: parse only if string
    const entries = results.map(entry => {
      let denominations = entry.denominations;
      if (typeof denominations === 'string') {
        try {
          denominations = JSON.parse(denominations);
        } catch (e) {
          console.error('JSON parse error:', e);
          denominations = {};
        }
      }
      return { ...entry, denominations };
    });

    res.json(entries);
  });
});

// POST add new cash entry
app.post('/api/cash-entries', (req, res) => {
  let { cashierName, counterNumber, timestamp, denominations, totalAmount } = req.body;

  // Fix: convert timestamp to MySQL DATETIME format
  timestamp = new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");

  const denominationsJson = JSON.stringify(denominations);

  const query = `
    INSERT INTO cash_entries (cashierName, counterNumber, timestamp, denominations, totalAmount)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [cashierName, counterNumber, timestamp, denominationsJson, totalAmount];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting entry:', err);
      return res.status(500).json({ error: 'Failed to add entry' });
    }

    res.status(201).json({
      id: result.insertId,
      cashierName,
      counterNumber,
      timestamp,
      denominations,
      totalAmount
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
});
