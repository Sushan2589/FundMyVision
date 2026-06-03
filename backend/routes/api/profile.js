const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET PROFILE (works for both ideator and investor)
router.get("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const role = req.session.user.role;

  if (role === "investor") {
    db.get(
      `SELECT u.username, u.email, u.verified, ip.company_name, ip.bio, ip.industries, ip.min_investment, ip.max_investment
       FROM users u
       LEFT JOIN investor_profiles ip ON u.id = ip.user_id
       WHERE u.id = ?`,
      [userId],
      (err, row) => {
        if (err) return res.status(500).json(err);
        res.json(row);
      }
    );
  } else {
    db.get(
      `SELECT u.username, u.email, p.bio, p.skills, p.location
       FROM users u
       LEFT JOIN ideator_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId],
      (err, row) => {
        if (err) return res.status(500).json(err);
        res.json(row);
      }
    );
  }
});

// UPDATE ideator profile
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
        return res.status(500).json({ error: "Error updating profile" });
      }

      res.json({ success: true });
    }
  );
});

// UPDATE investor profile
router.post("/update-investor", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { company_name, bio, industries, min_investment, max_investment } = req.body;

  db.run(
    `INSERT INTO investor_profiles (user_id, company_name, bio, industries, min_investment, max_investment)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id)
     DO UPDATE SET
       company_name = excluded.company_name,
       bio = excluded.bio,
       industries = excluded.industries,
       min_investment = excluded.min_investment,
       max_investment = excluded.max_investment`,
    [userId, company_name, bio, industries, min_investment || null, max_investment || null],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Error updating profile" });
      }

      res.json({ success: true });
    }
  );
});

module.exports = router;