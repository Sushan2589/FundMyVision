function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  if (req.originalUrl.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.redirect('/login');
}

module.exports = isAuthenticated;