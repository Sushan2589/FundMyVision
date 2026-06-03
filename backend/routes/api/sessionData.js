const router = require("express").Router();
const isAuthenticated = require("../../middleware/auth");


router.get("/", isAuthenticated, (req, res) => {
  const user = req.session.user;

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    verificationStatus: user.verification_status || null
  });
});

module.exports = router;