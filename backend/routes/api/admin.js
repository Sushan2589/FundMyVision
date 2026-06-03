const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

// Apply admin protection to all routes in this router
router.use(isAuthenticated, adminOnly);

// GET /api/admin/kyc-pending - List users with verified = 1 (pending KYC)
router.get("/kyc-pending", (req, res) => {
  db.all(
    `SELECT id, username, email, role, verified, created_at
     FROM users
     WHERE verified = 1`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// POST /api/admin/kyc-approve/:userId - Set verified = 2
router.post("/kyc-approve/:userId", (req, res) => {
  const { userId } = req.params;
  db.run("UPDATE users SET verified = 2 WHERE id = ?", [userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, verified: 2 });
  });
});

// POST /api/admin/kyc-reject/:userId - Set verified = 3
router.post("/kyc-reject/:userId", (req, res) => {
  const { userId } = req.params;
  db.run("UPDATE users SET verified = 3 WHERE id = ?", [userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, verified: 3 });
  });
});

// GET /api/admin/users - List all users
router.get("/users", (req, res) => {
  db.all(
    `SELECT id, username, email, role, verified, created_at
     FROM users`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// GET /api/admin/stats - Platform stats
router.get("/stats", (req, res) => {
  // Let's execute multiple queries to build the stats
  const stats = {
    totalUsers: 0,
    totalIdeas: 0,
    totalInterests: 0,
    pendingKYC: 0
  };

  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (row) stats.totalUsers = row.count;
    
    db.get("SELECT COUNT(*) as count FROM ideas", [], (err, row) => {
      if (row) stats.totalIdeas = row.count;

      db.get("SELECT COUNT(*) as count FROM interests", [], (err, row) => {
        if (row) stats.totalInterests = row.count;

        db.get("SELECT COUNT(*) as count FROM users WHERE verified = 1", [], (err, row) => {
          if (row) stats.pendingKYC = row.count;
          
          res.json(stats);
        });
      });
    });
  });
});

module.exports = router;
