const express = require("express");
const AffiliateApplication = require("../models/AffiliateApplication");
const User = require("../models/User");

const router = express.Router();

/* =========================================================
   APPLY FOR AFFILIATE
========================================================= */
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
        message: "User ID, name, email, and mobile are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingApplication = await AffiliateApplication.findOne({ userId });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already submitted an affiliate application.",
        application: existingApplication
      });
    }

    const application = await AffiliateApplication.create({
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      instagram: instagram?.trim() || "",
      youtube: youtube?.trim() || "",
      telegram: telegram?.trim() || "",
      audienceType: audienceType?.trim() || "",
      experience: experience?.trim() || "",
      reason: reason?.trim() || "",
      status: "pending"
    });

    await User.findByIdAndUpdate(userId, {
      isAffiliate: false,
      affiliateStatus: "pending"
    });

    res.status(201).json({
      message: "Affiliate application submitted successfully.",
      application
    });
  } catch (error) {
    console.error("Affiliate apply error:", error);
    res.status(500).json({
      message: "Failed to submit affiliate application",
      error: error.message
    });
  }
});

/* =========================================================
   GET MY AFFILIATE STATUS
========================================================= */
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const application = await AffiliateApplication.findOne({ userId }).lean();

    res.status(200).json({
      isAffiliate: user.isAffiliate || false,
      affiliateStatus: user.affiliateStatus || "none",
      affiliatePlan: user.affiliatePlan || "",
      planStatus: user.planStatus || "",
      maxProducts: user.maxProducts || 0,
      applicationStatus: application?.status || "none",
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

/* =========================================================
   SELECT PLAN (STARTER / GROWTH / ELITE)
========================================================= */
router.post("/select-plan", async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({
        message: "User ID and plan are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.affiliateStatus !== "approved") {
      return res.status(403).json({
        message: "Only approved affiliates can select a plan"
      });
    }

    let updateData = {};

    if (plan === "starter") {
      updateData = {
        isAffiliate: true,
        affiliatePlan: "starter",
        planStatus: "active",
        maxProducts: 3
      };
    } else if (plan === "growth") {
      updateData = {
        isAffiliate: true,
        affiliatePlan: "growth",
        planStatus: "inactive", // activate after payment verification
        maxProducts: 20
      };
    } else if (plan === "elite") {
      updateData = {
        isAffiliate: true,
        affiliatePlan: "elite",
        planStatus: "inactive", // activate after payment verification
        maxProducts: -1
      };
    } else {
      return res.status(400).json({
        message: "Invalid plan selected"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true
    });

    res.status(200).json({
      message:
        plan === "starter"
          ? "Starter plan activated successfully"
          : "Plan selected successfully. Awaiting payment verification.",
      user: {
        id: updatedUser._id,
        isAffiliate: updatedUser.isAffiliate,
        affiliateStatus: updatedUser.affiliateStatus,
        affiliatePlan: updatedUser.affiliatePlan,
        planStatus: updatedUser.planStatus,
        maxProducts: updatedUser.maxProducts
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
