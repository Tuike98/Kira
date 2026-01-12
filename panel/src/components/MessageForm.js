import React, { useState } from 'react';

function MessageForm({
  channels,
  selectedChannel,
  setSelectedChannel,
  handleSendMessage,
  handleSaveMessageTemplate,
  handleSaveEmbedTemplate,
  handlePreviewToggle,
  preview,
  sending = false
}) {
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
  const [sectionVisible, setSectionVisible] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { label: menuItemLabel, message: menuItemMessage }]);
    setMenuItemLabel('');
    setMenuItemMessage('');
  };

  const handleFileUpload = (e) => {
    setAttachments([...attachments, ...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!message && !embedTitle && !embedDescription) {
      alert('Please enter at least a message or embed content');
      return;
    }

    const result = await handleSendMessage({
      message,
      embedTitle,
      embedColor,
      embedDescription,
      embedFooter,
      attachments,
      menuType,
      menuItems
    });

    if (result?.success) {
      setSuccessMessage('Message sent successfully!');
      // Clear form
      setMessage('');
      setEmbedTitle('');
      setEmbedDescription('');
      setEmbedFooter('');
      setAttachments([]);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="section">
      <h2
        onClick={() => setSectionVisible(!sectionVisible)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        Messages {sectionVisible ? '▼' : '▶'}
      </h2>
      {sectionVisible && (
        <div className="messages-section">
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
          {successMessage && <div className="success-message">{successMessage}</div>}
          <div className="button-group">
            <button type="button" onClick={handlePreviewToggle} disabled={sending}>
              {preview ? 'Hide Preview' : 'Preview Message'}
            </button>
            <button type="submit" disabled={sending || !selectedChannel}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
            <button
              type="button"
              onClick={() => handleSaveMessageTemplate(message)}
              disabled={!message || sending}
            >
              Save as Template
            </button>
            <button
              type="button"
              onClick={() => handleSaveEmbedTemplate({ title: embedTitle, color: embedColor, description: embedDescription, footer: embedFooter })}
              disabled={(!embedTitle && !embedDescription) || sending}
            >
              Save Embed as Template
            </button>
          </div>
        </form>
        {preview && (
          <div className="preview">
            <h3>Message Preview:</h3>
            <p>{message || <em>No message content</em>}</p>
            <h3>Embed Preview:</h3>
            <div className="embed-preview" style={{ borderLeft: `4px solid ${embedColor}` }}>
              {embedTitle && <h4 style={{ color: embedColor }}>{embedTitle}</h4>}
              {embedDescription && <p>{embedDescription}</p>}
              {embedFooter && <small>{embedFooter}</small>}
              {!embedTitle && !embedDescription && !embedFooter && <em>No embed content</em>}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

export default MessageForm;