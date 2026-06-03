const router = require("express").Router();
const db = require("../db");
const isAuthenticated = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const path = require("path");

router.use(isAuthenticated);
router.use(adminOnly);



router.get("/dashboard", isAuthenticated, adminOnly, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../pages/admin/dashboard.html")
  );
});

// ADMIN KYC REVIEW PAGE
router.get("/kyc", isAuthenticated, adminOnly, (req, res) => {
  res.sendFile(
    require("path").join(
      __dirname,
      "../pages/admin/kyc.html"
    )
  );
});

module.exports = router;