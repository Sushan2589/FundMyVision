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

          // Step 1: Create or find the 1-on-1 conversation
          db.get(
            "SELECT id FROM conversations WHERE idea_id = ? AND investor_id = ?",
            [idea_id, investor_id],
            (err, conv) => {
              if (err) return res.status(500).json({ error: "Database error" });

              const handleConversationCreated = (conversationId) => {
                // Step 2: Create or find the discussion group for this idea
                db.get(
                  "SELECT id FROM discussion_groups WHERE idea_id = ?",
                  [idea_id],
                  (err, group) => {
                    if (err) {
                      console.error("Discussion group lookup error:", err);
                      return res.json({ success: true, conversationId });
                    }

                    const addMembers = (groupId) => {
                      // Add ideator (owner) to group
                      db.run(
                        "INSERT OR IGNORE INTO discussion_group_members (group_id, user_id) VALUES (?, ?)",
                        [groupId, ownerId],
                        (err) => {
                          if (err) console.error("Add ideator to group error:", err);
                        }
                      );
                      // Add investor to group
                      db.run(
                        "INSERT OR IGNORE INTO discussion_group_members (group_id, user_id) VALUES (?, ?)",
                        [groupId, investor_id],
                        (err) => {
                          if (err) console.error("Add investor to group error:", err);
                        }
                      );
                      res.json({ success: true, conversationId });
                    };

                    if (group) {
                      addMembers(group.id);
                    } else {
                      // Create new discussion group for the idea
                      db.run(
                        "INSERT INTO discussion_groups (idea_id) VALUES (?)",
                        [idea_id],
                        function (err) {
                          if (err) {
                            console.error("Create discussion group error:", err);
                            return res.json({ success: true, conversationId });
                          }
                          addMembers(this.lastID);
                        }
                      );
                    }
                  }
                );
              };

              if (conv) {
                handleConversationCreated(conv.id);
              } else {
                db.run(
                  "INSERT INTO conversations (idea_id, investor_id) VALUES (?, ?)",
                  [idea_id, investor_id],
                  function (err) {
                    if (err) return res.status(500).json({ error: "Database error" });
                    handleConversationCreated(this.lastID);
                  }
                );
              }
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