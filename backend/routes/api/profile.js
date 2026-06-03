const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET PROFILE
router.get("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.get(
    `SELECT u.username, p.bio, p.skills, p.location
     FROM users u
     LEFT JOIN ideator_profiles p ON u.id = p.user_id
     WHERE u.id = ?`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json(err);

      res.json(row);
    }
  );
}); 

router.post("/update", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { bio, skills, location } = req.body;

  db.run(
    `
    INSERT INTO ideator_profiles (user_id, bio, skills, location)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET
      bio = excluded.bio,
      skills = excluded.skills,
      location = excluded.location
    `,
    [userId, bio, skills, location],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).send("Error updating profile");
      }

      res.redirect("/ideator/profile");
    }
  );
});

module.exports = router;