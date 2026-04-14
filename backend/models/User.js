const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // Email verification removed
    isVerified: {
      type: Boolean,
      default: true
    },

    // Store multiple device FCM tokens
    fcmTokens: {
      type: [String],
      default: []
    },

    // ===============================
    // AFFILIATE ACCESS
    // ===============================
    isAffiliate: {
      type: Boolean,
      default: false
    },

    affiliateStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },

    // ===============================
    // PLAN CONTROL
    // ===============================
    affiliatePlan: {
      type: String,
      enum: ["", "starter", "growth", "elite"],
      default: ""
    },

    planStatus: {
      type: String,
      enum: ["", "inactive", "active"],
      default: ""
    },

    // 3 = free, 20 = growth, -1 = unlimited
    maxProducts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
