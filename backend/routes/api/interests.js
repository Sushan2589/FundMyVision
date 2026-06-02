const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");




// INVESTOR: My interests
router.get("/mine", isAuthenticated, (req, res) => {
  const investor_id = req.session.user.id;

  db.all(
    `
    SELECT i.*, ideas.title
    FROM interests i
    JOIN ideas ON ideas.id = i.idea_id
    WHERE i.investor_id = ?
    `,
    [investor_id],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

// INVESTOR sends interest
router.post("/", isAuthenticated, (req, res) => {
  const investor_id = req.session.user.id;
  const { idea_id, message, amount } = req.body;

  db.run(
    `
    INSERT INTO interests (idea_id, investor_id, message, amount)
    VALUES (?, ?, ?, ?)
    `,
    [idea_id, investor_id, message, amount],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({ success: true });
    }
  );
});

module.exports = router;