const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const AffiliateApplication = require("../models/AffiliateApplication");

const router = express.Router();

// =======================================
// APPLY FOR AFFILIATE
// =======================================
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

    if (!userId || !name || !email || !mobile) {
      return res.status(400).json({
        message: "userId, name, email and mobile are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Check if already has application
    let existingApplication = await AffiliateApplication.findOne({ userId: user._id });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already submitted an affiliate application",
        application: existingApplication
      });
    }

    const application = await AffiliateApplication.create({
      userId: user._id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      instagram: (instagram || "").trim(),
      youtube: (youtube || "").trim(),
      telegram: (telegram || "").trim(),
      audienceType: (audienceType || "").trim(),
      experience: (experience || "").trim(),
      reason: (reason || "").trim(),
      status: "pending"
    });

    // Update user affiliate status
    user.affiliateStatus = "pending";
    user.isAffiliate = false;

    // keep plan empty until approved + plan selected
    if (!user.affiliatePlan) user.affiliatePlan = "";
    if (!user.planStatus) user.planStatus = "";
    if (!user.maxProducts) user.maxProducts = 0;

    await user.save();

    res.status(201).json({
      message: "Affiliate application submitted successfully",
      application,
      user: {
        id: user._id,
        isAffiliate: user.isAffiliate,
        affiliateStatus: user.affiliateStatus,
        affiliatePlan: user.affiliatePlan,
        planStatus: user.planStatus,
        maxProducts: user.maxProducts
      }
    });
  } catch (error) {
    console.error("Affiliate apply error:", error);
    res.status(500).json({
      message: "Failed to submit affiliate application",
      error: error.message
    });
  }
});

// =======================================
// GET AFFILIATE STATUS
// =======================================
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

    const user = await User.findById(userId).select(
      "name email mobile isAffiliate affiliateStatus affiliatePlan planStatus maxProducts"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const application = await AffiliateApplication.findOne({ userId: user._id });

    res.status(200).json({
      message: "Affiliate status fetched successfully",
      user,
      application
    });
  } catch (error) {
    console.error("Affiliate status error:", error);
    res.status(500).json({
      message: "Failed to fetch affiliate status",
      error: error.message
    });
  }
});

// =======================================
// SELECT PLAN (Starter / Growth / Elite)
// =======================================
router.post("/select-plan", async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({
        message: "userId and plan are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const safePlan = String(plan).trim().toLowerCase();

    if (!["starter", "growth", "elite"].includes(safePlan)) {
      return res.status(400).json({
        message: "Invalid plan. Allowed: starter, growth, elite"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Must be approved affiliate before selecting any plan
    if (user.affiliateStatus !== "approved") {
      return res.status(403).json({
        message: "Only approved affiliates can select a plan"
      });
    }

    // ===============================
    // STARTER PLAN = AUTO ACTIVATE
    // ===============================
    if (safePlan === "starter") {
      user.isAffiliate = true;
      user.affiliatePlan = "starter";
      user.planStatus = "active";
      user.maxProducts = 3;

      await user.save();

      return res.status(200).json({
        message: "Starter plan activated successfully",
        user: {
          id: user._id,
          isAffiliate: user.isAffiliate,
          affiliateStatus: user.affiliateStatus,
          affiliatePlan: user.affiliatePlan,
          planStatus: user.planStatus,
          maxProducts: user.maxProducts
        }
      });
    }

    // ===============================
    // GROWTH / ELITE
    // For now: request created, admin verifies manually in MongoDB
    // We DO NOT auto-activate paid plans here
    // ===============================
    return res.status(200).json({
      message: `${safePlan} plan request received. Please complete payment and wait for manual activation by ShopPlus.`,
      pendingPlanRequest: safePlan,
      user: {
        id: user._id,
        isAffiliate: user.isAffiliate,
        affiliateStatus: user.affiliateStatus,
        affiliatePlan: user.affiliatePlan,
        planStatus: user.planStatus,
        maxProducts: user.maxProducts
      }
    });
  } catch (error) {
    console.error("Select plan error:", error);
    res.status(500).json({
      message: "Failed to process plan selection",
      error: error.message
    });
  }
});

module.exports = router;
