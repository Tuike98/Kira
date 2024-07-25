const express = require('express');
const router = express.Router();
const ServerSettings = require('../app/models/serverSettings');
const { ensureAuthenticated } = require('../middlewares/auth');
const { logError } = require('../logger');

module.exports = (bot) => {
  router.get('/:id/settings', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching server settings for guild with id: ${id}`);

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

      const serverSettings = await ServerSettings.findOne({ where: { serverId: id } });
      if (!serverSettings) {
        const message = `Ustawienia serwera nie zostały znalezione dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }
      console.log(`Ustawienia serwera pobrane dla: ${guild.name}`);

      res.json(serverSettings);
    } catch (error) {
      let message;
      let solution;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas pobierania ustawień serwera dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
        solution = 'Sprawdź status serwera zewnętrznego i spróbuj ponownie później.';
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas pobierania ustawień serwera dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
        solution = 'Sprawdź połączenie sieciowe i spróbuj ponownie.';
      } else {
        message = `Nieoczekiwany błąd podczas pobierania ustawień serwera dla ID ${req.params.id}: ${error.message}`;
        solution = 'Sprawdź logi serwera, aby uzyskać więcej informacji.';
      }
      logError(message, error, solution);
      res.status(500).json({ error: message, solution });
    }
  });

  router.put('/:id/settings', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, welcomeMessage, autoRole } = req.body;
      console.log(`Updating server settings for guild with id: ${id}`);

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

      const serverSettings = await ServerSettings.findOne({ where: { serverId: id } });
      if (!serverSettings) {
        const message = `Ustawienia serwera nie zostały znalezione dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }

      serverSettings.name = name;
      serverSettings.welcomeMessage = welcomeMessage;
      serverSettings.autoRole = autoRole;
      await serverSettings.save();

      console.log(`Ustawienia serwera zaktualizowane dla: ${guild.name}`);
      res.json(serverSettings);
    } catch (error) {
      let message;
      let solution;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas aktualizacji ustawień serwera dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
        solution = 'Sprawdź status serwera zewnętrznego i spróbuj ponownie później.';
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas aktualizacji ustawień serwera dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
        solution = 'Sprawdź połączenie sieciowe i spróbuj ponownie.';
      } else {
        message = `Nieoczekiwany błąd podczas aktualizacji ustawień serwera dla ID ${req.params.id}: ${error.message}`;
        solution = 'Sprawdź logi serwera, aby uzyskać więcej informacji.';
      }
      logError(message, error, solution);
      res.status(500).json({ error: message, solution });
    }
  });

  return router;
};