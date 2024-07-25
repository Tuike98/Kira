// src/components/MenuForm.js
import React, { useState } from 'react';

function MenuForm({ channels, selectedChannel, setSelectedChannel }) {
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemLabel, setMenuItemLabel] = useState('');
  const [menuItemMessage, setMenuItemMessage] = useState('');
  const [menuType, setMenuType] = useState('normal');
  const [selectedMessage, setSelectedMessage] = useState('');

  const handleAddMenuItem = () => {
    if (menuItemLabel && menuItemMessage) {
      setMenuItems([...menuItems, { label: menuItemLabel, message: menuItemMessage }]);
      setMenuItemLabel('');
      setMenuItemMessage('');
    }
  };

  const handleCreateMenu = async () => {
    try {
      const response = await fetch(`/api/server/${selectedChannel}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          message: selectedMessage,
          menuType,
          menuItems,
        }),
      });
      if (!response.ok) throw new Error('Failed to create menu');
      alert('Menu created successfully');
    } catch (error) {
      console.error('Error creating menu:', error);
    }
  };

  return (
    <div className="section">
      <h2 onClick={() => document.getElementById('menuSection').classList.toggle('hidden')}>Create Menu</h2>
      <div id="menuSection" className="hidden">
        <label>
          Select Channel:
          <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>{channel.name}</option>
            ))}
          </select>
        </label>
        <label>
          Select Message:
          <textarea
            value={selectedMessage}
            onChange={(e) => setSelectedMessage(e.target.value)}
            placeholder="Enter the message for the menu"
          />
        </label>
        <label>
          Menu Type:
          <select value={menuType} onChange={(e) => setMenuType(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="dropdown">Dropdown</option>
          </select>
        </label>
        <div>
          <input
            type="text"
            value={menuItemLabel}
            onChange={(e) => setMenuItemLabel(e.target.value)}
            placeholder="Menu Item Label"
          />
          <input
            type="text"
            value={menuItemMessage}
            onChange={(e) => setMenuItemMessage(e.target.value)}
            placeholder="Menu Item Message"
          />
          <button onClick={handleAddMenuItem}>Add Menu Item</button>
        </div>
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>{item.label} - {item.message}</li>
          ))}
        </ul>
        <button onClick={handleCreateMenu}>Create Menu</button>
      </div>
    </div>
  );
}

export default MenuForm;