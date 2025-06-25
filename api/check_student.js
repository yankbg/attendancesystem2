const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Pool config (use env vars in production)
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

  const { studentId, fullname } = req.body;
  if (!studentId || !fullname) {
    return res.json({ status: 'error', message: 'Missing studentId or fullname' });
  }
  if (isNaN(studentId)) {
    return res.json({ status: 'error', message: 'Invalid student Id' });
  }
  try {
    const result = await pool.query(
      'SELECT id, image_path FROM students WHERE id = $1 AND name ILIKE $2',
      [parseInt(studentId), fullname]
    );
    if (result.rows.length > 0) {
      res.json({ status: 'success', exists: true, image_path: result.rows[0].image_path });
    } else {
      res.json({ status: 'error', exists: false, message: 'Student not found' });
    }
  } catch (err) {
    res.json({ status: 'error', message: 'Database error: ' + err.message });
  }
});

module.exports = router;
