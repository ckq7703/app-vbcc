import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  GraduationCap,
  FileText,
  Eye,
  CheckCircle2,
  Bell,
  LogOut,
  SquarePlus,
} from 'lucide-react';

const Dashboard = ({ role, account, onLogout }) => {
  const location = useLocation();

  const isActiveLink = (path) =>
    location.pathname === path ? 'sidebar-link active' : 'sidebar-link';

  const handleLogout = (e) => {
    e.preventDefault();
    onLogout();
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          {/* Brand */}
          <div className="header-brand">
            <GraduationCap size={28} strokeWidth={2} color="#1e3a8a" />
            <span className="brand-text">Quản lý Chứng chỉ</span>
          </div>

          {/* Right side */}
          <div className="header-right">
            {/* Notification */}
            <div className="notification-icon">
              <Bell size={22} strokeWidth={2} />
              <span className="notification-badge">3</span>
            </div>

            {/* User Info */}
            <div className="user-info">
              <span className="user-email">{account}</span>
              <span className="user-role-badge">
                {role === 'admin'
                  ? 'Quản trị viên'
                  : role === 'student'
                  ? 'Sinh viên'
                  : 'Người xác minh'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <Link className={isActiveLink('/')} to="/">
              <Home size={20} />
              <span className="sidebar-text">Trang chủ</span>
            </Link>

            {role === 'admin' && (
              <>
                <Link className={isActiveLink('/issue')} to="/issue">
                  <SquarePlus size={20} />
                  <span className="sidebar-text">Phát hành chứng chỉ</span>
                </Link>
                <Link className={isActiveLink('/issueimport')} to="/issueimport">
                  <SquarePlus size={20} />
                  <span className="sidebar-text">Phát hành chứng chỉ hàng loạt</span>
                </Link>
                <Link
                  className={isActiveLink('/admin/certificates')}
                  to="/admin/certificates"
                >
                  <FileText size={20} />
                  <span className="sidebar-text">Danh sách chứng chỉ</span>
                </Link>
              </>
            )}

            {(role === 'student' || role === 'admin') && (
              <Link className={isActiveLink('/view')} to="/view">
                <Eye size={20} />
                <span className="sidebar-text">Xem chứng chỉ</span>
              </Link>
            )}

            {role === 'verifier' && (
              <Link className={isActiveLink('/view')} to="/view">
                <CheckCircle2 size={20} />
                <span className="sidebar-text">Xác minh</span>
              </Link>
            )}
          </nav>

          {/* Logout */}
          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span className="sidebar-text">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Content */}
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
