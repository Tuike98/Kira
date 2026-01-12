import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import License from './pages/License';
import Servers from './pages/Servers';
import Dashboard from './pages/Dashboard';
import Logout from './pages/Logout';
import ServerSettings from './pages/ServerSettings';
import BotSettings from './pages/BotSettings';
import './styles/theme.css';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.isAuthenticated);
        setUsername(data.username || '');
      })
      .catch(err => console.error('Error checking authentication status:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner-large"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navigation isAuthenticated={isAuthenticated} username={username} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home isAuthenticated={isAuthenticated} username={username} />} />
              <Route path="/licenses" element={<License isAuthenticated={isAuthenticated} />} />
              <Route path="/servers" element={<Servers isAuthenticated={isAuthenticated} />} />
              <Route path="/dashboard/:id" element={<Dashboard />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/dashboard/:id/serversettings" element={<ServerSettings />} />
              <Route path="/dashboard/:id/botsettings" element={<BotSettings />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;