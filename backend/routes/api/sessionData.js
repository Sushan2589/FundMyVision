const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");


router.get("/", isAuthenticated, (req, res) => {

  const user = req.session.user;

  if (user.role !== "investor") {
    return res.json(user);
  }

  db.get(
    `
    SELECT verification_status
    FROM investor_profiles
    WHERE user_id = ?
    `,
    [user.id],
    (err, row) => {

      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        verificationStatus: row?.verification_status
      });

    }
  );

});

module.exports = router