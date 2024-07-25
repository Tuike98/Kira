const express = require('express');
const router = express.Router();

module.exports = (bot) => {
  router.post('/:id/roles', async (req, res) => {
    try {
      const { id } = req.params;
      const { roleName, color } = req.body;
      console.log(`ID: ${id}, Role Name: ${roleName}, Color: ${color}`);

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

      const role = await guild.roles.create({
        name: roleName,
        color: color,
      });

      res.json({ success: true, role });
    } catch (error) {
      console.error('Error creating role:', error.message);
      console.error(error.stack);
      res.status(500).json({ error: 'Error creating role' });
    }
  });

  router.get('/:id/roles', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching roles for guild with id: ${id}`);

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

      const roles = guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
      }));

      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error.message);
      console.error(error.stack);
      res.status(500).json({ error: 'Error fetching roles' });
    }
  });

  return router;
};