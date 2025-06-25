const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_0kXx8aimHZfn@ep-super-haze-a92tp83o-pooler.gwc.azure.neon.tech/AttendanceSystem?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

router.options('/', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }).sendStatus(200);
});

router.get('/', async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  try {
    const result = await pool.query('SELECT student_name, student_id, date, time FROM attendance ORDER BY date DESC, time DESC');
    res.json({
      status: 'success',
      message: result.rows.length ? 'Attendance records retrieved successfully' : 'No attendance records found',
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Query failed: ' + err.message });
  }
});

module.exports = router;
