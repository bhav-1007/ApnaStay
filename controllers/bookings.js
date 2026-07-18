const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

const DAY_MS = 1000 * 60 * 60 * 24;

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you tried to book does not exist!");
    return res.redirect("/listings");
  }

  if (listing.deleted) {
    req.flash("error", "This listing is not available for booking.");
    return res.redirect("/listings");
  }

  if (listing.owner && listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing.");
    return res.redirect(`/listings/${id}`);
  }

  const checkIn = parseDateOnly(req.body.checkIn);
  const checkOut = parseDateOnly(req.body.checkOut);

  if (!checkIn || !checkOut) {
    req.flash("error", "Please choose valid check-in and check-out dates.");
    return res.redirect(`/listings/${id}`);
  }

  if (checkIn < startOfTodayUtc()) {
    req.flash("error", "Check-in cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  if (checkOut <= checkIn) {
    req.flash("error", "Check-out must be after check-in.");
    return res.redirect(`/listings/${id}`);
  }

  const conflict = await Booking.findOne({
    listing: id,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });

  if (conflict) {
    req.flash("error", "Those dates are already booked. Please choose another stay window.");
    return res.redirect(`/listings/${id}`);
  }

  const totalNights = Math.round((checkOut - checkIn) / DAY_MS);
  const totalPrice = totalNights * listing.price;

  await Booking.create({
    listing: listing._id,
    guest: req.user._id,
    checkIn,
    checkOut,
    totalNights,
    totalPrice,
  });

  req.flash("success", "Your stay is confirmed!");
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

  req.flash("success", "Booking cancelled.");
  res.redirect("/bookings/my");
};
