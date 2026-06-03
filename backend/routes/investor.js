const router = require("express").Router();
const path = require("path");
const isAuthenticated = require("../middleware/auth");
const investorOnly = require("../middleware/investorOnly");

router.use(isAuthenticated);
router.use(investorOnly);

router.get("/dashboard", (req, res) => {
   const user = req.session.user;

  if (user.role === "investor") {

    if (user.verification_status !== "approved") {
      return res.sendFile(
        path.join(__dirname, "../pages/investor/limited.html")
      );
    }

    return res.sendFile(
      path.join(__dirname, "../pages/investor/dashboard.html")
    );
  }

  res.redirect("/login");
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