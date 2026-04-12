const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

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
      isVerified: true,
      fcmTokens: []
    });

    console.log("User created successfully:", user.email);

    res.status(201).json({
      message: "Signup successful. You can now login.",
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error("Signup error:", error);
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

    const existingTokenCount = Array.isArray(user.fcmTokens) ? user.fcmTokens.length : 0;

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isVerified: true,
        existingTokenCount
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

module.exports = router;
