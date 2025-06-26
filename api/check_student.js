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
  const { studentId, fullname } = req.body;

  // Validate inputs
  if (!studentId || !fullname) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing studentId or fullname',
    });
  }

  if (isNaN(studentId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid student Id',
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
      'SELECT id, image_path FROM students WHERE id = $1 AND name ILIKE $2',
      [parseInt(studentId), fullname]
    );
    client.release();

    if (result.rows.length > 0) {
      return res.json({
        status: 'success',
        exists: true,
        image_path: result.rows[0].image_path,
      });
    } else {
      return res.status(404).json({
        status: 'error',
        exists: false,
        message: 'Student not found',
      });
    }
  } catch (err) {
    console.error('Database error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Database error: ' + err.message,
    });
  } finally {
    await pool.end();
  }
});

module.exports = router;
