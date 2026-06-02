const router = require("express").Router();
const path = require("path");
const isAuthenticated = require("../middleware/auth");
const ideatorOnly = require("../middleware/ideatorOnly");
console.log(isAuthenticated);
console.log(ideatorOnly);
router.use(isAuthenticated);
router.use(ideatorOnly);

router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/ideator/dashboard.html"));
});

router.get("/ideas", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/ideator/ideas.html"));
});

router.get("/create-idea", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/ideator/create-idea.html"));
});

router.get("/investors", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/ideator/investors.html"));
});

router.get("/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/ideator/messages.html"));
});

router.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/ideator/profile.html"));
});

module.exports = router;