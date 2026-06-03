const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET /api/kyc/status
router.get("/status", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  db.get("SELECT verified FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ verified: row.verified });
  });
});

// POST /api/kyc/submit
router.post("/submit", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  // Update verified to 1 (pending)
  db.run("UPDATE users SET verified = 1 WHERE id = ?", [userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Also update session user status
    if (req.session.user) {
      req.session.user.verified = 1;
    }
    
    res.json({ success: true, verified: 1 });
  });
});

module.exports = router;
