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

router.get('/', async (req, res) => {
  // Connect to PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT student_name, student_id, date, time FROM attendance ORDER BY date DESC, time DESC'
    );
    client.release();

    const attendance_records = result.rows.map(row => ({
      ...row,
      student_id: parseInt(row.student_id),
    }));

    return res.json({
      status: 'success',
      message: attendance_records.length
        ? 'Attendance records retrieved successfully'
        : 'No attendance records found',
      data: attendance_records,
      count: attendance_records.length,
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
