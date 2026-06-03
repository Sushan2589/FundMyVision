const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET /api/investor-profile
router.get("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.get(
    `SELECT u.username, u.email, u.verified, p.company_name, p.bio, p.industries, p.min_investment, p.max_investment
     FROM users u
     LEFT JOIN investor_profiles p ON u.id = p.user_id
     WHERE u.id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(row);
    }
  );
});

// POST /api/investor-profile/update
router.post("/update", isAuthenticated, (req, res) => {
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
    [userId, company_name, bio, industries, min_investment, max_investment],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
