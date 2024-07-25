import React, { useState, useEffect } from 'react';

function Servers({ isAuthenticated }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [editingServer, setEditingServer] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchServers();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) throw new Error('Failed to fetch servers');
      const data = await response.json();
      console.log('Otrzymane dane serwerów:', data);
      setServers(data);
    } catch (error) {
      console.error('Error fetching servers:', error);
      setError('Error fetching servers: ' + error.message);
      addNotification('Error fetching servers: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message, type) => {
    setNotifications([...notifications, { message, type }]);
    setTimeout(() => {
      setNotifications((notifications) => notifications.slice(1));
    }, 5000);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleFilter = (event) => {
    setFilter(event.target.value);
  };

  const handleViewMode = (mode) => {
    setViewMode(mode);
  };

  const handleEdit = (server) => {
    setEditingServer(server);
  };

  const handleSave = (server) => {
    setNotifications([...notifications, { message: 'Server settings saved successfully!', type: 'success' }]);
    setEditingServer(null);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + servers.map(server => `${server.name},${server.id},${server.memberCount},${server.ownerID}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "servers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredServers = servers
    .filter(server =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filter === 'all' ||
      (filter === 'withBot' && server.hasBot) ||
      (filter === 'withLicense' && server.license) ||
      (filter === 'withoutBot' && !server.hasBot) ||
      (filter === 'withoutLicense' && !server.license))
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  const indexOfLastServer = currentPage * itemsPerPage;
  const indexOfFirstServer = indexOfLastServer - itemsPerPage;
  const currentServers = filteredServers.slice(indexOfFirstServer, indexOfLastServer);

  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);

  if (!isAuthenticated) {
    return <div className="page"><p>Proszę się zalogować, aby uzyskać dostęp do tej strony.</p></div>;
  }

  if (loading) {
    return <div className="page"><p>Ładowanie...</p></div>;
  }

  if (error) {
    return <div className="page"><p>{error}</p></div>;
  }

  return (
    <div className="page">
      <h1>Serwery</h1>
      <input
        type="text"
        placeholder="Szukaj serwerów"
        value={searchTerm}
        onChange={handleSearch}
      />
      <button onClick={handleSort}>Sortuj {sortOrder === 'asc' ? 'Malejąco' : 'Rosnąco'}</button>
      <select value={filter} onChange={handleFilter}>
        <option value="all">Wszystkie</option>
        <option value="withBot">Z Botem</option>
        <option value="withLicense">Z Licencją</option>
        <option value="withoutBot">Bez Bota</option>
        <option value="withoutLicense">Bez Licencji</option>
      </select>
      <button onClick={() => handleViewMode('list')}>Widok Listy</button>
      <button onClick={() => handleViewMode('grid')}>Widok Siatki</button>
      <button onClick={handleExport}>Eksport do CSV</button>
      {notifications.map((note, index) => (
        <p key={index} className={`notification ${note.type}`}>{note.message}</p>
      ))}
      <div className={viewMode === 'list' ? 'list-view' : 'grid-view'}>
        {currentServers.map((server) => (
          <div key={server.id} className="server-item">
            <img src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`} alt={`${server.name} icon`} width="50" height="50" />
            <div className="server-info">
              {editingServer && editingServer.id === server.id ? (
                <>
                  <input type="text" value={editingServer.name} onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })} />
                  <button onClick={() => handleSave(editingServer)}>Zapisz</button>
                </>
              ) : (
                <>
                  <h2>{server.name}</h2>
                  <p>Członkowie: {server.memberCount}</p>
                  <p>ID Właściciela: {server.ownerID}</p>
                  <p>Właściciel: {server.ownerUsername}</p>
                  <img src={server.ownerAvatar} alt="Owner Avatar" width="50" height="50" />
                  <button onClick={() => handleEdit(server)}>Edytuj</button>
                </>
              )}
              {server.license && server.hasBot ? (
                <button onClick={() => window.location.href = `/dashboard/${server.id}`}>Dashboard</button>
              ) : server.license && !server.hasBot ? (
                <button onClick={() => window.location.href = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=8&guild_id=${server.id}`}>Zaproś Bota</button>
              ) : (
                <a href="/license">Aktywuj Licencję</a>
              )}
              <div className="server-widgets">
                <p>Aktywność użytkowników: {server.userActivity}</p>
                <p>Liczba wiadomości dziennie: {server.dailyMessages}</p>
              </div>
              <div className="server-activity-history">
                <h3>Historia aktywności</h3>
                <ul>
                  {server.activityHistory && server.activityHistory.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination">
        {[...Array(totalPages)].map((_, index) => (
          <button key={index} onClick={() => setCurrentPage(index + 1)}>{index + 1}</button>
        ))}
      </div>
    </div>
  );
}

export default Servers;