const router = require("express").Router();
const path = require("path");
const isAuthenticated = require("../middleware/auth");
const investorOnly = require("../middleware/investorOnly");
const db = require("../db");

router.use(isAuthenticated);
router.use(investorOnly);

router.get("/dashboard", (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.redirect("/login");
  }

  if (user.role !== "investor") {
    return res.redirect("/login");
  }

  db.get(
    `
    SELECT verification_status
    FROM investor_profiles
    WHERE user_id = ?
    `,
    [user.id],
    (err, row) => {

      if (err) {
        return res.send("DB error");
      }

      const status = row?.verification_status;

      if (status !== "approved") {
        return res.sendFile(
          path.join(__dirname, "../pages/investor/limited.html")
        );
      }

      return res.sendFile(
        path.join(__dirname, "../pages/investor/dashboard.html")
      );

    }
  );
   
});

router.get("/browse", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/investor/browse.html"));
});

router.get("/interests", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/investor/interests.html"));
});

router.get("/kyc", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/investor/kyc.html"));
});

module.exports = router;