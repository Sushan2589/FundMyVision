const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET KYC status
router.get("/status", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.get(
    "SELECT verified FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!row) return res.status(404).json({ error: "User not found" });

      const statusMap = {
        0: "not_submitted",
        1: "pending",
        2: "approved",
        3: "rejected",
      };

      res.json({
        verified: row.verified,
        status: statusMap[row.verified] || "not_submitted",
      });
    }
  );
});

// SUBMIT KYC (sets verified to 1 = pending)
router.post("/submit", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { full_name, id_number, company_name, phone } = req.body;

  // Check if already submitted and pending/approved
  db.get(
    "SELECT verified FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (row.verified === 2) {
        return res.json({ success: true, message: "Already verified" });
      }

      // Update user to pending verification
      db.run(
        "UPDATE users SET verified = 1 WHERE id = ?",
        [userId],
        function (err) {
          if (err) {
            console.log(err);
            return res.status(500).json({ error: "Failed to submit KYC" });
          }

          // Also update investor profile with submitted details
          db.run(
            `INSERT INTO investor_profiles (user_id, company_name, bio)
             VALUES (?, ?, ?)
             ON CONFLICT(user_id)
             DO UPDATE SET company_name = excluded.company_name, bio = excluded.bio`,
            [userId, company_name || null, `KYC: ${full_name}, ID: ${id_number}, Phone: ${phone}`],
            function (err) {
              if (err) console.log("Profile update error:", err);

              res.json({ success: true, message: "KYC submitted for review" });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
