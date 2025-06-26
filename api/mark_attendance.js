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
  try {
    const { qr_data } = req.body;
    if (!qr_data) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing qr_data in request',
      });
    }

    let qr_info;
    try {
      qr_info = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch (err) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid JSON format in qr_data',
      });
    }

    const { studentId, fullname, Date, time } = qr_info;

    // Validate required fields
    const required_fields = ['studentId', 'fullname', 'Date', 'time'];
    for (const field of required_fields) {
      if (!qr_info[field]) {
        return res.status(400).json({
          status: 'error',
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Validate date and time
    if (!/^\d{4}-\d{2}-\d{2}$/.test(Date)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    const timeRegex = /^(\d{2}:\d{2}(:\d{2})?)$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid time format. Expected HH:MM:SS or HH:MM.',
      });
    }
    const formattedTime = time.length === 5 ? `${time}:00` : time;

    // Connect to PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();

    // Create attendance table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, date)
      )`;
    await client.query(createTableSQL);

    // Check for existing attendance
    const checkResult = await client.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND date = $2',
      [parseInt(studentId), Date]
    );

    if (checkResult.rows.length > 0) {
      client.release();
      return res.status(400).json({
        status: 'error',
        message: `Attendance already marked for this student on ${Date}`,
      });
    }

    // Insert attendance record
    const insertResult = await client.query(
      'INSERT INTO attendance (student_id, student_name, date, time) VALUES ($1, $2, $3, $4) RETURNING *',
      [parseInt(studentId), fullname, Date, formattedTime]
    );

    client.release();
    await pool.end();

    const record = insertResult.rows[0];
    return res.json({
      status: 'success',
      message: `Attendance marked successfully for student ${fullname}`,
      data: {
        studentId: parseInt(studentId),
        fullname,
        Date,
        time: formattedTime,
        marked_at: record.marked_at,
      },
    });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
});

module.exports = router;
