const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET /api/discussion-groups - List all discussion groups for the current user
router.get("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    `SELECT dg.id, dg.idea_id, dg.created_at, i.title as idea_title,
            (SELECT COUNT(*) FROM discussion_group_members dgm WHERE dgm.group_id = dg.id) as member_count,
            (SELECT dm.message FROM discussion_messages dm WHERE dm.group_id = dg.id ORDER BY dm.timestamp DESC LIMIT 1) as last_message,
            (SELECT dm.timestamp FROM discussion_messages dm WHERE dm.group_id = dg.id ORDER BY dm.timestamp DESC LIMIT 1) as last_message_time,
            (SELECT u.username FROM discussion_messages dm JOIN users u ON dm.sender_id = u.id WHERE dm.group_id = dg.id ORDER BY dm.timestamp DESC LIMIT 1) as last_message_sender
     FROM discussion_groups dg
     JOIN discussion_group_members dgm ON dgm.group_id = dg.id
     JOIN ideas i ON dg.idea_id = i.id
     WHERE dgm.user_id = ?
     ORDER BY last_message_time DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows || []);
    }
  );
});

// GET /api/discussion-groups/:id/messages - Get messages in a discussion group
router.get("/:id/messages", isAuthenticated, (req, res) => {
  const groupId = req.params.id;
  const userId = req.session.user.id;

  // Verify user is a member of this group
  db.get(
    `SELECT id FROM discussion_group_members WHERE group_id = ? AND user_id = ?`,
    [groupId, userId],
    (err, member) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!member) {
        return res.status(403).json({ error: "Access denied to this discussion group" });
      }

      db.all(
        `SELECT dm.*, u.username as sender_name, u.role as sender_role
         FROM discussion_messages dm
         JOIN users u ON dm.sender_id = u.id
         WHERE dm.group_id = ?
         ORDER BY dm.timestamp ASC`,
        [groupId],
        (err, messages) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }
          res.json(messages || []);
        }
      );
    }
  );
});

// POST /api/discussion-groups/:id/messages - Send a message to a discussion group
router.post("/:id/messages", isAuthenticated, (req, res) => {
  const groupId = req.params.id;
  const senderId = req.session.user.id;
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  // Verify user is a member
  db.get(
    `SELECT id FROM discussion_group_members WHERE group_id = ? AND user_id = ?`,
    [groupId, senderId],
    (err, member) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!member) {
        return res.status(403).json({ error: "Access denied to this discussion group" });
      }

      db.run(
        `INSERT INTO discussion_messages (group_id, sender_id, message) VALUES (?, ?, ?)`,
        [groupId, senderId, message],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }

          const messageId = this.lastID;
          db.get(
            `SELECT dm.*, u.username as sender_name, u.role as sender_role
             FROM discussion_messages dm
             JOIN users u ON dm.sender_id = u.id
             WHERE dm.id = ?`,
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

// GET /api/discussion-groups/:id/members - List members of a discussion group
router.get("/:id/members", isAuthenticated, (req, res) => {
  const groupId = req.params.id;
  const userId = req.session.user.id;

  // Verify user is a member
  db.get(
    `SELECT id FROM discussion_group_members WHERE group_id = ? AND user_id = ?`,
    [groupId, userId],
    (err, member) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!member) {
        return res.status(403).json({ error: "Access denied to this discussion group" });
      }

      db.all(
        `SELECT u.id, u.username, u.role, dgm.joined_at
         FROM discussion_group_members dgm
         JOIN users u ON dgm.user_id = u.id
         WHERE dgm.group_id = ?
         ORDER BY dgm.joined_at ASC`,
        [groupId],
        (err, members) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }
          res.json(members || []);
        }
      );
    }
  );
});

module.exports = router;
