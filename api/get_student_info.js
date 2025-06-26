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
  const { student_id, student_name } = req.body;

  // Validate inputs
  if (!student_id || isNaN(student_id) || !student_name) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid or missing student_id or student_name',
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
      'SELECT image_path FROM students WHERE id = $1 AND name ILIKE $2',
      [parseInt(student_id), student_name]
    );
    client.release();

    if (result.rows.length > 0) {
      return res.json({
        status: 'success',
        image_path: result.rows[0].image_path,
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found',
      });
    }
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
