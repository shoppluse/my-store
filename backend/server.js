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
   START SERVER AFTER DB CONNECTS
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
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
