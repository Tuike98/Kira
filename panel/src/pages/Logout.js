import React from 'react';

function Logout() {
  const handleLogout = () => {
    // Logika wylogowania
  };

  return (
    <div className="page">
      <h1>Logout</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Logout;