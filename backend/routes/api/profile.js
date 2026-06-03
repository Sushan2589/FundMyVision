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
  const { bio, skills } = req.body;

  db.run(
    `
    INSERT INTO ideator_profiles (user_id, bio, skills)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET
      bio = excluded.bio,
      skills = excluded.skills,
      
    `,
    [userId, bio, skills],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).send("Error updating profile");
      }

      res.redirect("/ideator/profile");
    }
  );
});

router.post("/kyc", isAuthenticated, (req, res) => {

  const {
        company_name,
        bio,
        industry,
        min_investment,
        max_investment
    } = req.body;

  db.run(
        `
        UPDATE investor_profiles
        SET
            company_name = ?,
            bio = ?,
            industries = ?,
            min_investment = ?,
            max_investment = ?,
            verification_status = 'pending'
        WHERE user_id = ?
        `,
        [
            company_name,
            bio,
            industry,
            min_investment,
            max_investment,
            req.session.user.id
        ],
    (err) => {

      if (err) {
  console.log(err);

  return res.status(500).json({
    error: err.message
  });
}

      res.json({
        success: true
      });

    }
  );

});

module.exports = router;