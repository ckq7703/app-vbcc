const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // hoặc lấy từ process.env
    database: 'certificate_db'
  });

  const email = 'verifier@example.com';
  const password = '123456';
  const role = 'verifier';

  // Hash mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);

  // Thêm vào bảng Users
  try {
    const [result] = await connection.execute(
      'INSERT INTO Users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
    console.log('User created:', result.insertId);
  } catch (err) {
    console.error('Insert error:', err);
  } finally {
    await connection.end();
  }
})();
