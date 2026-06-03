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

//IDEATOR dashboard interest shows

router.get("/received", isAuthenticated, (req, res) => {
  const ideator_id = req.session.user.id;

  db.all(
    `
    SELECT 
      interests.id,
      interests.message,
      interests.amount,
      interests.status,
      ideas.title AS idea_title,
      users.username AS investor_name
    FROM interests
    JOIN ideas ON ideas.id = interests.idea_id
    JOIN users ON users.id = interests.investor_id
    WHERE ideas.owner_id = ?
    ORDER BY interests.id DESC
    `,
    [ideator_id],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

//APPROVE

router.post("/approve", isAuthenticated, (req, res) => {
  const { interest_id } = req.body;

  db.run(
    `UPDATE interests SET status = 'approved' WHERE id = ?`,
    [interest_id],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({ success: true, status: "approved" });
    }
  );
});


//DECLINE

router.post("/reject", isAuthenticated, (req, res) => {
  const { interest_id } = req.body;

  db.run(
    `UPDATE interests SET status = 'rejected' WHERE id = ?`,
    [interest_id],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({ success: true, status: "rejected" });
    }
  );
});

module.exports = router;