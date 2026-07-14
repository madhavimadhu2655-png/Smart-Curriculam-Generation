import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Icons for navigation
  const getNavIcon = (path) => {
    const icons = {
      '/dashboard': '📊',
      '/students': '👥',
      '/attendance': '📋',
      '/qr-scanner': '📱',
      '/learning-paths': '🎯',
      '/create-path': '➕',
      '/reports': '📈'
    };
    return icons[path] || '📄';
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">ET</div>
          <span>EduTrack</span>
        </Link>

        <nav className="nav">
          {user && (
            <>
              <ul className="nav-links">
                <li>
                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                    <span className="nav-link-icon">{getNavIcon('/dashboard')}</span>
                    Dashboard
                  </Link>
                </li>
                {user.role === 'teacher' && (
                  <>
                    <li>
                      <Link to="/students" className={`nav-link ${isActive('/students')}`}>
                        <span className="nav-link-icon">{getNavIcon('/students')}</span>
                        Students
                      </Link>
                    </li>
                    <li>
                      <Link to="/attendance" className={`nav-link ${isActive('/attendance')}`}>
                        <span className="nav-link-icon">{getNavIcon('/attendance')}</span>
                        Attendance
                      </Link>
                    </li>
                    <li>
                      <Link to="/qr-scanner" className={`nav-link ${isActive('/qr-scanner')}`}>
                        <span className="nav-link-icon">{getNavIcon('/qr-scanner')}</span>
                        QR Scanner
                      </Link>
                    </li>
                    <li>
                      <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
                        <span className="nav-link-icon">{getNavIcon('/reports')}</span>
                        Reports
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link to="/learning-paths" className={`nav-link ${isActive('/learning-paths')}`}>
                    <span className="nav-link-icon">{getNavIcon('/learning-paths')}</span>
                    Learning Paths
                  </Link>
                </li>
              </ul>

              <div className="user-menu">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                      {user.name || user.email?.split('@')[0] || 'Demo User'}
                    </div>
                    <div className="user-role-badge">
                      {user.role || 'teacher'}
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </div>
            </>
          )}

          {!user && (
            <div className="nav-links">
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>
                Login
              </Link>
              <Link to="/register" className={`nav-link ${isActive('/register')}`}>
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;