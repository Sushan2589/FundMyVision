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

module.exports = router;