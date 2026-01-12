import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Templates() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    message: '',
    embedTitle: '',
    embedDescription: '',
    embedColor: '#bb86fc',
    embedFooter: ''
  });

  const categories = ['all', 'welcome', 'rules', 'events', 'announcements', 'other'];

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/templates/${id}?category=${selectedCategory}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      setError('Error fetching templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [id, selectedCategory, navigate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const content = {
        message: formData.message || undefined,
        embed: (formData.embedTitle || formData.embedDescription) ? {
          title: formData.embedTitle || undefined,
          description: formData.embedDescription || undefined,
          color: formData.embedColor,
          footer: formData.embedFooter || undefined
        } : undefined
      };

      const response = await fetch(`/api/templates/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          content,
          variables: ['{{server.name}}', '{{server.members}}']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      setError('Error creating template: ' + error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const content = {
        message: formData.message || undefined,
        embed: (formData.embedTitle || formData.embedDescription) ? {
          title: formData.embedTitle || undefined,
          description: formData.embedDescription || undefined,
          color: formData.embedColor,
          footer: formData.embedFooter || undefined
        } : undefined
      };

      const response = await fetch(`/api/templates/${id}/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      setError('Error updating template: ' + error.message);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      fetchTemplates();
    } catch (error) {
      setError('Error deleting template: ' + error.message);
    }
  };

  const handleUse = async (template, channelId) => {
    try {
      const response = await fetch(`/api/templates/${id}/${template.id}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ channelId }),
      });

      if (!response.ok) {
        throw new Error('Failed to use template');
      }

      alert('Template sent successfully!');
      fetchTemplates();
    } catch (error) {
      setError('Error using template: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      message: '',
      embedTitle: '',
      embedDescription: '',
      embedColor: '#bb86fc',
      embedFooter: ''
    });
  };

  const editTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message: template.content.message || '',
      embedTitle: template.content.embed?.title || '',
      embedDescription: template.content.embed?.description || '',
      embedColor: template.content.embed?.color || '#bb86fc',
      embedFooter: template.content.embed?.footer || ''
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="templates-header">
        <h1>Message Templates</h1>
        <button onClick={() => { resetForm(); setShowCreateModal(true); }}>
          Create Template
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="category-filter">
        <label>Category:</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="templates-grid">
        {templates.length === 0 ? (
          <p className="no-templates">No templates found. Create your first template!</p>
        ) : (
          templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3>{template.name}</h3>
                <span className={`category-badge category-${template.category}`}>
                  {template.category}
                </span>
              </div>

              <div className="template-content">
                {template.content.message && (
                  <div className="message-preview">
                    <strong>Message:</strong>
                    <p>{template.content.message.substring(0, 100)}...</p>
                  </div>
                )}
                {template.content.embed && (
                  <div className="embed-preview">
                    <strong>Embed:</strong>
                    <p>{template.content.embed.title || template.content.embed.description?.substring(0, 50)}...</p>
                  </div>
                )}
              </div>

              <div className="template-stats">
                <span>Used: {template.usageCount} times</span>
                {template.lastUsed && (
                  <span>Last: {new Date(template.lastUsed).toLocaleDateString()}</span>
                )}
              </div>

              <div className="template-actions">
                <button onClick={() => editTemplate(template)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(template.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingTemplate(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
            <form onSubmit={editingTemplate ? handleUpdate : handleCreate}>
              <label>
                Template Name:
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Category:
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Message:
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Use {{server.name}} and {{server.members}} as variables"
                  rows={3}
                />
              </label>

              <h3>Embed (Optional)</h3>

              <label>
                Embed Title:
                <input
                  type="text"
                  value={formData.embedTitle}
                  onChange={(e) => setFormData({ ...formData, embedTitle: e.target.value })}
                />
              </label>

              <label>
                Embed Description:
                <textarea
                  value={formData.embedDescription}
                  onChange={(e) => setFormData({ ...formData, embedDescription: e.target.value })}
                  rows={3}
                />
              </label>

              <label>
                Embed Color:
                <input
                  type="color"
                  value={formData.embedColor}
                  onChange={(e) => setFormData({ ...formData, embedColor: e.target.value })}
                />
              </label>

              <label>
                Embed Footer:
                <input
                  type="text"
                  value={formData.embedFooter}
                  onChange={(e) => setFormData({ ...formData, embedFooter: e.target.value })}
                />
              </label>

              <div className="modal-actions">
                <button type="submit">
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingTemplate(null); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Templates;
