const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const rewardRoutes = require("./routes/rewardRoutes");
const nodemailer = require("nodemailer");
const FcmToken = require("./models/FcmToken");
const admin = require("./config/firebaseAdmin");

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

// ===============================
// OWNER AUTH MIDDLEWARE
// ===============================
function verifyOwner(req, res, next) {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: Invalid admin key",
    });
  }

  next();
}

// ===============================
// SEND NOTIFICATION TO ALL TOKENS
// ===============================
app.post("/api/send-notification", verifyOwner, async (req, res) => {
  try {
    const { title, body, url } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Title and body are required",
      });
    }

    const tokenDocs = await FcmToken.find({}, "token");

    if (!tokenDocs.length) {
      return res.status(404).json({
        success: false,
        message: "No FCM tokens found in database",
      });
    }

    const allTokens = tokenDocs.map((doc) => doc.token).filter(Boolean);

    const CHUNK_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];

    for (let i = 0; i < allTokens.length; i += CHUNK_SIZE) {
      const chunk = allTokens.slice(i, i + CHUNK_SIZE);

      const message = {
        notification: {
          title,
          body,
        },
        webpush: {
          notification: {
            title,
            body,
            icon: "https://shoppluse.github.io/my-store/icons/icon-192.png",
            badge: "https://shoppluse.github.io/my-store/icons/icon-192.png",
          },
          fcmOptions: {
            link: url || "https://shoppluse.github.io/my-store/home.html",
          },
        },
        tokens: chunk,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          const failedToken = chunk[index];
          const errorCode = resp.error?.code || "";

          console.error("FCM send error:", failedToken, errorCode);

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(failedToken);
          }
        }
      });
    }

    // Remove invalid tokens from MongoDB
    if (invalidTokens.length > 0) {
      await FcmToken.deleteMany({ token: { $in: invalidTokens } });
    }

    return res.status(200).json({
      success: true,
      message: "Notification broadcast completed",
      totalTokens: allTokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure,
      removedInvalidTokens: invalidTokens.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending notifications",
      error: error.message,
    });
  }
});

// ===============================
// OPTIONAL: GET TOKEN COUNT (OWNER)
// ===============================
app.get("/api/token-count", verifyOwner, async (req, res) => {
  try {
    const count = await FcmToken.countDocuments();
    return res.status(200).json({
      success: true,
      totalTokens: count,
    });
  } catch (error) {
    console.error("Token count error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching token count",
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
