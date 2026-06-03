const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

router.get("/kyc/all", adminOnly, (req, res) => {

  db.all(
    `
    SELECT *
    FROM investor_profiles
    `,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );

});

router.get("/kyc/pending", isAuthenticated, adminOnly, (req, res) => {

  db.all(
    `
    SELECT *
    FROM investor_profiles
    WHERE verification_status = 'pending'
    `,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );

});

router.post("/kyc/approve", isAuthenticated, adminOnly, (req, res) => {

  const { user_id } = req.body;

  db.run(
    `
    UPDATE investor_profiles
    SET verification_status = 'approved'
    WHERE user_id = ?
    `,
    [user_id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ success: true });
    }
  );

});

router.post("/kyc/reject", isAuthenticated, adminOnly, (req, res) => {

  const { user_id } = req.body;

  db.run(
    `
    UPDATE investor_profiles
    SET verification_status = 'rejected'
    WHERE user_id = ?
    `,
    [user_id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ success: true });
    }
  );

});

module.exports = router;