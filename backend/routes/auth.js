const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const AffiliateApplication = require("../models/AffiliateApplication");

const router = express.Router();

// SIGNUP (No OTP / No Email Verification)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile.trim();

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingMobile = await User.findOne({ mobile: cleanMobile });
    if (existingMobile) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: hashedPassword,
      isVerified: true
    });

    console.log("✅ User created successfully:", user.email);

    res.status(201).json({
      message: "Signup successful. You can now login.",
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({
      message: "Signup failed",
      error: error.message
    });
  }
});

// VERIFY EMAIL (Disabled / Optional placeholder)
router.post("/verify-email", async (req, res) => {
  return res.status(200).json({
    message: "Email verification is not required."
  });
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({ message: "Email/Mobile and password are required" });
    }

    const cleanIdentifier = emailOrMobile.trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { mobile: emailOrMobile.trim() }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isVerified: true,
        isAffiliate: user.isAffiliate || false,
        affiliateStatus: user.affiliateStatus || "none",
        affiliatePlan: user.affiliatePlan || "none",
        planStatus: user.planStatus || "inactive",
        maxProducts: user.maxProducts || 0
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

// GET USER BY ID
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isVerified: user.isVerified || false,
        isAffiliate: user.isAffiliate || false,
        affiliateStatus: user.affiliateStatus || "none",
        affiliatePlan: user.affiliatePlan || "none",
        planStatus: user.planStatus || "inactive",
        maxProducts: user.maxProducts || 0
      }
    });
  } catch (error) {
    console.error("❌ Get user by ID error:", error);
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message
    });
  }
});

// APPLY FOR AFFILIATE PROGRAM
router.post("/apply-affiliate", async (req, res) => {
  try {
    const {
      userId,
      instagram,
      youtube,
      telegram,
      audienceType,
      experience,
      reason
    } = req.body;

    console.log("📥 /apply-affiliate called with:", {
      userId,
      instagram,
      youtube,
      telegram,
      audienceType,
      experience,
      reason
    });

    if (!userId || !reason) {
      return res.status(400).json({
        message: "User ID and reason are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const cleanReason = (reason || "").trim();
    const cleanInstagram = (instagram || "").trim();
    const cleanYoutube = (youtube || "").trim();
    const cleanTelegram = (telegram || "").trim();
    const cleanAudienceType = (audienceType || "").trim();
    const cleanExperience = (experience || "").trim();

    if (!cleanReason) {
      return res.status(400).json({
        message: "Reason is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    console.log("👤 User found:", {
      id: user._id.toString(),
      email: user.email,
      affiliateStatus: user.affiliateStatus
    });

    if (user.affiliateStatus === "pending") {
      return res.status(400).json({
        message: "Your affiliate application is already pending review."
      });
    }

    if (user.affiliateStatus === "approved") {
      return res.status(400).json({
        message: "You are already an approved affiliate member."
      });
    }

    // 1) Save status in users collection
    user.affiliateStatus = "pending";
    user.affiliateReason = cleanReason;
    user.affiliateAppliedAt = new Date();
    user.affiliateReviewedAt = null;
    user.affiliateReviewNote = "";

    await user.save();

    console.log("✅ User updated in users collection");

    // 2) Delete old application if exists
    try {
      const deleteResult = await AffiliateApplication.deleteMany({ userId: user._id });
      console.log("🗑️ Old affiliate applications deleted:", deleteResult.deletedCount);
    } catch (deleteErr) {
      console.error("⚠️ Could not delete old affiliate applications:", deleteErr.message);
    }

    // 3) Save fresh application in affiliateapplications collection
    const application = new AffiliateApplication({
      userId: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      instagram: cleanInstagram,
      youtube: cleanYoutube,
      telegram: cleanTelegram,
      audienceType: cleanAudienceType,
      experience: cleanExperience,
      reason: cleanReason,
      status: "pending"
    });

    const savedApplication = await application.save();

    console.log("✅ Affiliate application saved in affiliateapplications:", {
      id: savedApplication._id.toString(),
      userId: savedApplication.userId.toString(),
      email: savedApplication.email
    });

    // 4) Verify immediately from DB
    const verifyApplication = await AffiliateApplication.findById(savedApplication._id);

    console.log("🔍 Verification from DB:", verifyApplication ? "FOUND" : "NOT FOUND");

    res.status(200).json({
      message: "Affiliate application submitted successfully. Your request is now pending review.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isVerified: true,
        affiliateStatus: user.affiliateStatus,
        affiliateReason: user.affiliateReason,
        affiliateAppliedAt: user.affiliateAppliedAt
      },
      application: {
        id: savedApplication._id,
        userId: savedApplication.userId,
        name: savedApplication.name,
        email: savedApplication.email,
        mobile: savedApplication.mobile,
        instagram: savedApplication.instagram,
        youtube: savedApplication.youtube,
        telegram: savedApplication.telegram,
        audienceType: savedApplication.audienceType,
        experience: savedApplication.experience,
        reason: savedApplication.reason,
        status: savedApplication.status,
        createdAt: savedApplication.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Apply affiliate error:", error);
    res.status(500).json({
      message: "Failed to submit affiliate application",
      error: error.message
    });
  }
});

module.exports = router;
