const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'cicd_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cicd_app',
  password: process.env.DB_PASSWORD || 'MySecurePass123!',
  port: process.env.DB_PORT || 5432,
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Home page
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to CI/CD Sample App!', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Database connection test
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    res.json({ 
      status: 'Database connected successfully!', 
      timestamp: result.rows[0].current_time,
      database_version: result.rows[0].db_version
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'Database connection failed', 
      error: err.message 
    });
  }
});

// Initialize users table and get users
app.get('/users', async (req, res) => {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.json({
      count: result.rows.length,
      users: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new user
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📝 Node.js version: ${process.version}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    pool.end();
    process.exit(0);
  });
});

module.exports = { app, server };
