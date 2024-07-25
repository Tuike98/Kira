const { EmbedBuilder, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const express = require('express');
const router = express.Router();

module.exports = (bot) => {
  router.post('/:id/message', async (req, res) => {
    try {
      const { id } = req.params;
      const { channelId, message, embedMessage, menuType, menuItems } = req.body;
      console.log(`ID: ${id}, Channel ID: ${channelId}, Message: ${message}, Embed Message: ${JSON.stringify(embedMessage)}, Menu Type: ${menuType}, Menu Items: ${JSON.stringify(menuItems)}`);

      if (!id) {
        console.error('Guild ID is undefined');
        return res.status(400).json({ error: 'Guild ID is undefined' });
      }

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        console.error(`Guild not found for ID: ${id}`);
        return res.status(404).json({ error: 'Guild not found' });
      }
      console.log(`Guild fetched: ${guild.name}`);

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        console.error(`Channel not found for ID: ${channelId}`);
        console.log(`Available channels: ${guild.channels.cache.map(c => `${c.id} (${c.name}, type: ${c.type})`).join(', ')}`);
        return res.status(404).json({ error: 'Channel not found' });
      }

      console.log(`Channel fetched: ${channel.name}, Type: ${channel.type}`);
      if (channel.type !== 'GUILD_TEXT' && channel.type !== 0) {  // In discord.js v14, 'GUILD_TEXT' is now 0
        console.error(`Channel is not a text channel for ID: ${channelId}`);
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
        const components = menuItems.map(item => new MessageButton()
          .setCustomId(`menu_item_${item.label}`)
          .setLabel(item.label)
          .setStyle('PRIMARY'));

        if (menuType === 'dropdown') {
          const selectMenu = new MessageSelectMenu()
            .setCustomId('select')
            .setPlaceholder('Select an option')
            .addOptions(menuItems.map(item => ({ label: item.label, value: item.message })));
          await channel.send({
            content: 'Choose an option:',
            components: [new MessageActionRow().addComponents(selectMenu)]
          });
        } else {
          await channel.send({
            content: 'Choose an option:',
            components: [new MessageActionRow().addComponents(components)]
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending message:', error.message);
      console.error(error.stack);
      res.status(500).json({ error: 'Error sending message' });
    }
  });

  return router;
};