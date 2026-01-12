const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const { logger, logError } = require('../logger');

module.exports = (bot) => {
  router.post('/:id/message', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { channelId, message, embedMessage, menuType, menuItems } = req.body;

      logger.info(`Sending message request - Guild: ${id}, Channel: ${channelId}`);

      // Input validation
      if (!id || !/^[0-9]+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid or missing Guild ID' });
      }

      if (!channelId || !/^[0-9]+$/.test(channelId)) {
        return res.status(400).json({ error: 'Invalid or missing Channel ID' });
      }

      if (!message && !embedMessage) {
        return res.status(400).json({ error: 'Either message or embedMessage must be provided' });
      }

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        logger.error(`Guild not found for ID: ${id}`);
        return res.status(404).json({ error: 'Guild not found' });
      }
      logger.info(`Guild fetched: ${guild.name}`);

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        logger.error(`Channel not found for ID: ${channelId}`);
        return res.status(404).json({ error: 'Channel not found' });
      }

      logger.info(`Channel fetched: ${channel.name}, Type: ${channel.type}`);
      if (channel.type !== ChannelType.GuildText) {
        logger.error(`Channel is not a text channel for ID: ${channelId}`);
        return res.status(400).json({ error: 'Channel is not a text channel' });
      }

      if (embedMessage) {
        const embed = new EmbedBuilder()
          .setTitle(embedMessage.title)
          .setDescription(embedMessage.description)
          .setColor(embedMessage.color)
          .setFooter({ text: embedMessage.footer });
        await channel.send({ embeds: [embed] });
      } else if (message) {
        await channel.send(message);
      }

      if (menuItems && menuItems.length > 0) {
        if (menuType === 'dropdown') {
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('Select an option')
            .addOptions(menuItems.map(item => ({
              label: item.label,
              value: item.message || item.label,
              description: item.description || undefined
            })));

          const row = new ActionRowBuilder().addComponents(selectMenu);
          await channel.send({
            content: 'Choose an option:',
            components: [row]
          });
        } else {
          // Create buttons (max 5 per row)
          const buttons = menuItems.slice(0, 5).map(item =>
            new ButtonBuilder()
              .setCustomId(`menu_item_${item.label}`)
              .setLabel(item.label)
              .setStyle(ButtonStyle.Primary)
          );

          const row = new ActionRowBuilder().addComponents(buttons);
          await channel.send({
            content: 'Choose an option:',
            components: [row]
          });
        }
      }

      logger.info(`Message sent successfully to channel ${channelId}`);
      res.json({ success: true });
    } catch (error) {
      logError('Error sending message', error);
      res.status(500).json({
        error: 'Error sending message',
        message: error.message
      });
    }
  });

  return router;
};