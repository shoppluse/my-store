const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP email function
async function sendOtpEmail(toEmail, otp, userName = "User") {
  const mailOptions = {
    from: `"ShopPlus" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "ShopPlus Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f8ff; color: #1f1f1f;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #dbe7ff;">
          <h2 style="color: #0047ab; margin-top: 0;">Welcome to ShopPlus, ${userName} 👋</h2>
          <p style="font-size: 15px; line-height: 1.6;">
            Use the OTP below to verify your email address.
          </p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0099ff; text-align: center; margin: 24px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            This OTP is valid for 10 minutes.<br />
            If you did not create a ShopPlus account, you can ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5edff; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
            © 2026 ShopPlus
          </p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("OTP email sent successfully:", info.messageId);
  return info;
}

// SIGNUP
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: hashedPassword,
      isVerified: false,
      emailOtp: otp,
      emailOtpExpires: otpExpiry
    });

    console.log("User created successfully:", user.email);
    console.log("Generated OTP:", otp);

    // Send real OTP email
    try {
      await sendOtpEmail(user.email, otp, user.name);
    } catch (mailError) {
      console.error("OTP email sending failed:", mailError);
      return res.status(500).json({
        message: "Signup created, but OTP email could not be sent. Please check email settings.",
        error: mailError.message
      });
    }

    res.status(201).json({
      message: "Signup successful. OTP sent to your email.",
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

// VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({ message: "No OTP found. Please signup again." });
    }

    if (user.emailOtp !== otp.trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.emailOtpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;

    await user.save();

    res.status(200).json({
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      message: "Email verification failed",
      error: error.message
    });
  }
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

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
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
        isVerified: user.isVerified
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
