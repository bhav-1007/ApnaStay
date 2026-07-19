const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

const HOUR_MS = 1000 * 60 * 60;

function parseDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Shift request does not exist!");
    return res.redirect("/listings");
  }

  if (listing.deleted) {
    req.flash("error", "This shift is not available.");
    return res.redirect("/listings");
  }

  if (listing.owner && listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot accept your own shift request.");
    return res.redirect(`/listings/${id}`);
  }

  const checkIn = parseDateTime(req.body.startAt || req.body.checkIn);
  const checkOut = parseDateTime(req.body.endAt || req.body.checkOut);

  if (!checkIn || !checkOut) {
    req.flash("error", "Please choose valid shift start and end times.");
    return res.redirect(`/listings/${id}`);
  }

  if (checkIn < new Date()) {
    req.flash("error", "Shift start time cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  if (checkOut <= checkIn) {
    req.flash("error", "Shift end time must be after the start time.");
    return res.redirect(`/listings/${id}`);
  }

  const workerConflict = await Booking.findOne({
    guest: req.user._id,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });

  if (workerConflict) {
    req.flash("error", "You already accepted an overlapping shift. Please choose another window.");
    return res.redirect(`/listings/${id}`);
  }

  const acceptedCount = await Booking.countDocuments({
    listing: id,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });

  if (acceptedCount >= (listing.workersNeeded || 1)) {
    req.flash("error", "This shift is already fully staffed.");
    return res.redirect(`/listings/${id}`);
  }

  const totalNights = Math.max(1, Math.round((checkOut - checkIn) / HOUR_MS));
  const totalPrice = totalNights * listing.price;

  await Booking.create({
    listing: listing._id,
    guest: req.user._id,
    checkIn,
    checkOut,
    totalNights,
    totalPrice,
  });

  req.flash("success", "Shift accepted. Check-in and payment details are ready.");
  res.redirect("/bookings/my");
};

module.exports.myBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });

  res.render("bookings/my.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  booking.status = "cancelled";
  await booking.save();

  req.flash("success", "Shift acceptance cancelled.");
  res.redirect("/bookings/my");
};
