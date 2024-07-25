import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function BotSettings() {
  const { id } = useParams();
  const [botSettings, setBotSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBotSettings();
  }, [id]);

  const fetchBotSettings = async () => {
    try {
      const response = await fetch(`/api/server/${id}/botsettings`);
      if (!response.ok) throw new Error('Failed to fetch bot settings');
      const data = await response.json();
      setBotSettings(data);
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      setError('Error fetching bot settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    // Implement save logic here
  };

  if (loading) {
    return <div className="page"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="page"><p>{error}</p></div>;
  }

  return (
    <div className="page">
      <h1>Bot Settings</h1>
      {botSettings ? (
        <form onSubmit={handleSaveSettings}>
          <label>
            Bot Prefix:
            <input type="text" value={botSettings.prefix} onChange={(e) => setBotSettings({ ...botSettings, prefix: e.target.value })} />
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

export default BotSettings;
