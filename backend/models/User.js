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

    isVerified: {
      type: Boolean,
      default: true
    },

    fcmTokens: {
      type: [String],
      default: []
    },

    isAffiliate: {
      type: Boolean,
      default: false
    },

    affiliateStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },

    affiliateReason: {
      type: String,
      default: ""
    },

    affiliateAppliedAt: {
      type: Date,
      default: null
    },

    affiliateReviewedAt: {
      type: Date,
      default: null
    },

    affiliateReviewNote: {
      type: String,
      default: ""
    },

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
