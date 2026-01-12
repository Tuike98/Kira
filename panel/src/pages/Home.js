import React, { useState, useEffect } from 'react';

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
      const serversResponse = await fetch('/api/servers');
      if (!serversResponse.ok) {
        const errorDetails = await serversResponse.text();
        throw new Error(`Failed to fetch servers. Status: ${serversResponse.status}, StatusText: ${serversResponse.statusText}, Details: ${errorDetails}`);
      }
      const servers = await serversResponse.json();
      const adminServers = servers.filter(server => (server.permissions & 0x8) === 0x8);
      const botServers = servers.filter(server => server.hasBot);

      setAdminServerCount(adminServers.length);
      setBotServerCount(botServers.length);

      const subscriptionsResponse = await fetch('/api/licenses');
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

  return (
    <div className="page">
      {isAuthenticated ? (
        <>
          <h1>Witamy, {username}!</h1>
          {loading ? (
            <p>Ładowanie danych...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <ul>
              <li>Serwery, na których masz uprawnienia administratora: {adminServerCount}</li>
              <li>Serwery, na których jest Kira Evolved: {botServerCount}</li>
              <li>Subskrypcje: {subscriptionCount}</li>
            </ul>
          )}
        </>
      ) : (
        <>
          <h1>Witamy w Kira Evolved!</h1>
          <p>Kira Evolved to zaawansowany bot do zarządzania serwerami Discord, oferujący szeroki zakres funkcji, takich jak zarządzanie kanałami, użytkownikami, rolami i wiele więcej.</p>
          <p>Główne funkcje Kira Evolved:</p>
          <ul>
            <li>Zarządzanie kanałami: Możliwość tworzenia, edytowania i usuwania kanałów.</li>
            <li>Zarządzanie użytkownikami: Narzędzia do moderacji, przydzielania ról i zarządzania użytkownikami.</li>
            <li>Automatyzacja: Automatyczne przypisywanie ról, powitania nowych użytkowników i inne.</li>
            <li>Bezpieczeństwo: Zaawansowane funkcje zabezpieczające, takie jak system antyspamowy.</li>
            <li>Integracje: Integracje z innymi narzędziami i usługami.</li>
          </ul>
          <a href="/auth/discord">Zaloguj się poprzez Discord</a>
        </>
      )}
    </div>
  );
}

export default Home;