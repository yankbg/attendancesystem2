const express = require('express');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/', async (req, res) => {
  try {
    const { id, name, image } = req.body;

    // Validate inputs
    if (!id || !name || !image) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: id, name, or image',
      });
    }

    // Validate image format and size
    if (!image.match(/^data:image\/(jpeg|png);base64,/)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid image format. Only JPEG or PNG allowed.',
      });
    }

    const imageData = image.split('base64,')[1];
    const imageBuffer = Buffer.from(imageData, 'base64');
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        status: 'error',
        message: 'Image size exceeds 5MB limit',
      });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(image, {
      resource_type: 'image',
    });

    if (!cloudinaryResult.secure_url) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to upload image to Cloudinary',
      });
    }

    const imageUrl = cloudinaryResult.secure_url;

    // Connect to PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();

    // Create students table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    await client.query(createTableSQL);

    // Check for duplicate student ID
    const checkResult = await client.query('SELECT COUNT(*) FROM students WHERE id = $1', [id]);
    if (parseInt(checkResult.rows[0].count) > 0) {
      client.release();
      return res.status(400).json({
        status: 'error',
        message: 'Student with this ID already registered',
      });
    }

    // Insert student record
    await client.query('INSERT INTO students (id, name, image_path) VALUES ($1, $2, $3)', [
      id,
      name,
      imageUrl,
    ]);

    client.release();
    await pool.end();

    return res.json({
      status: 'success',
      message: 'Student registered successfully',
      image_url: imageUrl,
    });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

module.exports = router;
