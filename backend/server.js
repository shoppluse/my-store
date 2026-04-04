const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const rewardRoutes = require("./routes/rewardRoutes");
const nodemailer = require("nodemailer");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Routes
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/rewards", rewardRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
