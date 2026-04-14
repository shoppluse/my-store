const express = require("express");
const mongoose = require("mongoose");
const AffiliateApplication = require("../models/AffiliateApplication");
const User = require("../models/User");

const router = express.Router();

/**
 * APPLY FOR AFFILIATE
 * POST /api/affiliate/apply
 */
router.post("/apply", async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      mobile,
      instagram,
      youtube,
      telegram,
      audienceType,
      experience,
      reason
    } = req.body;

    // Basic validation
    if (!userId || !name || !email || !mobile) {
      return res.status(400).json({
        message: "userId, name, email, and mobile are required"
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanMobile = String(mobile).trim();

    // Check user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Prevent duplicate pending/approved applications
    const existingApplication = await AffiliateApplication.findOne({
      userId: userId,
      status: { $in: ["pending", "approved"] }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: existingApplication.status === "approved"
          ? "You are already an approved affiliate member."
          : "You have already submitted an affiliate application."
      });
    }

    // Create affiliate application
    const application = await AffiliateApplication.create({
      userId: user._id,
      name: String(name).trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      instagram: instagram ? String(instagram).trim() : "",
      youtube: youtube ? String(youtube).trim() : "",
      telegram: telegram ? String(telegram).trim() : "",
      audienceType: audienceType ? String(audienceType).trim() : "",
      experience: experience ? String(experience).trim() : "",
      reason: reason ? String(reason).trim() : "",
      status: "pending"
    });

    // Update user affiliate status to pending
    user.affiliateStatus = "pending";
    user.isAffiliate = false;
    await user.save();

    return res.status(201).json({
      message: "Affiliate application submitted successfully. Your request is pending review.",
      application: {
        id: application._id,
        status: application.status,
        createdAt: application.createdAt
      },
      user: {
        id: user._id,
        isAffiliate: user.isAffiliate,
        affiliateStatus: user.affiliateStatus
      }
    });
  } catch (error) {
    console.error("Affiliate apply error:", error);
    return res.status(500).json({
      message: "Failed to submit affiliate application",
      error: error.message
    });
  }
});

/**
 * CHECK CURRENT USER AFFILIATE STATUS
 * POST /api/affiliate/status
 */
router.post("/status", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const user = await User.findById(userId).select("name email mobile isAffiliate affiliateStatus");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const latestApplication = await AffiliateApplication.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("status createdAt updatedAt");

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAffiliate: user.isAffiliate,
        affiliateStatus: user.affiliateStatus
      },
      application: latestApplication
        ? {
            status: latestApplication.status,
            createdAt: latestApplication.createdAt,
            updatedAt: latestApplication.updatedAt
          }
        : null
    });
  } catch (error) {
    console.error("Affiliate status error:", error);
    return res.status(500).json({
      message: "Failed to fetch affiliate status",
      error: error.message
    });
  }
});

module.exports = router;
