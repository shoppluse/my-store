const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

/* =========================================
   BASIC APP SETTINGS
========================================= */
app.set("trust proxy", 1);

/* =========================================
   CORS
========================================= */
app.use(cors({
  origin: true,
  credentials: true
}));

/* =========================================
   BODY PARSERS
========================================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================
   STATIC FRONTEND
========================================= */
const frontendPath = path.join(__dirname, "public", "my-store");
app.use("/my-store", express.static(frontendPath));

/* =========================================
   API ROUTES
========================================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/rewards", require("./routes/rewardRoutes")); // ✅ THIS WAS MISSING

/* =========================================
   HEALTH CHECKS
========================================= */
app.get("/", (req, res) => {
  res.status(200).send("ShopPlus backend is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime()
  });
});

/* =========================================
   STATIC FALLBACK
========================================= */
app.get("/my-store", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* =========================================
   404 HANDLER
========================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* =========================================
   GLOBAL ERROR HANDLER
========================================= */
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

/* =========================================
   START SERVER
========================================= */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
