import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Dashboard = ({ role, account, onLogout }) => {
  const location = useLocation();

  const isActiveLink = (path) => {
    return location.pathname === path ? 'sidebar-link active' : 'sidebar-link';
  };

  const handleLogout = (e) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-brand">
            <span className="brand-icon">🎓</span>
            <span className="brand-text">Quản lý Chứng chỉ</span>
          </div>
          
          <div className="header-right">
            <div className="notification-icon">
              <span className="notification-badge">3</span>
              🔔
            </div>
            
            <div className="user-info">
              <span className="user-email">{account}</span>
              <span className="user-role-badge">{role === 'admin' ? 'Quản trị viên' : role === 'student' ? 'Sinh viên' : 'Người xác minh'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <Link className={isActiveLink('/')} to="/">
              <span className="sidebar-icon">🏠</span>
              <span className="sidebar-text">Trang chủ</span>
            </Link>
            
            {role === 'admin' && (
              <>
                <Link className={isActiveLink('/issue')} to="/issue">
                  <span className="sidebar-icon">📋</span>
                  <span className="sidebar-text">Phát hành chứng chỉ</span>
                </Link>
                <Link className={isActiveLink('/admin/certificates')} to="/admin/certificates">
                  <span className="sidebar-icon">📋</span>
                  <span className="sidebar-text">Danh sách chứng chỉ</span>
                </Link>
              </>
            )}
            
            {(role === 'student' || role === 'admin') && (
              <Link className={isActiveLink('/view')} to="/view">
                <span className="sidebar-icon">👁</span>
                <span className="sidebar-text">Xem chứng chỉ</span>
              </Link>
            )}
            
            {role === 'verifier' && (
              <Link className={isActiveLink('/view')} to="/view">
                <span className="sidebar-icon">✓</span>
                <span className="sidebar-text">Xác minh</span>
              </Link>
            )}
          </nav>
          
          {/* Logout Button at Bottom */}
          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <span className="sidebar-icon">🚪</span>
              <span className="sidebar-text">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;