const router = require("express").Router();
const path = require("path");
const isAuthenticated = require("../middleware/auth");
const investorOnly = require("../middleware/investorOnly");

router.use(isAuthenticated);
router.use(investorOnly);

router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/investor/dashboard.html"));
});

router.get("/browse", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/investor/browse.html"));
});

router.get("/interests", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/investor/interests.html"));
});

module.exports = router;