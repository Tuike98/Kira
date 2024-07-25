function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(`Użytkownik ${req.user.username} jest zalogowany.`);
    return next();
  }
  console.warn('Użytkownik nie jest zalogowany. Przekierowanie do Discorda.');
  res.redirect('/auth/discord');
}

module.exports = { ensureAuthenticated };