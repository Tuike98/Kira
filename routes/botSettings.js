// routes/botSettings.js

const express = require('express');
const router = express.Router();
const BotSettings = require('../app/models/botSettings');

module.exports = (bot) => {
  router.get('/:id/botsettings', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching bot settings for ID: ${id}`);

      // Validate the ID format
      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        console.error(`Invalid server ID format: ${id}`);
        return res.status(400).json({ error: 'Invalid server ID format' });
      }

      const botSettings = await BotSettings.findOne({ where: { serverId: id } });
      if (!botSettings) {
        console.error(`Bot settings not found for ID: ${id}`);
        const defaultBotSettings = await BotSettings.create({ serverId: id, prefix: '!', language: 'en', loggingChannel: null });
        return res.json(defaultBotSettings);
      }
      res.json(botSettings);
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      res.status(500).json({ error: 'Error fetching bot settings' });
    }
  });

  router.post('/:id/botsettings', async (req, res) => {
    try {
      const { id } = req.params;
      const { prefix, language, loggingChannel } = req.body;
      console.log(`Saving bot settings for ID: ${id}`);

      // Validate the ID format
      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        console.error(`Invalid server ID format: ${id}`);
        return res.status(400).json({ error: 'Invalid server ID format' });
      }

      const [botSettings, created] = await BotSettings.findOrCreate({
        where: { serverId: id },
        defaults: { serverId: id, prefix, language, loggingChannel },
      });

      if (!created) {
        botSettings.prefix = prefix;
        botSettings.language = language;
        botSettings.loggingChannel = loggingChannel;
        await botSettings.save();
      }

      res.json(botSettings);
    } catch (error) {
      console.error('Error saving bot settings:', error);
      res.status(500).json({ error: 'Error saving bot settings' });
    }
  });

  return router;
};