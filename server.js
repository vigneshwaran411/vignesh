const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Database pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_db_user',
  password: 'your_db_password',
  database: 'garbage_monitoring',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware for JWT Authentication
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const connection = await pool.getConnection();
  await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
  connection.release();

  res.status(201).send('User registered');
});

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const connection = await pool.getConnection();
  const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
  connection.release();

  if (rows.length && await bcrypt.compare(password, rows[0].password)) {
    const token = jwt.sign({ username }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.send('Username or password incorrect');
  }
});

// CRUD operations for Garbage Bins
app.route('/api/bins')
  .get(authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    const [bins] = await connection.execute('SELECT * FROM bins');
    connection.release();
    res.json(bins);
  })
  .post(authenticateJWT, async (req, res) => {
    const { location, status } = req.body;
    const connection = await pool.getConnection();
    await connection.execute('INSERT INTO bins (location, status) VALUES (?, ?)', [location, status]);
    connection.release();
    res.status(201).send('Bin created');
  });

app.route('/api/bins/:id')
  .put(authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { location, status } = req.body;
    const connection = await pool.getConnection();
    await connection.execute('UPDATE bins SET location = ?, status = ? WHERE id = ?', [location, status, id]);
    connection.release();
    res.send('Bin updated');
  })
  .delete(authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM bins WHERE id = ?', [id]);
    connection.release();
    res.send('Bin deleted');
  });

// Report Submission and Retrieval
app.route('/api/reports')
  .post(authenticateJWT, async (req, res) => {
    const { binId, description } = req.body;
    const connection = await pool.getConnection();
    await connection.execute('INSERT INTO reports (binId, description) VALUES (?, ?)', [binId, description]);
    connection.release();
    res.status(201).send('Report submitted');
  })
  .get(authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    const [reports] = await connection.execute('SELECT * FROM reports');
    connection.release();
    res.json(reports);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});