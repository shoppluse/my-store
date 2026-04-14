const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

/* =========================================
   MIDDLEWARE
========================================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================
   STATIC FRONTEND (optional but useful)
   If your frontend is inside "public/my-store"
========================================= */
app.use("/my-store", express.static(path.join(__dirname, "public", "my-store")));

/* =========================================
   API ROUTES
========================================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));

/* =========================================
   HEALTH CHECK
========================================= */
app.get("/", (req, res) => {
  res.send("ShopPlus backend is running 🚀");
});

/* =========================================
   MONGODB CONNECTION
========================================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  });

/* =========================================
   404 HANDLER
========================================= */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

/* =========================================
   GLOBAL ERROR HANDLER
========================================= */
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

/* =========================================
   START SERVER
========================================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
