import React, { useState } from 'react';
import Web3 from 'web3';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [useMetaMask, setUseMetaMask] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        onLogin(data.token, data.role);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi đăng nhập: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskLogin = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Vui lòng cài đặt MetaMask!');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      
      if (accounts.length > 0) {
        // Giả lập lấy role từ blockchain (thay bằng smart contract thực tế)
        const role = accounts[0] === '0xYourAdminAddress' ? 'admin' : 'student';
        onLogin('metaMaskToken', role);
      }
    } catch (err) {
      setError('Lỗi MetaMask: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Đăng nhập</h1>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        {!useMetaMask ? (
          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="loading"></span> : null}
              Đăng nhập
            </button>
            
            <div className="login-divider">
              <span>hoặc</span>
            </div>
            
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setUseMetaMask(true)}
              disabled={loading}
            >
              🦊 Sử dụng MetaMask
            </button>
          </form>
        ) : (
          <div>
            <div className="text-center mb-3">
              <p>Kết nối với MetaMask để đăng nhập</p>
            </div>
            
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleMetaMaskLogin}
              disabled={loading}
            >
              {loading ? <span className="loading"></span> : null}
              🦊 Kết nối MetaMask
            </button>
            
            <div className="login-divider">
              <span>hoặc</span>
            </div>
            
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setUseMetaMask(false)}
              disabled={loading}
            >
              ← Quay lại đăng nhập email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;