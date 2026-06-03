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

// IDEATOR: Get interests for my ideas
router.get("/for-ideator", isAuthenticated, (req, res) => {
  const owner_id = req.session.user.id;

  db.all(
    `SELECT i.*, ideas.title as idea_title, u.username as investor_name, u.email as investor_email
     FROM interests i
     JOIN ideas ON ideas.id = i.idea_id
     JOIN users u ON u.id = i.investor_id
     WHERE ideas.owner_id = ?
     ORDER BY i.id DESC`,
    [owner_id],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows || []);
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

// IDEATOR: Accept interest (creates a conversation)
router.post("/:id/accept", isAuthenticated, (req, res) => {
  const interestId = req.params.id;
  const userId = req.session.user.id;

  // Verify this interest is for one of the user's ideas
  db.get(
    `SELECT i.*, ideas.owner_id, ideas.id as idea_id
     FROM interests i
     JOIN ideas ON ideas.id = i.idea_id
     WHERE i.id = ? AND ideas.owner_id = ?`,
    [interestId, userId],
    (err, interest) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!interest) return res.status(404).json({ error: "Interest not found" });

      // Update interest status
      db.run(
        "UPDATE interests SET status = 'accepted' WHERE id = ?",
        [interestId],
        function (err) {
          if (err) return res.status(500).json({ error: "Database error" });

          // Create conversation for this idea (if not already exists)
          db.get(
            "SELECT id FROM conversations WHERE idea_id = ?",
            [interest.idea_id],
            (err, existing) => {
              if (existing) {
                return res.json({ success: true, conversationId: existing.id });
              }

              db.run(
                "INSERT INTO conversations (idea_id) VALUES (?)",
                [interest.idea_id],
                function (err) {
                  if (err) {
                    console.log("Create conversation error:", err);
                    return res.json({ success: true });
                  }

                  // Add a system message
                  const convId = this.lastID;
                  db.run(
                    "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
                    [convId, userId, "Interest accepted! Let's discuss this idea."],
                    () => {
                      res.json({ success: true, conversationId: convId });
                    }
                  );
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
  const userId = req.session.user.id;

  db.get(
    `SELECT i.*
     FROM interests i
     JOIN ideas ON ideas.id = i.idea_id
     WHERE i.id = ? AND ideas.owner_id = ?`,
    [interestId, userId],
    (err, interest) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!interest) return res.status(404).json({ error: "Interest not found" });

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