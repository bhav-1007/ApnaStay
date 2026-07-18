const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const dashboardController = require("../controllers/dashboard.js");

router.get("/dashboard", isLoggedIn, wrapAsync(dashboardController.renderDashboard));

module.exports = router;
