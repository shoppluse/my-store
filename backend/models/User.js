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

    // Since email OTP verification is removed
    isVerified: {
      type: Boolean,
      default: true
    },

    // Store multiple device FCM tokens directly inside user document
    fcmTokens: {
      type: [String],
      default: []
    },

    // Affiliate application status
    affiliateStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },

    // Why user wants to join affiliate program
    affiliateReason: {
      type: String,
      default: "",
      trim: true
    },

    // When user applied for affiliate program
    affiliateAppliedAt: {
      type: Date,
      default: null
    },

    // When admin reviewed the affiliate application
    affiliateReviewedAt: {
      type: Date,
      default: null
    },

    // Optional admin note for approval/rejection
    affiliateReviewNote: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
