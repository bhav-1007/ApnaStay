const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const { isLoggedIn, isOwner } = require("../middleware.js");

const validateListing = (req, res, next) => {
  let {error} = listingSchema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

//Index Route - now supports search, filter, and pagination
router.get(
  "/",
  wrapAsync(async (req, res) => {
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
    const totalCount = await Listing.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const allListings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    res.render("listings/index.ejs", {
      allListings,
      query: req.query,
      currentPage,
      totalPages,
    });
  })
);

//New Route
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

//Create Route
router.post(
  "/",
  isLoggedIn,
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "Successfully made a new listing!");
    res.redirect(`/listings/${newListing._id}`);
  })
);

//My Listings Dashboard - keep ABOVE "/:id"
router.get(
  "/my",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const myListings = await Listing.find({
      owner: req.user._id,
      deleted: false,
    }).sort({ createdAt: -1 });
    res.render("listings/my.ejs", { myListings });
  })
);

//Wishlist Page - keep ABOVE "/:id"
router.get(
  "/wishlist",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      match: { deleted: false },
    });
    const wishlistListings = user.wishlist;
    res.render("listings/wishlist.ejs", { wishlistListings });
  })
);

//Wishlist Toggle - keep ABOVE "/:id"
router.post(
  "/:id/wishlist",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const index = user.wishlist.findIndex((listingId) => listingId.equals(id));

    if (index === -1) {
      user.wishlist.push(id);
      await user.save();
      req.flash("success", "Added to your wishlist!");
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      req.flash("success", "Removed from your wishlist.");
    }
    res.redirect(req.get("Referrer") || `/listings/${id}`);
  })
);

//Trash Route - keep this ABOVE "/:id" and "/:id/edit"
router.get(
  "/trash",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const trashedListings = await Listing.find({
      deleted: true,
      owner: req.user._id,
    });
    res.render("listings/trash.ejs", { trashedListings });
  })
);

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }
    if (listing.deleted) {
      req.flash("error", "This listing is in trash. Restore it before editing.");
      return res.redirect("/listings/trash");
    }
    res.render("listings/edit.ejs", { listing });
  })
);

//Update Route
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { runValidators: true, returnDocument: "after" }
    );
    if (!updatedListing) {
      req.flash("error", "Listing you tried to update does not exist!");
      return res.redirect("/listings");
    }
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  })
);

//Delete Route (soft delete -> trash)
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found or already deleted!");
      return res.redirect("/listings");
    }
    listing.deleted = true;
    listing.deletedAt = new Date();
    await listing.save();
    req.flash("success", "Listing moved to trash. Restore it anytime from Trash.");
    res.redirect("/listings");
  })
);

//Restore Route
router.post(
  "/:id/restore",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings/trash");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
      req.flash("error", "You don't have permission to do that!");
      return res.redirect("/listings/trash");
    }
    listing.deleted = false;
    listing.deletedAt = null;
    await listing.save();
    req.flash("success", "Listing restored!");
    res.redirect(`/listings/${id}`);
  })
);

//Permanent Delete Route (from Trash)
router.delete(
  "/:id/permanent",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings/trash");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
      req.flash("error", "You don't have permission to do that!");
      return res.redirect("/listings/trash");
    }
    await Listing.findByIdAndDelete(id); // triggers cascade review delete via post hook
    req.flash("success", "Listing permanently deleted.");
    res.redirect("/listings/trash");
  })
);

//Show Route - keep this near the bottom
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews").populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }
    if (listing.deleted) {
      const isOwnerViewing = req.user && listing.owner && listing.owner._id.equals(req.user._id);
      if (!isOwnerViewing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
      }
      req.flash("error", "This listing is in trash. Restore it to make changes.");
    }

    let isWishlisted = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      isWishlisted = user.wishlist.some((listingId) => listingId.equals(id));
    }

    res.render("listings/show.ejs", { listing, isWishlisted });
  })
);

module.exports = router;
