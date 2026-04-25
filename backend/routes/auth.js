const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AffiliateApplication = require("../models/AffiliateApplication");

const router = express.Router();

/* =========================================
   TEST ROUTE
========================================= */
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth routes are working"
  });
});

/* =========================================
   SHARED SIGNUP HANDLER
========================================= */
const handleSignup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanMobile = String(mobile).trim();
    const cleanPassword = String(password).trim();

    if (!cleanName || !cleanEmail || !cleanMobile || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (cleanPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters"
      });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const existingMobile = await User.findOne({ mobile: cleanMobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      password: hashedPassword,
      isVerified: true
    });

    console.log("✅ User created successfully:", user.email);

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "shopplus_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Signup successful. You can now login.",
      token,
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
    console.error("❌ Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Signup failed",
      error: error.message
    });
  }
};

/* =========================================
   SIGNUP ROUTES
========================================= */
router.post("/signup", handleSignup);
router.post("/register", handleSignup);

/* =========================================
   VERIFY EMAIL
========================================= */
router.post("/verify-email", async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Email verification is not required."
  });
});

/* =========================================
   LOGIN
========================================= */
router.post("/login", async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Mobile and password are required"
      });
    }

    const cleanIdentifier = String(emailOrMobile).trim().toLowerCase();
    const cleanMobile = String(emailOrMobile).trim();
    const cleanPassword = String(password).trim();

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { mobile: cleanMobile }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "shopplus_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
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
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
});

/* =========================================
   GET USER BY ID
========================================= */
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message
    });
  }
});

/* =========================================
   APPLY FOR AFFILIATE PROGRAM
========================================= */
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

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: "User ID and reason are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const cleanReason = String(reason || "").trim();
    const cleanInstagram = String(instagram || "").trim();
    const cleanYoutube = String(youtube || "").trim();
    const cleanTelegram = String(telegram || "").trim();
    const cleanAudienceType = String(audienceType || "").trim();
    const cleanExperience = String(experience || "").trim();

    if (!cleanReason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.affiliateStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your affiliate application is already pending review."
      });
    }

    if (user.affiliateStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "You are already an approved affiliate member."
      });
    }

    user.affiliateStatus = "pending";
    user.affiliateReason = cleanReason;
    user.affiliateAppliedAt = new Date();
    user.affiliateReviewedAt = null;
    user.affiliateReviewNote = "";

    await user.save();

    try {
      await AffiliateApplication.deleteMany({ userId: user._id });
    } catch (deleteErr) {
      console.error("⚠️ Could not delete old affiliate applications:", deleteErr.message);
    }

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

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({
      success: false,
      message: "Failed to submit affiliate application",
      error: error.message
    });
  }
});

module.exports = router;
