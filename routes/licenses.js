const express = require('express');
const router = express.Router();
const License = require('../app/models/license');
const { ensureAuthenticated } = require('../middlewares/auth');
const { logError } = require('../logger');

router.post('/', ensureAuthenticated, async (req, res) => {
  const { key, serverId } = req.body;
  try {
    const license = await License.create({
      license_key: key,
      serverId,
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    });
    res.status(201).json(license);
  } catch (error) {
    const message = `Błąd podczas tworzenia licencji: ${error.message}`;
    const solution = 'Upewnij się, że podane dane są poprawne i spróbuj ponownie.';
    logError(message, error, solution);
    res.status(500).json({ error: message, solution });
  }
});

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const licenses = await License.findAll();
    res.json(licenses);
  } catch (error) {
    const message = `Błąd podczas pobierania licencji: ${error.message}`;
    const solution = 'Sprawdź połączenie z bazą danych i spróbuj ponownie.';
    logError(message, error, solution);
    res.status(500).json({ error: message, solution });
  }
});

router.get('/:serverId', ensureAuthenticated, async (req, res) => {
  const { serverId } = req.params;
  try {
    const license = await License.findOne({ where: { serverId } });
    if (!license) {
      const message = `Licencja dla serwera ${serverId} nie została znaleziona`;
      const solution = 'Sprawdź, czy podane ID serwera jest poprawne.';
      console.error(message);
      return res.status(404).json({ error: message, solution });
    }
    res.json(license);
  } catch (error) {
    const message = `Błąd podczas pobierania licencji dla serwera ${serverId}: ${error.message}`;
    const solution = 'Sprawdź połączenie z bazą danych i spróbuj ponownie.';
    logError(message, error, solution);
    res.status(500).json({ error: message, solution });
  }
});

router.put('/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { key, expiresAt } = req.body;
  try {
    const license = await License.findByPk(id);
    if (!license) {
      const message = `Licencja o ID ${id} nie została znaleziona`;
      const solution = 'Sprawdź, czy podane ID licencji jest poprawne.';
      console.error(message);
      return res.status(404).json({ error: message, solution });
    }
    license.license_key = key || license.license_key;
    license.expiresAt = expiresAt || license.expiresAt;
    await license.save();
    res.json(license);
  } catch (error) {
    const message = `Błąd podczas aktualizacji licencji o ID ${id}: ${error.message}`;
    const solution = 'Sprawdź, czy podane dane są poprawne i spróbuj ponownie.';
    logError(message, error, solution);
    res.status(500).json({ error: message, solution });
  }
});

router.delete('/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const license = await License.findByPk(id);
    if (!license) {
      const message = `Licencja o ID ${id} nie została znaleziona`;
      const solution = 'Sprawdź, czy podane ID licencji jest poprawne.';
      console.error(message);
      return res.status(404).json({ error: message, solution });
    }
    await license.destroy();
    res.status(204).json({ message: `Licencja o ID ${id} została usunięta` });
  } catch (error) {
    const message = `Błąd podczas usuwania licencji o ID ${id}: ${error.message}`;
    const solution = 'Sprawdź połączenie z bazą danych i spróbuj ponownie.';
    logError(message, error, solution);
    res.status(500).json({ error: message, solution });
  }
});

module.exports = router;