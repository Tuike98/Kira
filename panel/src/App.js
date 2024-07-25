import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LeftSidebar from './components/LeftSidebar';
import Home from './pages/Home';
import License from './pages/License';
import Servers from './pages/Servers';
import Dashboard from './pages/Dashboard';
import Logout from './pages/Logout';
import ServerSettings from './pages/ServerSettings';
import BotSettings from './pages/BotSettings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/auth/check')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.isAuthenticated);
        setUsername(data.username);
      })
      .catch(err => console.error('Error checking authentication status:', err));
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} />
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} username={username} />} />
          <Route path="/license" element={<License isAuthenticated={isAuthenticated} />} />
          <Route path="/servers" element={<Servers isAuthenticated={isAuthenticated} />} />
          <Route path="/dashboard/:id" element={<Dashboard />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/dashboard/:id/serversettings" element={<ServerSettings />} />
          <Route path="/dashboard/:id/botsettings" element={<BotSettings />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;