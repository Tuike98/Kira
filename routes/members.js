const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');

module.exports = (bot) => {
  router.get('/:id/members', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching members for guild with id: ${id}`);

      const guild = await bot.guilds.fetch(id);
      if (!guild) {
        const message = `Serwer nie został znaleziony dla ID: ${id}`;
        console.error(message);
        return res.status(404).json({ error: message });
      }

      const members = guild.members.cache.map(member => ({
        id: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        roles: member.roles.cache.map(role => ({ id: role.id, name: role.name })),
      }));

      res.json(members);
    } catch (error) {
      let message;
      if (error.response) {
        message = `Błąd odpowiedzi serwera podczas pobierania członków serwera dla ID ${req.params.id}: ${error.response.statusText} (${error.response.status})`;
      } else if (error.request) {
        message = `Brak odpowiedzi serwera podczas pobierania członków serwera dla ID ${req.params.id}. Szczegóły zapytania: ${error.request}`;
      } else {
        message = `Nieoczekiwany błąd podczas pobierania członków serwera dla ID ${req.params.id}: ${error.message}`;
      }
      console.error(message);
      res.status(500).json({ error: message });
    }
  });

  return router;
};