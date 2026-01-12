import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import './Templates.css';

function Templates() {
  const [messageTemplates] = useState([
    { id: 1, name: 'Welcome Message', content: 'Welcome to our server! 👋', type: 'message' },
    { id: 2, name: 'Rules', content: 'Please read and follow our server rules.', type: 'message' },
  ]);

  const [embedTemplates] = useState([
    {
      id: 1,
      name: 'Announcement',
      title: 'Important Announcement',
      description: 'This is an important announcement for all members.',
      color: '#5865F2',
      type: 'embed'
    },
  ]);

  return (
    <div className="page templates-page">
      <div className="page-header">
        <h1 className="page-title">Message Templates</h1>
        <p className="page-subtitle">Manage your saved message and embed templates</p>
      </div>

      <div className="templates-section">
        <div className="section-header">
          <h2>Message Templates</h2>
          <Button variant="primary" size="sm">+ New Template</Button>
        </div>

        {messageTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3 className="empty-state-title">No message templates yet</h3>
            <p className="empty-state-description">
              Create your first message template to save time when sending frequent messages.
            </p>
            <Button variant="primary">Create Template</Button>
          </div>
        ) : (
          <div className="templates-grid">
            {messageTemplates.map(template => (
              <Card key={template.id} hoverable>
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <Badge variant="primary">{template.type}</Badge>
                </div>
                <p className="template-content">{template.content}</p>
                <div className="template-actions">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Use</Button>
                  <Button variant="error" size="sm">Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="templates-section">
        <div className="section-header">
          <h2>Embed Templates</h2>
          <Button variant="primary" size="sm">+ New Embed</Button>
        </div>

        {embedTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3 className="empty-state-title">No embed templates yet</h3>
            <p className="empty-state-description">
              Create embed templates for rich, formatted messages.
            </p>
            <Button variant="primary">Create Embed</Button>
          </div>
        ) : (
          <div className="templates-grid">
            {embedTemplates.map(template => (
              <Card key={template.id} hoverable>
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <Badge variant="primary">{template.type}</Badge>
                </div>
                <div className="embed-preview" style={{ borderLeft: `4px solid ${template.color}` }}>
                  <h4>{template.title}</h4>
                  <p>{template.description}</p>
                </div>
                <div className="template-actions">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Use</Button>
                  <Button variant="error" size="sm">Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Templates;
