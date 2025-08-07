const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const Web3 = require('web3');
// const { create } = require('ipfs-http-client');
const multer = require('multer'); // Thêm multer
const path = require('path'); // Thêm path
const fs = require('fs'); // Thêm fs

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5001',
  methods: ['GET', 'POST'],
  credentials: true
}));


// Cấu hình lưu trữ file với multer
const uploadDir = path.join(__dirname, 'upload/cert');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Tạo thư mục upload/cert nếu chưa tồn tại
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${req.body.ipfsHash}.pdf`); // Tên file: ipfsHash-timestamp.pdf
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF'), false);
    }
  }
});

// Cấu hình kết nối MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'certificate_db'
};

let db;

async function initializeDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL Database');
    await db.execute('SELECT 1');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

initializeDatabase();

// Cấu hình Web3 và IPFS
const web3 = new Web3(process.env.WEB3_PROVIDER || 'http://localhost:8545');
// const ipfs = create({ url: 'http://localhost:5002/api/v0' });

// Middleware kiểm tra token
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
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
  }

  console.log('Login request body:', req.body);

  try {
    const [results] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);

    if (results.length === 0) {
      console.warn(`Email không tồn tại: ${email}`);
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.warn(`Mật khẩu sai cho user: ${email}`);
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// Kiểm tra auth
app.get('/api/auth/check', authenticateToken, (req, res) => {
  res.json({ success: true, role: req.user.role });
});

// Lấy thông tin sinh viên
app.get('/api/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM Students WHERE studentId = ?', [req.params.studentId]);
    if (!results.length) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json(results[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lưu log xác minh
app.post('/api/verification', authenticateToken, async (req, res) => {
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

// Cập nhật endpoint lưu chứng chỉ
app.post('/api/certificates', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  const { studentAddress, studentName, studentId, university, issueDate, courseName, instructor, ipfsHash } = req.body;
  const certpath = req.file ? `/upload/cert/${req.file.filename}` : null;

  if (!studentAddress || !studentName || !studentId || !university || !issueDate || !ipfsHash) {
    return res.status(400).json({ success: false, message: 'Thiếu các trường bắt buộc' });
  }

  try {
    await db.execute(
      `INSERT INTO tbl_certificates (studentAddress, studentName, studentId, university, issueDate, courseName, instructor, ipfsHash, certpath, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [studentAddress, studentName, studentId, university, issueDate, courseName || null, instructor || null, ipfsHash, certpath]
    );
    res.json({ success: true, message: 'Chứng chỉ đã được lưu vào database', certpath });
  } catch (error) {
    console.error('Error saving certificate:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu chứng chỉ vào database' });
  }
});

// Thêm endpoint để lấy danh sách chứng chỉ
app.get('/api/certificates', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối. Chỉ admin mới được phép.' });
    }

    const [results] = await db.execute('SELECT * FROM tbl_certificates ORDER BY createdAt DESC');
    res.json(results);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// Xử lý xác minh chứng chỉ qua QR code
app.get('/verify', async (req, res) => {
  const { ipfsHash } = req.query;

  if (!ipfsHash) {
    return res.status(400).json({ success: false, message: 'Thiếu ipfsHash' });
  }

  try {
    // Kiểm tra kết nối đến node Ethereum
    await web3.eth.getBlockNumber();
    console.log('Connected to Ethereum node successfully');

    // Cấu hình contract
    const contractAddress = process.env.CONTRACT_ADDRESS;
    console.log('Using contract address:', contractAddress); // Debug địa chỉ
    const contractABI = require('../build/contracts/cert.json');
    // console.log('Contract ABI loaded:', contractABI.abi); 
    if (!contractABI.abi) {
      throw new Error('ABI not found in cert.json');
    }
    const contract = new web3.eth.Contract(contractABI.abi, contractAddress);

    // Debug: Kiểm tra ipfsToId
    const ipfsToIdValue = await contract.methods.ipfsToId(ipfsHash).call();
    console.log('ipfsToId value for', ipfsHash, ':', ipfsToIdValue.toString());

    // Kiểm tra transaction history (tùy chọn debug)
    const events = await contract.getPastEvents('CertificateIssued', { fromBlock: 0, toBlock: 'latest' });
    // console.log('CertificateIssued events:', events);

    // Kiểm tra và gán kết quả từ isCertificateValid
    let isValid, id, studentName, studentId, university, issueDate, issuedBy, returnedIpfsHash;
    try {
      const result = await contract.methods.isCertificateValid(ipfsHash).call();
      console.log('Result from isCertificateValid:', result);
      if (result) {
        isValid = result.isValid || false;
        id = result.id || '0';
        studentName = result.studentName || '';
        studentId = result.studentId || '';
        university = result.university || '';
        issueDate = result.issueDate || '0';
        issuedBy = result.issuedBy || '0x0000000000000000000000000000000000000000';
        returnedIpfsHash = result.ipfsHash || '';
      } else {
        console.error('No result returned from isCertificateValid');
        throw new Error('Kết quả từ contract không hợp lệ');
      }
    } catch (callError) {
      console.error('Error calling isCertificateValid:', callError);
      throw callError;
    }

    if (!isValid) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không hợp lệ hoặc không tồn tại trên blockchain' });
    }

    res.json({
      success: true,
      message: 'Xác minh thành công',
      certificate: {
        id,
        studentName,
        studentId,
        university,
        issueDate: new Date(parseInt(issueDate) * 1000).toLocaleDateString(),
        issuedBy,
        ipfsHash: returnedIpfsHash
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});


// trong app.js hoặc server.js
app.use('/upload', express.static(path.join(__dirname, 'upload')));


// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));