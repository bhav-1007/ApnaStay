const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing you tried to review does not exist!");
    return res.redirect("/listings");
  }
  let newReview = new Review(req.body.review);
  newReview.author = req.user.username;
  newReview.owner = req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "New review added!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.updateReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Review.findByIdAndUpdate(reviewId, { ...req.body.review });
  req.flash("success", "Review updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted!");
  res.redirect(`/listings/${id}`);
};