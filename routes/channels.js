const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');

module.exports = (bot) => {
  // Sprawdzenie, czy bot jest poprawnie przekazywany
  if (!bot) {
    console.error('Bot nie został przekazany do routes/channels.js');
    throw new Error('Bot jest wymagany');
  }

  router.post('/:id/channels', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, type } = req.body;
      console.log(`Creating new channel for guild with id: ${id}`);

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        const message = `Serwer nie został znaleziony dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }

      const channel = await guild.channels.create(name, { type });
      console.log(`Kanał utworzony: ${channel.name}`);

      res.json(channel);
    } catch (error) {
      let message;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas tworzenia kanału dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas tworzenia kanału dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
      } else {
        message = `Nieoczekiwany błąd podczas tworzenia kanału dla ID ${req.params.id}: ${error.message}`;
      }
      console.error(message);
      res.status(500).json({ error: message });
    }
  });

  router.delete('/:id/channels/:channelId', ensureAuthenticated, async (req, res) => {
    try {
      const { id, channelId } = req.params;
      console.log(`Deleting channel with id: ${channelId} from guild with id: ${id}`);

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        const message = `Serwer nie został znaleziony dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        const message = `Kanał nie został znaleziony dla ID: ${channelId}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }

      await channel.delete();
      console.log(`Kanał usunięty: ${channel.name}`);

      res.status(204).send();
    } catch (error) {
      let message;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas usuwania kanału dla ID ${req.params.channelId}: ${error.response.statusText} (${error.response.status})`;
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas usuwania kanału dla ID ${req.params.channelId}. Szczegóły zapytania: ${error.request}`;
      } else {
        message = `Nieoczekiwany błąd podczas usuwania kanału dla ID ${req.params.channelId}: ${error.message}`;
      }
      console.error(message);
      res.status(500).json({ error: message });
    }
  });

  router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching server details for guild with id: ${id}`);

      // Sprawdzenie formatu ID
      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        const message = `Nieprawidłowy format ID serwera: ${id}`;
        console.error(message);
        return res.status(400).json({ error: message });
      }

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        const message = `Serwer nie został znaleziony dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }
      console.log(`Serwer pobrany: ${guild.name}`);

      const serverDetails = {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        ownerID: guild.ownerId,
      };

      res.json(serverDetails);
    } catch (error) {
      let message;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas pobierania szczegółów serwera dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas pobierania szczegółów serwera dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
      } else {
        message = `Nieoczekiwany błąd podczas pobierania szczegółów serwera dla ID ${req.params.id}: ${error.message}`;
      }
      console.error(message);
      res.status(500).json({ error: message });
    }
  });

  router.get('/:id/channels', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching channels for guild with id: ${id}`);

      // Sprawdzenie formatu ID
      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        const message = `Nieprawidłowy format ID serwera: ${id}`;
        console.error(message);
        return res.status(400).json({ error: message });
      }

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        const message = `Serwer nie został znaleziony dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }
      console.log(`Serwer pobrany: ${guild.name}`);

      const channels = guild.channels.cache.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
      }));

      res.json(channels);
    } catch (error) {
      let message;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas pobierania kanałów dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas pobierania kanałów dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
      } else {
        message = `Nieoczekiwany błąd podczas pobierania kanałów dla ID ${req.params.id}: ${error.message}`;
      }
      console.error(message);
      res.status(500).json({ error: message });
    }
  });

  return router;
};