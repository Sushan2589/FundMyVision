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
  if (req.session && req.session.user && req.session.user.role === 'investor') {
    const userId = req.session.user.id;
    db.get("SELECT verified FROM users WHERE id = ?", [userId], (err, user) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!user || user.verified !== 2) {
        // Return 3 high-quality dummy ideas
        return res.json([
          {
            id: 9991,
            title: "Smart Solar Window Blinds",
            summary: "Solar-powered window blinds that track the sun to optimize energy generation.",
            description: "These smart blinds automatically adjust their angle throughout the day to capture maximum solar energy, feeding it back into the household grid. Fully automated with smart home integration. Complete your KYC verification to view details and contact the creator.",
            category: "CleanTech",
            stage: "Prototype",
            funding_needed: 25000,
            owner_name: "Alpha Innovations (Demo)"
          },
          {
            id: 9992,
            title: "Decentralized Health Records",
            summary: "A secure, blockchain-based patient health record management platform.",
            description: "A platform allowing patients to own, control, and share their medical history securely with doctors and research organizations. Utilizes zero-knowledge proofs for maximum privacy. Complete your KYC verification to view details and contact the creator.",
            category: "Healthcare",
            stage: "Concept",
            funding_needed: 50000,
            owner_name: "HealthBlock Tech (Demo)"
          },
          {
            id: 9993,
            title: "Urban Vertical Farming Kit",
            summary: "Automated, space-efficient hydroponic kits for apartment dwellers.",
            description: "Modular vertical farming systems designed to fit small balconies or indoor spaces, featuring automated watering, LED lighting, and nutrient dosing managed via mobile app. Complete your KYC verification to view details and contact the creator.",
            category: "Agriculture",
            stage: "Seed",
            funding_needed: 15000,
            owner_name: "GreenSprout (Demo)"
          }
        ]);
      }
      
      // Verified investor - return real ideas
      db.all("SELECT ideas.*, users.username as owner_name FROM ideas JOIN users ON ideas.owner_id = users.id", [], (err, rows) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        res.json(rows);
      });
    });
  } else {
    // Non-investor or not logged in, return real ideas
    db.all("SELECT ideas.*, users.username as owner_name FROM ideas JOIN users ON ideas.owner_id = users.id", [], (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }
      res.json(rows);
    });
  }
});

module.exports = router;