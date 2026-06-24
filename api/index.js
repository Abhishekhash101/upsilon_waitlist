import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
import dotenv from 'dotenv';

// Load .env for local dev (Vercel injects env vars automatically in production)
dotenv.config();

const { Pool } = pkg;
const app = express();

// --- DB Connection (lazy init, safe for serverless cold starts) ---
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5, // Keep connection pool small for serverless
    });
  }
  return pool;
}

// --- Middleware ---
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- Init DB Tables (called once on first request) ---
let dbReady = false;
async function ensureDB() {
  if (dbReady) return;
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        joined_waitlist BOOLEAN DEFAULT TRUE,
        submitted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    dbReady = true;
  } finally {
    client.release();
  }
}

// --- Hardcoded Admin Credentials ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'upsilon@2024';

// --- Auth Middleware (user JWT) ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// --- Admin Auth Middleware ---
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Admin access denied.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err || !payload || payload.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid or expired admin token.' });
    }
    next();
  });
}

// --- Routes ---

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  await ensureDB();
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const db = getPool();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  await ensureDB();
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const db = getPool();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/waitlist  (protected)
app.post('/api/waitlist', authenticateToken, async (req, res) => {
  await ensureDB();
  const { name, email, joinedWaitlist } = req.body;

  if (!name || !email)
    return res.status(400).json({ error: 'Name and email are required.' });
  if (!joinedWaitlist)
    return res.status(400).json({ error: 'You must confirm joining the waitlist.' });

  try {
    const db = getPool();
    const existing = await db.query('SELECT id FROM waitlist WHERE user_id = $1', [req.user.id]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'You have already joined the waitlist.' });

    await db.query(
      'INSERT INTO waitlist (user_id, name, email, joined_waitlist) VALUES ($1, $2, $3, $4)',
      [req.user.id, name, email.toLowerCase(), joinedWaitlist]
    );
    res.status(201).json({ message: 'Successfully joined the waitlist!' });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '4h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid admin credentials.' });
});

// GET /api/admin/data  (protected)
app.get('/api/admin/data', authenticateAdmin, async (req, res) => {
  await ensureDB();
  try {
    const result = await getPool().query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        CASE WHEN w.id IS NOT NULL THEN true ELSE false END AS on_waitlist,
        w.submitted_at AS waitlist_submitted_at
      FROM users u
      LEFT JOIN waitlist w ON w.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Admin data error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- Export for Vercel (do NOT call app.listen here) ---
export default app;
