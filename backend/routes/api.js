const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { auth, adminOnly } = require("../middleware/auth");
const router = express.Router();

// Test database/API connection
router.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "success", message: "API and database are connected." });
  } catch (error) {
    res.status(500).json({ status: "error", message: "API is running, but database connection failed." });
  }
});

// Create student/alumni account
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role, batch_year, course } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ status: "error", message: "Name, email and password are required." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ status: "error", message: "Password must be at least 8 characters." });
    }

    // Visitors cannot register as admin.
    const safeRole = role === "alumni" ? "alumni" : "student";
    const passwordHash = await bcrypt.hash(password, 10);
    const year = batch_year ? Number(batch_year) : null;
    if (year !== null && !Number.isInteger(year)) {
      return res.status(400).json({ status: "error", message: "Batch year must be a number." });
    }

    await db.execute(
      `INSERT INTO users (full_name, email, password, role, batch_year, course)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [String(full_name).trim(), String(email).trim().toLowerCase(), passwordHash, safeRole, year, course || null]
    );
    res.status(201).json({ status: "success", message: "Account created. You can now log in." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ status: "error", message: "This email is already registered." });
    }
    console.error(error.message);
    res.status(500).json({ status: "error", message: "Could not create account. Check database settings." });
  }
});

// Log in and return a token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required." });
    }
    const [rows] = await db.execute(
      `SELECT id, full_name, email, password, role, batch_year, course, current_title, company, profile_pic
       FROM users WHERE email = ? LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ status: "error", message: "Incorrect email or password." });
    }

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    delete user.password;
    res.json({ status: "success", message: "Login successful.", token, user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "error", message: "Login failed. Check database settings." });
  }
});

// Get logged-in user's profile
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, email, role, batch_year, course, current_title, company, profile_pic
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ status: "error", message: "User not found." });
    res.json({ status: "success", user: rows[0] });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Could not load profile." });
  }
});

// Public alumni directory
router.get("/alumni", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, batch_year, course, current_title, company, profile_pic
       FROM users WHERE role = 'alumni' ORDER BY full_name`
    );
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "error", message: "Could not load alumni." });
  }
});

// Public talks/events list
router.get("/talks", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, speaker_name, category, description, event_date, is_upcoming
       FROM talks ORDER BY event_date ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Could not load talks." });
  }
});

// Register the logged-in user for a talk
router.post("/talks/:id/register", auth, async (req, res) => {
  try {
    const talkId = Number(req.params.id);
    const [talks] = await db.execute("SELECT id FROM talks WHERE id = ?", [talkId]);
    if (!talks.length) return res.status(404).json({ status: "error", message: "Talk not found." });

    await db.execute(
      "INSERT INTO registrations (user_id, talk_id) VALUES (?, ?)",
      [req.user.id, talkId]
    );
    res.status(201).json({ status: "success", message: "You registered for this talk." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ status: "error", message: "You are already registered." });
    }
    res.status(500).json({ status: "error", message: "Could not register for talk." });
  }
});

// Logged-in user's registrations
router.get("/my-registrations", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.id AS talk_id, t.title, t.speaker_name, t.category, t.event_date, r.registered_at
       FROM registrations r JOIN talks t ON t.id = r.talk_id
       WHERE r.user_id = ? ORDER BY t.event_date ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Could not load your registrations." });
  }
});

// Admin overview statistics
router.get("/admin/stats", auth, adminOnly, async (req, res) => {
  try {
    const [[users]] = await db.query("SELECT COUNT(*) AS total_users FROM users");
    const [[alumni]] = await db.query("SELECT COUNT(*) AS total_alumni FROM users WHERE role='alumni'");
    const [[talks]] = await db.query("SELECT COUNT(*) AS total_talks FROM talks");
    const [[registrations]] = await db.query("SELECT COUNT(*) AS total_registrations FROM registrations");
    res.json({
      total_users: users.total_users,
      total_alumni: alumni.total_alumni,
      total_talks: talks.total_talks,
      total_registrations: registrations.total_registrations
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Could not load admin statistics." });
  }
});

module.exports = router;
