const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

router.use(isAuthenticated);

// GET all conversations for the current user
router.get("/conversations", (req, res) => {
  const userId = req.session.user.id;
  const role = req.session.user.role;

  let query;
  if (role === "investor") {
    // Investor: find conversations where they expressed interest
    query = `
      SELECT c.id, c.idea_id, ideas.title as idea_title,
             u_ideator.username as other_user,
             u_ideator.id as other_user_id,
             (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
             (SELECT timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_timestamp
      FROM conversations c
      JOIN ideas ON ideas.id = c.idea_id
      JOIN users u_ideator ON u_ideator.id = ideas.owner_id
      JOIN interests i ON i.idea_id = c.idea_id AND i.investor_id = ?
      ORDER BY last_timestamp DESC
    `;
  } else {
    // Ideator: find conversations for their ideas
    query = `
      SELECT c.id, c.idea_id, ideas.title as idea_title,
             u_investor.username as other_user,
             u_investor.id as other_user_id,
             (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
             (SELECT timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_timestamp
      FROM conversations c
      JOIN ideas ON ideas.id = c.idea_id
      JOIN interests i ON i.idea_id = c.idea_id
      JOIN users u_investor ON u_investor.id = i.investor_id
      WHERE ideas.owner_id = ?
      ORDER BY last_timestamp DESC
    `;
  }

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.log("Chat conversations error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows || []);
  });
});

// GET messages for a conversation
router.get("/conversations/:id/messages", (req, res) => {
  const conversationId = req.params.id;

  db.all(
    `SELECT m.id, m.message, m.timestamp, m.sender_id,
            u.username as sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.timestamp ASC`,
    [conversationId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows || []);
    }
  );
});

// POST send a message
router.post("/conversations/:id/messages", (req, res) => {
  const conversationId = req.params.id;
  const senderId = req.session.user.id;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  db.run(
    "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
    [conversationId, senderId, message.trim()],
    function (err) {
      if (err) {
        console.log("Send message error:", err);
        return res.status(500).json({ error: "Failed to send message" });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: message.trim(),
        sender_id: senderId,
        sender_name: req.session.user.username,
        timestamp: new Date().toISOString(),
      });
    }
  );
});

module.exports = router;
