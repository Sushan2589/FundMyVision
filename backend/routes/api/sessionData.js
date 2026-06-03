const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET /api/sessionData
router.get("/", isAuthenticated, (req, res) => {
  const user = req.session.user;

  db.get("SELECT verified FROM users WHERE id = ?", [user.id], (err, row) => {
    if (err || !row) {
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        verified: 0
      });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      verified: row.verified
    });
  });
});

module.exports = router;