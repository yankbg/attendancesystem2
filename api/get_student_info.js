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

  const id = req.body.student_id;
  const name = req.body.student_name;
  if (!id || isNaN(id) || !name) {
    return res.json({ status: 'error', message: 'Invalid or missing student_id or student_name' });
  }
  try {
    const result = await pool.query('SELECT image_path FROM students WHERE id = $1 AND name ILIKE $2', [parseInt(id), name]);
    if (result.rows.length > 0) {
      res.json({ status: 'success', image_path: result.rows[0].image_path });
    } else {
      res.json({ status: 'error', message: 'Image not found' });
    }
  } catch (err) {
    res.json({ status: 'error', message: 'Query failed: ' + err.message });
  }
});

module.exports = router;
