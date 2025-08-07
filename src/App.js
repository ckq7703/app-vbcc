import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import IssueCertificate from './components/IssueCertificate';
import ViewCertificates from './components/ViewCertificates';
import getWeb3 from './utils/web3Config';
import CertificateList from './components/CertificateList';
import CertificateVerificationPage from './components/CertificateVerificationPage';

function App() {
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/check', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setRole(data.role);
            setIsAuthenticated(true);
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

  return (
    <Router>
      <div className="container mt-4">
        <Routes>
          {/* Route công khai cho xác minh chứng chỉ (không yêu cầu đăng nhập) */}
          <Route path="/verify" element={<CertificateVerificationPage />} />

          {/* Route yêu cầu đăng nhập */}
          {isAuthenticated ? (
            <Route path="/" element={<Dashboard role={role} account={account} onLogout={handleLogout} />}>
              {role === 'admin' && (
                <>
                  <Route path="issue" element={<IssueCertificate />} />
                  <Route path="admin/certificates" element={<CertificateList />} />
                </>
              )}
              {(role === 'admin' || role === 'student' || role === 'verifier') && (
                <Route path="view" element={<ViewCertificates />} />
              )}
              {/* Redirect to default route if none matched */}
              <Route path="*" element={<Navigate to={role === 'admin' ? "/issue" : "/view"} />} />
            </Route>
          ) : (
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          )}

          {/* Redirect to login nếu chưa đăng nhập và không phải /verify */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;