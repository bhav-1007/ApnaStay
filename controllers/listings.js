const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { cloudinary } = require("../cloudConfig.js");
const geocodeLocation = require("../utils/geocode.js");
const sampleData = require("../init/data.js");

module.exports.index = async (req, res) => {
  const { q, minPrice, maxPrice, country, page = 1 } = req.query;
  const PAGE_SIZE = 9;

  let filter = { deleted: false };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }
  if (country) {
    filter.country = { $regex: `^${country}$`, $options: "i" };
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const currentPage = Math.max(1, parseInt(page) || 1);
  let totalCount = 0;
  let totalPages = 1;
  let allListings = [];

  try {
    totalCount = await Listing.countDocuments(filter);
    totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    allListings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);
  } catch (err) {
    allListings = sampleData.data.map((listing, index) => ({
      ...listing,
      _id: `demo-${index + 1}`,
    }));
    totalCount = allListings.length;
    totalPages = 1;
  }

  res.render("listings/index.ejs", {
    allListings,
    query: req.query,
    currentPage,
    totalPages,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  let url = req.file.path;
  let filename = req.file.filename;
  normalizeShiftFields(req.body.listing);
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // Prefer exact coordinates from the autocomplete selection —
  // more reliable than re-geocoding free text, and avoids a second
  // Nominatim call.
  const { lat, lng } = req.body.listing;
  if (lat && lng) {
    newListing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  } else {
    // Fallback for any client without JS / hidden fields not filled
    const geometry = await geocodeLocation(`${req.body.listing.location}, ${req.body.listing.country}`);
    if (geometry) {
      newListing.geometry = geometry;
    }
  }

  await newListing.save();
  req.flash("success", "Shift request posted successfully!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.myListings = async (req, res) => {
  const myListings = await Listing.find({
    owner: req.user._id,
    deleted: false,
  }).sort({ createdAt: -1 });
  res.render("listings/my.ejs", { myListings });
};

module.exports.wishlistPage = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    match: { deleted: false },
  });
  const wishlistListings = user.wishlist;
  res.render("listings/wishlist.ejs", { wishlistListings });
};

module.exports.toggleWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex((listingId) => listingId.equals(id));

  if (index === -1) {
    user.wishlist.push(id);
    await user.save();
    req.flash("success", "Shift saved to your watchlist!");
  } else {
    user.wishlist.splice(index, 1);
    await user.save();
    req.flash("success", "Shift removed from your watchlist.");
  }
  res.redirect(req.get("Referrer") || `/listings/${id}`);
};

module.exports.renderTrash = async (req, res) => {
  const trashedListings = await Listing.find({
    deleted: true,
    owner: req.user._id,
  });
  res.render("listings/trash.ejs", { trashedListings });
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request does not exist!");
    return res.redirect("/listings");
  }
  if (listing.deleted) {
    req.flash("error", "This shift is archived. Restore it before editing.");
    return res.redirect("/listings/trash");
  }

  // Reduce quality to 40% for faster loading on the edit page preview
  if (listing.image && listing.image.url) {
    listing.image.url = listing.image.url.replace("/upload/", "/upload/q_40/");
  }

  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request you tried to update does not exist!");
    return res.redirect("/listings");
  }

  const locationChanged =
    req.body.listing.location !== listing.location ||
    req.body.listing.country !== listing.country;

  normalizeShiftFields(req.body.listing);
  Object.assign(listing, req.body.listing);

  const { lat, lng } = req.body.listing;
  if (lat && lng) {
    listing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  } else if (locationChanged) {
    // Fallback: text-based re-geocode only if location text changed
    // and no fresh autocomplete selection was submitted.
    const geometry = await geocodeLocation(`${listing.location}, ${listing.country}`);
    if (geometry) {
      listing.geometry = geometry;
    }
  }

  if (req.file) {
    // delete the old image from Cloudinary first
    if (listing.image && listing.image.filename) {
      await cloudinary.uploader.destroy(listing.image.filename);
    }
    listing.image = { url: req.file.path, filename: req.file.filename };
  }

  await listing.save();
  req.flash("success", "Shift request updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request not found or already archived!");
    return res.redirect("/listings");
  }
  listing.deleted = true;
  listing.deletedAt = new Date();
  await listing.save();
  req.flash("success", "Shift moved to archive. Restore it anytime from Archive.");
  res.redirect("/listings");
};

module.exports.restoreListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request not found!");
    return res.redirect("/listings/trash");
  }
  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/listings/trash");
  }
  listing.deleted = false;
  listing.deletedAt = null;
  await listing.save();
  req.flash("success", "Shift request restored!");
  res.redirect(`/listings/${id}`);
};

module.exports.permanentDestroy = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request not found!");
    return res.redirect("/listings/trash");
  }
  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/listings/trash");
  }
  await Listing.findByIdAndDelete(id); // triggers cascade review delete via post hook
  req.flash("success", "Shift request permanently deleted.");
  res.redirect("/listings/trash");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  if (id.startsWith("demo-")) {
    const index = Number(id.replace("demo-", "")) - 1;
    const demoListing = sampleData.data[index];
    if (!demoListing) {
      req.flash("error", "Shift request does not exist!");
      return res.redirect("/listings");
    }
    return res.render("listings/show.ejs", {
      listing: {
        ...demoListing,
        _id: id,
        reviews: [],
        owner: {
          username: "PeakShift Demo Business",
          email: "business@peakshift.demo",
          _id: { equals: () => false },
        },
        deleted: false,
      },
      isWishlisted: false,
    });
  }

  const listing = await Listing.findById(id).populate("reviews").populate("owner");
  if (!listing) {
    req.flash("error", "Shift request does not exist!");
    return res.redirect("/listings");
  }
  if (listing.deleted) {
    const isOwnerViewing = req.user && listing.owner && listing.owner._id.equals(req.user._id);
    if (!isOwnerViewing) {
      req.flash("error", "Shift request does not exist!");
      return res.redirect("/listings");
    }
    req.flash("error", "This shift is archived. Restore it to make changes.");
  }

  let isWishlisted = false;
  if (req.user) {
    const user = await User.findById(req.user._id);
    isWishlisted = user.wishlist.some((listingId) => listingId.equals(id));
  }

  res.render("listings/show.ejs", { listing, isWishlisted });
};

function normalizeShiftFields(listing) {
  if (!listing) return;
  if (typeof listing.skillTags === "string") {
    listing.skillTags = listing.skillTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (!listing.roleType) listing.roleType = "Peak-hour helper";
  if (!listing.workersNeeded) listing.workersNeeded = 1;
}
