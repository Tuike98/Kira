const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const MessageTemplate = require('../app/models/messageTemplate');
const { logger, logError } = require('../logger');

module.exports = (bot) => {
  // Get all templates for a server
  router.get('/:serverId', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const { category } = req.query;

      const where = { serverId };
      if (category && category !== 'all') {
        where.category = category;
      }

      const templates = await MessageTemplate.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      logger.info(`Fetched ${templates.length} templates for server ${serverId}`);
      res.json(templates);
    } catch (error) {
      logError('Error fetching templates', error);
      res.status(500).json({ error: 'Failed to fetch templates', message: error.message });
    }
  });

  // Get single template
  router.get('/:serverId/:id', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId, id } = req.params;

      const template = await MessageTemplate.findOne({
        where: { id, serverId },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      logError('Error fetching template', error);
      res.status(500).json({ error: 'Failed to fetch template', message: error.message });
    }
  });

  // Create new template
  router.post('/:serverId', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const { name, category, content, variables } = req.body;

      // Validation
      if (!name || !content) {
        return res.status(400).json({ error: 'Name and content are required' });
      }

      if (!content.message && !content.embed) {
        return res.status(400).json({ error: 'Template must have message or embed content' });
      }

      const template = await MessageTemplate.create({
        serverId,
        name,
        category: category || 'other',
        content,
        variables: variables || [],
      });

      logger.info(`Created template ${template.id} for server ${serverId}`);
      res.status(201).json(template);
    } catch (error) {
      logError('Error creating template', error);
      res.status(500).json({ error: 'Failed to create template', message: error.message });
    }
  });

  // Update template
  router.put('/:serverId/:id', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId, id } = req.params;
      const { name, category, content, variables } = req.body;

      const template = await MessageTemplate.findOne({
        where: { id, serverId },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await template.update({
        name: name || template.name,
        category: category || template.category,
        content: content || template.content,
        variables: variables !== undefined ? variables : template.variables,
      });

      logger.info(`Updated template ${id} for server ${serverId}`);
      res.json(template);
    } catch (error) {
      logError('Error updating template', error);
      res.status(500).json({ error: 'Failed to update template', message: error.message });
    }
  });

  // Delete template
  router.delete('/:serverId/:id', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId, id } = req.params;

      const template = await MessageTemplate.findOne({
        where: { id, serverId },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await template.destroy();

      logger.info(`Deleted template ${id} for server ${serverId}`);
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      logError('Error deleting template', error);
      res.status(500).json({ error: 'Failed to delete template', message: error.message });
    }
  });

  // Use template (increment usage count and send message)
  router.post('/:serverId/:id/use', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId, id } = req.params;
      const { channelId } = req.body;

      if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
      }

      const template = await MessageTemplate.findOne({
        where: { id, serverId },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Get guild and channel
      const guild = await bot.guilds.fetch(serverId);
      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // Process variables in template
      const processedContent = processTemplateVariables(template.content, {
        serverName: guild.name,
        serverIcon: guild.iconURL(),
        memberCount: guild.memberCount,
      });

      // Send message
      const { EmbedBuilder } = require('discord.js');
      const messageOptions = {};

      if (processedContent.message) {
        messageOptions.content = processedContent.message;
      }

      if (processedContent.embed) {
        const embed = new EmbedBuilder()
          .setTitle(processedContent.embed.title || null)
          .setDescription(processedContent.embed.description || null)
          .setColor(processedContent.embed.color || '#000000')
          .setFooter(processedContent.embed.footer ? { text: processedContent.embed.footer } : null);

        messageOptions.embeds = [embed];
      }

      await channel.send(messageOptions);

      // Update usage stats
      await template.update({
        usageCount: template.usageCount + 1,
        lastUsed: new Date(),
      });

      logger.info(`Used template ${id} in channel ${channelId}`);
      res.json({ success: true, template });
    } catch (error) {
      logError('Error using template', error);
      res.status(500).json({ error: 'Failed to use template', message: error.message });
    }
  });

  return router;
};

// Helper function to process template variables
function processTemplateVariables(content, variables) {
  const processed = JSON.parse(JSON.stringify(content));

  const replacements = {
    '{{server.name}}': variables.serverName,
    '{{server.icon}}': variables.serverIcon,
    '{{server.members}}': variables.memberCount,
  };

  // Replace in message
  if (processed.message) {
    Object.entries(replacements).forEach(([key, value]) => {
      processed.message = processed.message.replace(new RegExp(key, 'g'), value);
    });
  }

  // Replace in embed
  if (processed.embed) {
    ['title', 'description', 'footer'].forEach(field => {
      if (processed.embed[field]) {
        Object.entries(replacements).forEach(([key, value]) => {
          processed.embed[field] = processed.embed[field].replace(new RegExp(key, 'g'), value);
        });
      }
    });
  }

  return processed;
}
