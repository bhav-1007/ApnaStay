const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isGuestOnBooking } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

router.post("/listings/:id/bookings", isLoggedIn, wrapAsync(bookingController.createBooking));
router.get("/bookings/my", isLoggedIn, wrapAsync(bookingController.myBookings));
router.delete(
  "/bookings/:bookingId",
  isLoggedIn,
  isGuestOnBooking,
  wrapAsync(bookingController.cancelBooking)
);

module.exports = router;
