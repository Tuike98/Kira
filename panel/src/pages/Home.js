import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import './Home.css';

function Home({ isAuthenticated, username }) {
  const [adminServerCount, setAdminServerCount] = useState(0);
  const [botServerCount, setBotServerCount] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const serversResponse = await fetch('/api/servers', { credentials: 'include' });
      if (!serversResponse.ok) {
        const errorDetails = await serversResponse.text();
        throw new Error(`Failed to fetch servers. Status: ${serversResponse.status}, StatusText: ${serversResponse.statusText}, Details: ${errorDetails}`);
      }
      const servers = await serversResponse.json();
      const adminServers = servers.filter(server => (server.permissions & 0x8) === 0x8);
      const botServers = servers.filter(server => server.hasBot);

      setAdminServerCount(adminServers.length);
      setBotServerCount(botServers.length);

      const subscriptionsResponse = await fetch('/api/licenses', { credentials: 'include' });
      if (!subscriptionsResponse.ok) {
        const errorDetails = await subscriptionsResponse.text();
        throw new Error(`Failed to fetch subscriptions. Status: ${subscriptionsResponse.status}, StatusText: ${subscriptionsResponse.statusText}, Details: ${errorDetails}`);
      }
      const subscriptions = await subscriptionsResponse.json();
      setSubscriptionCount(subscriptions.length);
    } catch (error) {
      console.error('Error fetching data:', error.message, error.stack);
      setError('Error fetching data. Please check the server logs for more details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page home-page">
        <div className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Kira Evolved!</h1>
            <p className="hero-description">
              Advanced Discord bot management platform with powerful features for server administration,
              channel management, user moderation, and automation.
            </p>
            <a href="/auth/discord" className="hero-cta">
              <Button variant="primary" size="lg">
                Login with Discord
              </Button>
            </a>
          </div>
        </div>

        <div className="features-grid">
          <Card hoverable>
            <div className="feature-icon">📢</div>
            <h3>Channel Management</h3>
            <p>Create, edit, and delete channels with ease. Full control over your server structure.</p>
          </Card>

          <Card hoverable>
            <div className="feature-icon">👥</div>
            <h3>User Management</h3>
            <p>Moderation tools, role assignment, and comprehensive user management features.</p>
          </Card>

          <Card hoverable>
            <div className="feature-icon">⚙️</div>
            <h3>Automation</h3>
            <p>Automatic role assignment, welcome messages, and custom automated workflows.</p>
          </Card>

          <Card hoverable>
            <div className="feature-icon">🔒</div>
            <h3>Security</h3>
            <p>Advanced security features including anti-spam systems and content filtering.</p>
          </Card>

          <Card hoverable>
            <div className="feature-icon">🔌</div>
            <h3>Integrations</h3>
            <p>Connect with other tools and services to enhance your server functionality.</p>
          </Card>

          <Card hoverable>
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Track server activity, user engagement, and get insights into your community.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {username}!</h1>
        <p className="page-subtitle">Here's an overview of your servers and subscriptions</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="stats-grid">
          <Skeleton height="120px" count={3} />
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{adminServerCount}</div>
            <div className="stat-label">Admin Servers</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #23A559 0%, #1A8A45 100%)' }}>
            <div className="stat-value">{botServerCount}</div>
            <div className="stat-label">Servers with Bot</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #F0B232 0%, #D89A1C 100%)' }}>
            <div className="stat-value">{subscriptionCount}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <Card title="Quick Actions" padding="lg">
          <div className="actions-grid">
            <Button variant="primary" onClick={() => window.location.href = '/servers'}>
              View Servers
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/licenses'}>
              Manage Licenses
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/templates'}>
              Message Templates
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Home;
