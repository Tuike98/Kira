import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './Navigation.css';

const Navigation = ({ isAuthenticated, username }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="navbar-logo-icon">🤖</span>
          <span className="navbar-logo-text">Kira Evolved</span>
        </Link>

        <button
          className={`navbar-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                to="/servers"
                className={`navbar-link ${isActive('/servers') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Servers
              </Link>
              <Link
                to="/templates"
                className={`navbar-link ${isActive('/templates') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Templates
              </Link>
              <Link
                to="/licenses"
                className={`navbar-link ${isActive('/licenses') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Licenses
              </Link>

              <div className="navbar-right">
                <button
                  className="navbar-theme-toggle"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <div className="navbar-user">
                  <span className="navbar-username">{username}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="navbar-right">
              <button
                className="navbar-theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <a href="/auth/discord" className="navbar-login-btn">
                Login with Discord
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
