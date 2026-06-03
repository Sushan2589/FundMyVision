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

// IDEATOR: Get received interests on their ideas
router.get("/received", isAuthenticated, (req, res) => {
  const ownerId = req.session.user.id;

  db.all(
    `SELECT i.*, ideas.title as idea_title, u.username as investor_name, u.email as investor_email
     FROM interests i
     JOIN ideas ON ideas.id = i.idea_id
     JOIN users u ON u.id = i.investor_id
     WHERE ideas.owner_id = ?`,
    [ownerId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// IDEATOR: Accept interest
router.post("/:id/accept", isAuthenticated, (req, res) => {
  const interestId = req.params.id;
  const ownerId = req.session.user.id;

  db.get(
    `SELECT i.*, ideas.owner_id
     FROM interests i
     JOIN ideas ON ideas.id = i.idea_id
     WHERE i.id = ?`,
    [interestId],
    (err, interest) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!interest) return res.status(404).json({ error: "Interest not found" });
      if (interest.owner_id !== ownerId) return res.status(403).json({ error: "Access denied" });

      db.run(
        "UPDATE interests SET status = 'accepted' WHERE id = ?",
        [interestId],
        function (err) {
          if (err) return res.status(500).json({ error: "Database error" });

          const { idea_id, investor_id } = interest;
          db.get(
            "SELECT id FROM conversations WHERE idea_id = ? AND investor_id = ?",
            [idea_id, investor_id],
            (err, conv) => {
              if (err) return res.status(500).json({ error: "Database error" });
              if (conv) {
                return res.json({ success: true, conversationId: conv.id });
              }

              db.run(
                "INSERT INTO conversations (idea_id, investor_id) VALUES (?, ?)",
                [idea_id, investor_id],
                function (err) {
                  if (err) return res.status(500).json({ error: "Database error" });
                  res.json({ success: true, conversationId: this.lastID });
                }
              );
            }
          );
        }
      );
    }
  );
});

// IDEATOR: Reject interest
router.post("/:id/reject", isAuthenticated, (req, res) => {
  const interestId = req.params.id;
  const ownerId = req.session.user.id;

  db.get(
    `SELECT i.*, ideas.owner_id
     FROM interests i
     JOIN ideas ON ideas.id = i.idea_id
     WHERE i.id = ?`,
    [interestId],
    (err, interest) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!interest) return res.status(404).json({ error: "Interest not found" });
      if (interest.owner_id !== ownerId) return res.status(403).json({ error: "Access denied" });

      db.run(
        "UPDATE interests SET status = 'rejected' WHERE id = ?",
        [interestId],
        function (err) {
          if (err) return res.status(500).json({ error: "Database error" });
          res.json({ success: true });
        }
      );
    }
  );
});

module.exports = router;