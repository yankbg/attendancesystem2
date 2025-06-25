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

  try {
    const { qr_data } = req.body;
    if (!qr_data) throw new Error("Missing 'qr_data' in request");

    let qr_info = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    const required_fields = ['studentId', 'fullname', 'Date', 'time'];
    for (const field of required_fields) {
      if (!qr_info[field]) throw new Error(`Missing required field: ${field}`);
    }
    const student_id = parseInt(qr_info.studentId);
    const student_name = qr_info.fullname;
    const date = qr_info.Date;
    const time = qr_info.time;

    await pool.query(`CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INT NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (student_id, date)
    )`);

    // Check if attendance already marked
    const check = await pool.query('SELECT id FROM attendance WHERE student_id = $1 AND date = $2', [student_id, date]);
    if (check.rows.length > 0) {
      return res.json({ status: 'error', message: `Attendance already marked for this student on ${date}` });
    }

    // Insert attendance
    const insert = await pool.query(
      'INSERT INTO attendance (student_id, student_name, date, time) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, student_name, date, time]
    );
    const record = insert.rows[0];
    res.json({
      status: 'success',
      message: `Attendance marked successfully for student ${student_name}`,
      data: {
        studentId: student_id,
        fullname: student_name,
        Date: date,
        time: time,
        marked_at: record.marked_at
      }
    });
  } catch (e) {
    res.status(400).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
