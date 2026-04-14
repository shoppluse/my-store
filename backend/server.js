const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const rewardRoutes = require("./routes/rewardRoutes");
const affiliateRoutes = require("./routes/affiliate");
const nodemailer = require("nodemailer");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// MIDDLEWARE
// ===============================
app.use(
  cors({
    origin: ["https://shoppluse.github.io"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// EMAIL TRANSPORTER (kept for future use)
// ===============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.locals.transporter = transporter;

// ===============================
// TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("ShopPlus Backend is running...");
});

// ===============================
// APP ROUTES
// ===============================
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/rewards", rewardRoutes);
app.use("/api/affiliate", affiliateRoutes);

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`ShopPlus backend running on port ${PORT}`);
});
