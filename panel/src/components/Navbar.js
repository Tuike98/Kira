import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ isAuthenticated }) {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        {isAuthenticated && (
          <>
            <li>
              <Link to="/license">License</Link>
            </li>
            <li>
              <Link to="/servers">Servers</Link>
            </li>
            <li>
              <Link to="/logout">Logout</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;