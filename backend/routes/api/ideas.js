const router = require("express").Router();
const db = require("../../db");
const isAuthenticated = require("../../middleware/auth");

// GET my ideas
router.get("/mine", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    "SELECT * FROM ideas WHERE owner_id = ?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      res.json(rows);
    }
  );
});

// CREATE IDEA
router.post("/create", isAuthenticated, (req, res) => {
  const { title, description, funding_needed, category, summary, stage } = req.body;

  const owner_id = req.session.user.id;

  console.log("CREATE IDEA HIT");
  console.log(req.body);

  db.run(
    `
    INSERT INTO ideas (owner_id, title, description, funding_needed, category, summary, stage)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [owner_id, title, description, funding_needed, category || null, summary || null, stage || null],
    function (err) {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ error: "Database error" });
      }

      console.log("IDEA CREATED ID:", this.lastID);

      res.json({ success: true, id: this.lastID });
    }
  );
});

router.get("/", (req, res) => {
  db.all("SELECT ideas.*, users.username as owner_name FROM ideas JOIN users ON ideas.owner_id = users.id", [], (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json(rows);
  });
});

// GET single idea
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT ideas.*, users.username as owner_name, users.email as owner_email
     FROM ideas
     JOIN users ON ideas.owner_id = users.id
     WHERE ideas.id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.status(404).json({ error: "Idea not found" });
      }
      res.json(row);
    }
  );
});

// EDIT idea (owner only)
router.put("/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.id;
  const { title, description, funding_needed, category, summary, stage } = req.body;

  db.get("SELECT owner_id FROM ideas WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Idea not found" });
    if (row.owner_id !== userId) return res.status(403).json({ error: "Access denied" });

    db.run(
      `UPDATE ideas
       SET title = ?, description = ?, funding_needed = ?, category = ?, summary = ?, stage = ?
       WHERE id = ?`,
      [title, description, funding_needed, category, summary, stage, id],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true });
      }
    );
  });
});

// DELETE idea (owner only)
router.delete("/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.id;

  db.get("SELECT owner_id FROM ideas WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Idea not found" });
    if (row.owner_id !== userId) return res.status(403).json({ error: "Access denied" });

    db.run("DELETE FROM ideas WHERE id = ?", [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true });
    });
  });
});

module.exports = router;