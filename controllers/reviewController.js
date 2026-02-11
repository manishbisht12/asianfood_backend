import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  try {
    const { review, rating } = req.body;

    if (!review || !rating) {
      return res.status(400).json({
        success: false,
        message: "Review and rating are required",
      });
    }

    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
    });

      if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review",
      });
    }

    const newReview = await Review.create({
      user: req.user._id,
      name: req.user.name,
      review,
      rating,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: newReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while creating review",
      error: error.message,
    });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
      error: error.message,
    });
  }
};
