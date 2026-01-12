const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const ServerSettings = require('../app/models/serverSettings');
const License = require('../app/models/license');
const { logger, logError } = require('../logger');

module.exports = (bot) => {
  router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      logger.info(`Fetching server details for ID: ${id}`);

      const idPattern = /^[0-9]+$/;
      if (!idPattern.test(id)) {
        const message = `Invalid server ID format: ${id}`;
        logger.error(message);
        return res.status(400).json({ error: message });
      }

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        const message = `Server not found for ID: ${id}`;
        logger.error(message);
        return res.status(404).json({ error: message });
      }
      logger.info(`Server fetched: ${guild.name}`);

      const serverSettings = await ServerSettings.findOne({ where: { serverId: id } });
      if (!serverSettings) {
        const message = `Server settings not found for ID: ${id}`;
        logger.warn(message);
        return res.status(404).json({ error: message });
      }
      logger.info(`Server settings fetched for: ${guild.name}`);

      const license = await License.findOne({ where: { serverId: id } });
      if (!license) {
        logger.info(`No active license for server ID: ${id}`);
      }

      const serverDetails = {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        ownerID: guild.ownerId,
        license: license ? {
          key: license.license_key,
          expiresAt: license.expiresAt,
        } : null,
      };

      res.json(serverDetails);
    } catch (error) {
      let message;
      let solution;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas pobierania szczegółów serwera dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
        solution = 'Sprawdź status serwera zewnętrznego i spróbuj ponownie później.';
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas pobierania szczegółów serwera dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
        solution = 'Sprawdź połączenie sieciowe i spróbuj ponownie.';
      } else {
        message = `Nieoczekiwany błąd podczas pobierania szczegółów serwera dla ID ${req.params.id}: ${error.message}`;
        solution = 'Sprawdź logi serwera, aby uzyskać więcej informacji.';
      }
      logError(message, error, solution);
      res.status(500).json({ error: message, solution });
    }
  });

  return router;
};