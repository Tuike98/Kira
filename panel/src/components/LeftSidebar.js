import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function LeftSidebar() {
  const { id } = useParams(); // Pobranie ID serwera z parametrów URL
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      <div className={`left-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <h2 className={collapsed ? 'collapsed' : ''}>Server Options</h2>
        <ul>
          <li>
            <Link to={`/dashboard/${id}/serversettings`}>Server Settings</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/serversettings`}>Server Settings</Link></li>
              <li><Link to={`/dashboard/${id}/botsettings`}>Bot Settings</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/channels`}>Channels</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/categorymanage`}>Manage Categories</Link></li>
              <li><Link to={`/dashboard/${id}/managechannels`}>Manage Channels</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/users`}>Users</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/userslist`}>Users List</Link></li>
              <li><Link to={`/dashboard/${id}/manageusers`}>Manage Users</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/permissions`}>Permissions</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/createperms`}>Create Permissions</Link></li>
              <li><Link to={`/dashboard/${id}/manageperms`}>Manage Permissions</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/messages`}>Messages</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/createmessage`}>Create Message</Link></li>
              <li><Link to={`/dashboard/${id}/managemessages`}>Manage Messages</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/embed`}>Embed</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/createembed`}>Create Embed</Link></li>
              <li><Link to={`/dashboard/${id}/manageembed`}>Manage Embed</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/reactionroles`}>Reaction Roles</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/createrr`}>Create RR</Link></li>
              <li><Link to={`/dashboard/${id}/managerr`}>Manage RR</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/menu`}>Menu</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/createmenu`}>Create Menu</Link></li>
              <li><Link to={`/dashboard/${id}/managemenu`}>Manage Menu</Link></li>
            </ul>
          </li>
          <li>
            <Link to={`/dashboard/${id}/ticket`}>Ticket</Link>
            <ul>
              <li><Link to={`/dashboard/${id}/createticket`}>Create Ticket</Link></li>
              <li><Link to={`/dashboard/${id}/manageticket`}>Manage Ticket</Link></li>
            </ul>
          </li>
        </ul>
      </div>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {collapsed ? '>' : '<'}
      </button>
    </>
  );
}

export default LeftSidebar;