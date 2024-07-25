import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MessageForm from '../components/MessageForm';
import MenuForm from '../components/MenuForm';

function Dashboard() {
  const { id } = useParams();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [embedTemplates, setEmbedTemplates] = useState([]);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchServerDetails();
    fetchChannels();
  }, [id]);

  const fetchServerDetails = async () => {
    try {
      console.log(`Rozpoczęto pobieranie szczegółów serwera o ID: ${id}`);

      // Sprawdzenie formatu ID serwera
      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        throw new Error(`Nieprawidłowy format ID serwera: ${id}`);
      }

      const response = await fetch(`/api/server/${id}`);
      
      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Nie udało się pobrać szczegółów serwera. Status: ${response.status}, StatusText: ${response.statusText}, Szczegóły: ${errorDetails}`);
      }

      const data = await response.json();
      console.log('Pobrane szczegóły serwera:', data);

      // Walidacja struktury danych
      if (typeof data !== 'object' || data === null) {
        throw new Error('Oczekiwano, że dane będą obiektem.');
      }

      // Walidacja kluczowych właściwości obiektu serwera
      const requiredProps = ['id', 'name', 'icon', 'memberCount', 'ownerID'];
      requiredProps.forEach(prop => {
        if (!data.hasOwnProperty(prop)) {
          throw new Error(`Brak wymaganej właściwości w danych serwera: ${prop}`);
        }
      });

      setServer(data);
    } catch (error) {
      console.error('Błąd podczas pobierania szczegółów serwera:', error.message);
      console.error('Szczegóły błędu:', error.stack);
      setError('Błąd podczas pobierania szczegółów serwera: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      console.log(`Rozpoczęto pobieranie kanałów dla serwera o ID: ${id}`);

      const response = await fetch(`/api/server/${id}/channels`);
      
      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Failed to fetch channels. Status: ${response.status}, StatusText: ${response.statusText}, Details: ${errorDetails}`);
      }

      const data = await response.json();
      console.log('Pobrane kanały:', data);

      // Walidacja struktury danych
      if (!Array.isArray(data)) {
        throw new Error('Oczekiwano, że dane będą tablicą.');
      }

      // Walidacja pojedynczego obiektu kanału
      data.forEach(channel => {
        if (!channel.id || !channel.name || typeof channel.id !== 'string' || typeof channel.name !== 'string') {
          throw new Error('Nieprawidłowa struktura danych kanału. Oczekiwano obiektów z właściwościami id i name typu string.');
        }
      });

      setChannels(data);
      if (data.length > 0) {
        setSelectedChannel(data[0].id);
        console.log(`Ustawiono wybrany kanał na: ${data[0].id} (${data[0].name})`);
      } else {
        console.log('Brak dostępnych kanałów.');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania kanałów:', error.message);
      setError('Błąd podczas pobierania kanałów: ' + error.message);
    }
  };

  const handleSendMessage = async ({ message, embedTitle, embedColor, embedDescription, embedFooter, attachments }) => {
    try {
      const embedMessage = {
        title: embedTitle,
        color: embedColor,
        description: embedDescription,
        footer: embedFooter,
      };

      console.log('Sending message:', { message, embedMessage, attachments }); // Dodane logowanie

      const response = await fetch(`/api/server/${id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          message,
          embedMessage,
          attachments
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      alert('Message sent successfully');
      setHistory([...history, { message, embedMessage }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message: ' + error.message);
    }
  };

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
    return <div className="page"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="page"><p>{error}</p></div>;
  }

  return (
    <div className="container">
      <div className="page">
        {server ? (
          <>
            <h1>{server.name}</h1>
            <img src={server.icon} alt={`${server.name} icon`} width="100" height="100" />
            <p>Members: {server.memberCount}</p>
            <p>Owner ID: {server.ownerID}</p>
            {server.license ? (
              <>
                <p>License Key: {server.license.key}</p>
                <p>Expires At: {new Date(server.license.expiresAt).toLocaleString()}</p>
              </>
            ) : (
              <p>No active license</p>
            )}
            <MessageForm
              channels={channels}
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
              handleSendMessage={handleSendMessage}
              handleSaveMessageTemplate={handleSaveMessageTemplate}
              handleSaveEmbedTemplate={handleSaveEmbedTemplate}
              handlePreviewToggle={handlePreviewToggle}
              preview={preview}
            />
            <MenuForm
              channels={channels}
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
            />
            <div className="section">
              <h2 onClick={() => document.getElementById('historySection').classList.toggle('hidden')}>Message History</h2>
              <div id="historySection" className="hidden">
                <ul>
                  {history.map((item, index) => (
                    <li key={index}>
                      <p><strong>Message:</strong> {item.message}</p>
                      <p><strong>Embed:</strong> {item.embedMessage && item.embedMessage.title ? item.embedMessage.title : 'No embed'}</p>
                      <p><strong>Channel:</strong> {channels.find(channel => channel.id === selectedChannel)?.name || 'Unknown'}</p>
                    </li>
                  ))}
                </ul>
              </div>
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