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

router.post('/', async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  const date = req.body.date || req.query.date;
  if (!date) return res.json({ status: 'error', message: 'Missing date parameter' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.json({ status: 'error', message: 'Invalid date format. Expected YYYY-MM-DD.' });

  try {
    const result = await pool.query('SELECT student_id, student_name, time FROM attendance WHERE date = $1', [date]);
    res.json({ status: 'success', date, data: result.rows });
  } catch (err) {
    res.json({ status: 'error', message: 'Query failed: ' + err.message });
  }
});

module.exports = router;
