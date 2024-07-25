import React, { useState, useEffect } from 'react';

function License({ isAuthenticated }) {
  const [servers, setServers] = useState([]);
  const [licenseKey, setLicenseKey] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchServers();
      fetchLicenses();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) throw new Error('Failed to fetch servers');
      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error('Error fetching servers:', error);
      setError('Error fetching servers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses');
      if (!response.ok) throw new Error('Failed to fetch licenses');
      const licenses = await response.json();
      setServers(prevServers =>
        prevServers.map(server => {
          const license = licenses.find(lic => lic.serverId === server.id);
          if (license) {
            const daysLeft = Math.ceil(
              (new Date(license.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
            );
            return {
              ...server,
              licenseExpires: license.expiresAt,
              daysLeft: daysLeft,
            };
          }
          return server;
        })
      );
    } catch (error) {
      console.error('Error fetching licenses:', error);
      setError('Error fetching licenses');
    }
  };

  const handleActivateLicense = async (event) => {
    event.preventDefault();
    if (licenseKey && selectedServer) {
      try {
        const response = await fetch('/api/licenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: licenseKey,
            serverId: selectedServer,
          }),
        });
        if (!response.ok) throw new Error('Failed to activate license');
        const newLicense = await response.json();
        setServers(prevServers =>
          prevServers.map(server =>
            server.id === newLicense.serverId
              ? {
                  ...server,
                  licenseExpires: newLicense.expiresAt,
                  daysLeft: Math.ceil(
                    (new Date(newLicense.expiresAt) - new Date()) /
                    (1000 * 60 * 60 * 24)
                  ),
                }
              : server
          )
        );
        setNotifications([...notifications, 'License activated successfully!']);
      } catch (error) {
        console.error('Error activating license:', error);
        setError('Error activating license');
        setNotifications([...notifications, 'Error activating license']);
      }
    } else {
      alert('Please enter a license key and select a server.');
    }
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

  const filteredServers = servers
    .filter(server =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filter === 'all' || (filter === 'withBot' && server.hasBot) || (filter === 'withLicense' && server.licenseExpires))
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
    return <div className="page"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="page"><p>{error}</p></div>;
  }

  return (
    <div className="page">
      <h1>License</h1>
      <form onSubmit={handleActivateLicense}>
        <label>
          License Key:
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
          />
        </label>
        <label>
          Select Server:
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
          >
            <option value="">Select a server</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Activate</button>
      </form>
      <h2>Servers</h2>
      <input
        type="text"
        placeholder="Search servers"
        value={searchTerm}
        onChange={handleSearch}
      />
      <button onClick={handleSort}>Sort {sortOrder === 'asc' ? 'Descending' : 'Ascending'}</button>
      <select value={filter} onChange={handleFilter}>
        <option value="all">All</option>
        <option value="withBot">With Bot</option>
        <option value="withLicense">With License</option>
      </select>
      <button onClick={() => handleViewMode('list')}>List View</button>
      <button onClick={() => handleViewMode('grid')}>Grid View</button>
      {notifications.map((note, index) => (
        <p key={index} className="notification">{note}</p>
      ))}
      <div className={viewMode === 'list' ? 'list-view' : 'grid-view'}>
        {currentServers.map((server) => (
          <div key={server.id} className="server-item">
            <img src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`} alt={`${server.name} icon`} width="50" height="50" />
            <div className="server-info">
              <h2>{server.name}</h2>
              {server.licenseExpires ? (
                <span> - License expires on {new Date(server.licenseExpires).toLocaleDateString()} ({server.daysLeft} days left)</span>
              ) : (
                <span> - No license</span>
              )}
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

export default License;