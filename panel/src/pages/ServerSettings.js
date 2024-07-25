import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ServerSettings() {
  const { id } = useParams();
  const [serverSettings, setServerSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchServerSettings();
  }, [id]);

  const fetchServerSettings = async () => {
    try {
      const response = await fetch(`/api/server/${id}/serversettings`);
      if (!response.ok) throw new Error('Failed to fetch server settings');
      const data = await response.json();
      setServerSettings(data);
    } catch (error) {
      console.error('Error fetching server settings:', error);
      setError('Error fetching server settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/server/${id}/serversettings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverSettings),
      });
      if (!response.ok) throw new Error('Failed to save server settings');
      const data = await response.json();
      setSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving server settings:', error);
      setError('Error saving server settings: ' + error.message);
    }
  };

  if (loading) {
    return <div className="page"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="page"><p>{error}</p></div>;
  }

  return (
    <div className="page">
      <h1>Server Settings</h1>
      {success && <p className="success">{success}</p>}
      {serverSettings ? (
        <form onSubmit={handleSaveSettings}>
          <label>
            Server Name:
            <input
              type="text"
              value={serverSettings.name}
              onChange={(e) => setServerSettings({ ...serverSettings, name: e.target.value })}
            />
          </label>
          <label>
            Welcome Message:
            <textarea
              value={serverSettings.welcomeMessage}
              onChange={(e) => setServerSettings({ ...serverSettings, welcomeMessage: e.target.value })}
            />
          </label>
          <label>
            Auto-Role:
            <input
              type="text"
              value={serverSettings.autoRole}
              onChange={(e) => setServerSettings({ ...serverSettings, autoRole: e.target.value })}
            />
          </label>
          {/* Add more settings fields as needed */}
          <button type="submit">Save Settings</button>
        </form>
      ) : (
        <p>No settings found</p>
      )}
    </div>
  );
}

export default ServerSettings;