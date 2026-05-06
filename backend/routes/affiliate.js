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
      fullName,
      email,
      mobile,
      socialPlatform,
      socialLink,
      promoMethod,
      whyJoin
    } = req.body;

    if (!userId || !fullName || !email || !mobile) {
      return res.status(400).json({
        message: "userId, fullName, email and mobile are required"
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

    const existingPending = await AffiliateApplication.findOne({
      userId,
      status: "pending"
    });

    if (existingPending) {
      return res.status(400).json({
        message: "You already have a pending affiliate application"
      });
    }

    const application = await AffiliateApplication.create({
      userId,
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      mobile: String(mobile).trim(),
      socialPlatform: (socialPlatform || "").trim(),
      socialLink: (socialLink || "").trim(),
      promoMethod: (promoMethod || "").trim(),
      whyJoin: (whyJoin || "").trim(),
      status: "pending"
    });

    user.affiliateStatus = "pending";
    user.isAffiliate = false;
    await user.save();

    res.status(201).json({
      message: "Affiliate application submitted successfully",
      application: {
        id: application._id,
        status: application.status
      },
      user: {
        id: user._id,
        affiliateStatus: user.affiliateStatus,
        isAffiliate: user.isAffiliate
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
// CHECK AFFILIATE STATUS
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

    res.status(200).json({
      message: "Affiliate status fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAffiliate: user.isAffiliate,
        affiliateStatus: user.affiliateStatus,
        affiliatePlan: user.affiliatePlan,
        planStatus: user.planStatus,
        maxProducts: user.maxProducts
      }
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
        message: "Invalid plan selected"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.affiliateStatus !== "approved" && user.isAffiliate !== true) {
      return res.status(403).json({
        message: "Only approved affiliates can select a plan"
      });
    }

    let maxProducts = 0;
    let planStatus = "inactive";

    if (safePlan === "starter") {
      maxProducts = 3;
      planStatus = "active";
    } else if (safePlan === "growth") {
      maxProducts = 20;
      planStatus = "inactive"; // activate after payment confirmation
    } else if (safePlan === "elite") {
      maxProducts = -1;
      planStatus = "inactive"; // activate after payment confirmation
    }

    user.affiliatePlan = safePlan;
    user.planStatus = planStatus;
    user.maxProducts = maxProducts;

    // If starter, make sure affiliate is active
    if (safePlan === "starter") {
      user.isAffiliate = true;
      user.affiliateStatus = "approved";
    }

    await user.save();

    res.status(200).json({
      message:
        safePlan === "starter"
          ? "Starter plan activated successfully"
          : `${safePlan} plan selected. Activate after payment confirmation.`,
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
      message: "Failed to select plan",
      error: error.message
    });
  }
});

module.exports = router;
