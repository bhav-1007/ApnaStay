const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");

// Signup - show form
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// Signup - create user
router.post(
  "/users",
  wrapAsync(async (req, res, next) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome to ApnaStay!");
        res.redirect("/listings");
      });
    } catch (e) {
      console.log(e.stack);
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  })
);

// Login - show form
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

// Login - authenticate user
router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  }
);

// Logout
router.get("/logout", (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You are not logged in!");
    return res.redirect("/listings");
  }
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
});

module.exports = router;