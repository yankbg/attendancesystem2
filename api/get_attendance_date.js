const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Handle CORS
router.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

router.post('/', async (req, res) => {
  const date = req.body.date || req.query.date;

  // Validate date
  if (!date) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing date parameter',
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid date format. Expected YYYY-MM-DD.',
    });
  }

  // Connect to PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT student_id, student_name, time FROM attendance WHERE date = $1',
      [date]
    );
    client.release();

    return res.json({
      status: 'success',
      date,
      data: result.rows,
    });
  } catch (err) {
    console.error('Database error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Query failed: ' + err.message,
    });
  } finally {
    await pool.end();
  }
});

module.exports = router;
