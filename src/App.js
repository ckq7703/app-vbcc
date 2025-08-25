import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import IssueCertificate from './components/IssueCertificate';
import BulkIssueCertificate from './components/BulkIssueCertificate';

import ViewCertificates from './components/ViewCertificates';
import getWeb3 from './utils/web3Config';
import CertificateList from './components/CertificateList';
import CertificateVerificationPage from './components/CertificateVerificationPage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // ✅ thêm state loading

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setRole(data.role);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }

      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('MetaMask connection failed:', error);
      }

      setLoadingAuth(false); // ✅ kết thúc kiểm tra
    };
    checkAuth();
  }, []);

  const handleLogin = (token, userRole) => {
    localStorage.setItem('token', token);
    setRole(userRole);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setRole(null);
    setIsAuthenticated(false);
    setAccount(null);
  };

  // ✅ Hiển thị khi đang kiểm tra đăng nhập
  if (loadingAuth) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang kiểm tra đăng nhập...</div>;
  }

  return (
    <Router>
      <div className="container mt-4">
        <Routes>
          {/* Route công khai cho xác minh chứng chỉ */}
          <Route path="/verify" element={<CertificateVerificationPage />} />

          {/* Route yêu cầu đăng nhập */}
          {isAuthenticated ? (
            <Route path="/" element={<Dashboard role={role} account={account} onLogout={handleLogout} />}>
              {role === 'admin' && (
                <>
                  <Route path="issue" element={<IssueCertificate />} />
                  <Route path="issueimport" element={<BulkIssueCertificate />} />
                  <Route path="admin/certificates" element={<CertificateList />} />
                </>
              )}
              {(role === 'admin' || role === 'student' || role === 'verifier') && (
                <Route path="view" element={<ViewCertificates />} />
              )}
              {/* Redirect mặc định */}
              <Route path="*" element={<Navigate to={role === 'admin' ? "/issue" : "/view"} />} />
            </Route>
          ) : (
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          )}

          {/* Redirect về login nếu chưa đăng nhập */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
