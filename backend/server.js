const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from the sibling 'frontend' folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ----------------------------------------------------
// 1. REGISTER API ENDPOINT
// ----------------------------------------------------
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Check if user already exists in MySQL
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Account already exists! Please log in.' });
    }

    const userRole = role || 'Student / Alumnus';
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password, userRole]
    );

    res.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: result.insertId,
        name,
        email,
        role: userRole
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error occurred.' });
  }
});

// ----------------------------------------------------
// 2. LOGIN API ENDPOINT
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter email and password.' });
  }

  try {
    // Query MySQL users table
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found! Please register first.' });
    }

    const user = rows[0];

    // Verify password match
    if (user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error occurred.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});