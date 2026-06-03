const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

router.use(isAuthenticated);
router.use(adminOnly);

// GET admin dashboard stats
router.get("/stats", (req, res) => {
  const stats = {};

  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'investor'", [], (err, row) => {
    stats.totalInvestors = row ? row.count : 0;

    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'ideator'", [], (err, row) => {
      stats.totalIdeators = row ? row.count : 0;

      db.get("SELECT COUNT(*) as count FROM ideas", [], (err, row) => {
        stats.totalIdeas = row ? row.count : 0;

        db.get("SELECT COUNT(*) as count FROM users WHERE verified = 1", [], (err, row) => {
          stats.pendingKYC = row ? row.count : 0;

          db.get("SELECT COUNT(*) as count FROM users WHERE verified = 2", [], (err, row) => {
            stats.approvedKYC = row ? row.count : 0;

            db.get("SELECT COUNT(*) as count FROM interests", [], (err, row) => {
              stats.totalInterests = row ? row.count : 0;

              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// GET pending KYC users
router.get("/kyc-pending", (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.email, u.created_at, u.verified,
            ip.company_name, ip.bio
     FROM users u
     LEFT JOIN investor_profiles ip ON u.id = ip.user_id
     WHERE u.verified = 1`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows || []);
    }
  );
});

// GET all KYC submissions (pending + approved + rejected)
router.get("/kyc-all", (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.email, u.role, u.created_at, u.verified,
            ip.company_name, ip.bio
     FROM users u
     LEFT JOIN investor_profiles ip ON u.id = ip.user_id
     WHERE u.role = 'investor' AND u.verified > 0
     ORDER BY u.verified ASC, u.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows || []);
    }
  );
});

// POST approve KYC
router.post("/kyc-approve", (req, res) => {
  const { userId } = req.body;

  db.run(
    "UPDATE users SET verified = 2 WHERE id = ?",
    [userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true });
    }
  );
});

// POST reject KYC
router.post("/kyc-reject", (req, res) => {
  const { userId } = req.body;

  db.run(
    "UPDATE users SET verified = 3 WHERE id = ?",
    [userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true });
    }
  );
});

module.exports = router;
