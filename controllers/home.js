const Listing = require("../models/listing.js");
const sampleData = require("../init/data.js");

module.exports.renderHome = async (req, res) => {
  let featuredListings = [];
  try {
    featuredListings = await Listing.find({ deleted: false })
      .sort({ createdAt: -1 })
      .limit(4);
  } catch (err) {
    featuredListings = sampleData.data.slice(0, 4).map((listing, index) => ({
      ...listing,
      _id: `demo-${index + 1}`,
    }));
  }
  res.render("home.ejs", { featuredListings });
};
