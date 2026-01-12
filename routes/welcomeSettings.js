const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const WelcomeSettings = require('../app/models/welcomeSettings');
const { logger, logError } = require('../logger');

module.exports = (bot) => {
  // Get welcome settings for a server
  router.get('/:serverId', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;

      let settings = await WelcomeSettings.findOne({
        where: { serverId },
      });

      // Create default settings if none exist
      if (!settings) {
        settings = await WelcomeSettings.create({
          serverId,
          welcomeEnabled: false,
          goodbyeEnabled: false,
          dmNewMembers: false,
        });
      }

      logger.info(`Fetched welcome settings for server ${serverId}`);
      res.json(settings);
    } catch (error) {
      logError('Error fetching welcome settings', error);
      res.status(500).json({ error: 'Failed to fetch welcome settings', message: error.message });
    }
  });

  // Update welcome settings
  router.put('/:serverId', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const updateData = req.body;

      // Validate channel IDs if provided
      if (updateData.welcomeChannelId || updateData.goodbyeChannelId) {
        const guild = await bot.guilds.fetch(serverId);
        if (!guild) {
          return res.status(404).json({ error: 'Server not found' });
        }

        if (updateData.welcomeChannelId) {
          const channel = guild.channels.cache.get(updateData.welcomeChannelId);
          if (!channel) {
            return res.status(400).json({ error: 'Welcome channel not found' });
          }
        }

        if (updateData.goodbyeChannelId) {
          const channel = guild.channels.cache.get(updateData.goodbyeChannelId);
          if (!channel) {
            return res.status(400).json({ error: 'Goodbye channel not found' });
          }
        }
      }

      // Validate auto-role if provided
      if (updateData.autoRoleId) {
        const guild = await bot.guilds.fetch(serverId);
        const role = guild.roles.cache.get(updateData.autoRoleId);
        if (!role) {
          return res.status(400).json({ error: 'Auto-role not found' });
        }
      }

      let settings = await WelcomeSettings.findOne({
        where: { serverId },
      });

      if (!settings) {
        settings = await WelcomeSettings.create({
          serverId,
          ...updateData,
        });
      } else {
        await settings.update(updateData);
      }

      logger.info(`Updated welcome settings for server ${serverId}`);
      res.json(settings);
    } catch (error) {
      logError('Error updating welcome settings', error);
      res.status(500).json({ error: 'Failed to update welcome settings', message: error.message });
    }
  });

  // Test welcome message
  router.post('/:serverId/test', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const { type, channelId } = req.body; // type: 'welcome' or 'goodbye'

      if (!type || !channelId) {
        return res.status(400).json({ error: 'Type and channel ID are required' });
      }

      const settings = await WelcomeSettings.findOne({
        where: { serverId },
      });

      if (!settings) {
        return res.status(404).json({ error: 'Welcome settings not found' });
      }

      const guild = await bot.guilds.fetch(serverId);
      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // Get the authenticated user
      const testUser = req.user;
      const messageData = type === 'welcome' ? settings.welcomeMessage : settings.goodbyeMessage;

      if (!messageData) {
        return res.status(400).json({ error: `No ${type} message configured` });
      }

      // Process variables with test data
      const { EmbedBuilder } = require('discord.js');
      const processedMessage = processWelcomeVariables(messageData, {
        userTag: testUser.username,
        userMention: `<@${testUser.id}>`,
        serverName: guild.name,
        memberCount: guild.memberCount,
        userAvatar: testUser.avatar ? `https://cdn.discordapp.com/avatars/${testUser.id}/${testUser.avatar}.png` : null,
      });

      const messageOptions = {};

      if (processedMessage.message) {
        messageOptions.content = `**[TEST MESSAGE]**\n${processedMessage.message}`;
      }

      if (processedMessage.embed) {
        const embed = new EmbedBuilder()
          .setTitle(processedMessage.embed.title || null)
          .setDescription(processedMessage.embed.description || null)
          .setColor(processedMessage.embed.color || '#000000')
          .setFooter(processedMessage.embed.footer ? { text: processedMessage.embed.footer } : null);

        if (processedMessage.embed.thumbnail) {
          embed.setThumbnail(processedMessage.embed.thumbnail);
        }

        messageOptions.embeds = [embed];
      }

      await channel.send(messageOptions);

      logger.info(`Sent test ${type} message for server ${serverId}`);
      res.json({ success: true, message: `Test ${type} message sent` });
    } catch (error) {
      logError('Error sending test message', error);
      res.status(500).json({ error: 'Failed to send test message', message: error.message });
    }
  });

  return router;
};

// Helper function to process welcome message variables
function processWelcomeVariables(content, variables) {
  const processed = JSON.parse(JSON.stringify(content));

  const replacements = {
    '{{user}}': variables.userTag,
    '{{user.mention}}': variables.userMention,
    '{{server}}': variables.serverName,
    '{{memberCount}}': variables.memberCount,
    '{{user.avatar}}': variables.userAvatar,
  };

  // Replace in message
  if (processed.message) {
    Object.entries(replacements).forEach(([key, value]) => {
      processed.message = processed.message.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
  }

  // Replace in embed
  if (processed.embed) {
    ['title', 'description', 'footer', 'thumbnail'].forEach(field => {
      if (processed.embed[field]) {
        Object.entries(replacements).forEach(([key, value]) => {
          processed.embed[field] = processed.embed[field].replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      }
    });
  }

  return processed;
}
