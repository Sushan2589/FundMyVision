const router = require("express").Router();
const isAuthenticated = require("../../middleware/auth");

// GET /api/me
router.get("/", isAuthenticated, (req, res) => {
  const user = req.session.user;

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email
  });
});

module.exports = router;