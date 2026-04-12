const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const rewardRoutes = require("./routes/rewardRoutes");
const nodemailer = require("nodemailer");
const User = require("./models/User");
const admin = require("./config/firebaseAdmin");

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
    credentials: true,
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
    pass: process.env.EMAIL_PASS,
  },
});

app.locals.transporter = transporter;

// ===============================
// TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("ShopPlus Backend is running...");
});

// ===============================
// SAVE FCM TOKEN INSIDE USER
// ===============================
app.post("/api/save-token", async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: "FCM token and userId are required",
      });
    }

    const cleanToken = String(token).trim();

    if (!cleanToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid FCM token",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add token only if not already present
    if (!user.fcmTokens.includes(cleanToken)) {
      user.fcmTokens.push(cleanToken);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "FCM token saved inside user successfully",
        totalUserTokens: user.fcmTokens.length
      });
    }

    return res.status(200).json({
      success: true,
      message: "FCM token already exists for this user",
      totalUserTokens: user.fcmTokens.length
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
// GET USER TOKEN COUNT (for frontend new-device logic)
// ===============================
app.get("/api/user/:userId/token-count", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("fcmTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      totalTokens: Array.isArray(user.fcmTokens) ? user.fcmTokens.length : 0
    });
  } catch (error) {
    console.error("User token count error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user token count",
      error: error.message
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
// SEND NOTIFICATION TO ALL USERS' TOKENS
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

    const users = await User.find({}, "fcmTokens");

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found in database",
      });
    }

    // Collect all tokens from all users
    const allTokens = users
      .flatMap((user) => Array.isArray(user.fcmTokens) ? user.fcmTokens : [])
      .map((token) => (typeof token === "string" ? token.trim() : ""))
      .filter(Boolean);

    // Remove duplicates
    const uniqueTokens = [...new Set(allTokens)];

    if (!uniqueTokens.length) {
      return res.status(404).json({
        success: false,
        message: "No valid FCM tokens available in users collection",
      });
    }

    const CHUNK_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];
    const failedTokens = [];

    for (let i = 0; i < uniqueTokens.length; i += CHUNK_SIZE) {
      const chunk = uniqueTokens.slice(i, i + CHUNK_SIZE);

      const message = {
        notification: {
          title,
          body,
        },
        data: {
          url: url || "https://shoppluse.github.io/my-store/home.html",
          click_action: url || "https://shoppluse.github.io/my-store/home.html",
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title,
            body,
            icon: "https://shoppluse.github.io/my-store/icons/icon-192.png",
            badge: "https://shoppluse.github.io/my-store/icons/icon-192.png",
            requireInteraction: true,
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
          const errorCode = resp.error?.code || "unknown";

          console.error("FCM send error:", failedToken, errorCode);

          failedTokens.push({
            token: failedToken,
            errorCode,
          });

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(failedToken);
          }
        }
      });
    }

    // Remove invalid tokens from all users
    if (invalidTokens.length > 0) {
      await User.updateMany(
        { fcmTokens: { $in: invalidTokens } },
        { $pull: { fcmTokens: { $in: invalidTokens } } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Notification broadcast completed",
      totalTokens: uniqueTokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure,
      removedInvalidTokens: invalidTokens.length,
      sampleFailedTokens: failedTokens.slice(0, 10)
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
// GET TOTAL TOKEN COUNT (OWNER ONLY)
// ===============================
app.get("/api/token-count", verifyOwner, async (req, res) => {
  try {
    const users = await User.find({}, "fcmTokens");

    const allTokens = users
      .flatMap((user) => Array.isArray(user.fcmTokens) ? user.fcmTokens : [])
      .map((token) => (typeof token === "string" ? token.trim() : ""))
      .filter(Boolean);

    const uniqueTokens = [...new Set(allTokens)];

    return res.status(200).json({
      success: true,
      totalTokens: uniqueTokens.length,
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

// ===============================
// APP ROUTES
// ===============================
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/rewards", rewardRoutes);

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`ShopPlus backend running on port ${PORT}`);
});
