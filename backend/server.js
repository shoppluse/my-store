const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const rewardRoutes = require("./routes/rewardRoutes");
const nodemailer = require("nodemailer");
const FcmToken = require("./models/FcmToken");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["https://shoppluse.github.io"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email transporter (for real OTP emails)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Make transporter available in routes if needed
app.locals.transporter = transporter;

// Test route
app.get("/", (req, res) => {
  res.send("My Store Backend is running...");
});

// ===============================
// SAVE FCM TOKEN ROUTE
// ===============================
app.post("/api/save-token", async (req, res) => {
  try {
    const { token, user, platform } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const existingToken = await FcmToken.findOne({ token });

    if (existingToken) {
      existingToken.user = user || existingToken.user || "guest";
      existingToken.platform = platform || existingToken.platform || "web";
      await existingToken.save();

      return res.status(200).json({
        success: true,
        message: "Token already exists, updated successfully",
      });
    }

    await FcmToken.create({
      token,
      user: user || "guest",
      platform: platform || "web",
    });

    return res.status(201).json({
      success: true,
      message: "FCM token saved successfully",
    });
  } catch (error) {
    console.error("Save token error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving token",
      error: error.message,
    });
  }
});

// Routes
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/rewards", rewardRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
