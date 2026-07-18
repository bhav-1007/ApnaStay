const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const { isLoggedIn } = require("../middleware.js");
const reviewController = require("../controllers/review.js");

const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

const isReviewOwner = wrapAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${req.params.id}`);
  }
  if (!review.owner || !review.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect(`/listings/${req.params.id}`);
  }
  next();
});

router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview)
);

router
  .route("/:reviewId")
  .put(isLoggedIn, isReviewOwner, validateReview, wrapAsync(reviewController.updateReview))
  .delete(isLoggedIn, isReviewOwner, wrapAsync(reviewController.destroyReview));

module.exports = router;