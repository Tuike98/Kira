import React, { useState } from 'react';

function MessageForm({ channels, selectedChannel, setSelectedChannel, handleSendMessage, handleSaveMessageTemplate, handleSaveEmbedTemplate, handlePreviewToggle, preview }) {
  const [message, setMessage] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedColor, setEmbedColor] = useState('#000000');
  const [embedDescription, setEmbedDescription] = useState('');
  const [embedFooter, setEmbedFooter] = useState('');
  const [menuType, setMenuType] = useState('normal');
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemLabel, setMenuItemLabel] = useState('');
  const [menuItemMessage, setMenuItemMessage] = useState('');
  const [attachments, setAttachments] = useState([]);

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { label: menuItemLabel, message: menuItemMessage }]);
    setMenuItemLabel('');
    setMenuItemMessage('');
  };

  const handleFileUpload = (e) => {
    setAttachments([...attachments, ...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage({ message, embedTitle, embedColor, embedDescription, embedFooter, attachments, menuType, menuItems });
  };

  return (
    <div className="section">
      <h2 onClick={() => document.getElementById('messagesSection').classList.toggle('hidden')}>Messages</h2>
      <div id="messagesSection" className="hidden">
        <form onSubmit={handleSubmit}>
          <label>
            Select Channel:
            <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>{channel.name}</option>
              ))}
            </select>
          </label>
          <h2>Create Message</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
          />
          <h2>Create Embed Message</h2>
          <label>
            Title:
            <input
              type="text"
              value={embedTitle}
              onChange={(e) => setEmbedTitle(e.target.value)}
            />
          </label>
          <label>
            Color:
            <input
              type="color"
              value={embedColor}
              onChange={(e) => setEmbedColor(e.target.value)}
            />
          </label>
          <textarea
            value={embedDescription}
            onChange={(e) => setEmbedDescription(e.target.value)}
            placeholder="Enter your embed description"
          />
          <label>
            Footer:
            <input
              type="text"
              value={embedFooter}
              onChange={(e) => setEmbedFooter(e.target.value)}
            />
          </label>
          <div>
            <label>
              Attach Files:
              <input type="file" multiple onChange={handleFileUpload} />
            </label>
          </div>
          <button type="button" onClick={handlePreviewToggle}>Preview Message</button>
          <button type="submit">Send Message</button>
          <button type="button" onClick={() => handleSaveMessageTemplate(message)}>Save as Template</button>
          <button type="button" onClick={() => handleSaveEmbedTemplate({ title: embedTitle, color: embedColor, description: embedDescription, footer: embedFooter })}>Save Embed as Template</button>
        </form>
        {preview && (
          <div className="preview">
            <h3>Message Preview:</h3>
            <p>{message}</p>
            <h3>Embed Preview:</h3>
            <div>
              <h4 style={{ color: embedColor }}>{embedTitle}</h4>
              <p>{embedDescription}</p>
              <p>{embedFooter}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageForm;