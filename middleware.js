const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in to do that!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isGuestOnBooking = async (req, res, next) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/bookings/my");
  }

  if (!booking.guest || !booking.guest.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/bookings/my");
  }

  next();
};
