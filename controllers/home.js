const Listing = require("../models/listing.js");

module.exports.renderHome = async (req, res) => {
  const featuredListings = await Listing.find({ deleted: false })
    .sort({ createdAt: -1 })
    .limit(4);
  res.render("home.ejs", { featuredListings });
};