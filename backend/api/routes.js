const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Đăng nhập
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [results] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Kiểm tra xác thực
router.get('/auth/check', authenticateToken, (req, res) => {
  res.json({ success: true, role: req.user.role });
});

// Lấy thông tin sinh viên
router.get('/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM Students WHERE studentId = ?', [req.params.studentId]);
    if (!results.length) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json(results[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Ghi log xác minh
router.post('/verification', authenticateToken, async (req, res) => {
  const { certificateId, verifierId, result } = req.body;
  try {
    await db.execute(
      'INSERT INTO VerificationLogs (certificateId, verifierId, result, timestamp) VALUES (?, ?, ?, NOW())',
      [certificateId, verifierId, result]
    );
    res.json({ success: true, message: 'Log saved' });
  } catch (error) {
    console.error('Verification log error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
