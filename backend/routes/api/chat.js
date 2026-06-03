const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET /api/chat/conversations - List all conversations for the user
router.get("/conversations", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const role = req.session.user.role;

  let query = "";
  if (role === "investor") {
    query = `
      SELECT c.id, c.idea_id, c.investor_id, i.title as idea_title, u.username as partner_name, u.role as partner_role,
             (SELECT m.message FROM messages m WHERE m.conversation_id = c.id ORDER BY m.timestamp DESC LIMIT 1) as last_message,
             (SELECT m.timestamp FROM messages m WHERE m.conversation_id = c.id ORDER BY m.timestamp DESC LIMIT 1) as last_message_time
      FROM conversations c
      JOIN ideas i ON c.idea_id = i.id
      JOIN users u ON i.owner_id = u.id
      WHERE c.investor_id = ?
      ORDER BY last_message_time DESC
    `;
  } else {
    // Default to ideator
    query = `
      SELECT c.id, c.idea_id, c.investor_id, i.title as idea_title, u.username as partner_name, u.role as partner_role,
             (SELECT m.message FROM messages m WHERE m.conversation_id = c.id ORDER BY m.timestamp DESC LIMIT 1) as last_message,
             (SELECT m.timestamp FROM messages m WHERE m.conversation_id = c.id ORDER BY m.timestamp DESC LIMIT 1) as last_message_time
      FROM conversations c
      JOIN ideas i ON c.idea_id = i.id
      JOIN users u ON c.investor_id = u.id
      WHERE i.owner_id = ?
      ORDER BY last_message_time DESC
    `;
  }

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// GET /api/chat/conversations/:id/messages - Get messages in a conversation
router.get("/conversations/:id/messages", isAuthenticated, (req, res) => {
  const conversationId = req.params.id;
  const userId = req.session.user.id;

  // Verify user is participant in conversation
  db.get(
    `SELECT c.id, c.investor_id, i.owner_id
     FROM conversations c
     JOIN ideas i ON c.idea_id = i.id
     WHERE c.id = ?`,
    [conversationId],
    (err, conv) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!conv) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conv.investor_id !== userId && conv.owner_id !== userId) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }

      db.all(
        `SELECT m.*, u.username as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.timestamp ASC`,
        [conversationId],
        (err, messages) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }
          res.json(messages);
        }
      );
    }
  );
});

// POST /api/chat/conversations/:id/messages - Send a message
router.post("/conversations/:id/messages", isAuthenticated, (req, res) => {
  const conversationId = req.params.id;
  const senderId = req.session.user.id;
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  // Verify participant
  db.get(
    `SELECT c.id, c.investor_id, i.owner_id
     FROM conversations c
     JOIN ideas i ON c.idea_id = i.id
     WHERE c.id = ?`,
    [conversationId],
    (err, conv) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!conv) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conv.investor_id !== senderId && conv.owner_id !== senderId) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }

      db.run(
        `INSERT INTO messages (conversation_id, sender_id, message)
         VALUES (?, ?, ?)`,
        [conversationId, senderId, message],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }

          const messageId = this.lastID;
          db.get(
            `SELECT m.*, u.username as sender_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.id = ?`,
            [messageId],
            (err, newMessage) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
              }
              res.json(newMessage);
            }
          );
        }
      );
    }
  );
});

// POST /api/chat/conversations - Get or create a conversation
router.post("/conversations", isAuthenticated, (req, res) => {
  const { idea_id, investor_id } = req.body;

  if (!idea_id || !investor_id) {
    return res.status(400).json({ error: "idea_id and investor_id are required" });
  }

  // Check if conversation exists
  db.get(
    `SELECT id FROM conversations WHERE idea_id = ? AND investor_id = ?`,
    [idea_id, investor_id],
    (err, conv) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      if (conv) {
        return res.json({ id: conv.id });
      }

      // Create new conversation
      db.run(
        `INSERT INTO conversations (idea_id, investor_id) VALUES (?, ?)`,
        [idea_id, investor_id],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }
          res.json({ id: this.lastID });
        }
      );
    }
  );
});

module.exports = router;
