const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Mount your API routes
app.use('/api/check_student', require('./api/check_student'));
app.use('/api/get_Attendance', require('./api/get_Attendance'));
app.use('/api/get_attendanceDate', require('./api/get_attendanceDate'));
app.use('/api/get_student_info', require('./api/get_student_info'));
app.use('/api/mark_attendance', require('./api/mark_attendance'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for SPA routing (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
