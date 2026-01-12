import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function WelcomeSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);

  const [settings, setSettings] = useState({
    welcomeEnabled: false,
    welcomeChannelId: '',
    welcomeMessage: { message: '', embed: null },
    goodbyeEnabled: false,
    goodbyeChannelId: '',
    goodbyeMessage: { message: '', embed: null },
    dmNewMembers: false,
    dmMessage: '',
    autoRoleId: ''
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/welcome/${id}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch welcome settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      setError('Error fetching settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchChannelsAndRoles = useCallback(async () => {
    try {
      const [channelsRes, rolesRes] = await Promise.all([
        fetch(`/api/server/${id}/channels`, { credentials: 'include' }),
        fetch(`/api/server/${id}/roles`, { credentials: 'include' })
      ]);

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error fetching channels/roles:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchSettings();
    fetchChannelsAndRoles();
  }, [fetchSettings, fetchChannelsAndRoles]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/welcome/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Error saving settings: ' + error.message);
    }
  };

  const handleTest = async (type) => {
    setError(null);
    setSuccess(null);

    try {
      const channelId = type === 'welcome' ? settings.welcomeChannelId : settings.goodbyeChannelId;

      if (!channelId) {
        setError('Please select a channel first');
        return;
      }

      const response = await fetch(`/api/welcome/${id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type, channelId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test message');
      }

      setSuccess(`Test ${type} message sent!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Error sending test: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Welcome & Goodbye Settings</h1>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Welcome Settings */}
        <div className="settings-section">
          <h2>Welcome Messages</h2>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.welcomeEnabled}
              onChange={(e) => setSettings({ ...settings, welcomeEnabled: e.target.checked })}
            />
            Enable Welcome Messages
          </label>

          {settings.welcomeEnabled && (
            <>
              <label>
                Welcome Channel:
                <select
                  value={settings.welcomeChannelId}
                  onChange={(e) => setSettings({ ...settings, welcomeChannelId: e.target.value })}
                  required={settings.welcomeEnabled}
                >
                  <option value="">Select a channel</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Welcome Message:
                <textarea
                  value={settings.welcomeMessage?.message || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    welcomeMessage: { ...settings.welcomeMessage, message: e.target.value }
                  })}
                  placeholder="Welcome {{user.mention}} to {{server}}! We now have {{memberCount}} members!"
                  rows={4}
                />
              </label>

              <div className="variable-hints">
                <p><strong>Available variables:</strong></p>
                <ul>
                  <li><code>{'{{user}}'}</code> - User's tag</li>
                  <li><code>{'{{user.mention}}'}</code> - Mention the user</li>
                  <li><code>{'{{server}}'}</code> - Server name</li>
                  <li><code>{'{{memberCount}}'}</code> - Total member count</li>
                </ul>
              </div>

              <button type="button" onClick={() => handleTest('welcome')} className="btn-secondary">
                Send Test Welcome Message
              </button>
            </>
          )}
        </div>

        {/* Goodbye Settings */}
        <div className="settings-section">
          <h2>Goodbye Messages</h2>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.goodbyeEnabled}
              onChange={(e) => setSettings({ ...settings, goodbyeEnabled: e.target.checked })}
            />
            Enable Goodbye Messages
          </label>

          {settings.goodbyeEnabled && (
            <>
              <label>
                Goodbye Channel:
                <select
                  value={settings.goodbyeChannelId}
                  onChange={(e) => setSettings({ ...settings, goodbyeChannelId: e.target.value })}
                  required={settings.goodbyeEnabled}
                >
                  <option value="">Select a channel</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Goodbye Message:
                <textarea
                  value={settings.goodbyeMessage?.message || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    goodbyeMessage: { ...settings.goodbyeMessage, message: e.target.value }
                  })}
                  placeholder="Goodbye {{user}}! We'll miss you."
                  rows={4}
                />
              </label>

              <button type="button" onClick={() => handleTest('goodbye')} className="btn-secondary">
                Send Test Goodbye Message
              </button>
            </>
          )}
        </div>

        {/* DM Settings */}
        <div className="settings-section">
          <h2>Direct Message Settings</h2>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.dmNewMembers}
              onChange={(e) => setSettings({ ...settings, dmNewMembers: e.target.checked })}
            />
            Send DM to New Members
          </label>

          {settings.dmNewMembers && (
            <label>
              DM Message:
              <textarea
                value={settings.dmMessage || ''}
                onChange={(e) => setSettings({ ...settings, dmMessage: e.target.value })}
                placeholder="Welcome to {{server}}! Please read the rules."
                rows={4}
              />
            </label>
          )}
        </div>

        {/* Auto-Role Settings */}
        <div className="settings-section">
          <h2>Auto-Role</h2>

          <label>
            Auto-Role (assigned to new members):
            <select
              value={settings.autoRoleId || ''}
              onChange={(e) => setSettings({ ...settings, autoRoleId: e.target.value })}
            >
              <option value="">None</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Settings</button>
        </div>
      </form>
    </div>
  );
}

export default WelcomeSettings;
