const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.renderDashboard = async (req, res) => {
  const myListings = await Listing.find({
    owner: req.user._id,
    deleted: false,
  }).sort({ createdAt: -1 });

  const listingIds = myListings.map((listing) => listing._id);
  const bookings = await Booking.find({
    listing: { $in: listingIds },
    status: "confirmed",
  })
    .populate("listing")
    .populate("guest")
    .sort({ checkIn: 1 });

  const now = new Date();
  const stats = {
    totalListings: myListings.length,
    totalBookings: bookings.length,
    upcomingCheckIns: bookings.filter((booking) => booking.checkIn >= now).length,
  };

  res.render("dashboard/index.ejs", { myListings, bookings, stats });
};
