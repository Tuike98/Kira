import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageForm from '../components/MessageForm';
import MenuForm from '../components/MenuForm';

function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [embedTemplates, setEmbedTemplates] = useState([]);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchServerDetails();
    fetchChannels();
  }, [fetchServerDetails, fetchChannels]);

  const fetchServerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate server ID format
      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        throw new Error(`Invalid server ID format: ${id}`);
      }

      const response = await fetch(`/api/server/${id}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch server details (Status: ${response.status})`);
      }

      const data = await response.json();

      // Validate data structure
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid server data received');
      }

      const requiredProps = ['id', 'name', 'icon', 'memberCount', 'ownerID'];
      const missingProps = requiredProps.filter(prop => !data.hasOwnProperty(prop));
      if (missingProps.length > 0) {
        throw new Error(`Missing required properties: ${missingProps.join(', ')}`);
      }

      setServer(data);
    } catch (error) {
      setError('Error fetching server details: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch(`/api/server/${id}/channels`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch channels (Status: ${response.status})`);
      }

      const data = await response.json();

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid channels data received');
      }

      // Validate channel objects
      const invalidChannel = data.find(channel =>
        !channel.id || !channel.name ||
        typeof channel.id !== 'string' ||
        typeof channel.name !== 'string'
      );

      if (invalidChannel) {
        throw new Error('Invalid channel structure in response');
      }

      setChannels(data);
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0].id);
      }
    } catch (error) {
      setError('Error fetching channels: ' + error.message);
    }
  }, [id, selectedChannel]);

  const handleSendMessage = useCallback(async ({ message, embedTitle, embedColor, embedDescription, embedFooter, attachments }) => {
    try {
      setSendingMessage(true);
      setError(null);

      if (!selectedChannel) {
        throw new Error('Please select a channel first');
      }

      const embedMessage = (embedTitle || embedDescription)
        ? {
            title: embedTitle || undefined,
            color: embedColor || '#000000',
            description: embedDescription || undefined,
            footer: embedFooter || undefined,
          }
        : null;

      const response = await fetch(`/api/server/${id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          channelId: selectedChannel,
          message: message || undefined,
          embedMessage,
          attachments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Success feedback
      setHistory(prev => [...prev, {
        message,
        embedMessage,
        timestamp: new Date().toISOString(),
        channelId: selectedChannel
      }]);

      return { success: true };
    } catch (error) {
      setError('Error sending message: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setSendingMessage(false);
    }
  }, [id, selectedChannel]);

  const handleSaveMessageTemplate = (message) => {
    setMessageTemplates([...messageTemplates, message]);
  };

  const handleSaveEmbedTemplate = (embedMessage) => {
    setEmbedTemplates([...embedTemplates, embedMessage]);
  };

  const handlePreviewToggle = () => {
    setPreview(!preview);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading server details...</p>
        </div>
      </div>
    );
  }

  if (error && !server) {
    return (
      <div className="page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page">
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {server ? (
          <>
            <div className="server-header">
              <img src={server.icon} alt={`${server.name} icon`} width="100" height="100" />
              <div className="server-info">
                <h1>{server.name}</h1>
                <p>Members: {server.memberCount}</p>
                <p>Owner ID: {server.ownerID}</p>
                {server.license ? (
                  <div className="license-info">
                    <p><strong>License Key:</strong> {server.license.key}</p>
                    <p><strong>Expires:</strong> {new Date(server.license.expiresAt).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="no-license">No active license</p>
                )}
              </div>
            </div>
            <MessageForm
              channels={channels}
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
              handleSendMessage={handleSendMessage}
              handleSaveMessageTemplate={handleSaveMessageTemplate}
              handleSaveEmbedTemplate={handleSaveEmbedTemplate}
              handlePreviewToggle={handlePreviewToggle}
              preview={preview}
              sending={sendingMessage}
            />
            <MenuForm
              channels={channels}
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
            />
            <div className="section">
              <h2
                onClick={() => setHistoryVisible(!historyVisible)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Message History {historyVisible ? '▼' : '▶'}
              </h2>
              {historyVisible && (
                <div className="history-section">
                  {history.length === 0 ? (
                    <p>No messages sent yet</p>
                  ) : (
                    <ul>
                      {history.map((item, index) => (
                        <li key={index}>
                          <p><strong>Message:</strong> {item.message || 'None'}</p>
                          <p><strong>Embed:</strong> {item.embedMessage?.title || 'No embed'}</p>
                          <p><strong>Channel:</strong> {channels.find(channel => channel.id === item.channelId)?.name || 'Unknown'}</p>
                          <p><strong>Time:</strong> {new Date(item.timestamp).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <p>Server not found</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;