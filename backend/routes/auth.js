const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      isEmailVerified: false,
      emailOtp: otp,
      emailOtpExpires: otpExpiry
    });

    await sendEmail(
      user.email,
      "ShopPlus Email Verification OTP",
      `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify your ShopPlus account</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for email verification is:</p>
          <h1 style="color: #0047ab; letter-spacing: 4px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
        </div>
      `
    );

    res.status(201).json({
      message: "Signup successful. OTP sent to email.",
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (!user.emailOtp || user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.emailOtpExpires || user.emailOtpExpires < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;

    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Email verification failed", error: error.message });
  }
});

module.exports = router;
